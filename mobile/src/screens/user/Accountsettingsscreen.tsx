import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  Bell,
  ShoppingBag,
  Tag,
  Lock,
  ShieldCheck,
  Moon,
  Trash2,
  UserCircle,
  Check,
} from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { spacing } from '../../services/theme/spacing';
import { useThemeColors } from '../../hooks/useThemeColors';

// ─── Toggle Component ─────────────────────────────────────────────────────────
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

// ─── Icon Box ─────────────────────────────────────────────────────────────────
const IconBox = ({
  bg,
  children,
}: {
  bg: string;
  children: React.ReactNode;
}) => (
  <View style={[styles.iconBox, { backgroundColor: bg }]}>{children}</View>
);

// ─── Section Header ───────────────────────────────────────────────────────────
const SectionHeader = ({ title }: { title: string }) => (
  <Text style={styles.sectionHeader}>{title}</Text>
);

// ─── Menu Item ────────────────────────────────────────────────────────────────
const MenuItem = ({
  iconBg,
  icon,
  label,
  sublabel,
  rightEl,
  onPress,
  last,
  danger,
}: {
  iconBg: string;
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  rightEl?: React.ReactNode;
  onPress?: () => void;
  last?: boolean;
  danger?: boolean;
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={onPress ? 0.7 : 1}
    style={[styles.menuItem, last && styles.menuItemLast]}
  >
    <IconBox bg={iconBg}>{icon}</IconBox>
    <View style={styles.menuItemText}>
      <Text style={[styles.menuItemLabel, danger && styles.menuItemDanger]}>
        {label}
      </Text>
      {sublabel ? (
        <Text style={styles.menuItemSublabel} numberOfLines={1}>
          {sublabel}
        </Text>
      ) : null}
    </View>
    {rightEl !== undefined ? (
      rightEl
    ) : onPress ? (
      <ChevronRight color="#94a3b8" size={18} />
    ) : null}
  </TouchableOpacity>
);

// ─── Card Wrapper ─────────────────────────────────────────────────────────────
const MenuCard = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.menuCard}>{children}</View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
export const AccountSettingsScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const colors = useThemeColors();

  const [notifPickup, setNotifPickup] = useState(true);
  const [notifReward, setNotifReward] = useState(true);
  const [notifPromo, setNotifPromo] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(user?.name || '');
  const [savedName, setSavedName] = useState(user?.name || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const initials = savedName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleSaveName = () => {
    if (!tempName.trim()) return;
    setSavedName(tempName.trim());
    setEditingName(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action is permanent and cannot be undone. All your data, balance, and history will be removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => Alert.alert('Account deletion request submitted.'),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <ChevronLeft color="#121c28" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Account Settings</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Save success toast */}
        {saveSuccess && (
          <View style={styles.toast}>
            <Check color="#ffffff" size={16} />
            <Text style={styles.toastText}>Changes saved!</Text>
          </View>
        )}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatarRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View style={styles.avatarInfo}>
                <Text style={styles.avatarName}>{savedName}</Text>
                <Text style={styles.avatarRole}>Eco Member</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setTempName(savedName);
                  setEditingName(true);
                }}
                style={styles.editBtn}
              >
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
            </View>

            {editingName && (
              <View style={styles.editNameBox}>
                <Text style={styles.fieldLabel}>DISPLAY NAME</Text>
                <TextInput
                  value={tempName}
                  onChangeText={setTempName}
                  style={styles.nameInput}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleSaveName}
                />
                <View style={styles.editActions}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setEditingName(false)}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={handleSaveName}
                  >
                    <Text style={styles.saveBtnText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Contact Info */}
          <SectionHeader title="Contact Info" />
          <MenuCard>
            <MenuItem
              iconBg="#e0f2fe"
              icon={<Mail color="#0284c7" size={18} />}
              label="Email Address"
              sublabel={user?.email || 'budi.santoso@email.com'}
              onPress={() => {}}
            />
            <MenuItem
              iconBg="#fef3c7"
              icon={<Phone color="#b45309" size={18} />}
              label="Phone Number"
              sublabel="+62 812 3456 7890"
              onPress={() => {}}
            />
            <MenuItem
              iconBg="#ede9fe"
              icon={<MapPin color="#7c3aed" size={18} />}
              label="Home Address"
              sublabel="Jl. Kebon Jeruk No. 12, Jakarta"
              onPress={() => navigation.navigate('AddYourHome')}
              last
            />
          </MenuCard>

          {/* Notifications */}
          <SectionHeader title="Notifications" />
          <MenuCard>
            <MenuItem
              iconBg="#dcfce7"
              icon={<Bell color="#16a34a" size={18} />}
              label="Pickup Notifications"
              sublabel="Updates on your active pickups"
              rightEl={
                <Toggle
                  value={notifPickup}
                  onValueChange={setNotifPickup}
                />
              }
            />
            <MenuItem
              iconBg="#fef9c3"
              icon={<ShoppingBag color="#ca8a04" size={18} />}
              label="Reward Alerts"
              sublabel="When EcoCoins are added"
              rightEl={
                <Toggle
                  value={notifReward}
                  onValueChange={setNotifReward}
                />
              }
            />
            <MenuItem
              iconBg="#fce7f3"
              icon={<Tag color="#db2777" size={18} />}
              label="Promotions & Tips"
              sublabel="Eco tips and special offers"
              rightEl={
                <Toggle
                  value={notifPromo}
                  onValueChange={setNotifPromo}
                />
              }
              last
            />
          </MenuCard>

          {/* Security */}
          <SectionHeader title="Security" />
          <MenuCard>
            <MenuItem
              iconBg="#fff1f2"
              icon={<Lock color="#e11d48" size={18} />}
              label="Change Password"
              sublabel="Last changed 3 months ago"
              onPress={() => Alert.alert('Coming soon', 'Password change will be available in the next update.')}
            />
            <MenuItem
              iconBg="#f0fdf4"
              icon={<ShieldCheck color="#16a34a" size={18} />}
              label="Two-Factor Auth"
              sublabel="Protect your account"
              onPress={() => Alert.alert('Coming soon', '2FA will be available in the next update.')}
              last
            />
          </MenuCard>

          {/* Appearance */}
          <SectionHeader title="Appearance" />
          <MenuCard>
            <MenuItem
              iconBg="#f1f5f9"
              icon={<Moon color="#475569" size={18} />}
              label="Dark Mode"
              sublabel="Switch to dark theme"
              rightEl={
                <Toggle value={darkMode} onValueChange={setDarkMode} />
              }
              last
            />
          </MenuCard>

          {/* Account */}
          <SectionHeader title="Account" />
          <MenuCard>
            <MenuItem
              iconBg="#fff1f2"
              icon={<Trash2 color="#e11d48" size={18} />}
              label="Delete Account"
              sublabel="Permanently remove your data"
              onPress={handleDeleteAccount}
              danger
              last
            />
          </MenuCard>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9ff' },
  safeArea: { flex: 1 },
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
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#121c28',
  },
  toast: {
    position: 'absolute',
    top: 80,
    alignSelf: 'center',
    backgroundColor: '#006948',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    zIndex: 999,
    ...Platform.select({
      ios: {
        shadowColor: '#006948',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: { elevation: 8 },
    }),
  },
  toastText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  scroll: {
    paddingTop: spacing.lg,
  },
  // Profile Card
  profileCard: {
    marginHorizontal: spacing.lg,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#e8edf2',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#006948',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  avatarInfo: { flex: 1 },
  avatarName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#121c28',
    marginBottom: 2,
  },
  avatarRole: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  editBtn: {
    backgroundColor: '#e0f2f1',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  editBtnText: {
    color: '#006948',
    fontSize: 13,
    fontWeight: '700',
  },
  editNameBox: {
    marginTop: spacing.md,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#e8edf2',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 1,
    marginBottom: 8,
  },
  nameInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#006948',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: '500',
    color: '#121c28',
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#006948',
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  // Section
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
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
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
  menuItemLast: {
    borderBottomWidth: 0,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  menuItemText: { flex: 1, minWidth: 0 },
  menuItemLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#121c28',
  },
  menuItemDanger: { color: '#e11d48' },
  menuItemSublabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
});