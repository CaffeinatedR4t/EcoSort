import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  Lock,
  ShieldCheck,
  UserCircle,
  Key,
  Check,
  Trash2,
  LogOut,
} from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { spacing } from '../../services/theme/spacing';

// ─── Helpers ──────────────────────────────────────────────────────────────────
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
  const { user, logout } = useAuthStore();

  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName]       = useState(user?.name || '');
  const [savedName, setSavedName]     = useState(user?.name || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const adminId = user?.id
    ? `ADM-${user.id.replace(/-/g, '').slice(0, 4).toUpperCase()}`
    : 'ADM-0000';

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

  const handleChangePassword = () => {
    Alert.alert(
      'Change Password',
      'A password reset link will be sent to your registered email address.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send Link', onPress: () => Alert.alert('Sent!', 'Check your email for the reset link.') },
      ]
    );
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
          <Text style={styles.headerTitle}>Account Settings</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Save toast */}
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
          {/* Profile card */}
          <View style={styles.profileCard}>
            <View style={styles.avatarRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
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
                  >
                    <Text style={styles.saveBtnText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Contact */}
          <SectionHeader title="Contact Info" />
          <MenuCard>
            <MenuItem
              iconBg="#e0f2fe"
              icon={<Mail color="#0284c7" size={18} />}
              label="Email Address"
              sublabel={user?.email || 'admin@ecosort.id'}
              onPress={() => {}}
            />
            <MenuItem
              iconBg="#fef3c7"
              icon={<Phone color="#b45309" size={18} />}
              label="Phone Number"
              sublabel="+62 812 0000 0000"
              onPress={() => {}}
              last
            />
          </MenuCard>

          {/* Role & Access */}
          <SectionHeader title="Role & Access" />
          <MenuCard>
            <MenuItem
              iconBg="#e0f2f1"
              icon={<ShieldCheck color="#006948" size={18} />}
              label="Current Role"
              sublabel="Super Admin — Full access"
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
              sublabel="Send reset link to your email"
              onPress={handleChangePassword}
            />
            <MenuItem
              iconBg="#f0fdf4"
              icon={<Key color="#16a34a" size={18} />}
              label="Two-Factor Authentication"
              sublabel="Add an extra layer of security"
              onPress={() =>
                Alert.alert('Coming soon', '2FA will be available in the next update.')
              }
            />
            <MenuItem
              iconBg="#fef3c7"
              icon={<LogOut color="#b45309" size={18} />}
              label="Revoke All Sessions"
              sublabel="Log out of all active devices"
              onPress={handleRevokeAccess}
              last
            />
          </MenuCard>

          {/* Danger zone */}
          <SectionHeader title="Danger Zone" />
          <MenuCard>
            <MenuItem
              iconBg="#fff1f2"
              icon={<Trash2 color="#ba1a1a" size={18} />}
              label="Delete Admin Account"
              sublabel="Permanently remove this account"
              onPress={() =>
                Alert.alert(
                  'Delete Account',
                  'This will permanently remove your admin access. This action cannot be undone.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => {} },
                  ]
                )
              }
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