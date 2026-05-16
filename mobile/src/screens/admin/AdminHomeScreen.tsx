import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  StatusBar,
  ActivityIndicator,
  Platform,
  Pressable,
  Switch,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAdminStore } from '../../store/adminStore';
import { useAuthStore } from '../../store/authStore';
import { spacing } from '../../services/theme/spacing';
import { Card } from '../../components/Card';
import MapView from 'react-native-maps';
import {
  LogOut,
  Bell,
  Wallet,
  Recycle,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  Hourglass,
  Trash2,
  LayoutDashboard,
  Map,
  User,
  Zap,
  TrendingUp,
  Settings,
  UserCheck,
  MoonStar,
  ChevronRight,
} from 'lucide-react-native';

// ─── Types ────────────────────────────────────────────────────────────────────
type AdminTab = 'overview' | 'earnings' | 'area' | 'profile';

// ─── Bottom Nav ───────────────────────────────────────────────────────────────
const AdminBottomNav = ({
  activeTab,
  onTabPress,
}: {
  activeTab: AdminTab;
  onTabPress: (tab: AdminTab) => void;
}) => {
  const insets = useSafeAreaInsets();
  const tabs: { key: AdminTab; label: string; icon: any }[] = [
    { key: 'overview', label: 'Overview',  icon: LayoutDashboard },
    { key: 'earnings', label: 'Earnings',  icon: Wallet },
    { key: 'area',     label: 'Area',      icon: Map },
    { key: 'profile',  label: 'Profile',   icon: User },
  ];

  return (
    <View style={[navStyles.container, { paddingBottom: insets.bottom || 12 }]}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        const IconComp = tab.icon;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onTabPress(tab.key)}
            android_ripple={{ color: 'transparent' }}
            style={navStyles.touchable}
          >
            {isActive ? (
              <View style={navStyles.activePill}>
                <IconComp size={18} color="#fff" strokeWidth={2.5} />
                <Text style={navStyles.activePillLabel}>{tab.label}</Text>
              </View>
            ) : (
              <View style={navStyles.inactiveWrap}>
                <IconComp size={22} color="#94a3b8" strokeWidth={1.8} />
                <Text style={navStyles.inactiveLabel}>{tab.label}</Text>
              </View>
            )}
          </Pressable>
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
    backgroundColor: '#fff',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 10 },
    }),
  },
  touchable: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 52 },
  activePill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#006948',
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 24, gap: 6,
  },
  activePillLabel: { fontSize: 12, fontWeight: '700', color: '#fff' },
  inactiveWrap: { alignItems: 'center', gap: 3 },
  inactiveLabel: { fontSize: 10, fontWeight: '500', color: '#94a3b8' },
});

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({
  label,
  value,
  unit,
  sub,
  subColor,
  iconBg,
  icon,
  progress,
  progressColor,
}: {
  label: string;
  value: string;
  unit?: string;
  sub: string;
  subColor: string;
  iconBg: string;
  icon: React.ReactNode;
  progress: number; // 0–1
  progressColor: string;
}) => (
  <View style={cardStyles.card}>
    <View style={cardStyles.cardTop}>
      <Text style={cardStyles.cardLabel}>{label}</Text>
      <View style={[cardStyles.iconCircle, { backgroundColor: iconBg }]}>
        {icon}
      </View>
    </View>
    <View style={cardStyles.valueRow}>
      <Text style={cardStyles.valueText}>{value}</Text>
      {unit && <Text style={cardStyles.unitText}> {unit}</Text>}
    </View>
    <Text style={[cardStyles.subText, { color: subColor }]}>{sub}</Text>
    <View style={cardStyles.progressBg}>
      <View style={[
        cardStyles.progressFill,
        { width: `${Math.min(progress * 100, 100)}%` as any, backgroundColor: progressColor },
      ]} />
    </View>
  </View>
);

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  cardLabel: { fontSize: 14, color: '#64748b', fontWeight: '500' },
  iconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 },
  valueText: { fontSize: 40, fontWeight: '800', color: '#006948', lineHeight: 48 },
  unitText: { fontSize: 20, fontWeight: '700', color: '#006948' },
  subText: { fontSize: 13, fontWeight: '600', marginBottom: spacing.md },
  progressBg: { height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
});

