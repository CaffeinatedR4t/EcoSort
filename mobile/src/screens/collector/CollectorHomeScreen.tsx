import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
  Platform,
  ScrollView,
  ActivityIndicator,
  Animated,
  useWindowDimensions,
  ImageBackground,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { colors } from '../../services/theme/colors';
import { spacing } from '../../services/theme/spacing';
import { Card } from '../../components/Card';
import { Logo } from '../../components/Logo';
import { ProfileAvatar } from '../../components/ProfileAvatar';
import { useAuthStore } from '../../store/authStore';
import { usePickupStore } from '../../store/pickupStore';
import { useNotificationStore } from '../../store/notificationStore';
import { supabase } from '../../services/api/supabase';
import {
  cacheCollectorPickupHistory,
  getCachedCollectorPickupHistory,
} from '../../services/offline/pickupHistoryCache';
import {
  LogOut,
  Package,
  Navigation,
  Wallet,
  Clock,
  CheckCircle,
  Truck,
  ChevronRight,
  Bell,
  Map as MapIcon,
  History,
  User,
  Home,
  Recycle,
  Hourglass,
  UserCircle,
  HelpCircle,
  Award,
  MapPin,
  CircleCheckBig,
  ScanLine,
  ChevronDown,
  ArrowUpRight,
} from 'lucide-react-native';

// ─── Types ────────────────────────────────────────────────────────────────────
type TabType = 'available' | 'active' | 'history' | 'profile';

interface HistoryItem {
  id: string;
  location: { lat: number; lng: number; address: string };
  waste_hint: string | null;
  created_at: string;
  waste_classifications?: {
    waste_type: string;
    collector_weight_kg: number | null;
  }[];
}

interface DriverStats {
  completedJobs: number;
  totalWeightKg: number;
  completedEarnings: number;
  pendingEarnings: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getJobAccentColor = (hint: string = '') => {
  const h = hint.toLowerCase();
  if (h.includes('metal'))                             return '#2e7d32'; // Dark Forest Green
  if (h.includes('paper') || h.includes('cardboard')) return '#558b2f'; // Olive Green
  if (h.includes('organic'))                           return '#166534'; // Standard Green
  if (h.includes('plastic'))                           return '#006948'; // Brand Green
  return '#006948';
};

const getJobTypeLabel = (hint: string = '') => {
  if (!hint) return 'Mixed Waste';
  const upper = hint.split(':')[0].trim();
  return upper ? upper.charAt(0) + upper.slice(1).toLowerCase() : 'Mixed Waste';
};

const getWasteTypeBadgeColor = (type: string) => {
  switch (type.toLowerCase()) {
    case 'plastic': return { bg: '#e0f2f1', text: '#006948' }; // Teal-ish Green
    case 'paper':   return { bg: '#f1f8e9', text: '#558b2f' }; // Light Lime
    case 'metal':   return { bg: '#e8f5e9', text: '#2e7d32' }; // Forest Green
    case 'organic': return { bg: '#dcfce7', text: '#166534' }; // Emerald Green
    case 'glass':   return { bg: '#f9fbe7', text: '#827717' }; // Lime Green
    default:        return { bg: '#f0f4f1', text: '#006948' }; // Default Light Green
  }
};

const formatRupiah = (amount: number = 0) => `Rp ${amount.toLocaleString('id-ID')}`;

type BannerVariant = 'morning' | 'afternoon' | 'evening' | 'night';

const bannerAssets: Record<BannerVariant, any> = {
  morning: require('../../../assets/logo/gm (1).png'),
  afternoon: require('../../../assets/logo/ga (1).png'),
  evening: require('../../../assets/logo/ge (1).png'),
  night: require('../../../assets/logo/gn (1).png'),
};

const getDriverBannerVariant = (hour = new Date().getHours()): BannerVariant => {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
};

const getDriverBannerGreeting = (hour = new Date().getHours(), name = 'Driver') => {
  const variant = getDriverBannerVariant(hour);
  const prefix = {
    morning: 'Good morning',
    afternoon: 'Good afternoon',
    evening: 'Good evening',
    night: 'Good night',
  }[variant];

  return `${prefix}, ${name}`;
};

const getTimelineDotColor = (type: string) => {
  switch (type.toLowerCase()) {
    case 'plastic': return '#006948';
    case 'paper':   return '#558b2f';
    case 'metal':   return '#2e7d32';
    case 'organic': return '#166534';
    case 'glass':   return '#827717';
    default:        return '#006948';
  }
};

// ─── TSP Nearest Neighbor ─────────────────────────────────────────────────────
const haversineDistance = (
  c1: { lat: number; lng: number },
  c2: { lat: number; lng: number }
) => {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(c2.lat - c1.lat);
  const dLon = toRad(c2.lng - c1.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 *
      Math.cos(toRad(c1.lat)) *
      Math.cos(toRad(c2.lat));
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const runTSP = (
  start: { lat: number; lng: number },
  jobs: any[]
): any[] => {
  if (jobs.length <= 1) return jobs;
  let unvisited = [...jobs];
  const optimized: any[] = [];
  let currentPoint = start;

  while (unvisited.length > 0) {
    let nearestIdx = 0;
    let minDist = Infinity;
    for (let i = 0; i < unvisited.length; i++) {
      const dist = haversineDistance(currentPoint, unvisited[i].location);
      if (dist < minDist) {
        minDist = dist;
        nearestIdx = i;
      }
    }
    optimized.push(unvisited[nearestIdx]);
    currentPoint = unvisited[nearestIdx].location;
    unvisited.splice(nearestIdx, 1);
  }
  return optimized;
};

// ─── Bottom Nav ───────────────────────────────────────────────────────────────
const AnimatedCollectorNavItem = ({
  isActive,
  onPress,
  IconComp,
  label,
}: {
  isActive: boolean;
  onPress: () => void;
  IconComp: any;
  label: string;
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isActive ? 1.15 : 1,
      useNativeDriver: true,
      friction: 4,
      tension: 40,
    }).start();
  }, [isActive, scaleAnim]);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={navStyles.touchable}
      activeOpacity={0.7}
      testID={`collector-nav-${label.toLowerCase()}`}
    >
      <Animated.View style={[navStyles.navItemInner, { transform: [{ scale: scaleAnim }] }]}>
        <IconComp
          size={24}
          color={isActive ? '#006948' : '#94a3b8'}
          strokeWidth={isActive ? 2.5 : 2}
        />
        <Text style={[navStyles.label, { color: isActive ? '#006948' : '#94a3b8' }]}>
          {label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const CollectorBottomNav = ({
  activeTab,
  onTabPress,
}: {
  activeTab: TabType;
  onTabPress: (tab: TabType) => void;
}) => {
  const insets = useSafeAreaInsets();

  const tabs: { key: TabType; icon: any; label: string }[] = [
    { key: 'available', icon: Home, label: 'Home' },
    { key: 'active',    icon: MapIcon, label: 'Route' },
    { key: 'history',   icon: History, label: 'History' },
    { key: 'profile',   icon: User, label: 'Profile' },
  ];

  return (
    <View style={[navStyles.container, { paddingBottom: insets.bottom || 14 }]}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <AnimatedCollectorNavItem
            key={tab.key}
            isActive={isActive}
            onPress={() => onTabPress(tab.key)}
            IconComp={tab.icon}
            label={tab.label}
          />
        );
      })}
    </View>
  );
};

const navStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    zIndex: 1000,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.05, shadowRadius: 5 },
      android: { elevation: 10 },
    }),
  },
  touchable: { flex: 1, height: 60, alignItems: 'center', justifyContent: 'center' },
  navItemInner: { alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 12, fontWeight: '600', marginTop: 4 },
});

// ─── Profile Tab ──────────────────────────────────────────────────────────────
const ProfileTab = ({
  user,
  logout,
  stats,
  header,
  navigation, // <--- 1. Tambahkan navigation di sini
}: {
  user: any;
  logout: () => void;
  stats: DriverStats;
  header?: React.ReactNode;
  navigation: any; // <--- 2. Definisikan tipe datanya
}) => {
  const insets = useSafeAreaInsets();

  const driverId = user?.id
    ? 'ECO-' + user.id.replace(/-/g, '').slice(0, 4).toUpperCase()
    : 'ECO-0000';
  const vehicleType = user?.vehicle_type;
  const vehiclePlate = user?.vehicle_plate;

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[
        profileStyles.scroll, 
        { paddingBottom: Platform.OS === 'ios' ? insets.bottom + 100 : 120 }
      ]}
      showsVerticalScrollIndicator={false}
    >
      {header}
      <View style={profileStyles.profileCard}>
        <View style={profileStyles.avatarWrapper}>
          <ProfileAvatar
            name={user?.name}
            avatarUrl={user?.avatar_url}
            size={92}
            fallback="D"
          />
        </View>
        <Text style={profileStyles.userName}>{user?.name || 'Collector'}</Text>
        <Text style={profileStyles.userTitle}>Eco Collector • Driver ID {driverId}</Text>
      </View>

      <View style={profileStyles.impactCard}>
        <View style={profileStyles.impactInfo}>
          <Text style={profileStyles.impactLabel}>Total Weight Collected</Text>
          <View style={profileStyles.impactValueRow}>
            <Text style={profileStyles.impactValue}>{stats.totalWeightKg.toFixed(0)}</Text>
            <Text style={profileStyles.impactUnit}>kg</Text>
          </View>
        </View>
      </View>

      <View style={profileStyles.statsRow}>
        <Card style={profileStyles.smallStatCard}>
          <Recycle color="#006948" size={24} style={profileStyles.statIcon} />
          <Text style={profileStyles.smallStatValue}>{stats.completedJobs.toLocaleString('id-ID')}</Text>
          <Text style={profileStyles.smallStatLabel}>JOBS</Text>
        </Card>
        <Card style={profileStyles.smallStatCard}>
          <Award color="#006948" size={24} style={profileStyles.statIcon} />
          <Text style={profileStyles.smallStatValue}>{formatRupiah(stats.completedEarnings)}</Text>
          <Text style={profileStyles.smallStatLabel}>EARNINGS</Text>
        </Card>
      </View>

      <Card style={profileStyles.vehicleCard}>
        <View style={profileStyles.sectionHeader}>
          <View style={profileStyles.sectionIconBox}>
            <Truck color="#006948" size={20} />
          </View>
          <Text style={profileStyles.sectionTitle}>Vehicle Info</Text>
        </View>
        {vehicleType || vehiclePlate ? (
          <View style={profileStyles.vehicleDetails}>
            <Text style={profileStyles.vehicleValue}>{vehicleType || 'Vehicle type not set'}</Text>
            <Text style={profileStyles.vehicleMeta}>{vehiclePlate || 'License plate not set'}</Text>
          </View>
        ) : (
          <Text style={profileStyles.emptyVehicleText}>Vehicle details not configured</Text>
        )}
      </Card>

      <Card style={profileStyles.menuCard}>
        {/* Tambahkan onPress di bawah ini */}
        <TouchableOpacity 
          style={profileStyles.menuItem}
          onPress={() => navigation.navigate('AccountSettings')}
        >
          <View style={[profileStyles.menuIconBox, { backgroundColor: '#e6f4f0' }]}>
            <UserCircle color="#006948" size={20} />
          </View>
          <Text style={profileStyles.menuText}>Account Settings</Text>
          <ChevronRight color="#9ca3af" size={20} />
        </TouchableOpacity>

        {/* Tambahkan onPress di bawah ini */}
        <TouchableOpacity 
          style={profileStyles.menuItem}
          onPress={() => navigation.navigate('HelpSupport')}
        >
          <View style={[profileStyles.menuIconBox, { backgroundColor: '#f1f5f9' }]}>
            <HelpCircle color="#006948" size={20} />
          </View>
          <Text style={profileStyles.menuText}>Help & Support</Text>
          <ChevronRight color="#9ca3af" size={20} />
        </TouchableOpacity>

        <TouchableOpacity style={[profileStyles.menuItem, { borderBottomWidth: 0 }]} onPress={logout}>
          <View style={[profileStyles.menuIconBox, { backgroundColor: '#ffdad6' }]}>
            <LogOut color="#ba1a1a" size={20} />
          </View>
          <Text style={[profileStyles.menuText, { color: '#ba1a1a' }]}>Log Out</Text>
        </TouchableOpacity>
      </Card>
    </ScrollView>
  );
};

