import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Alert, 
  RefreshControl, 
  TouchableOpacity, 
  StatusBar,
  Platform,
  useWindowDimensions,
  ScrollView
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../services/theme/colors';
import { spacing } from '../../services/theme/spacing';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { useAuthStore } from '../../store/authStore';
import { usePickupStore } from '../../store/pickupStore';
import * as Location from 'expo-location';
import { 
  LogOut, 
  Package, 
  Map as MapIcon, 
  Navigation, 
  Wallet, 
  Clock, 
  CheckCircle,
  Truck,
  ChevronRight
} from 'lucide-react-native';

export const CollectorHomeScreen = () => {
  const { user, logout } = useAuthStore();
  const { requests, fetchPendingRequests, fetchAssignedRequests, acceptRequest, loading, reorderRequests } = usePickupStore();
  const [tab, setTab] = useState<'available' | 'active' | 'history'>('available');
  const [refreshing, setRefreshing] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  useEffect(() => {
    loadData();
  }, [tab]);

  const loadData = async () => {
    if (!user) return;
    if (tab === 'available') {
      await fetchPendingRequests();
    } else if (tab === 'active') {
      await fetchAssignedRequests(user.id);
    } else {
      await fetchHistory();
    }
  };

  const fetchHistory = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('pickup_requests')
      .select('*')
      .eq('collector_id', user.id)
      .eq('status', 'COMPLETED')
      .order('created_at', { ascending: false });
    
    if (!error) setHistory(data || []);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const haversineDistance = (coords1: { lat: number, lng: number }, coords2: { lat: number, lng: number }) => {
    const toRad = (x: number) => (x * Math.PI) / 180;
    const R = 6371; // km
    const dLat = toRad(coords2.lat - coords1.lat);
    const dLon = toRad(coords2.lng - coords1.lng);
    const lat1 = toRad(coords1.lat);
    const lat2 = toRad(coords2.lat);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleOptimizeRoute = async () => {
    if (requests.length <= 1) {
      Alert.alert('Info', 'Not enough active jobs to optimize.');
      return;
    }

    setIsOptimizing(true);
    try {
      // 1. Get current location
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to optimize your route.');
        return;
      }

      const currentPos = await Location.getCurrentPositionAsync({});
      let currentPoint = { 
        lat: currentPos.coords.latitude, 
        lng: currentPos.coords.longitude 
      };

      // 2. TSP Nearest Neighbor Algorithm
      let unvisited = [...requests];
      const optimized: any[] = [];

      while (unvisited.length > 0) {
        let nearestIdx = 0;
        let minDistance = Infinity;

        for (let i = 0; i < unvisited.length; i++) {
          const dist = haversineDistance(currentPoint, unvisited[i].location);
          if (dist < minDistance) {
            minDistance = dist;
            nearestIdx = i;
          }
        }

        optimized.push(unvisited[nearestIdx]);
        // Update current point to the job just added
        currentPoint = unvisited[nearestIdx].location;
        unvisited.splice(nearestIdx, 1);
      }

      // 3. Update store
      reorderRequests(optimized);
      Alert.alert('Optimized!', 'Your route has been reordered based on your current location.');
    } catch (error) {
      console.error('Optimization error:', error);
      Alert.alert('Error', 'Failed to optimize route.');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleAccept = async (requestId: string) => {
    if (!user) return;
    try {
      await acceptRequest(requestId, user.id);
      Alert.alert('Success', 'Job accepted! It is now in your active route.');
      setTab('active');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const renderJobItem = ({ item }: { item: typeof requests[0] }) => (
    <TouchableOpacity 
      activeOpacity={0.7}
      onPress={() => tab === 'active' && navigation.navigate('CollectorJobDetail', { job: item })}
      disabled={tab === 'available'}
    >
      <Card style={styles.jobCard}>
        <View style={styles.jobMain}>
          <View style={[styles.jobIconContainer, { backgroundColor: tab === 'available' ? '#fff9e6' : '#f1f8e9' }]}>
            <Package color={tab === 'available' ? colors.gold : colors.primary} size={24} />
          </View>
          
          <View style={styles.jobContent}>
            <View style={styles.jobHeaderRow}>
              <Text style={styles.jobId}>ID: {item.id.substring(0, 8).toUpperCase()}</Text>
              <Text style={styles.jobTime}>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
            
            <Text style={styles.jobAddress} numberOfLines={1}>{item.location.address}</Text>
            
            {tab === 'active' && (
              <View style={styles.hintBadge}>
                <Text style={styles.hintText} numberOfLines={1}>{item.waste_hint}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.jobFooter}>
          {tab === 'available' ? (
            <Button 
              title="Accept Job" 
              onPress={() => handleAccept(item.id)} 
              loading={loading}
              style={styles.acceptBtn}
              textStyle={{ fontSize: 13, fontWeight: '700' }}
            />
          ) : (
            <View style={styles.activeActions}>
              <View style={styles.statusPill}>
                <Clock size={12} color={colors.primary} />
                <Text style={styles.statusText}>{item.status.replace('_', ' ')}</Text>
              </View>
              <ChevronRight color={colors.ceramic} size={20} />
            </View>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Collector Mode</Text>
            <Text style={styles.userName}>{user?.name}</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <LogOut color={colors.error} size={20} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Earnings Card */}
          <Card style={styles.statsCard}>
            <View style={styles.statsHeader}>
              <View style={styles.walletIcon}>
                <Wallet color={colors.white} size={20} />
              </View>
              <Text style={styles.statsLabel}>Total Earnings</Text>
            </View>
            <Text style={styles.statsValue}>Rp {user?.balance?.toLocaleString() || '0'}</Text>
            
            <View style={styles.statsDivider} />
            
            <View style={styles.miniStatsRow}>
              <View style={styles.miniStat}>
                <CheckCircle color={colors.primary} size={16} />
                <Text style={styles.miniStatText}>24 Collected</Text>
              </View>
              <View style={styles.miniStat}>
                <Truck color={colors.primary} size={16} />
                <Text style={styles.miniStatText}>89.4 kg Total</Text>
              </View>
            </View>
          </Card>

          {/* Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tab, tab === 'available' && styles.tabActive]} 
              onPress={() => setTab('available')}
            >
              <Text style={[styles.tabText, tab === 'available' && styles.tabTextActive]}>Available</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, tab === 'active' && styles.tabActive]} 
              onPress={() => setTab('active')}
            >
              <Text style={[styles.tabText, tab === 'active' && styles.tabTextActive]}>Active</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, tab === 'history' && styles.tabActive]} 
              onPress={() => setTab('history')}
            >
              <Text style={[styles.tabText, tab === 'history' && styles.tabTextActive]}>History</Text>
            </TouchableOpacity>
          </View>

          {/* List Section */}
          <View style={styles.listSection}>
            {tab === 'history' ? (
              history.length > 0 ? (
                history.map(item => (
                  <Card key={item.id} style={styles.historyCard}>
                    <View style={styles.historyHeader}>
                      <View style={styles.historyDateGroup}>
                        <Clock size={12} color={colors.textBlackSoft} />
                        <Text style={styles.historyDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
                      </View>
                      <View style={styles.successBadge}>
                        <CheckCircle size={12} color="#059669" />
                        <Text style={styles.successText}>COMPLETED</Text>
                      </View>
                    </View>
                    <Text style={styles.historyAddress} numberOfLines={1}>{item.location.address}</Text>
                    <Text style={styles.historyHint}>{item.waste_hint}</Text>
                  </Card>
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <Clock color={colors.ceramic} size={64} strokeWidth={1} />
                  <Text style={styles.emptyText}>No completed jobs yet.</Text>
                </View>
              )
            ) : requests.length > 0 ? (
              requests.map(item => (
                <View key={item.id}>
                  {renderJobItem({ item })}
                </View>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Package color={colors.ceramic} size={64} strokeWidth={1} />
                <Text style={styles.emptyText}>
                  {tab === 'available' ? 'No new pickups in your area.' : 'Your route is currently empty.'}
                </Text>
                <Button 
                  title="Refresh Jobs" 
                  onPress={onRefresh} 
                  variant="ghost" 
                  style={{ marginTop: spacing.md }}
                />
              </View>
            )}
          </View>
        </ScrollView>

        {tab === 'active' && requests.length > 0 && (
          <View style={[styles.floatingFooter, { paddingBottom: insets.bottom + spacing.md }]}>
            <TouchableOpacity 
              style={styles.optimizeBtn}
              onPress={() => Alert.alert('Coming Soon', 'Route optimization will be available in the next update.')}
            >
              <Navigation color={colors.white} size={20} />
              <Text style={styles.optimizeText}>Optimize Route</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f1',
  },
  greeting: {
    fontSize: 12,
    color: colors.textBlackSoft,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textBlack,
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff1f2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    padding: spacing.lg,
    paddingBottom: 120,
  },
  statsCard: {
    backgroundColor: colors.primary,
    padding: spacing.xl,
    borderRadius: 24,
    marginBottom: spacing.xl,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  walletIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  statsValue: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.white,
    marginBottom: spacing.lg,
  },
  statsDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: spacing.md,
  },
  miniStatsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  miniStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  miniStatText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: '700',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#eeebe9',
    padding: 4,
    borderRadius: 16,
    marginBottom: spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  tabActive: {
    backgroundColor: colors.white,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textBlackSoft,
  },
  tabTextActive: {
    color: colors.primary,
  },
  listSection: {
    gap: spacing.md,
  },
  jobCard: {
    padding: spacing.lg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f1f1f1',
    marginBottom: spacing.md,
  },
  jobMain: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  jobIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  jobContent: {
    flex: 1,
  },
  jobHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  jobId: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textBlackSoft,
    letterSpacing: 0.5,
  },
  jobTime: {
    fontSize: 11,
    color: colors.textBlackSoft,
    fontWeight: '600',
  },
  jobAddress: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textBlack,
    marginBottom: 6,
  },
  hintBadge: {
    backgroundColor: '#f1f8e9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  hintText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '700',
  },
  jobFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f8f9fa',
    paddingTop: spacing.md,
  },
  acceptBtn: {
    height: 40,
    borderRadius: 12,
  },
  activeActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f1f8e9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textBlackSoft,
    textAlign: 'center',
    fontWeight: '600',
    paddingHorizontal: spacing.xl,
  },
  floatingFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    backgroundColor: 'transparent',
  },
  optimizeBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 28,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  optimizeText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  historyCard: {
    padding: spacing.lg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f1f1f1',
    marginBottom: spacing.md,
    backgroundColor: colors.white,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyDateGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historyDate: {
    fontSize: 12,
    color: colors.textBlackSoft,
    fontWeight: '600',
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  successText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  historyAddress: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textBlack,
    marginBottom: 4,
  },
  historyHint: {
    fontSize: 12,
    color: colors.textBlackSoft,
  },
});
