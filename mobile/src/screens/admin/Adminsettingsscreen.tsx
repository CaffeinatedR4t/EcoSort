import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  ChevronLeft,
  ChevronRight,
  Bell,
  ShieldCheck,
  Globe,
  Moon,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wallet,
} from 'lucide-react-native';
import { spacing } from '../../services/theme/spacing';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const Toggle = ({
  value,
  onValueChange,
}: {
  value: boolean;
  onValueChange: (v: boolean) => void;
}) => (
  <Switch
    value={value}
    onValueChange={onValueChange}
    trackColor={{ false: '#cbd5e1', true: '#006948' }}
    thumbColor={Platform.OS === 'android' ? '#ffffff' : undefined}
    ios_backgroundColor="#cbd5e1"
  />
);

const SectionHeader = ({ title }: { title: string }) => (
  <Text style={styles.sectionHeader}>{title}</Text>
);

const MenuCard = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.menuCard}>{children}</View>
);

const MenuItem = ({
  iconBg,
  icon,
  label,
  sublabel,
  rightEl,
  onPress,
  last,
}: {
  iconBg: string;
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  rightEl?: React.ReactNode;
  onPress?: () => void;
  last?: boolean;
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={onPress ? 0.7 : 1}
    style={[styles.menuItem, last && styles.menuItemLast]}
  >
    <View style={[styles.iconBox, { backgroundColor: iconBg }]}>{icon}</View>
    <View style={styles.menuItemText}>
      <Text style={styles.menuItemLabel}>{label}</Text>
      {sublabel ? (
        <Text style={styles.menuItemSublabel}>{sublabel}</Text>
      ) : null}
    </View>
    {rightEl !== undefined ? (
      rightEl
    ) : onPress ? (
      <ChevronRight color="#94a3b8" size={18} />
    ) : null}
  </TouchableOpacity>
);

// ─── Screen ───────────────────────────────────────────────────────────────────
export const AdminSettingsScreen = () => {
  const navigation = useNavigation<any>();

  // Notification toggles
  const [notifNewPickup, setNotifNewPickup]       = useState(true);
  const [notifRewardPending, setNotifRewardPending] = useState(true);
  const [notifWithdrawal, setNotifWithdrawal]     = useState(true);
  const [notifSystem, setNotifSystem]             = useState(false);

  // App toggles
  const [darkMode, setDarkMode]         = useState(false);
  const [autoRefresh, setAutoRefresh]   = useState(true);
  const [liveUpdates, setLiveUpdates]   = useState(true);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <ChevronLeft color="#121c28" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {/* Hero */}
          <View style={styles.heroCard}>
            <View style={styles.heroIconBox}>
              <ShieldCheck color="#006948" size={32} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>Admin Settings</Text>
              <Text style={styles.heroSub}>
                Control app preferences and notification behavior.
              </Text>
            </View>
          </View>

          {/* Notifications */}
          <SectionHeader title="Notifications" />
          <MenuCard>
            <MenuItem
              iconBg="#dbeafe"
              icon={<Bell color="#1d4ed8" size={18} />}
              label="New Pickup Requests"
              sublabel="Alert when a new pickup is submitted"
              rightEl={
                <Toggle
                  value={notifNewPickup}
                  onValueChange={setNotifNewPickup}
                />
              }
            />
            <MenuItem
              iconBg="#dcfce7"
              icon={<CheckCircle color="#16a34a" size={18} />}
              label="Pending Reward Reviews"
              sublabel="Alert when rewards await approval"
              rightEl={
                <Toggle
                  value={notifRewardPending}
                  onValueChange={setNotifRewardPending}
                />
              }
            />
            <MenuItem
              iconBg="#fef3c7"
              icon={<Wallet color="#b45309" size={18} />}
              label="Withdrawal Requests"
              sublabel="Alert when withdrawal is submitted"
              rightEl={
                <Toggle
                  value={notifWithdrawal}
                  onValueChange={setNotifWithdrawal}
                />
              }
            />
            <MenuItem
              iconBg="#f3e8ff"
              icon={<AlertTriangle color="#7c3aed" size={18} />}
              label="System Alerts"
              sublabel="Critical errors and system warnings"
              rightEl={
                <Toggle
                  value={notifSystem}
                  onValueChange={setNotifSystem}
                />
              }
              last
            />
          </MenuCard>

          {/* App Behavior */}
          <SectionHeader title="App Behavior" />
          <MenuCard>
            <MenuItem
              iconBg="#f1f5f9"
              icon={<Moon color="#475569" size={18} />}
              label="Dark Mode"
              sublabel="Switch admin panel to dark theme"
              rightEl={
                <Toggle value={darkMode} onValueChange={setDarkMode} />
              }
            />
            <MenuItem
              iconBg="#dcfce7"
              icon={<RefreshCw color="#16a34a" size={18} />}
              label="Auto Refresh Overview"
              sublabel="Refresh stats every 60 seconds"
              rightEl={
                <Toggle
                  value={autoRefresh}
                  onValueChange={setAutoRefresh}
                />
              }
            />
            <MenuItem
              iconBg="#e0f2f1"
              icon={<Clock color="#006948" size={18} />}
              label="Live Feed Updates"
              sublabel="Real-time activity feed on Overview"
              rightEl={
                <Toggle
                  value={liveUpdates}
                  onValueChange={setLiveUpdates}
                />
              }
              last
            />
          </MenuCard>

          {/* Region */}
          <SectionHeader title="Region & Language" />
          <MenuCard>
            <MenuItem
              iconBg="#e0f2fe"
              icon={<Globe color="#0284c7" size={18} />}
              label="Language"
              sublabel="English (US)"
              onPress={() => {}}
            />
            <MenuItem
              iconBg="#fef3c7"
              icon={<Clock color="#b45309" size={18} />}
              label="Timezone"
              sublabel="Asia/Jakarta (WIB, UTC+7)"
              onPress={() => {}}
              last
            />
          </MenuCard>

          {/* App Info */}
          <View style={styles.appInfoCard}>
            <Text style={styles.appInfoTitle}>EcoSort Admin Panel</Text>
            <Text style={styles.appInfoSub}>Version 1.0.0 • Build 100</Text>
            <Text style={styles.appInfoSub}>Last updated May 2026</Text>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#121c28' },
  scroll: { paddingTop: spacing.lg },
  heroCard: {
    marginHorizontal: spacing.lg,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#e8edf2',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  heroIconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#e0f2f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: { fontSize: 17, fontWeight: '800', color: '#121c28', marginBottom: 4 },
  heroSub: { fontSize: 13, color: '#64748b', lineHeight: 18 },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  menuCard: {
    marginHorizontal: spacing.lg,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e8edf2',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6 },
      android: { elevation: 1 },
    }),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  menuItemLast: { borderBottomWidth: 0 },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  menuItemText: { flex: 1, minWidth: 0 },
  menuItemLabel: { fontSize: 15, fontWeight: '600', color: '#121c28' },
  menuItemSublabel: { fontSize: 12, color: '#64748b', marginTop: 2 },
  appInfoCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    alignItems: 'center',
    padding: spacing.lg,
  },
  appInfoTitle: { fontSize: 14, fontWeight: '700', color: '#121c28', marginBottom: 4 },
  appInfoSub: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
});