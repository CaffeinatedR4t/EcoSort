import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  StatusBar,
  Switch,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  Bell,
  ShoppingBag,
  Tag,
  Lock,
  ShieldCheck,
  UserCircle,
  Key,
  Check,
  Trash2,
  LogOut,
  Pencil,
} from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { useNotificationPreferenceStore } from '../../store/notificationPreferenceStore';
import { spacing } from '../../services/theme/spacing';
import { ProfileAvatar } from '../../components/ProfileAvatar';
import { DeleteAccountModal } from '../../components/DeleteAccountModal';
import { pickAndUploadProfileAvatar } from '../../utils/profile';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const SectionHeader = ({ title }: { title: string }) => (
  <Text style={styles.sectionHeader}>{title}</Text>
);

const MenuCard = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.menuCard}>{children}</View>
);

const Toggle = ({
  value,
  onValueChange,
  disabled,
}: {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}) => (
  <Switch
    value={value}
    onValueChange={onValueChange}
    disabled={disabled}
    trackColor={{ false: '#cbd5e1', true: '#006948' }}
    thumbColor={Platform.OS === 'android' ? '#ffffff' : undefined}
    ios_backgroundColor="#cbd5e1"
  />
);

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
    <View style={[styles.iconBox, { backgroundColor: iconBg }]}>{icon}</View>
    <View style={styles.menuItemText}>
      <Text style={[styles.menuItemLabel, danger && { color: '#ba1a1a' }]}>
        {label}
      </Text>
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
export const AdminAccountSettingsScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user, session, logout, updateProfile, deleteAccount } = useAuthStore();
  const {
    preferencesByUser,
    loading: loadingPreferences,
    saving: savingPreferences,
    fetchPreferences,
    updatePreference,
  } = useNotificationPreferenceStore();

  const [editingName, setEditingName] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [tempName, setTempName]       = useState(user?.name || '');
  const [tempPhone, setTempPhone]     = useState(user?.phone_number || '');
  const [savedName, setSavedName]     = useState(user?.name || '');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveMessage, setSaveMessage] = useState('Changes saved!');
  const [savingProfile, setSavingProfile] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const adminId = user?.id
    ? `ADM-${user.id.replace(/-/g, '').slice(0, 4).toUpperCase()}`
    : 'ADM-0000';
  const accountEmail = session?.user?.email || user?.email || 'No email available';
  const notificationPreferences = user ? preferencesByUser[user.id] : undefined;
  const togglesDisabled = loadingPreferences || savingPreferences || !user;

  useEffect(() => {
    if (user?.id) {
      fetchPreferences(user.id).catch((error) => {
        Alert.alert('Notifications unavailable', error?.message || 'Unable to load notification settings.');
      });
    }
  }, [fetchPreferences, user?.id]);

  const handleTogglePreference = async (
    key: 'pickup_enabled' | 'reward_enabled' | 'promo_enabled' | 'system_enabled',
    value: boolean
  ) => {
    if (!user) return;
    const result = await updatePreference(user.id, key, value);
    if (!result.success) {
      Alert.alert('Save failed', result.error || 'Unable to update notification settings.');
    }
  };

  const handleSaveName = async () => {
    const nextName = tempName.trim();
    if (!nextName) return;

    setSavingProfile(true);
    const result = await updateProfile({
      name: nextName,
    });
    setSavingProfile(false);
    if (!result.success) {
      Alert.alert('Save failed', result.error || 'Unable to update your profile.');
      return;
    }

    setSavedName(nextName);
    setEditingName(false);
    setSaveMessage(result.offline ? 'Saved offline. Will sync when online.' : 'Changes saved!');
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleSavePhone = async () => {
    setSavingProfile(true);
    const result = await updateProfile({ phone_number: tempPhone.trim() || null });
    setSavingProfile(false);
    if (!result.success) {
      Alert.alert('Save failed', result.error || 'Unable to update your phone number.');
      return;
    }

    setEditingPhone(false);
    setSaveMessage(result.offline ? 'Saved offline. Will sync when online.' : 'Changes saved!');
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handlePickAvatar = async () => {
    if (!user) return;
    const avatarUrl = await pickAndUploadProfileAvatar(user.id);
    if (!avatarUrl) return;

    const result = await updateProfile({ avatar_url: avatarUrl });
    if (!result.success) {
      Alert.alert('Save failed', result.error || 'Unable to update your profile picture.');
    }
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    const result = await deleteAccount();
    setDeletingAccount(false);

    if (!result.success) {
      Alert.alert('Delete failed', result.error || 'Unable to delete your account.');
      return;
    }

    setDeleteModalVisible(false);
  };

  const handleRevokeAccess = () => {
    Alert.alert(
      'Revoke All Sessions',
      'This will log you out of all devices. You will need to log in again.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Revoke', style: 'destructive', onPress: logout },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: '#006948' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#006948" />
      <SafeAreaView style={{ flex: 1, backgroundColor: '#006948' }} edges={['top', 'left', 'right']}>
        <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
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

        {/* Save toast */}
        {saveSuccess && (
          <View style={styles.toast}>
            <Check color="#ffffff" size={16} />
            <Text style={styles.toastText}>{saveMessage}</Text>
          </View>
        )}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
          style={{ backgroundColor: '#ffffff' }}
        >
          {/* Profile card */}
          <View style={styles.profileCard}>
            <View style={styles.avatarRow}>
              <TouchableOpacity
                onPress={handlePickAvatar}
                activeOpacity={0.75}
                style={styles.avatarButton}
                accessibilityRole="button"
                accessibilityLabel="Edit profile picture"
              >
                <ProfileAvatar name={savedName} avatarUrl={user?.avatar_url} size={60} fallback="A" />
                <View testID="admin-avatar-edit-badge" style={styles.avatarEditBadge} pointerEvents="none">
                  <Pencil color="#ffffff" size={12} />
                </View>
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={styles.avatarName}>{savedName}</Text>
                <View style={styles.roleBadge}>
                  <ShieldCheck color="#006948" size={12} />
                  <Text style={styles.roleBadgeText}>
                    Administrator • {adminId}
                  </Text>
                </View>
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
                    disabled={savingProfile}
                  >
                    <Text style={styles.saveBtnText}>{savingProfile ? 'Saving...' : 'Save'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Contact */}
          <SectionHeader title="Contact Info" />
          <MenuCard>
            <MenuItem
              iconBg="#e6f4f0"
              icon={<Mail color="#006948" size={18} />}
              label="Email Address"
              sublabel={accountEmail}
            />
            <MenuItem
              iconBg="#e6f4f0"
              icon={<Phone color="#006948" size={18} />}
              label="Phone Number"
              sublabel={user?.phone_number || 'Add phone number'}
              onPress={() => {
                setTempPhone(user?.phone_number || '');
                setEditingPhone(true);
              }}
              last
            />
            {editingPhone && (
              <View style={styles.inlineEditBox}>
                <Text style={styles.fieldLabel}>PHONE NUMBER</Text>
                <TextInput
                  value={tempPhone}
                  onChangeText={setTempPhone}
                  style={styles.nameInput}
                  keyboardType="phone-pad"
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleSavePhone}
                />
                <View style={styles.editActions}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditingPhone(false)}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveBtn} onPress={handleSavePhone} disabled={savingProfile}>
                    <Text style={styles.saveBtnText}>{savingProfile ? 'Saving...' : 'Save'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </MenuCard>

          {/* Role & Access */}
          <SectionHeader title="Role & Access" />
          <MenuCard>
            <MenuItem
              iconBg="#e6f4f0"
              icon={<ShieldCheck color="#006948" size={18} />}
              label="Current Role"
              sublabel="Super Admin — Full access"
              last
            />
          </MenuCard>

          {/* Notifications */}
          <SectionHeader title="Notifications" />
          <MenuCard>
            <MenuItem
              iconBg="#e6f4f0"
              icon={<Bell color="#006948" size={18} />}
              label="Pickup Notifications"
              sublabel="New pickup and route updates"
              rightEl={<Toggle value={notificationPreferences?.pickup_enabled ?? true} onValueChange={(value) => handleTogglePreference('pickup_enabled', value)} disabled={togglesDisabled} />}
            />
            <MenuItem
              iconBg="#e6f4f0"
              icon={<ShoppingBag color="#006948" size={18} />}
              label="Reward Alerts"
              sublabel="Reward approval and payout updates"
              rightEl={<Toggle value={notificationPreferences?.reward_enabled ?? true} onValueChange={(value) => handleTogglePreference('reward_enabled', value)} disabled={togglesDisabled} />}
            />
            <MenuItem
              iconBg="#e6f4f0"
              icon={<Tag color="#006948" size={18} />}
              label="Promotions & Tips"
              sublabel="EcoSort tips and special programs"
              rightEl={<Toggle value={notificationPreferences?.promo_enabled ?? false} onValueChange={(value) => handleTogglePreference('promo_enabled', value)} disabled={togglesDisabled} />}
              last
            />
          </MenuCard>

          {/* Security */}
          <SectionHeader title="Security" />
          <MenuCard>
            <MenuItem
              iconBg="#e6f4f0"
              icon={<Lock color="#006948" size={18} />}
              label="Change Password"
              sublabel="Update your login password"
              onPress={() => navigation.navigate('ChangePassword')}
            />
            <MenuItem
              iconBg="#e6f4f0"
              icon={<Key color="#006948" size={18} />}
              label="Two-Factor Authentication"
              sublabel="Protect your account with an authenticator app"
              onPress={() => navigation.navigate('TwoFactorAuth')}
            />
            <MenuItem
              iconBg="#ffdad6"
              icon={<LogOut color="#ba1a1a" size={18} />}
              label="Revoke All Sessions"
              sublabel="Log out of all active devices"
              onPress={handleRevokeAccess}
              danger
              last
            />
          </MenuCard>

          {/* Danger zone */}
          <SectionHeader title="Danger Zone" />
          <MenuCard>
            <MenuItem
              iconBg="#ffdad6"
              icon={<Trash2 color="#ba1a1a" size={18} />}
              label="Delete Admin Account"
              sublabel="Permanently remove this account"
              onPress={() => setDeleteModalVisible(true)}
              danger
              last
            />
          </MenuCard>

          <View style={{ height: 40 }} />
        </ScrollView>
        <DeleteAccountModal
          visible={deleteModalVisible}
          loading={deletingAccount}
          onCancel={() => setDeleteModalVisible(false)}
          onConfirm={handleDeleteAccount}
        />
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  safeArea: { flex: 1, backgroundColor: '#ffffff' },
  scroll: { paddingTop: spacing.lg, backgroundColor: '#ffffff' },
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
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#121c28' },
  toast: {
    position: 'absolute',
    top: 72,
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
      ios: { shadowColor: '#006948', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 8 },
    }),
  },
  toastText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
  scroll: { paddingTop: spacing.lg },
  profileCard: {
    marginHorizontal: spacing.lg,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#e8edf2',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarButton: {
    width: 60,
    height: 60,
    position: 'relative',
    overflow: 'visible',
  },
  avatarEditBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#006948',
    borderWidth: 2,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
    ...Platform.select({
      android: { elevation: 6 },
    }),
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#006948',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: '800', color: '#ffffff' },
  avatarName: { fontSize: 16, fontWeight: '700', color: '#121c28', marginBottom: 4 },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#e0f2f1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  roleBadgeText: { fontSize: 11, fontWeight: '700', color: '#006948' },
  editBtn: {
    backgroundColor: '#e0f2f1',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  editBtnText: { color: '#006948', fontSize: 13, fontWeight: '700' },
  editNameBox: {
    marginTop: spacing.md,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#e8edf2',
  },
  inlineEditBox: {
    backgroundColor: '#ffffff',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
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
  editActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  saveBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#006948',
    alignItems: 'center',
  },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: '#ffffff' },
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
});