const profileStyles = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, backgroundColor: '#ffffff' },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    marginTop: 40,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
      android: { elevation: 3 },
    }),
  },
  avatarWrapper: {
    width: 100,
    height: 100,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -70,
    marginBottom: spacing.md,
    borderWidth: 4,
    borderColor: '#fff',
    backgroundColor: '#e6f4f0',
  },
  userName: { fontSize: 24, fontWeight: '800', color: '#121c28', marginBottom: 4 },
  userTitle: { fontSize: 14, color: '#757575', fontWeight: '500', textAlign: 'center' },
  impactCard: {
    backgroundColor: '#006948',
    borderRadius: 24,
    padding: spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...Platform.select({
      ios: { shadowColor: '#006948', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12 },
      android: { elevation: 6 },
    }),
  },
  impactInfo: { flex: 1 },
  impactLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '500', marginBottom: spacing.xs },
  impactValueRow: { flexDirection: 'row', alignItems: 'baseline' },
  impactValue: { fontSize: 48, fontWeight: '800', color: '#fff' },
  impactUnit: { fontSize: 20, fontWeight: '700', color: '#fff', marginLeft: 4 },
  kgBadge: {
    width: 60,
    height: 60,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  kgBadgeText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  statsRow: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.lg },
  smallStatCard: { flex: 1, padding: spacing.lg, borderRadius: 24, backgroundColor: '#fff' },
  statIcon: { marginBottom: spacing.md },
  smallStatValue: { fontSize: 22, fontWeight: '800', color: '#121c28', marginBottom: 4 },
  smallStatLabel: { fontSize: 12, fontWeight: '700', color: '#757575', letterSpacing: 1 },
  vehicleCard: { backgroundColor: '#fff', borderRadius: 24, padding: spacing.lg, marginBottom: spacing.lg },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: spacing.md },
  sectionIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#e6f4f0', justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  emptyVehicleText: { fontSize: 14, color: '#64748b', fontWeight: '600' },
  vehicleDetails: { gap: 4 },
  vehicleValue: { fontSize: 16, color: '#121c28', fontWeight: '800' },
  vehicleMeta: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  menuCard: { backgroundColor: '#fff', borderRadius: 24, paddingHorizontal: spacing.lg },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  menuIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  menuText: { flex: 1, fontSize: 16, fontWeight: '600', color: '#121c28' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export const CollectorHomeScreen = () => {
  const { user, logout } = useAuthStore();
  const { unreadCount, fetchNotifications } = useNotificationStore();
  const {
    requests,
    fetchPendingRequests,
    fetchAssignedRequests,
    acceptRequest,
    loading,
    reorderRequests,
  } = usePickupStore();

  const [tab, setTab] = useState<TabType>('available');
  const [refreshing, setRefreshing] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [driverStats, setDriverStats] = useState<DriverStats>({
    completedJobs: 0,
    totalWeightKg: 0,
    completedEarnings: 0,
    pendingEarnings: 0,
  });
  const [historyPage, setHistoryPage] = useState(5);
  const [tspLoading, setTspLoading] = useState(false);
  const [optimizedRequests, setOptimizedRequests] = useState<any[]>([]);

  // ── FIX: Refs untuk mencegah TSP infinite loop ────────────────────────────
  // tspDoneRef  → true setelah TSP selesai untuk batch request saat ini
  // tspRunning  → true selama TSP sedang berjalan (cegah double-trigger)
  // lastIdsRef  → simpan ID requests terakhir yang sudah di-TSP
  const tspDoneRef   = useRef(false);
  const tspRunning   = useRef(false);
  const lastIdsRef   = useRef<string>('');

  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const notificationTestId =
    tab === 'active'
      ? 'route-notification-button'
      : tab === 'profile'
        ? 'profile-notification-button'
        : tab === 'history'
          ? 'history-notification-button'
          : 'collector-notification-button';
  const driverFirstName = user?.name?.split(' ')[0] || 'Driver';
  const bannerVariant = getDriverBannerVariant();
  const [bannerGreetingTop, bannerGreetingBottom] = getDriverBannerGreeting(
    new Date().getHours(),
    driverFirstName
  ).split(', ');

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.logoGroup}>
        <View style={styles.logoPositioner}>
          <Logo size={32} />
        </View>
        <Text style={[styles.logoText, { color: '#006948' }]}>EcoSort</Text>
      </View>
      <TouchableOpacity
        testID={notificationTestId}
        style={[styles.iconButton, { backgroundColor: '#fff' }]}
        onPress={() => navigation.navigate('Notification')}
      >
        <Bell color="#006948" size={22} />
        {unreadCount > 0 && (
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeTextCount}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  // Reset TSP flag setiap kali tab berubah ke 'active'
  useEffect(() => {
    if (tab === 'active') {
      tspDoneRef.current = false;
    }
  }, [tab]);

  useEffect(() => {
    loadData();
  }, [tab]);

  useEffect(() => {
    if (user) {
      fetchNotifications?.(user.id);
      fetchDriverStats();
    }
  }, [user?.id]);

  // ── TSP trigger: hanya jalan jika tab active, requests ada,
  //    belum pernah di-TSP untuk batch ini, dan tidak sedang berjalan
  useEffect(() => {
    if (tab !== 'active') return;
    if (requests.length === 0) {
      setOptimizedRequests([]);
      return;
    }

    // Buat ID signature dari batch request sekarang
    const currentIds = requests.map((r) => r.id).sort().join(',');

    // Kalau batch sama dan TSP sudah selesai → skip
    if (tspDoneRef.current && lastIdsRef.current === currentIds) return;

    // Kalau sedang berjalan → skip
    if (tspRunning.current) return;

    // Kalau hanya 1 request → langsung set tanpa TSP
    if (requests.length === 1) {
      setOptimizedRequests(requests);
      tspDoneRef.current = true;
      lastIdsRef.current = currentIds;
      return;
    }

    // Jalankan TSP
    runTSPOptimization(currentIds);
  }, [requests, tab]);

  const loadData = async () => {
    if (!user || tab === 'profile') return;
    if (tab === 'available')    await fetchPendingRequests();
    else if (tab === 'active')  await fetchAssignedRequests(user.id);
    else if (tab === 'history') await fetchHistory();
  };

  const fetchHistory = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('pickup_requests')
        .select('*, waste_classifications(waste_type, collector_weight_kg)')
        .eq('collector_id', user.id)
        .eq('status', 'COMPLETED')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const nextHistory = (data as HistoryItem[]) || [];
      setHistory(nextHistory);
      await cacheCollectorPickupHistory(user.id, nextHistory);
    } catch {
      const cachedHistory = await getCachedCollectorPickupHistory(user.id);
      setHistory(cachedHistory as HistoryItem[]);
    }
  };

  const fetchDriverStats = async () => {
    if (!user) return;

    const { data: completedPickups } = await (supabase
      .from('pickup_requests') as any)
      .select('id, waste_classifications(collector_weight_kg)')
      .eq('collector_id', user.id)
      .eq('status', 'COMPLETED')
      .order('created_at', { ascending: false });

    const pickups = (completedPickups || []) as any[];
    const totalWeightKg = pickups.reduce((sum, pickup) => {
      const pickupWeight = (pickup.waste_classifications || []).reduce(
        (innerSum: number, row: any) => innerSum + (Number(row.collector_weight_kg) || 0),
        0
      );
      return sum + pickupWeight;
    }, 0);

    const { data: transactions } = await (supabase
      .from('transactions') as any)
      .select('amount, status, type')
      .eq('user_id', user.id)
      .eq('type', 'CREDIT')
      .order('created_at', { ascending: false });

    const credits = (transactions || []) as any[];
    const completedEarnings = credits
      .filter((tx) => tx.status === 'COMPLETED')
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    const pendingEarnings = credits
      .filter((tx) => tx.status === 'PENDING')
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

    setDriverStats({
      completedJobs: pickups.length,
      totalWeightKg,
      completedEarnings,
      pendingEarnings,
    });
  };

  const onRefresh = async () => {
    // Reset TSP saat refresh agar bisa re-optimasi dengan data baru
    tspDoneRef.current = false;
    lastIdsRef.current = '';
    setRefreshing(true);
    await loadData();
    await fetchDriverStats();
    setRefreshing(false);
  };

  // ─── TSP Optimization (tidak memanggil reorderRequests di store) ───────────
  const runTSPOptimization = async (currentIds: string) => {
    tspRunning.current = true;
    setTspLoading(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        // Tidak ada izin lokasi → tampilkan urutan apa adanya
        setOptimizedRequests(requests);
        tspDoneRef.current = true;
        lastIdsRef.current = currentIds;
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced, // lebih cepat dari High
      });

      const start = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      const sorted = runTSP(start, requests);

      // Set hanya di local state, TIDAK panggil reorderRequests
      // supaya tidak trigger useEffect requests lagi → infinite loop fix
      setOptimizedRequests(sorted);
      tspDoneRef.current = true;
      lastIdsRef.current = currentIds;

    } catch {
      // Kalau gagal ambil lokasi → tampilkan urutan apa adanya
      setOptimizedRequests(requests);
      tspDoneRef.current = true;
      lastIdsRef.current = currentIds;
    } finally {
      tspRunning.current = false;
      setTspLoading(false);
    }
  };

  const handleAccept = async (requestId: string) => {
    if (!user) return;
    try {
      await acceptRequest(requestId, user.id);
      Alert.alert('Success', 'Job accepted! Check your Assigned tab.');
      // Reset TSP flag agar setelah accept, urutan di-recalculate
      tspDoneRef.current = false;
      lastIdsRef.current = '';
      setTab('active');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDecline = (_requestId: string) => {
    Alert.alert('Declined', 'You have skipped this job.');
  };

  // ─── Requests Tab ──────────────────────────────────────────────────────────
  const renderRequestsTab = () => (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[
        styles.availableScroll,
        { paddingBottom: Platform.OS === 'ios' ? insets.bottom + 100 : 120 }
      ]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      <View testID="driver-home-header-shell" style={styles.homeHeaderShell}>
        {renderHeader()}
      </View>

      <View style={styles.bannerSection}>
        <ImageBackground
          testID={`driver-home-banner-${bannerVariant}`}
          source={bannerAssets[bannerVariant]}
          style={styles.bannerImage}
          imageStyle={styles.bannerImageAsset}
          resizeMode="cover"
        >
          <View style={styles.bannerOverlay}>
            <Text style={styles.bannerGreetingTop}>{bannerGreetingTop},</Text>
            <Text style={styles.bannerGreetingBottom}>{bannerGreetingBottom}</Text>
          </View>
        </ImageBackground>
      </View>

      <View style={styles.walletSection}>
        <View style={styles.walletCard}>
          <View style={styles.walletRow}>
            <View style={styles.walletIdentity}>
              <View style={styles.walletLogoWrap}>
                <Wallet color="#006948" size={20} />
              </View>
              <View style={styles.walletCopy}>
                <Text style={styles.walletLabel}>Eco Coins</Text>
                <Text style={styles.balanceText}>{formatRupiah(user?.balance ?? 0)}</Text>
              </View>
            </View>

            <View style={styles.walletActions}>
              <TouchableOpacity
                style={styles.walletAction}
                onPress={() => navigation.navigate('Withdrawal')}
                activeOpacity={0.82}
              >
                <View style={styles.walletActionIcon}>
                  <ArrowUpRight color="#006948" size={18} />
                </View>
                <Text style={styles.walletActionLabel}>Redeem</Text>
              </TouchableOpacity>

              <TouchableOpacity
                testID="driver-wallet-history-button"
                style={styles.walletAction}
                onPress={() => navigation.navigate('TransactionHistory')}
                activeOpacity={0.82}
              >
                <View style={styles.walletActionIcon}>
                  <History color="#006948" size={18} />
                </View>
                <Text style={styles.walletActionLabel}>History</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <View testID="driver-finished-stat-icon" style={styles.statIconCircle}>
            <CircleCheckBig color="#006948" size={22} />
          </View>
          <Text style={styles.statBoxLabel}>FINISHED</Text>
          <View style={styles.statValueRow}>
            <Text style={styles.statBoxValue}>{driverStats.completedJobs}</Text>
            <Text style={styles.statBoxUnit}> trips</Text>
          </View>
        </View>
        <View style={styles.statBox}>
          <View testID="driver-collected-stat-icon" style={styles.statIconCircle}>
            <Hourglass color="#006948" size={22} />
          </View>
          <Text style={styles.statBoxLabel}>COLLECTED</Text>
          <View style={styles.statValueRow}>
            <Text style={styles.statBoxValue}>{driverStats.totalWeightKg.toFixed(0)}</Text>
            <Text style={styles.statBoxUnit}>kg</Text>
          </View>
        </View>
      </View>

      {/* Job Cards */}
      <View style={styles.pickupSectionHeader}>
        <Text style={styles.pickupSectionTitle}>Pickup Requests</Text>
      </View>

      {requests.length > 0 ? (
        requests.map((item) => {
          const accentColor = getJobAccentColor(item.waste_hint ?? '');
          const typeLabel   = getJobTypeLabel(item.waste_hint ?? '');
          return (
            <View key={item.id} style={styles.jobCard}>
              <View style={[styles.jobAccent, { backgroundColor: accentColor }]} />
              <View style={styles.jobInner}>
                <View style={styles.jobTopRow}>
                  <Text style={styles.jobTypeText}>{typeLabel}</Text>
                </View>
                <View style={styles.jobDistanceRow}>
                  <MapPin color="#94a3b8" size={13} />
                  <Text style={styles.jobDistance}>
                    {new Date(item.created_at).toLocaleTimeString([], {
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </Text>
                </View>
                <View style={styles.jobAddressRow}>
                  <MapPin color="#006948" size={16} />
                  <Text style={styles.jobAddressText} numberOfLines={1}>
                    {item.location.address}
                  </Text>
                </View>
                <View style={styles.jobActions}>
                  <TouchableOpacity style={styles.declineBtn} onPress={() => handleDecline(item.id)}>
                    <Text style={styles.declineBtnText}>Decline</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(item.id)}>
                    <Text style={styles.acceptBtnText}>{loading ? '...' : 'Accept'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })
      ) : (
        <View style={styles.emptyContainer}>
          <Package color={colors.ceramic} size={64} strokeWidth={1} />
          <Text style={styles.emptyText}>No new pickups in your area.</Text>
          <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
            <Text style={styles.refreshBtnText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );

  // ─── Active / Assigned Tab ─────────────────────────────────────────────────
  const renderActiveTab = () => {
    const displayList = optimizedRequests.length > 0 ? optimizedRequests : requests;
    const currentJob  = displayList[0];
    const totalJobs   = displayList.length;

    return (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.assignedScroll, 
          { paddingBottom: Platform.OS === 'ios' ? insets.bottom + 100 : 120 }
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View testID="route-header-wrapper" style={styles.pageHeaderWrapper}>
          {renderHeader()}
        </View>
        
        {/* Stats Row */}
        <View style={styles.assignedStatsRow}>
          <View style={styles.assignedStatBox}>
            <Text style={styles.assignedStatBoxTitle}>ACTIVE STOPS</Text>
            <View style={styles.assignedPickupCount}>
              <Text style={styles.assignedPickupValue}>{totalJobs}</Text>
            </View>
          </View>

          <View style={styles.assignedStatBox}>
            <Text style={styles.assignedStatBoxTitle}>PENDING EARNINGS</Text>
            <View style={styles.estEarningsRow}>
              <Wallet color="#92400e" size={20} />
              <Text style={styles.estEarningsAmount}>
                {formatRupiah(driverStats.pendingEarnings)}
              </Text>
            </View>
          </View>
        </View>

        {requests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MapIcon color={colors.ceramic} size={64} strokeWidth={1} />
            <Text style={styles.emptyText}>Your route is currently empty.</Text>
          </View>
        ) : (
          <>
            {/* TSP Status Badge */}
            {tspLoading ? (
              <View style={styles.tspBadge}>
                <ActivityIndicator size="small" color="#006948" />
                <Text style={styles.tspBadgeText}>Optimizing route with TSP...</Text>
              </View>
            ) : (
              <View style={styles.tspBadge}>
                <Navigation color="#006948" size={14} />
                <Text style={styles.tspBadgeText}>
                  Route optimized via Nearest Neighbor TSP ({totalJobs} stops)
                </Text>
              </View>
            )}

            {/* Map */}
            {currentJob && (
              <View style={styles.mapContainer}>
                <MapView
                  style={styles.map}
                  provider={PROVIDER_DEFAULT}
                  initialRegion={{
                    latitude: currentJob.location.lat,
                    longitude: currentJob.location.lng,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                  }}
                  scrollEnabled={true}
                  zoomEnabled={true}
                  zoomControlEnabled={true}
                  showsUserLocation={true}
                  showsMyLocationButton={true}
                  mapPadding={{ top: 36, right: 24, bottom: 36, left: 24 }}
                >
                  {/* Marker tiap pickup, warna & nomor berbeda per jenis sampah */}
                  {displayList.map((item, idx) => {
                    const isFirst   = idx === 0;
                    const accentHex = getJobAccentColor(item.waste_hint ?? '');
                    const label     = getJobTypeLabel(item.waste_hint ?? '').slice(0, 3).toUpperCase();
                    return (
                      <Marker
                        key={item.id}
                        coordinate={{
                          latitude: item.location.lat,
                          longitude: item.location.lng,
                        }}
                        anchor={{ x: 0.5, y: 0.5 }}
                        title={`#${idx + 1} ${getJobTypeLabel(item.waste_hint ?? '')}`}
                        description={item.location.address}
                      >
                        <View
                          testID={`route-map-marker-${idx + 1}`}
                          collapsable={false}
                          style={styles.mapMarkerContainer}
                        >
                          <View
                            testID={`route-map-pin-${idx + 1}`}
                            collapsable={false}
                            style={[
                              styles.mapMarker,
                              { backgroundColor: isFirst ? '#006948' : accentHex },
                            ]}
                          >
                            <Text style={styles.mapMarkerNumber}>
                              {idx + 1}
                            </Text>
                          </View>
                        </View>
                      </Marker>
                    );
                  })}
                </MapView>
              </View>
            )}

            {/* Current Job Card */}
            {currentJob && (
              <View style={styles.assignedJobCard}>
                <View style={styles.assignedJobTop}>
                  <View style={styles.etaBadge}>
                    <Clock color="#0284c7" size={13} />
                    <Text style={styles.etaText}>Current stop</Text>
                  </View>
                </View>

                <Text style={styles.assignedJobAddress}>
                  {currentJob.location.address}
                </Text>

                <View style={styles.assignedJobMeta}>
                  <User color="#94a3b8" size={15} />
                  <Text style={styles.assignedJobMetaText}>
                    {getJobTypeLabel(currentJob.waste_hint ?? '')} •{' '}
                    {currentJob.waste_hint?.split(':')[1]?.split(',').length ?? 1} Bags
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.scanVerifyBtn}
                  onPress={() => navigation.navigate('CollectorJobDetail', { job: currentJob })}
                >
                  <ScanLine color="#fff" size={20} />
                  <Text style={styles.scanVerifyText}>Scan & Verify Pickup</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Next Stops */}
            {displayList.length > 1 && (
              <View style={styles.nextStopsContainer}>
                <Text style={styles.nextStopsTitle}>Next Stops</Text>
                {displayList.slice(1).map((item, idx) => (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.75}
                    onPress={() => navigation.navigate('CollectorJobDetail', { job: item })}
                  >
                    <View style={styles.nextStopCard}>
                      <View style={styles.nextStopNumber}>
                        <Text style={styles.nextStopNumberText}>{idx + 2}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.nextStopAddress} numberOfLines={1}>
                          {item.location.address}
                        </Text>
                        <Text style={styles.nextStopType}>
                          {getJobTypeLabel(item.waste_hint ?? '')}
                        </Text>
                      </View>
                      <ChevronRight color="#cbd5e1" size={18} />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    );
  };

  // ─── History Tab ───────────────────────────────────────────────────────────
  const renderHistoryTab = () => {
    const visibleHistory = history.slice(0, historyPage);
    const hasMore = history.length > historyPage;

    return (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scroll, 
          { paddingBottom: Platform.OS === 'ios' ? insets.bottom + 100 : 120 }
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View testID="history-header-wrapper" style={styles.historyHeaderWrapper}>
          {renderHeader()}
        </View>
        <Text style={styles.historyPageTitle}>History</Text>
        <Text style={styles.historyPageSubtitle}>
          Review your past sorting deposits and environmental impact.
        </Text>

        {history.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Clock color={colors.ceramic} size={64} strokeWidth={1} />
            <Text style={styles.emptyText}>No completed jobs yet.</Text>
          </View>
        ) : (
          <>
            <View style={styles.timeline}>
              {visibleHistory.map((item, idx) => {
                const classification = item.waste_classifications?.[0];
                const wasteType = classification?.waste_type ?? 'other';
                const weight    = classification?.collector_weight_kg;
                const badge     = getWasteTypeBadgeColor(wasteType);
                const dotColor  = getTimelineDotColor(wasteType);
                const isLast    = idx === visibleHistory.length - 1;

                return (
                  <View key={item.id} style={styles.timelineItem}>
                    <View style={styles.timelineDotCol}>
                      <View style={[styles.timelineDot, { backgroundColor: dotColor }]} />
                      {!isLast && <View style={styles.timelineLine} />}
                    </View>
                    <View style={styles.historyCard}>
                      <View style={styles.historyCardTop}>
                        <View style={[styles.wasteTypeBadge, { backgroundColor: badge.bg }]}>
                          <Text style={[styles.wasteTypeBadgeText, { color: badge.text }]}>
                            {wasteType.toUpperCase()}
                          </Text>
                        </View>
                        {weight != null && (
                          <Text style={styles.weightText}>{weight}kg</Text>
                        )}
                      </View>
                      <View style={styles.historyAddressRow}>
                        <MapPin color="#94a3b8" size={13} />
                        <Text style={styles.historyAddressText} numberOfLines={1}>
                          {item.location.address}
                        </Text>
                      </View>
                      <View style={styles.historyDateRow}>
                        <Text style={styles.historyDateText}>
                          {new Date(item.created_at).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric',
                          })}
                        </Text>
                        <Text style={styles.historyTimeText}>
                          {new Date(item.created_at).toLocaleTimeString([], {
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>

            {hasMore && (
              <TouchableOpacity
                style={styles.loadMoreBtn}
                onPress={() => setHistoryPage((p) => p + 5)}
              >
                <Text style={styles.loadMoreText}>Load More</Text>
                <ChevronDown color="#006948" size={18} />
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    );
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  const screenBackground = '#ffffff';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#006948" />

      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View testID="collector-screen-content" style={[styles.content, { backgroundColor: screenBackground }]}>
          {tab === 'available' && renderRequestsTab()}
          {tab === 'active'    && renderActiveTab()}
          {tab === 'history'   && renderHistoryTab()}
          {tab === 'profile'   && (
             <ProfileTab 
               user={user} 
               logout={logout} 
               stats={driverStats} 
               header={renderHeader()} 
               navigation={navigation} /* <--- 3. Masukkan navigation di sini */
             />
          )}
        </View>
      </SafeAreaView>

      <CollectorBottomNav activeTab={tab} onTabPress={setTab} />
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#006948' },
  safeArea: { flex: 1, backgroundColor: '#006948' },
  content: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    paddingLeft: 12,
    paddingTop: 8,
  },
  logoPositioner: {
    position: 'absolute',
    top: -2,
    left: -4,
    zIndex: 10,
    transform: [{ rotate: '-15deg' }],
  },
  logoText: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  badgeContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ba1a1a',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  badgeTextCount: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },
  bgCircle: {
    position: 'absolute',
    opacity: 0.5,
  },
  scroll: { paddingHorizontal: spacing.lg, paddingTop: 0, backgroundColor: '#ffffff' },
  availableScroll: { paddingTop: 0, backgroundColor: '#ffffff' },
  assignedScroll: { paddingTop: 0, backgroundColor: '#ffffff' },
  pageHeaderWrapper: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    marginBottom: spacing.xl,
  },
  historyHeaderWrapper: {
    paddingTop: spacing.md,
    marginBottom: spacing.xl,
  },
  homeHeaderShell: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm + 4,
    marginBottom: 0,
    overflow: 'hidden',
    zIndex: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 14,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  bannerSection: {
    height: 320,
    marginTop: -92,
    marginBottom: 0,
    backgroundColor: '#d7edd8',
    overflow: 'hidden',
    zIndex: 0,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-start',
  },
  bannerImageAsset: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: 150,
    justifyContent: 'flex-start',
  },
  bannerGreetingTop: {
    color: '#ffffff',
    fontSize: 27,
    fontWeight: '900',
    lineHeight: 30,
    maxWidth: '72%',
    textShadowColor: 'rgba(0, 0, 0, 0.24)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  bannerGreetingBottom: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 34,
    marginTop: -2,
    maxWidth: '72%',
    textShadowColor: 'rgba(0, 0, 0, 0.24)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  walletSection: {
    marginHorizontal: spacing.lg,
    marginTop: -45,
    marginBottom: spacing.lg,
    zIndex: 3,
  },
  walletCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: '#e8edf2',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: { elevation: 4 },
    }),
  },
  walletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  walletIdentity: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  walletLogoWrap: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#e0f2f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletCopy: { flex: 1, minWidth: 0 },
  walletLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    marginBottom: 2,
  },
  balanceText: {
    color: '#121c28',
    fontSize: 23,
    fontWeight: '800',
    lineHeight: 26,
  },
  walletActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    gap: 6,
  },
  walletAction: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 2,
    minWidth: 54,
  },
  walletActionIcon: {
    width: 34,
    height: 34,
    borderRadius: 14,
    backgroundColor: '#e0f2f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletActionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#121c28',
  },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginHorizontal: spacing.lg, marginBottom: spacing.xl },
  statBox: {
    flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: spacing.md, alignItems: 'center', gap: 6,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  statIconCircle: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#e0f2f1', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  statBoxLabel: { fontSize: 10, fontWeight: '700', color: '#94a3b8', letterSpacing: 1 },
  statValueRow: { flexDirection: 'row', alignItems: 'baseline' },
  statBoxValue: { fontSize: 28, fontWeight: '800', color: '#0f172a' },
  statBoxUnit: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  pickupSectionHeader: { marginHorizontal: spacing.lg, marginBottom: spacing.md },
  pickupSectionTitle: { fontSize: 20, fontWeight: '800', color: '#121c28' },
  jobCard: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, marginHorizontal: spacing.lg, marginBottom: spacing.md, overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  jobAccent: { width: 5, borderTopLeftRadius: 16, borderBottomLeftRadius: 16 },
  jobInner: { flex: 1, padding: spacing.md },
  jobTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  jobTypeText: { fontSize: 16, fontWeight: '700', color: '#0f172a', flex: 1 },
  rewardBadge: { backgroundColor: '#e6f4f0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  rewardBadgeText: { fontSize: 13, fontWeight: '700', color: '#006948' },
  jobDistanceRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: spacing.md },
  jobDistance: { fontSize: 12, color: '#94a3b8', fontWeight: '500' },
  jobAddressRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: spacing.md, backgroundColor: '#ffffff', borderRadius: 10, padding: spacing.sm,
  },
  jobAddressText: { flex: 1, fontSize: 14, color: '#334155', fontWeight: '500' },
  jobActions: { flexDirection: 'row', gap: spacing.sm },
  declineBtn: {
    flex: 1, height: 44, borderRadius: 10,
    borderWidth: 1, borderColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center',
  },
  declineBtnText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  acceptBtn: {
    flex: 1, height: 44, borderRadius: 10, backgroundColor: '#006948',
    justifyContent: 'center', alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#006948', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 6 },
      android: { elevation: 4 },
    }),
  },
  acceptBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  assignedStatsRow: {
    flexDirection: 'row', gap: spacing.md,
    paddingHorizontal: spacing.lg, marginBottom: spacing.md,
  },
  assignedStatBox: {
    flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: spacing.lg,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  assignedStatBoxTitle: { fontSize: 10, fontWeight: '800', color: '#94a3b8', letterSpacing: 1, marginBottom: 8 },
  assignedPickupCount: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 8 },
  assignedPickupValue: { fontSize: 32, fontWeight: '800', color: '#006948' },
  assignedPickupTotal: { fontSize: 16, fontWeight: '600', color: '#94a3b8' },
  progressBarBg: { height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#006948', borderRadius: 3 },
  estEarningsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  estEarningsAmount: { fontSize: 24, fontWeight: '800', color: '#92400e', lineHeight: 28 },
  tspBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginHorizontal: spacing.lg, marginBottom: spacing.sm,
    backgroundColor: '#f1f8e9', borderRadius: 10,
    paddingHorizontal: spacing.md, paddingVertical: 8,
  },
  tspBadgeText: { fontSize: 12, color: '#006948', fontWeight: '600', flex: 1 },
  mapMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    backgroundColor: 'transparent',
  },
  mapMarker: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#fff',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6 },
      android: { elevation: 6 },
    }),
  },
  mapMarkerNumber: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
  },
  mapContainer: {
    height: 260, marginHorizontal: spacing.lg,
    borderRadius: 20, overflow: 'hidden', marginBottom: 0,
  },
  map: { flex: 1 },

  assignedJobCard: {
    backgroundColor: '#fff', marginHorizontal: spacing.lg,
    borderRadius: 20, padding: spacing.lg, marginTop: -20,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
      android: { elevation: 5 },
    }),
  },
  assignedJobTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: spacing.md,
  },
  etaBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#e6f4f0', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  etaText: { fontSize: 13, fontWeight: '600', color: '#006948' },
  estValueLabel: { fontSize: 10, fontWeight: '700', color: '#94a3b8', letterSpacing: 1, textAlign: 'right' },
  estValueAmount: { fontSize: 18, fontWeight: '800', color: '#006948', textAlign: 'right' },
  assignedJobAddress: { fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: spacing.sm },
  assignedJobMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.lg },
  assignedJobMetaText: { fontSize: 14, color: '#64748b', fontWeight: '500' },
  scanVerifyBtn: {
    backgroundColor: '#006948', flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', height: 54, borderRadius: 14, gap: 10,
    ...Platform.select({
      ios: { shadowColor: '#006948', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 5 },
    }),
  },
  scanVerifyText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  nextStopsContainer: { marginHorizontal: spacing.lg, marginTop: spacing.lg },
  nextStopsTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: spacing.md },
  nextStopCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: '#fff', borderRadius: 14, padding: spacing.md, marginBottom: spacing.sm,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  nextStopNumber: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: '#e6f4f0', justifyContent: 'center', alignItems: 'center',
  },
  nextStopNumberText: { fontSize: 12, fontWeight: '800', color: '#006948' },
  nextStopAddress: { fontSize: 14, fontWeight: '600', color: '#0f172a', marginBottom: 2 },
  nextStopType: { fontSize: 12, color: '#94a3b8', fontWeight: '500' },
  nextStopReward: { fontSize: 13, fontWeight: '700', color: '#006948' },
  historyPageTitle: { fontSize: 34, fontWeight: '800', color: '#0f172a', marginBottom: 6 },
  historyPageSubtitle: { fontSize: 14, color: '#64748b', fontWeight: '400', marginBottom: spacing.xl, lineHeight: 20 },
  timeline: { paddingLeft: 8 },
  timelineItem: { flexDirection: 'row', gap: 12, marginBottom: 0 },
  timelineDotCol: { alignItems: 'center', width: 20 },
  timelineDot: { width: 12, height: 12, borderRadius: 4, marginTop: 16 },
  timelineLine: { width: 2, flex: 1, backgroundColor: '#e2e8f0', marginTop: 4 },
  historyCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: spacing.lg, marginBottom: spacing.md,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  historyCardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  wasteTypeBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  wasteTypeBadgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  weightText: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  historyAddressRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  historyAddressText: { flex: 1, fontSize: 14, color: '#475569', fontWeight: '500' },
  historyDateRow: { alignItems: 'flex-end' },
  historyDateText: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  historyTimeText: { fontSize: 12, color: '#94a3b8', fontWeight: '400' },
  loadMoreBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderWidth: 1.5, borderColor: '#006948',
    borderRadius: 30, paddingVertical: 14, marginTop: spacing.md, marginBottom: spacing.xl,
  },
  loadMoreText: { fontSize: 15, fontWeight: '700', color: '#006948' },
  emptyContainer: {
    width: '100%', alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: spacing.sm,
  },
  emptyText: {
    fontSize: 15, color: colors.textBlackSoft,
    textAlign: 'center', fontWeight: '600', paddingHorizontal: spacing.xl,
  },
  refreshBtn: { marginTop: spacing.md, alignSelf: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.sm },
  refreshBtnText: { fontSize: 16, fontWeight: '700', color: '#006948', textAlign: 'center' },
  optimizeBtn: {
    backgroundColor: '#006948', flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', height: 56, borderRadius: 28, gap: 12, marginTop: spacing.md,
    ...Platform.select({
      ios: { shadowColor: '#006948', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 10 },
      android: { elevation: 8 },
    }),
  },
  optimizeText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