// ─── Live Feed Item ───────────────────────────────────────────────────────────
const FeedItem = ({
  icon,
  iconBg,
  title,
  desc,
  time,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  desc: string;
  time: string;
}) => (
  <View style={feedStyles.item}>
    <View style={[feedStyles.iconBox, { backgroundColor: iconBg }]}>{icon}</View>
    <View style={feedStyles.textBox}>
      <Text style={feedStyles.title}>{title}</Text>
      <Text style={feedStyles.desc}>{desc}</Text>
    </View>
    <Text style={feedStyles.time}>{time}</Text>
  </View>
);

const feedStyles = StyleSheet.create({
  item: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  iconBox: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  textBox: { flex: 1 },
  title: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 2 },
  desc: { fontSize: 13, color: '#64748b', fontWeight: '400', lineHeight: 18 },
  time: { fontSize: 12, color: '#94a3b8', fontWeight: '500', marginTop: 2 },
});

// ─── Overview Tab ─────────────────────────────────────────────────────────────
const OverviewTab = () => {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 90 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Page Title */}
      <Text style={styles.pageTitle}>Today's Overview</Text>
      <Text style={styles.pageSubtitle}>Real-time ecosystem statistics.</Text>

      {/* Stat Cards */}
      <StatCard
        label="Active Trucks"
        value="42"
        sub="On Route Now"
        subColor="#0284c7"
        iconBg="#dbeafe"
        icon={<Truck color="#0284c7" size={22} />}
        progress={0.75}
        progressColor="#0284c7"
      />

      <StatCard
        label="Total Yield"
        value="1,240"
        unit="kg"
        sub="+12% vs Yesterday"
        subColor="#006948"
        iconBg="#dcfce7"
        icon={<Hourglass color="#006948" size={22} />}
        progress={0.65}
        progressColor="#006948"
      />

      <StatCard
        label="Volume Collected"
        value="8.5"
        unit="tons"
        sub="Daily Target: 10 tons"
        subColor="#b45309"
        iconBg="#fef3c7"
        icon={<Trash2 color="#b45309" size={22} />}
        progress={0.85}
        progressColor="#b45309"
      />

      {/* Live Feed */}
      <View style={styles.liveFeedCard}>
        <View style={styles.liveFeedHeader}>
          <Text style={styles.liveFeedTitle}>Live Feed</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        <FeedItem
          iconBg="#dcfce7"
          icon={<Recycle color="#006948" size={20} />}
          title="Sector 4 Route Completed"
          desc="Truck #102 dropped off 400kg."
          time="Just now"
        />
        <FeedItem
          iconBg="#dbeafe"
          icon={<Zap color="#0284c7" size={20} />}
          title="New High Score"
          desc="Community goal reached for Plastics."
          time="12m ago"
        />
        <FeedItem
          iconBg="#fef3c7"
          icon={<TrendingUp color="#b45309" size={20} />}
          title="Yield Target Reached"
          desc="Morning shift exceeded quota by 8%."
          time="1h ago"
        />
      </View>
    </ScrollView>
  );
};

