import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Logo } from '../../components/Logo';
import { spacing } from '../../services/theme/spacing';
import { useAdminStore } from '../../store/adminStore';
import { useAuthStore } from '../../store/authStore';
import {
  BarChart3,
  CheckCircle,
  ChevronRight,
  Clock,
  CreditCard,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  PackageCheck,
  Recycle,
  Scale,
  Settings,
  ShieldCheck,
  Truck,
  UserCircle,
  Wallet,
  XCircle,
} from 'lucide-react-native';

type AdminTab = 'overview' | 'earnings' | 'profile';
type EarningsSection = 'rewards' | 'withdrawal';

const formatWeight = (value: number) => {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded} kg` : `${rounded.toFixed(1)} kg`;
};

const AdminBottomNav = ({
  activeTab,
  onTabPress,
}: {
  activeTab: AdminTab;
  onTabPress: (tab: AdminTab) => void;
}) => {
  const insets = useSafeAreaInsets();
  const tabs: { key: AdminTab; label: string; icon: any }[] = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'earnings', label: 'Earnings', icon: Wallet },
    { key: 'profile', label: 'Profile', icon: UserCircle },
  ];

  return (
    <View style={[styles.navContainer, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      {tabs.map((tab) => {
        return (
          <AnimatedAdminNavItem
            key={tab.key}
            isActive={activeTab === tab.key}
            onPress={() => onTabPress(tab.key)}
            IconComponent={tab.icon}
            label={tab.label}
            testID={`admin-nav-${tab.key}`}
          />
        );
      })}
    </View>
  );
};

const AnimatedAdminNavItem = ({
  isActive,
  onPress,
  IconComponent,
  label,
  testID,
}: {
  isActive: boolean;
  onPress: () => void;
  IconComponent: any;
  label: string;
  testID: string;
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
      testID={testID}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive, disabled: false }}
      style={styles.navItem}
    >
      <Animated.View style={[styles.navAnimatedItem, { transform: [{ scale: scaleAnim }] }]}>
        <IconComponent
          color={isActive ? '#006948' : '#94a3b8'}
          size={24}
          strokeWidth={isActive ? 2.5 : 2}
        />
        <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{label}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const StatCard = ({
  title,
  value,
  subtitle,
  Icon,
  accent,
}: {
  title: string;
  value: string;
  subtitle: string;
  Icon: any;
  accent: string;
}) => (
  <View style={styles.statCard}>
    <View style={styles.statHeader}>
      <Text style={styles.statTitle}>{title}</Text>
      <View style={[styles.statIcon, { backgroundColor: `${accent}18` }]}>
        <Icon color={accent} size={22} />
      </View>
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={[styles.statSubtitle, { color: accent }]}>{subtitle}</Text>
  </View>
);

const EarningsMetricCard = ({
  label,
  value,
  accent = '#006948',
}: {
  label: string;
  value: string;
  accent?: string;
}) => (
  <View style={styles.earningsMetricCard}>
    <Text style={styles.metricLabel}>{label}</Text>
    <Text style={[styles.metricValue, { color: accent }]}>{value}</Text>
  </View>
);

const AdminProfileAction = ({
  label,
  description,
  Icon,
  iconColor,
  iconBackground,
  onPress,
  danger = false,
}: {
  label: string;
  description?: string;
  Icon: any;
  iconColor: string;
  iconBackground: string;
  onPress?: () => void;
  danger?: boolean;
}) => (
  <TouchableOpacity
    activeOpacity={0.75}
    accessibilityRole="button"
    onPress={onPress}
    style={[styles.profileActionRow, danger && styles.profileActionRowDanger]}
  >
    <View style={[styles.profileActionIcon, { backgroundColor: iconBackground }]}>
      <Icon color={iconColor} size={21} strokeWidth={2.2} />
    </View>
    <View style={styles.profileActionTextGroup}>
      <Text style={[styles.profileActionLabel, danger && styles.profileActionLabelDanger]}>{label}</Text>
      {description ? <Text style={styles.profileActionDescription}>{description}</Text> : null}
    </View>
    {!danger && <ChevronRight color="#9ca3af" size={20} />}
  </TouchableOpacity>
);

export const AdminHomeScreen = () => {
  const { user, logout } = useAuthStore();
  const {
    overviewMetrics,
    adminProfileMetrics,
    liveFeed,
    overviewLoading,
    pendingRewards,
    pendingWithdrawals,
    loading,
    fetchOverviewData,
    fetchAdminProfileData,
    fetchPendingRewards,
    fetchPendingWithdrawals,
    approveReward,
    rejectReward,
    approveWithdrawal,
    rejectWithdrawal,
  } = useAdminStore();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [earningsSection, setEarningsSection] = useState<EarningsSection>('rewards');
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchOverviewData();
    }
    if (activeTab === 'earnings') {
      fetchEarningsData();
    }
    if (activeTab === 'profile') {
      fetchAdminProfileData();
    }
  }, [activeTab]);

  const fetchEarningsData = async () => {
    await Promise.all([
      fetchPendingRewards(),
      fetchPendingWithdrawals(),
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'overview') {
      await fetchOverviewData();
    } else if (activeTab === 'earnings') {
      await fetchEarningsData();
    }
    setRefreshing(false);
  };

  const pendingRewardTotal = pendingRewards.reduce((total, item) => total + Number(item.amount || 0), 0);
  const pendingWithdrawalTotal = pendingWithdrawals.reduce((total, item) => total + Number(item.amount || 0), 0);
  const adminId = user?.id
    ? `ADM-${user.id.replace(/-/g, '').slice(0, 4).toUpperCase()}`
    : 'ADM-0000';
  const adminRoleLabel = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Admin';

  const renderOverview = () => (
    <>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Today's Overview</Text>
        <Text style={styles.heroSubtitle}>Real-time ecosystem statistics.</Text>
      </View>

      {overviewLoading && !refreshing ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color="#006948" size="large" />
        </View>
      ) : (
        <>
          <View style={styles.statsGrid}>
            <StatCard
              title="Active Pickups"
              value={overviewMetrics.activePickups.toLocaleString()}
              subtitle="Assigned or in progress"
              Icon={Truck}
              accent="#00668a"
            />
            <StatCard
              title="Completed Today"
              value={overviewMetrics.completedToday.toLocaleString()}
              subtitle="Finished collections"
              Icon={PackageCheck}
              accent="#006948"
            />
            <StatCard
              title="Collected Weight"
              value={formatWeight(overviewMetrics.collectedWeightToday)}
              subtitle="Verified by collectors"
              Icon={Scale}
              accent="#825100"
            />
          </View>

          <View style={styles.feedCard}>
            <View style={styles.feedHeader}>
              <Text style={styles.feedTitle}>Live Feed</Text>
              <BarChart3 color="#006948" size={22} />
            </View>

            {liveFeed.length > 0 ? (
              liveFeed.map((item) => (
                <View key={item.id} style={styles.feedItem}>
                  <View style={styles.feedIcon}>
                    <Clock color="#006948" size={20} />
                  </View>
                  <View style={styles.feedTextGroup}>
                    <Text style={styles.feedItemTitle}>{item.title}</Text>
                    <Text style={styles.feedDescription}>{item.description}</Text>
                  </View>
                  <Text style={styles.feedTime}>{item.timestamp}</Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyFeed}>
                <Clock color="#bccac0" size={42} strokeWidth={1.5} />
                <Text style={styles.emptyFeedTitle}>No activity yet</Text>
                <Text style={styles.emptyFeedText}>Recent pickup updates will appear here.</Text>
              </View>
            )}
          </View>
        </>
      )}
    </>
  );

  const renderRewardCard = (reward: any) => (
    <View key={reward.id} style={styles.requestCard}>
      <View style={styles.requestMain}>
        <View style={[styles.requestAvatar, { backgroundColor: '#e6f4f0' }]}>
          <Recycle color="#006948" size={22} />
        </View>
        <View style={styles.requestTextGroup}>
          <Text style={styles.requestName}>{reward.users?.name || reward.user_id || 'Unknown user'}</Text>
          <Text style={styles.requestMeta}>
            {new Date(reward.created_at).toLocaleDateString()} • Pending reward
          </Text>
        </View>
      </View>

      <View style={styles.requestFooter}>
        <View style={styles.rewardPill}>
          <Text style={styles.rewardPillText}>+Rp {Number(reward.amount || 0).toLocaleString()}</Text>
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionButton, styles.denyButton]} onPress={() => rejectReward(reward.id)}>
            <XCircle color="#ba1a1a" size={18} />
            <Text style={styles.denyText}>Deny</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.allowButton]} onPress={() => approveReward(reward.id)}>
            <CheckCircle color="#fff" size={18} />
            <Text style={styles.allowText}>Allow</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderWithdrawalCard = (withdrawal: any) => (
    <View key={withdrawal.id} style={styles.requestCard}>
      <View style={styles.requestMain}>
        <View style={[styles.requestAvatar, { backgroundColor: '#eef4ff' }]}>
          <CreditCard color="#00668a" size={22} />
        </View>
        <View style={styles.requestTextGroup}>
          <Text style={styles.requestName}>{withdrawal.users?.name || withdrawal.account_holder_name || withdrawal.user_id || 'Unknown user'}</Text>
          <Text style={styles.requestMeta}>{withdrawal.bank_name} • {withdrawal.account_number}</Text>
          <Text style={styles.requestDate}>{new Date(withdrawal.created_at).toLocaleDateString()}</Text>
        </View>
      </View>

      <View style={styles.requestFooter}>
        <View style={styles.rewardPill}>
          <Text style={styles.rewardPillText}>Rp {Number(withdrawal.amount || 0).toLocaleString()}</Text>
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionButton, styles.denyButton]} onPress={() => rejectWithdrawal(withdrawal.id)}>
            <XCircle color="#ba1a1a" size={18} />
            <Text style={styles.denyText}>Deny</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.allowButton]} onPress={() => approveWithdrawal(withdrawal.id)}>
            <CheckCircle color="#fff" size={18} />
            <Text style={styles.allowText}>Allow</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderEarnings = () => (
    <>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Earnings Review</Text>
        <Text style={styles.heroSubtitle}>Manage reward approvals and withdrawal requests.</Text>
      </View>

      <View style={styles.segmentedControl}>
        <TouchableOpacity
          style={[styles.segmentButton, earningsSection === 'rewards' && styles.segmentButtonActive]}
          onPress={() => setEarningsSection('rewards')}
        >
          <Text style={[styles.segmentText, earningsSection === 'rewards' && styles.segmentTextActive]}>Rewards</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentButton, earningsSection === 'withdrawal' && styles.segmentButtonActive]}
          onPress={() => setEarningsSection('withdrawal')}
        >
          <Text style={[styles.segmentText, earningsSection === 'withdrawal' && styles.segmentTextActive]}>Withdrawal</Text>
        </TouchableOpacity>
      </View>

      {earningsSection === 'rewards' ? (
        <>
          <View style={styles.earningsMetricsGrid}>
            <EarningsMetricCard label="Total Pending Rewards" value={`Rp ${pendingRewardTotal.toLocaleString()}`} />
            <EarningsMetricCard label="Pending Requests" value={pendingRewards.length.toLocaleString()} accent="#825100" />
          </View>
          <Text style={styles.sectionTitle}>Pending Approvals</Text>
          {loading && !refreshing ? (
            <ActivityIndicator color="#006948" style={styles.inlineLoader} />
          ) : pendingRewards.length > 0 ? (
            pendingRewards.map(renderRewardCard)
          ) : (
            <View style={styles.emptyFeed}>
              <Clock color="#bccac0" size={42} strokeWidth={1.5} />
              <Text style={styles.emptyFeedTitle}>No pending rewards</Text>
            </View>
          )}
        </>
      ) : (
        <>
          <View style={styles.earningsMetricsGrid}>
            <EarningsMetricCard label="Total Amount to Disburse" value={`Rp ${pendingWithdrawalTotal.toLocaleString()}`} />
            <EarningsMetricCard label="Pending Requests" value={pendingWithdrawals.length.toLocaleString()} accent="#ba1a1a" />
          </View>
          <Text style={styles.sectionTitle}>Withdrawal Requests</Text>
          {loading && !refreshing ? (
            <ActivityIndicator color="#006948" style={styles.inlineLoader} />
          ) : pendingWithdrawals.length > 0 ? (
            pendingWithdrawals.map(renderWithdrawalCard)
          ) : (
            <View style={styles.emptyFeed}>
              <Clock color="#bccac0" size={42} strokeWidth={1.5} />
              <Text style={styles.emptyFeedTitle}>No pending withdrawals</Text>
            </View>
          )}
        </>
      )}
    </>
  );

  const renderProfile = () => (
    <>
      <View style={styles.profileCard}>
        <View style={styles.profileAvatarWrapper}>
          <UserCircle color="#006948" size={78} strokeWidth={1.2} />
          <View style={styles.profileStatusDot} />
        </View>
        <Text style={styles.profileName}>{user?.name || 'Admin'}</Text>
        <View style={styles.profileRoleBadge}>
          <ShieldCheck color="#006948" size={16} />
          <Text style={styles.profileRoleText}>{adminRoleLabel}</Text>
        </View>
        <Text style={styles.profileId}>Admin ID: {adminId}</Text>
      </View>

      <View style={styles.profileSummaryCard}>
        <View style={styles.profileSummaryHeader}>
          <Text style={styles.profileSummaryTitle}>Admin Access</Text>
          <ShieldCheck color="#006948" size={22} />
        </View>
        <View style={styles.profileSummaryGrid}>
          <View style={styles.profileSummaryItem}>
            <Text style={styles.profileSummaryValue}>{adminProfileMetrics.pendingReviews}</Text>
            <Text style={styles.profileSummaryLabel}>PENDING REVIEWS</Text>
          </View>
          <View style={styles.profileSummaryDivider} />
          <View style={styles.profileSummaryItem}>
            <Text style={styles.profileSummaryValue}>{adminProfileMetrics.activePickups}</Text>
            <Text style={styles.profileSummaryLabel}>ACTIVE PICKUPS</Text>
          </View>
        </View>
      </View>

      <View style={styles.profileStatsRow}>
        <View style={styles.profileSmallStatCard}>
          <Text style={styles.profileSmallStatValue}>{adminProfileMetrics.totalUsers}</Text>
          <Text style={styles.profileSmallStatLabel}>USERS</Text>
        </View>
        <View style={styles.profileSmallStatCard}>
          <Text style={styles.profileSmallStatValue}>{adminProfileMetrics.totalCollectors}</Text>
          <Text style={styles.profileSmallStatLabel}>COLLECTORS</Text>
        </View>
      </View>

      <View style={styles.profileActionsCard}>
        <AdminProfileAction
          label="Settings"
          description="App preferences and notifications"
          Icon={Settings}
          iconColor="#00668a"
          iconBackground="#e0f2fe"
        />
        <AdminProfileAction
          label="Account Settings"
          description="Password, security and roles"
          Icon={UserCircle}
          iconColor="#006948"
          iconBackground="#e6f4f0"
        />
        <AdminProfileAction
          label="Help & Support"
          description="Admin help center and support"
          Icon={HelpCircle}
          iconColor="#475569"
          iconBackground="#f1f5f9"
        />
      </View>

      <TouchableOpacity
        activeOpacity={0.78}
        accessibilityRole="button"
        accessibilityLabel="Log out"
        style={styles.logoutButton}
        onPress={logout}
      >
        <LogOut color="#ba1a1a" size={21} strokeWidth={2.3} />
        <Text style={styles.logoutButtonText}>Log Out</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <View style={styles.container}>
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

      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.content}>
          <View style={styles.topbar}>
            <View style={styles.logoGroup}>
              <View style={styles.logoPositioner}>
                <Logo size={32} />
              </View>
              <Text style={styles.logoText}>Admin Panel</Text>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 104 }]}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'earnings' && renderEarnings()}
            {activeTab === 'profile' && renderProfile()}
          </ScrollView>
        </View>
      </SafeAreaView>

      <AdminBottomNav activeTab={activeTab} onTabPress={setActiveTab} />
    </View>
  );
};

const cardShadow = Platform.select({
  ios: {
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
  },
  android: {
    elevation: 4,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#006948',
  },
  bgCircle: {
    position: 'absolute',
    opacity: 0.5,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#006948',
  },
  content: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
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
    color: '#006948',
    letterSpacing: -0.5,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
  },
  hero: {
    marginBottom: spacing.lg,
  },
  heroTitle: {
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '800',
    color: '#121c28',
    letterSpacing: -0.4,
  },
  heroSubtitle: {
    marginTop: spacing.xs,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
    color: '#3d4a42',
  },
  loadingState: {
    paddingVertical: spacing.giant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 20,
    padding: spacing.lg,
    ...cardShadow,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  statTitle: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
    color: '#3d4a42',
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 38,
    lineHeight: 44,
    fontWeight: '800',
    color: '#006948',
    marginBottom: spacing.xs,
  },
  statSubtitle: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  feedCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 20,
    padding: spacing.lg,
    ...cardShadow,
  },
  earningsMetricCard: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 20,
    padding: spacing.lg,
    ...cardShadow,
  },
  metricLabel: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '800',
    color: '#3d4a42',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  metricValue: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
  },
  feedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  feedTitle: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '800',
    color: '#121c28',
  },
  feedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#eef4ff',
    gap: spacing.md,
  },
  feedIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#eef4ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedTextGroup: {
    flex: 1,
  },
  feedItemTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
    color: '#121c28',
  },
  feedDescription: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    color: '#3d4a42',
  },
  feedTime: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '800',
    color: '#6d7a72',
    textTransform: 'uppercase',
  },
  emptyFeed: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyFeedTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#3d4a42',
  },
  emptyFeedText: {
    fontSize: 13,
    color: '#6d7a72',
    textAlign: 'center',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#dfe9fa',
    borderRadius: 28,
    padding: 4,
    marginBottom: spacing.lg,
  },
  segmentButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentButtonActive: {
    backgroundColor: '#006948',
    ...Platform.select({
      ios: {
        shadowColor: '#006948',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  segmentText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
    color: '#3d4a42',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  segmentTextActive: {
    color: '#fff',
  },
  earningsMetricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '800',
    color: '#121c28',
    marginBottom: spacing.md,
  },
  requestCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...cardShadow,
  },
  requestMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  requestAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestTextGroup: {
    flex: 1,
  },
  requestName: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '800',
    color: '#121c28',
  },
  requestMeta: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    color: '#3d4a42',
  },
  requestDate: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '800',
    color: '#6d7a72',
    textTransform: 'uppercase',
  },
  requestFooter: {
    gap: spacing.md,
  },
  rewardPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#e6f4f0',
    borderWidth: 1,
    borderColor: '#85f8c4',
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  rewardPillText: {
    color: '#006948',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  denyButton: {
    borderWidth: 1.5,
    borderColor: '#ffdad6',
    backgroundColor: '#fff',
  },
  allowButton: {
    backgroundColor: '#006948',
  },
  denyText: {
    color: '#ba1a1a',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  allowText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  inlineLoader: {
    marginVertical: spacing.xl,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 24,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...cardShadow,
  },
  profileAvatarWrapper: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: '#e6f4f0',
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  profileStatusDot: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#006948',
    borderWidth: 3,
    borderColor: '#fff',
  },
  profileName: {
    fontSize: 26,
    lineHeight: 34,
    fontWeight: '800',
    color: '#121c28',
    textAlign: 'center',
  },
  profileRoleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#e6f4f0',
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  profileRoleText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
    color: '#006948',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  profileId: {
    marginTop: spacing.sm,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    color: '#6d7a72',
  },
  profileSummaryCard: {
    backgroundColor: '#006948',
    borderRadius: 24,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#006948',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.22,
        shadowRadius: 14,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  profileSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  profileSummaryTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
    color: '#fff',
  },
  profileSummaryGrid: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileSummaryItem: {
    flex: 1,
  },
  profileSummaryDivider: {
    width: 1,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.22)',
    marginHorizontal: spacing.md,
  },
  profileSummaryValue: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    color: '#fff',
  },
  profileSummaryLabel: {
    marginTop: 4,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.76)',
    letterSpacing: 0.8,
  },
  profileStatsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  profileSmallStatCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 20,
    padding: spacing.lg,
    ...cardShadow,
  },
  profileSmallStatValue: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
    color: '#121c28',
    marginBottom: 4,
  },
  profileSmallStatLabel: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '800',
    color: '#6d7a72',
    letterSpacing: 0.8,
  },
  profileActionsCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 24,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    ...cardShadow,
  },
  profileActionRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eef4ff',
    paddingVertical: spacing.md,
  },
  profileActionRowDanger: {
    borderBottomWidth: 0,
  },
  profileActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  profileActionTextGroup: {
    flex: 1,
  },
  profileActionLabel: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
    color: '#121c28',
  },
  profileActionLabelDanger: {
    color: '#ba1a1a',
  },
  profileActionDescription: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
    color: '#3d4a42',
  },
  logoutButton: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#ffdad6',
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#ba1a1a',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  logoutButtonText: {
    color: '#ba1a1a',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
  },
  navContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    paddingTop: 0,
    paddingHorizontal: spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  navItem: {
    flex: 1,
    minHeight: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navAnimatedItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 4,
  },
  navLabelActive: {
    color: '#006948',
  },
});
