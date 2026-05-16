import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  RefreshControl, 
  TouchableOpacity, 
  Platform, 
  useWindowDimensions,
  StatusBar,
  Alert
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useThemeColors } from '../../hooks/useThemeColors';
import { spacing } from '../../services/theme/spacing';
import { Card } from '../../components/Card';
import { BottomNav } from '../../components/BottomNav';
import { Logo } from '../../components/Logo';
import { useAuthStore } from '../../store/authStore';
import { usePickupStore } from '../../store/pickupStore';
import { useNotificationStore } from '../../store/notificationStore';
import { 
  Bell, 
  History, 
  Coffee, 
  Recycle, 
  CheckCircle2, 
  Droplets, 
  Rocket, 
  MapPin, 
  Home,
  ShieldCheck,
  Truck,
  ChevronRight
} from 'lucide-react-native';

export const UserHomeScreen = () => {
  const { user, transactions, fetchTransactions, fetchProfile } = useAuthStore();
  const { requests, fetchUserRequests } = usePickupStore();
  const { unreadCount, fetchNotifications } = useNotificationStore();
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<any>();
  const colors = useThemeColors();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (user) {
      fetchUserRequests(user.id);
      fetchTransactions();
      fetchProfile();
      fetchNotifications(user.id);
    }
  }, [user?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (user) {
      await Promise.all([
        fetchUserRequests(user.id),
        fetchTransactions(),
        fetchProfile(),
        fetchNotifications(user.id)
      ]);
    }
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good Morning,';
    if (hour >= 12 && hour < 17) return 'Good Afternoon,';
    if (hour >= 17 && hour < 21) return 'Good Evening,';
    return 'Good Night,';
  };

  // Dynamic calculations
  const balance = user?.balance || 0;

  return (
    <View style={[styles.container, { backgroundColor: '#f8f9ff' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#006948" />
      
      {/* Decorative Background Element */}
      <View style={[
        styles.bgCircle, 
        { 
          backgroundColor: '#e0f2f1',
          top: -width * 0.4,
          left: -width * 0.2,
          width: width * 1.5,
          height: width * 1.5,
          borderRadius: (width * 1.5) / 2,
        }
      ]} />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <ScrollView 
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Platform.OS === 'ios' ? insets.bottom + 100 : 120 }
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoGroup}>
              <View style={styles.logoPositioner}>
                <Logo size={32} />
              </View>
              <Text style={[styles.logoText, { color: '#006948' }]}>EcoSort</Text>
            </View>
            <TouchableOpacity 
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

          {/* Hero Greeting */}
          <View style={styles.heroSection}>
            <Text style={[styles.greetingText, { color: '#121c28' }]}>
              {getGreeting()}{'\n'}{user?.name || 'Alex'}
            </Text>
          </View>

          {/* Active Pickups Section */}
          {requests.filter(req => ['PENDING', 'ASSIGNED', 'IN_PROGRESS'].includes(req.status)).length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: '#121c28' }]}>Active Pickups</Text>
              {requests.filter(req => ['PENDING', 'ASSIGNED', 'IN_PROGRESS'].includes(req.status)).map(req => (
                <TouchableOpacity 
                  key={req.id}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('RequestDetail', { request: req })}
                  style={{ marginBottom: spacing.md }}
                >
                  <Card style={styles.activePickupCard}>
                    <View style={styles.activePickupMain}>
                      <View style={styles.activePickupIcon}>
                        <Truck color="#006948" size={24} />
                      </View>
                      <View style={styles.activePickupInfo}>
                        <Text style={styles.activePickupTitle}>Pickup #{req.id.substring(0,6).toUpperCase()}</Text>
                        <Text style={styles.activePickupStatus}>{req.status.replace('_', ' ')}</Text>
                      </View>
                    </View>
                    <View style={styles.activePickupArrow}>
                      <Text style={styles.activePickupHint}>TRACK</Text>
                      <ChevronRight color="#006948" size={16} />
                    </View>
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Wallet Card - Consistent with Driver UI */}
          <View style={[styles.walletCard, { backgroundColor: '#006948' }]}>
            <View style={styles.walletHeader}>
              <View style={styles.earningsIconBox}>
                <Wallet color="rgba(255,255,255,0.85)" size={20} />
              </View>
              <Text style={styles.walletLabel}>AVAILABLE BALANCE</Text>
            </View>
            
            <Text style={styles.balanceText}>Rp {balance.toLocaleString('id-ID')}</Text>
            
            <View style={styles.walletActions}>
              <TouchableOpacity 
                style={styles.pillBtn}
                onPress={() => navigation.navigate('Withdrawal')}
              >
                <Text style={[styles.pillBtnText, { color: '#006948' }]}>REDEEM</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Guides Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: '#121c28' }]}>Quick Guides</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={styles.guideScroll}
              contentContainerStyle={{ paddingRight: spacing.xl }}
            >
              <TouchableOpacity 
                style={styles.guideCard}
                onPress={() => navigation.navigate('GetStarted')}
              >
                <View style={[styles.guideIconBox, { backgroundColor: '#f3e5f5' }]}>
                  <Rocket color="#9c27b0" size={24} />
                </View>
                <Text style={styles.guideTitle}>Get Started</Text>
                <Text style={styles.guideSubtitle}>Learn the basics of earning.</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.guideCard}
                onPress={() => navigation.navigate('AddYourHome')}
              >
                <View style={[styles.guideIconBox, { backgroundColor: '#e1f5fe' }]}>
                  <Home color="#03a9f4" size={24} />
                </View>
                <Text style={styles.guideTitle}>Add your home</Text>
                <Text style={styles.guideSubtitle}>Setup your home address.</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.guideCard}
                onPress={() => navigation.navigate('Privacy')}
              >
                <View style={[styles.guideIconBox, { backgroundColor: '#f1f8e9' }]}>
                  <ShieldCheck color="#8bc34a" size={24} />
                </View>
                <Text style={styles.guideTitle}>Privacy</Text>
                <Text style={styles.guideSubtitle}>Your data is safe.</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </ScrollView>
      </SafeAreaView>

      <BottomNav activeRoute="Home" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bgCircle: {
    position: 'absolute',
    opacity: 0.5,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
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
    borderRadius: 22,
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
    backgroundColor: '#ff4444',
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
  heroSection: {
    marginBottom: spacing.xl,
  },
  greetingText: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
  },
  walletCard: {
    padding: spacing.xl,
    borderRadius: 24,
    marginBottom: spacing.xl,
    ...Platform.select({
      ios: {
        shadowColor: '#006948',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: spacing.md,
  },
  earningsIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  balanceText: {
    color: '#fff',
    fontSize: 38,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  walletActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  pillBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  pillBtnText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  activePickupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0f2f1',
  },
  activePickupMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  activePickupIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f1f8e9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activePickupInfo: {
    gap: 2,
  },
  activePickupTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#121c28',
  },
  activePickupStatus: {
    fontSize: 12,
    fontWeight: '600',
    color: '#006948',
    textTransform: 'uppercase',
  },
  activePickupArrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activePickupHint: {
    fontSize: 11,
    fontWeight: '800',
    color: '#006948',
    letterSpacing: 1,
  },
  guideScroll: {
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  guideCard: {
    width: 160,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: spacing.md,
    marginRight: spacing.md,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  guideIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  guideTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  guideSubtitle: {
    fontSize: 12,
    color: '#757575',
    textAlign: 'center',
  },
});