// ─── Helper: Avatar initials ──────────────────────────────────────────────────
const getInitials = (name: string = '') => {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const getAvatarColor = (name: string = '') => {
  const colors = ['#0284c7', '#006948', '#b45309', '#7c3aed', '#db2777'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return colors[hash % colors.length];
};

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

// ─── Earnings Tab (Rewards & Withdrawals) ─────────────────────────────────────
const EarningsTab = ({
  pendingRewards,
  pendingWithdrawals,
  loading,
  refreshing,
  onRefresh,
  handleApproveReward,
  handleRejectReward,
  handleApproveWithdrawal,
  handleRejectWithdrawal,
}: any) => {
  const [activeSubTab, setActiveSubTab] = useState<'REWARDS' | 'WITHDRAWALS'>('REWARDS');
  const insets = useSafeAreaInsets();

  // ── Summary calculations ──────────────────────────────────────────────────
  const totalRewardsPts  = pendingRewards.reduce((s: number, r: any) => s + (r.amount || 0), 0);
  const totalWithdrawAmt = pendingWithdrawals.reduce((s: number, d: any) => s + (d.amount || 0), 0);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 140 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── REWARDS sub-tab content ── */}
        {activeSubTab === 'REWARDS' && (
          <>
            <Text style={styles.pageTitle}>Rewards Review</Text>
            <Text style={styles.pageSubtitle}>Manage and process pending reward requests.</Text>

            {/* Summary cards */}
            <View style={earningStyles.summaryCard}>
              <Text style={earningStyles.summaryLabel}>TOTAL VOLUME PENDING</Text>
              <View style={earningStyles.summaryValueRow}>
                <Text style={earningStyles.summaryValue}>
                  {totalRewardsPts.toLocaleString('id-ID')}
                </Text>
                <Text style={earningStyles.summaryUnit}> pts</Text>
              </View>
            </View>

            <View style={earningStyles.summaryCard}>
              <Text style={earningStyles.summaryLabel}>PENDING REQUESTS</Text>
              <View style={earningStyles.summaryValueRow}>
                <Text style={[earningStyles.summaryValue, { color: '#b45309' }]}>
                  {pendingRewards.length}
                </Text>
                <View style={earningStyles.priorityBadge}>
                  <Text style={earningStyles.priorityText}>High Priority</Text>
                </View>
              </View>
            </View>

            {/* List */}
            <Text style={earningStyles.sectionTitle}>Pending Approvals</Text>

            {loading ? (
              <ActivityIndicator size="large" color="#006948" style={{ marginTop: 40 }} />
            ) : pendingRewards.length > 0 ? (
              pendingRewards.map((reward: any) => {
                const name     = reward.users?.name || 'User';
                const initials = getInitials(name);
                const avatarBg = getAvatarColor(name);
                return (
                  <View key={reward.id} style={earningStyles.approvalCard}>
                    {/* User Row */}
                    <View style={earningStyles.userRow}>
                      <View style={[earningStyles.avatar, { backgroundColor: avatarBg }]}>
                        <Text style={earningStyles.avatarText}>{initials}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={earningStyles.cardName}>{name}</Text>
                        <Text style={earningStyles.cardMeta}>
                          {timeAgo(reward.created_at)} • Rp {reward.amount.toLocaleString('id-ID')}
                        </Text>
                      </View>
                    </View>

                    {/* Points badge */}
                    <View style={earningStyles.ptsBadge}>
                      <Recycle color="#006948" size={14} />
                      <Text style={earningStyles.ptsBadgeText}>
                        +{reward.amount.toLocaleString('id-ID')} pts
                      </Text>
                    </View>

                    {/* Actions */}
                    <View style={earningStyles.actionRow}>
                      <TouchableOpacity
                        style={earningStyles.denyBtn}
                        onPress={() => handleRejectReward(reward.id)}
                      >
                        <Text style={earningStyles.denyText}>Deny</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={earningStyles.allowBtn}
                        onPress={() => handleApproveReward(reward.id, reward.amount, name)}
                      >
                        <Text style={earningStyles.allowText}>Allow</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyContainer}>
                <Clock color="#cbd5e1" size={56} strokeWidth={1} />
                <Text style={styles.emptyText}>No pending rewards</Text>
              </View>
            )}
          </>
        )}

        {/* ── WITHDRAWALS sub-tab content ── */}
        {activeSubTab === 'WITHDRAWALS' && (
          <>
            <Text style={styles.pageTitle}>Withdrawals</Text>
            <Text style={styles.pageSubtitle}>Review and process withdrawal requests.</Text>

            {/* Summary cards */}
            <View style={earningStyles.summaryCard}>
              <Text style={earningStyles.summaryLabel}>TOTAL AMOUNT TO DISBURSE</Text>
              <View style={earningStyles.summaryValueRow}>
                <Text style={earningStyles.summaryValue}>
                  Rp {totalWithdrawAmt.toLocaleString('id-ID')}
                </Text>
              </View>
            </View>

            <View style={earningStyles.summaryCard}>
              <Text style={earningStyles.summaryLabel}>PENDING REQUESTS</Text>
              <View style={earningStyles.summaryValueRow}>
                <Text style={[earningStyles.summaryValue, { color: '#b45309' }]}>
                  {pendingWithdrawals.length}
                </Text>
                <View style={[earningStyles.priorityBadge, { backgroundColor: '#fff1f2', borderColor: '#fecdd3' }]}>
                  <Text style={[earningStyles.priorityText, { color: '#e11d48' }]}>
                    ⚠ Action Required
                  </Text>
                </View>
              </View>
            </View>

            {/* List */}
            {loading ? (
              <ActivityIndicator size="large" color="#006948" style={{ marginTop: 40 }} />
            ) : pendingWithdrawals.length > 0 ? (
              pendingWithdrawals.map((draw: any) => {
                const name     = draw.users?.name || 'User';
                const initials = getInitials(name);
                const avatarBg = getAvatarColor(name);
                return (
                  <View key={draw.id} style={earningStyles.approvalCard}>
                    {/* User Row */}
                    <View style={earningStyles.userRow}>
                      <View style={[earningStyles.avatar, { backgroundColor: avatarBg }]}>
                        <Text style={earningStyles.avatarText}>{initials}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={earningStyles.cardName}>{name}</Text>
                        <View style={earningStyles.bankRow}>
                          <Wallet color="#94a3b8" size={13} />
                          <Text style={earningStyles.cardMeta}>
                            {draw.bank_name}
                          </Text>
                        </View>
                        <Text style={earningStyles.cardMeta}>
                          {new Date(draw.created_at).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric',
                          })},{' '}
                          {new Date(draw.created_at).toLocaleTimeString([], {
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </Text>
                      </View>
                    </View>

                    {/* Amount badge */}
                    <View style={earningStyles.amountBadge}>
                      <Text style={earningStyles.amountBadgeText}>
                        Rp {draw.amount.toLocaleString('id-ID')}
                      </Text>
                    </View>

                    {/* Actions */}
                    <View style={earningStyles.actionRow}>
                      <TouchableOpacity
                        style={earningStyles.denyBtn}
                        onPress={() => handleRejectWithdrawal(draw.id)}
                      >
                        <Text style={earningStyles.denyText}>Deny</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={earningStyles.allowBtn}
                        onPress={() => handleApproveWithdrawal(draw.id, draw.amount, name)}
                      >
                        <Text style={earningStyles.allowText}>Allow</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyContainer}>
                <Clock color="#cbd5e1" size={56} strokeWidth={1} />
                <Text style={styles.emptyText}>No pending withdrawals</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* ── Floating Sub-Tab Switcher ── */}
      <View style={[earningStyles.floatingTabBar, { bottom: insets.bottom + 70 }]}>
        <TouchableOpacity
          style={[
            earningStyles.floatingTab,
            activeSubTab === 'REWARDS' && earningStyles.floatingTabActive,
          ]}
          onPress={() => setActiveSubTab('REWARDS')}
        >
          <Text style={[
            earningStyles.floatingTabText,
            activeSubTab === 'REWARDS' && earningStyles.floatingTabTextActive,
          ]}>
            Rewards
          </Text>
          {pendingRewards.length > 0 && activeSubTab !== 'REWARDS' && (
            <View style={earningStyles.dotBadge} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            earningStyles.floatingTab,
            activeSubTab === 'WITHDRAWALS' && earningStyles.floatingTabActive,
          ]}
          onPress={() => setActiveSubTab('WITHDRAWALS')}
        >
          <Text style={[
            earningStyles.floatingTabText,
            activeSubTab === 'WITHDRAWALS' && earningStyles.floatingTabTextActive,
          ]}>
            Withdrawal
          </Text>
          {pendingWithdrawals.length > 0 && activeSubTab !== 'WITHDRAWALS' && (
            <View style={earningStyles.dotBadge} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Area Tab ─────────────────────────────────────────────────────────────────
const AreaTab = () => {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Map */}
      <View style={areaStyles.mapContainer}>
        <MapView
          style={areaStyles.map}
          initialRegion={{
            latitude: -6.2088,
            longitude: 106.8456,
            latitudeDelta: 0.15,
            longitudeDelta: 0.15,
          }}
          scrollEnabled={true}
          zoomEnabled={true}
          zoomControlEnabled={true}
          showsUserLocation={true}
          showsMyLocationButton={true}
        />
      </View>

      <View style={areaStyles.content}>
        {/* Zone Status Card */}
        <View style={areaStyles.zoneCard}>
          <View style={areaStyles.zoneCardBg} />
          <View style={areaStyles.zoneTop}>
            <CheckCircle color="rgba(255,255,255,0.8)" size={16} />
            <Text style={areaStyles.zoneLabel}>ZONE STATUS</Text>
          </View>
          <Text style={areaStyles.zoneStatus}>Operational</Text>
          <Text style={areaStyles.zoneDesc}>All recycling hubs online.</Text>
        </View>

        {/* Stats Grid */}
        <View style={areaStyles.statsGrid}>
          {/* Active Users */}
          <View style={areaStyles.statBox}>
            <Text style={areaStyles.statBoxLabel}>ACTIVE USERS</Text>
            <Text style={areaStyles.statBoxValue}>1,248</Text>
            <View style={areaStyles.trendRow}>
              <TrendingUp color="#006948" size={14} />
              <Text style={areaStyles.trendText}>+12% today</Text>
            </View>
          </View>

          {/* Active Drivers */}
          <View style={areaStyles.statBox}>
            <Text style={areaStyles.statBoxLabel}>ACTIVE DRIVERS</Text>
            <Text style={areaStyles.statBoxValue}>42</Text>
            <View style={areaStyles.capacityBarBg}>
              <View style={[areaStyles.capacityBarFill, { width: '85%' }]} />
            </View>
            <Text style={areaStyles.capacityText}>85% Capacity</Text>
          </View>

          {/* Active Requests */}
          <View style={areaStyles.statBox}>
            <View style={areaStyles.statBoxTopRow}>
              <Text style={areaStyles.statBoxLabel}>ACTIVE{'\n'}REQUESTS</Text>
              <Bell color="#b45309" size={18} />
            </View>
            <Text style={areaStyles.statBoxValue}>156</Text>
            <View style={areaStyles.demandBadge}>
              <Text style={areaStyles.demandBadgeText}>High Demand</Text>
            </View>
          </View>

          {/* Avg Response Time */}
          <View style={areaStyles.statBox}>
            <Text style={areaStyles.statBoxLabel}>AVG. RESPONSE TIME</Text>
            <View style={areaStyles.responseRow}>
              <Text style={areaStyles.statBoxValue}>14</Text>
              <Text style={areaStyles.responseUnit}> mins</Text>
            </View>
            <View style={areaStyles.optimalRow}>
              <Recycle color="#006948" size={14} />
              <Text style={areaStyles.optimalText}>Optimal</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const areaStyles = StyleSheet.create({
  mapContainer: {
    height: 300,
    width: '100%',
    backgroundColor: '#e2e8f0',
  },
  map: { flex: 1 },
  content: { padding: spacing.lg },

  // Zone Card
  zoneCard: {
    backgroundColor: '#006948',
    borderRadius: 20,
    padding: spacing.xl,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#006948', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12 },
      android: { elevation: 6 },
    }),
  },
  zoneCardBg: {
    position: 'absolute', right: -20, top: -20,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  zoneTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  zoneLabel: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.7)', letterSpacing: 1.5 },
  zoneStatus: { fontSize: 32, fontWeight: '800', color: '#fff', marginBottom: 4 },
  zoneDesc: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '400' },

  // Stats Grid
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  statBox: {
    flex: 1, minWidth: '45%',
    backgroundColor: '#fff', borderRadius: 16, padding: spacing.lg,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  statBoxTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  statBoxLabel: { fontSize: 10, fontWeight: '800', color: '#94a3b8', letterSpacing: 1, marginBottom: 8 },
  statBoxValue: { fontSize: 36, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trendText: { fontSize: 13, fontWeight: '600', color: '#006948' },
  capacityBarBg: { height: 5, backgroundColor: '#e2e8f0', borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  capacityBarFill: { height: '100%', backgroundColor: '#006948', borderRadius: 3 },
  capacityText: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  demandBadge: {
    backgroundColor: '#dbeafe', alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  demandBadgeText: { fontSize: 12, fontWeight: '700', color: '#0284c7' },
  responseRow: { flexDirection: 'row', alignItems: 'baseline' },
  responseUnit: { fontSize: 18, fontWeight: '600', color: '#64748b' },
  optimalRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  optimalText: { fontSize: 13, fontWeight: '600', color: '#006948' },
});

// ─── Profile Tab ──────────────────────────────────────────────────────────────
const AdminProfileTab = ({ user, logout }: { user: any; logout: () => void }) => {
  const insets = useSafeAreaInsets();
  const [darkMode, setDarkMode] = useState(false);

  const name = user?.name ?? 'Admin';
  const initials = name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <ScrollView
      contentContainerStyle={[profileStyles2.scroll, { paddingBottom: insets.bottom + 90 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Avatar */}
      <View style={profileStyles2.avatarSection}>
        <View style={profileStyles2.avatarCircle}>
          <Text style={profileStyles2.avatarInitials}>{initials}</Text>
        </View>
        <Text style={profileStyles2.name}>{name}</Text>
        <View style={profileStyles2.roleBadge}>
          <Text style={profileStyles2.roleText}>Super Admin</Text>
        </View>
      </View>

      {/* Menu Items */}
      <View style={profileStyles2.menuCard}>
        <TouchableOpacity style={profileStyles2.menuItem}>
          <View style={[profileStyles2.menuIconBox, { backgroundColor: '#EEF2F8' }]}>
            <Settings color="#475569" size={20} />
          </View>
          <View style={profileStyles2.menuTextBox}>
            <Text style={profileStyles2.menuTitle}>Settings</Text>
            <Text style={profileStyles2.menuDesc}>App preferences & notifications</Text>
          </View>
          <ChevronRight color="#cbd5e1" size={20} />
        </TouchableOpacity>

        <View style={profileStyles2.menuDivider} />

        <TouchableOpacity style={profileStyles2.menuItem}>
          <View style={[profileStyles2.menuIconBox, { backgroundColor: '#EEF2F8' }]}>
            <UserCheck color="#475569" size={20} />
          </View>
          <View style={profileStyles2.menuTextBox}>
            <Text style={profileStyles2.menuTitle}>Account Settings</Text>
            <Text style={profileStyles2.menuDesc}>Password, security & roles</Text>
          </View>
          <ChevronRight color="#cbd5e1" size={20} />
        </TouchableOpacity>
      </View>

      {/* App Appearance */}
      <Text style={profileStyles2.sectionLabel}>App Appearance</Text>
      <View style={profileStyles2.menuCard}>
        <View style={profileStyles2.menuItem}>
          <View style={[profileStyles2.menuIconBox, { backgroundColor: '#EEF2F8' }]}>
            <MoonStar color="#475569" size={20} />
          </View>
          <Text style={[profileStyles2.menuTitle, { flex: 1 }]}>Dark Mode</Text>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: '#e2e8f0', true: '#006948' }}
            thumbColor="#fff"
            style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
          />
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity style={profileStyles2.logoutBtn} onPress={logout}>
        <LogOut color="#e11d48" size={20} />
        <Text style={profileStyles2.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const profileStyles2 = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl },
  avatarSection: { alignItems: 'center', marginBottom: spacing.xl },
  avatarCircle: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: '#006948', justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 4, borderColor: '#fff',
    ...Platform.select({
      ios: { shadowColor: '#006948', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 10 },
      android: { elevation: 6 },
    }),
  },
  avatarInitials: { fontSize: 36, fontWeight: '800', color: '#fff' },
  name: { fontSize: 28, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
  roleBadge: {
    backgroundColor: '#e6f4f0', paddingHorizontal: 16, paddingVertical: 5,
    borderRadius: 20,
  },
  roleText: { fontSize: 14, fontWeight: '700', color: '#006948' },

  menuCard: {
    backgroundColor: '#fff', borderRadius: 20, marginBottom: spacing.md,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: spacing.lg, gap: spacing.md,
  },
  menuDivider: { height: 1, backgroundColor: '#f1f5f9', marginHorizontal: spacing.lg },
  menuIconBox: {
    width: 44, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  menuTextBox: { flex: 1 },
  menuTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a', marginBottom: 2 },
  menuDesc: { fontSize: 13, color: '#94a3b8', fontWeight: '400' },

  sectionLabel: {
    fontSize: 14, fontWeight: '700', color: '#64748b',
    marginBottom: spacing.sm, marginLeft: 4,
  },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: '#fff',
    borderWidth: 1.5, borderColor: '#fecaca',
    borderRadius: 16, padding: spacing.lg, marginTop: spacing.md,
    ...Platform.select({
      ios: { shadowColor: '#e11d48', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  logoutText: { fontSize: 18, fontWeight: '700', color: '#e11d48' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export const AdminHomeScreen = () => {
  const {
    pendingRewards,
    pendingWithdrawals,
    loading,
    fetchPendingRewards,
    fetchPendingWithdrawals,
    approveReward,
    rejectReward,
    approveWithdrawal,
    rejectWithdrawal,
  } = useAdminStore();

  const { logout, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    fetchPendingRewards();
    fetchPendingWithdrawals();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchPendingRewards(), fetchPendingWithdrawals()]);
    setRefreshing(false);
  };

  const handleApproveReward = (id: string, amount: number, userName: string) => {
    Alert.alert(
      'Approve Reward',
      `Approve Rp ${amount.toLocaleString()} for ${userName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Approve', onPress: () => approveReward(id) },
      ]
    );
  };

  const handleRejectReward = (id: string) => {
    Alert.alert(
      'Reject Reward',
      'Are you sure you want to reject this reward?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reject', style: 'destructive', onPress: () => rejectReward(id) },
      ]
    );
  };

  const handleApproveWithdrawal = (id: string, amount: number, userName: string) => {
    Alert.alert(
      'Approve Withdrawal',
      `Mark Rp ${amount.toLocaleString()} withdrawal for ${userName} as COMPLETED?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => approveWithdrawal(id) },
      ]
    );
  };

  const handleRejectWithdrawal = (id: string) => {
    Alert.alert(
      'Reject Withdrawal',
      'Reject this withdrawal? The amount will be refunded to the user.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reject', style: 'destructive', onPress: () => rejectWithdrawal(id) },
      ]
    );
  };

  const totalPendingBadge = pendingRewards.length + pendingWithdrawals.length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEF2F8" />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIconBox}>
              <Recycle color="#006948" size={20} />
            </View>
            <Text style={styles.headerTitle}>Admin Panel</Text>
          </View>
          <TouchableOpacity style={styles.bellBtn}>
            <Bell color="#006948" size={22} />
            {totalPendingBadge > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{totalPendingBadge}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'earnings' && (
          <EarningsTab
            pendingRewards={pendingRewards}
            pendingWithdrawals={pendingWithdrawals}
            loading={loading}
            refreshing={refreshing}
            onRefresh={onRefresh}
            handleApproveReward={handleApproveReward}
            handleRejectReward={handleRejectReward}
            handleApproveWithdrawal={handleApproveWithdrawal}
            handleRejectWithdrawal={handleRejectWithdrawal}
          />
        )}
        {activeTab === 'area'    && <AreaTab />}
        {activeTab === 'profile' && <AdminProfileTab user={user} logout={logout} />}

      </SafeAreaView>

      <AdminBottomNav activeTab={activeTab} onTabPress={setActiveTab} />
    </View>
  );
};

// ─── Earning Styles ───────────────────────────────────────────────────────────
const earningStyles = StyleSheet.create({
  summaryCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: spacing.lg,
    marginBottom: spacing.md,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  summaryLabel: {
    fontSize: 11, fontWeight: '700', color: '#94a3b8',
    letterSpacing: 1, marginBottom: 8,
  },
  summaryValueRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  summaryValue: { fontSize: 32, fontWeight: '800', color: '#006948' },
  summaryUnit: { fontSize: 18, fontWeight: '700', color: '#006948' },
  priorityBadge: {
    backgroundColor: '#fff8ed', borderWidth: 1, borderColor: '#fed7aa',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  priorityText: { fontSize: 12, fontWeight: '700', color: '#b45309' },
  sectionTitle: {
    fontSize: 22, fontWeight: '800', color: '#0f172a',
    marginTop: spacing.md, marginBottom: spacing.md,
  },
  approvalCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: spacing.lg,
    marginBottom: spacing.md,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  avatar: {
    width: 50, height: 50, borderRadius: 25,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  cardName: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 2 },
  cardMeta: { fontSize: 13, color: '#64748b', fontWeight: '400' },
  bankRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  ptsBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#e6f4f0', alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, marginBottom: spacing.md,
  },
  ptsBadgeText: { fontSize: 15, fontWeight: '800', color: '#006948' },
  amountBadge: {
    backgroundColor: '#e6f4f0', alignSelf: 'flex-start',
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, marginBottom: spacing.md,
  },
  amountBadgeText: { fontSize: 15, fontWeight: '800', color: '#006948' },
  actionRow: { flexDirection: 'row', gap: spacing.md },
  denyBtn: {
    flex: 1, height: 46, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#fca5a5',
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#fff',
  },
  denyText: { fontSize: 15, fontWeight: '700', color: '#e11d48' },
  allowBtn: {
    flex: 1, height: 46, borderRadius: 12,
    backgroundColor: '#006948', justifyContent: 'center', alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#006948', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 6 },
      android: { elevation: 4 },
    }),
  },
  allowText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  floatingTabBar: {
    position: 'absolute', alignSelf: 'center',
    flexDirection: 'row',
    backgroundColor: '#fff', borderRadius: 30,
    padding: 4, gap: 4,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12 },
      android: { elevation: 8 },
    }),
  },
  floatingTab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 26,
  },
  floatingTabActive: { backgroundColor: '#006948' },
  floatingTabText: { fontSize: 14, fontWeight: '700', color: '#94a3b8' },
  floatingTabTextActive: { color: '#fff' },
  dotBadge: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: '#e11d48', marginLeft: 2,
  },
});

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EEF2F8' },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    backgroundColor: '#EEF2F8',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIconBox: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#dcfce7', justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#006948' },
  bellBtn: { position: 'relative', width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  bellBadge: {
    position: 'absolute', top: 4, right: 4,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#e11d48', justifyContent: 'center', alignItems: 'center',
  },
  bellBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff' },

  // Scroll
  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },

  // Page titles
  pageTitle: { fontSize: 32, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  pageSubtitle: { fontSize: 14, color: '#64748b', fontWeight: '400', marginBottom: spacing.xl },

  // Live Feed
  liveFeedCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: spacing.lg,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  liveFeedHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: spacing.md,
  },
  liveFeedTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  viewAllText: { fontSize: 14, fontWeight: '600', color: '#006948' },

  // Sub tab (Earnings)
  subTabRow: {
    flexDirection: 'row', backgroundColor: '#fff',
    borderRadius: 16, padding: 4, gap: 4, marginBottom: spacing.lg,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  subTab: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', paddingVertical: 12,
    gap: 6, borderRadius: 12,
  },
  subTabActive: { backgroundColor: '#f1f8e9' },
  subTabText: { fontSize: 14, fontWeight: '600', color: '#94a3b8' },
  subTabTextActive: { color: '#006948' },
  badge: {
    backgroundColor: '#006948', minWidth: 18, height: 18,
    borderRadius: 9, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },

  // Item Cards (Earnings)
  itemCard: { marginBottom: spacing.md, padding: spacing.lg, borderRadius: 20 },
  itemHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: spacing.md,
  },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 2 },
  itemDate: { fontSize: 12, color: '#64748b' },
  rewardAmount: { fontSize: 18, fontWeight: '800', color: '#059669' },
  drawAmount: { fontSize: 18, fontWeight: '800', color: '#e11d48' },
  bankInfo: {
    backgroundColor: '#f8fafc', padding: spacing.md,
    borderRadius: 12, marginBottom: spacing.md,
  },
  bankLabel: { fontSize: 10, fontWeight: '800', color: '#94a3b8', letterSpacing: 1, marginBottom: 4 },
  bankDetail: { fontSize: 13, color: '#334155', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginBottom: spacing.md },
  actionRow: { flexDirection: 'row', gap: spacing.md },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1,
  },
  rejectBtn: { borderColor: '#fee2e2', backgroundColor: '#fff1f2' },
  approveBtn: { borderColor: '#dcfce7', backgroundColor: '#f0fdf4' },
  rejectText: { color: '#e11d48', fontSize: 14, fontWeight: '700' },
  approveText: { color: '#006948', fontSize: 14, fontWeight: '700' },

  // Empty
  emptyContainer: {
    width: '100%', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 60, gap: spacing.md,
  },
  emptyText: { fontSize: 15, color: '#94a3b8', fontWeight: '600', textAlign: 'center' },

  // Logout row
  logoutRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff1f2', padding: spacing.lg,
    borderRadius: 16, marginTop: spacing.xl,
    borderWidth: 1, borderColor: '#fee2e2',
  },
  logoutText: { fontSize: 16, fontWeight: '700', color: '#e11d48' },
});