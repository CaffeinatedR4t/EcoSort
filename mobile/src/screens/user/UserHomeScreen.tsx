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
  StatusBar
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
import { 
  Bell, 
  History, 
  TrendingUp,
  TrendingDown,
  Minus,
  Coffee, 
  Recycle, 
  CheckCircle2, 
  Droplets, 
  Rocket, 
  MapPin, 
  ShieldCheck
} from 'lucide-react-native';

export const UserHomeScreen = () => {
  const { user, transactions, fetchTransactions, fetchProfile } = useAuthStore();
  const { requests, fetchUserRequests } = usePickupStore();
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
    }
  }, [user?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (user) {
      await Promise.all([
        fetchUserRequests(user.id),
        fetchTransactions(),
        fetchProfile()
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
  const pendingTransactions = transactions.filter(tx => tx.status === 'PENDING');
  const pendingBalance = pendingTransactions.reduce((acc, tx) => acc + tx.amount, 0);
  const target = 50000;
  const progressPercent = Math.min((balance / target) * 100, 100);

  // Daily Task: Completed plastic pickups today
  const today = new Date().toDateString();
  const completedPlasticsToday = requests.filter(req => 
    req.status === 'COMPLETED' && 
    new Date(req.created_at).toDateString() === today && 
    req.waste_hint?.toLowerCase().includes('plastic')
  ).length;
  const plasticsCount = Math.min(completedPlasticsToday, 3);

  // Stagnant trend for now (will connect to transactions later)
  const weeklyTrend = 0; 

  const renderTrend = () => {
    if (weeklyTrend > 0) {
      return (
        <>
          <TrendingUp color="#fff" size={16} />
          <Text style={styles.trendText}>+Rp {weeklyTrend.toLocaleString()} this week</Text>
        </>
      );
    } else if (weeklyTrend < 0) {
      return (
        <>
          <TrendingDown color="#fff" size={16} />
          <Text style={styles.trendText}>-Rp {Math.abs(weeklyTrend).toLocaleString()} this week</Text>
        </>
      );
    } else {
      return (
        <>
          <Minus color="#fff" size={16} opacity={0.6} />
          <Text style={styles.trendText}>No change this week</Text>
        </>
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: '#f8f9ff' }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9ff" translucent={true} />
      
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
            <TouchableOpacity style={[styles.iconButton, { backgroundColor: '#fff' }]}>
              <Bell color="#006948" size={22} />
            </TouchableOpacity>
          </View>

          {/* Hero Greeting */}
          <View style={styles.heroSection}>
            <Text style={[styles.greetingText, { color: '#121c28' }]}>
              {getGreeting()}{'\n'}{user?.name || 'Alex'}
            </Text>
          </View>

          {/* Wallet Card */}
          <View style={[styles.walletCard, { backgroundColor: '#006948' }]}>
            <View style={styles.walletHeader}>
              <Text style={styles.walletLabel}>AVAILABLE BALANCE</Text>
              <TouchableOpacity style={styles.historyBtn}>
                <History color="#fff" size={18} opacity={0.8} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.balanceText}>Rp {balance.toLocaleString()}</Text>
            
            <View style={styles.trendContainer}>
              {renderTrend()}
            </View>

            <View style={styles.walletActions}>
              <TouchableOpacity 
                style={[styles.pillBtn, styles.btnFill]}
                onPress={() => navigation.navigate('Withdrawal')}
              >
                <Text style={[styles.pillBtnText, { color: '#006948' }]}>REDEEM</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.pillBtn, styles.btnOutline]}>
                <Text style={[styles.pillBtnText, { color: '#fff' }]}>TRANSFER</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Journey Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: '#121c28' }]}>Your Journey</Text>
            
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={() => {
                if (balance >= 50000) {
                  Alert.alert('Congratulations! 🎉', 'You have earned a Free Coffee voucher! Use code: ECOSORT-COFFEE-2026');
                } else {
                  Alert.alert('Keep Going!', `You need Rp ${(50000 - balance).toLocaleString()} more for a free coffee.`);
                }
              }}
            >
              <Card style={styles.journeyCard}>
                <View style={styles.journeyMain}>
                  <View style={[styles.journeyIconBox, { backgroundColor: '#e3f2fd' }]}>
                    <Coffee color="#2196f3" size={24} />
                  </View>
                  <View style={styles.journeyInfo}>
                    <Text style={styles.journeyTitle}>Free Coffee</Text>
                    <Text style={styles.journeySubtitle}>Starbucks Voucher</Text>
                  </View>
                  <Text style={[styles.journeyTarget, { color: '#006948' }]}>50k</Text>
                </View>
                
                <View style={styles.progressSection}>
                  <View style={styles.progressLabels}>
                    <Text style={styles.progressLabel}>Progress</Text>
                    <Text style={styles.progressValue}>{balance >= 1000 ? `${(balance / 1000).toFixed(0)}k` : balance} / 50k</Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { backgroundColor: '#006948', width: `${progressPercent}%` }]} />
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          </View>

          {/* Daily Task Section */}
          <TouchableOpacity 
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Scan')}
          >
            <Card style={styles.taskCard}>
              <View style={styles.taskHeader}>
                <View style={[styles.badge, { backgroundColor: '#fff3e0' }]}>
                  <Text style={styles.badgeText}>Daily</Text>
                </View>
                <Recycle color="#9e9e9e" size={20} />
              </View>
              
              <Text style={styles.taskTitle}>Recycle 3 Plastics</Text>
              <Text style={styles.taskDesc}>Drop off 3 plastic bottles at any smart bin to complete.</Text>
              
              <View style={styles.taskFooter}>
                <View style={styles.taskProgressIcons}>
                  {[1, 2, 3].map((num) => (
                    plasticsCount >= num ? (
                      <CheckCircle2 key={num} color="#006948" size={24} />
                    ) : (
                      <Droplets key={num} color="#cfd8dc" size={24} />
                    )
                  ))}
                </View>
                <Text style={[styles.rewardText, { color: '#00668a' }]}>+Rp 500</Text>
              </View>
            </Card>
          </TouchableOpacity>

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

              <View style={styles.guideCard}>
                <View style={[styles.guideIconBox, { backgroundColor: '#e1f5fe' }]}>
                  <MapPin color="#03a9f4" size={24} />
                </View>
                <Text style={styles.guideTitle}>Add your bins</Text>
                <Text style={styles.guideSubtitle}>Register home bins.</Text>
              </View>

              <View style={styles.guideCard}>
                <View style={[styles.guideIconBox, { backgroundColor: '#f1f8e9' }]}>
                  <ShieldCheck color="#8bc34a" size={24} />
                </View>
                <Text style={styles.guideTitle}>Privacy</Text>
                <Text style={styles.guideSubtitle}>Your data is safe.</Text>
              </View>
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
    paddingLeft: 12, // Give the text some space from the left edge to allow the absolute logo to stick out
    paddingTop: 8,   // Give space for the logo overlapping the top
  },
  logoPositioner: {
    position: 'absolute',
    top: -2,
    left: -4,
    zIndex: 10,
    transform: [{ rotate: '-15deg' }],
  },
  logoText: {
    fontSize: 26, // Slightly larger to emphasize the brand
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  walletLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  historyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceText: {
    color: '#fff',
    fontSize: 38,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  pendingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.xl,
  },
  trendText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '500',
  },
  walletActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  pillBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnFill: {
    backgroundColor: '#fff',
  },
  btnOutline: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
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
  pendingCard: {
    width: 200,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 16,
    marginRight: spacing.md,
  },
  pendingIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  pendingInfo: {
    flex: 1,
  },
  pendingAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#006948',
  },
  pendingStatus: {
    fontSize: 11,
    color: '#757575',
    fontWeight: '500',
  },
  journeyCard: {
    padding: spacing.lg,
    borderRadius: 20,
  },
  journeyMain: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  journeyIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  journeyInfo: {
    flex: 1,
  },
  journeyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  journeySubtitle: {
    fontSize: 13,
    color: '#757575',
  },
  journeyTarget: {
    fontSize: 20,
    fontWeight: '800',
  },
  progressSection: {
    marginTop: spacing.xs,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9e9e9e',
  },
  progressValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#616161',
  },
  progressBarBg: {
    height: 10,
    backgroundColor: '#f1f8e9',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  taskCard: {
    padding: spacing.lg,
    borderRadius: 20,
    marginBottom: spacing.xl,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#e65100',
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  taskDesc: {
    fontSize: 14,
    color: '#757575',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskProgressIcons: {
    flexDirection: 'row',
    gap: 8,
  },
  rewardText: {
    fontSize: 18,
    fontWeight: '800',
  },
  guideScroll: {
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm, // Add vertical padding for shadows
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
