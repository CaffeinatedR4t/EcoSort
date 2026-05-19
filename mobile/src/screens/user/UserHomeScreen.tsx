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
  ImageBackground,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { spacing } from '../../services/theme/spacing';
import { Card } from '../../components/Card';
import { BottomNav } from '../../components/BottomNav';
import { Logo } from '../../components/Logo';
import { useAuthStore } from '../../store/authStore';
import { usePickupStore } from '../../store/pickupStore';
import { ArrowUpRight, History as HistoryIcon } from 'lucide-react-native';
import { useNotificationStore } from '../../store/notificationStore';
import { 
  Bell, 
  Rocket, 
  Home,
  ShieldCheck,
  Truck,
  ChevronRight,
  Wallet
} from 'lucide-react-native';

type BannerVariant = 'morning' | 'afternoon' | 'evening' | 'night';

const bannerAssets: Record<BannerVariant, any> = {
  morning: require('../../../assets/logo/gm (1).png'),
  afternoon: require('../../../assets/logo/ga (1).png'),
  evening: require('../../../assets/logo/ge (1).png'),
  night: require('../../../assets/logo/gn (1).png'),
};

export const getHomeBannerVariant = (hour = new Date().getHours()): BannerVariant => {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
};

export const getHomeBannerGreeting = (hour = new Date().getHours(), name = 'there') => {
  const variant = getHomeBannerVariant(hour);
  const prefix = {
    morning: 'Good morning',
    afternoon: 'Good afternoon',
    evening: 'Good evening',
    night: 'Good night',
  }[variant];

  return `${prefix}, ${name}`;
};

export const UserHomeScreen = () => {
  const { user, fetchTransactions, fetchProfile } = useAuthStore();
  const { requests, fetchUserRequests } = usePickupStore();
  const { unreadCount, fetchNotifications } = useNotificationStore();
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<any>();
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

  const balance = user?.balance || 0;
  const bannerVariant = getHomeBannerVariant();
  const greetingText = getHomeBannerGreeting(new Date().getHours(), user?.name?.split(' ')[0] || 'there');
  const [bannerGreetingTop, bannerGreetingBottom] = greetingText.split(', ');

  return (
      <View style={[styles.container, { backgroundColor: '#006948' }]}>
        <StatusBar barStyle="light-content" backgroundColor="#006948" />

      <SafeAreaView style={{ flex: 1, backgroundColor: '#006948' }} edges={['top', 'left', 'right']}>
        <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
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
          <View style={styles.headerShell}>
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
          </View>

          {/* Time Banner */}
          <View style={styles.bannerSection}>
            <View style={styles.bannerCard}>
              <ImageBackground
                testID={`home-banner-${bannerVariant}`}
                source={bannerAssets[bannerVariant]}
                style={styles.bannerImage}
                imageStyle={styles.bannerImageAsset}
                resizeMode="cover"
              >
                  <View style={styles.bannerOverlay}>
                    <Text style={styles.bannerGreetingTop}>{bannerGreetingTop}</Text>
                    <Text style={styles.bannerGreetingBottom}>{bannerGreetingBottom}</Text>
                  </View>
                </ImageBackground>
              </View>
            </View>

          {/* Wallet Card */}
          <View style={styles.walletSection}>
            <View style={styles.walletCard}>
              <View style={styles.walletRow}>
                <View style={styles.walletCopy}>
                  <View style={styles.walletIdentity}>
                    <View style={styles.walletLogoWrap}>
                      <Wallet color="#006948" size={20} />
                    </View>
                    <View>
                      <Text style={styles.walletLabel}>Eco Coins</Text>
                      <Text style={styles.balanceText}>Rp {balance.toLocaleString('id-ID')}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.walletActions}>
                  <TouchableOpacity
                    style={styles.walletAction}
                    onPress={() => navigation.navigate('Withdrawal')}
                    testID="wallet-pay-button"
                    activeOpacity={0.82}
                  >
                    <View style={styles.walletActionIcon}>
                      <ArrowUpRight color="#006948" size={18} />
                    </View>
                    <Text style={styles.walletActionLabel}>Redeem</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.walletAction}
                    onPress={() => navigation.navigate('TransactionHistory')}
                    testID="wallet-history-button"
                    activeOpacity={0.82}
                  >
                    <View style={styles.walletActionIcon}>
                      <HistoryIcon color="#006948" size={18} />
                    </View>
                    <Text style={styles.walletActionLabel}>History</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
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
                <View style={[styles.guideIconBox, { backgroundColor: '#e8f5e9' }]}>
                  <Rocket color="#006948" size={24} />
                </View>
                <Text style={styles.guideTitle}>Get Started</Text>
                <Text style={styles.guideSubtitle}>Learn the basics of earning.</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.guideCard}
                onPress={() => navigation.navigate('AddYourHome')}
              >
                <View style={[styles.guideIconBox, { backgroundColor: '#c8e6c9' }]}>
                  <Home color="#006948" size={24} />
                </View>
                <Text style={styles.guideTitle}>Add your home</Text>
                <Text style={styles.guideSubtitle}>Setup your home address.</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.guideCard}
                onPress={() => navigation.navigate('Privacy')}
              >
                <View style={[styles.guideIconBox, { backgroundColor: '#a5d6a7' }]}>
                  <ShieldCheck color="#006948" size={24} />
                </View>
                <Text style={styles.guideTitle}>Privacy</Text>
                <Text style={styles.guideSubtitle}>Your data is safe.</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </ScrollView>
        </View>
      </SafeAreaView>

      <BottomNav activeRoute="Home" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerShell: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm + 4,
    marginBottom: 0,
    overflow: 'hidden',
    zIndex: 3,
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
  bgCircle: {
    position: 'absolute',
    opacity: 0.5,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: 0,
  },
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
  bannerSection: {
    marginBottom: spacing.sm,
    marginHorizontal: -spacing.lg,
    marginTop: -100,
    zIndex: 0,
  },
  bannerCard: {
    borderRadius: 0,
    overflow: 'hidden',
    backgroundColor: '#d7edd8',
    height: 350,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 18,
      },
      android: {
        elevation: 4,
      },
    }),
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
    paddingTop: 140,
    paddingBottom: spacing.md,
    justifyContent: 'flex-start',
  },
  bannerGreetingTop: {
    color: '#ffffff',
    fontSize: 27,
    fontWeight: '900',
    lineHeight: 30,
    maxWidth: '70%',
    textShadowColor: 'rgba(0, 0, 0, 0.22)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  bannerGreetingBottom: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 34,
    marginTop: -2,
    maxWidth: '70%',
    textShadowColor: 'rgba(0, 0, 0, 0.22)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  walletSection: {
    marginBottom: spacing.lg,
    marginTop: -45,
    paddingHorizontal: 0,
    zIndex: 2,
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
      android: {
        elevation: 4,
      },
    }),
  },
  walletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  walletCopy: {
    flex: 1,
    minWidth: 0,
  },
  walletIdentity: {
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
    gap: 6,
    marginTop: 0,
    alignItems: 'flex-start',
  },
  walletAction: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 2,
    paddingVertical: 0,
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
    marginTop: 0,
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
    borderRadius: 14,
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
    borderRadius: 14,
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
