import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Platform, 
  TextInput, 
  Switch,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { useNotificationPreferenceStore } from '../../store/notificationPreferenceStore';
import { spacing } from '../../services/theme/spacing';
import { ProfileAvatar } from '../../components/ProfileAvatar';
import { DeleteAccountModal } from '../../components/DeleteAccountModal';
import { pickAndUploadProfileAvatar } from '../../utils/profile';
import {
  Check, Mail, Phone, MapPin, Truck, CircleCheckBig,
  Bell, ShoppingBag, Tag, ChevronRight, ArrowLeft, Lock, ShieldCheck, Trash2, Pencil
} from 'lucide-react-native';

const PRIMARY = '#006948';
const PRIMARY_LIGHT = '#e6f4f0';
const TEXT_BLACK = '#0f172a';
const TEXT_SOFT = '#64748b';
const BORDER = '#f1f5f9';
const WHITE = '#ffffff';

// ─── Shared Profile Sub-components ───
const PIconBox = ({ bg, children }: { bg: string; children: React.ReactNode }) => (
  <View style={[styles.iconBox, { backgroundColor: bg }]}>{children}</View>
);

const PSectionLabel = ({ title }: { title: string }) => (
  <Text style={styles.sectionLabel}>{title}</Text>
);

const PToggle = ({
  value,
  onValueChange,
  disabled,
}: {
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
}) => (
  <Switch
    value={value}
    onValueChange={onValueChange}
    disabled={disabled}
    trackColor={{ false: '#e2e8f0', true: PRIMARY }}
    thumbColor={Platform.OS === 'android' ? WHITE : undefined}
    ios_backgroundColor="#e2e8f0"
  />
);

const PMenuItem = ({
  iconBg, icon, label, sublabel, rightEl, onPress, last, danger,
}: {
  iconBg: string; icon: React.ReactNode; label: string;
  sublabel?: string; rightEl?: React.ReactNode;
  onPress?: () => void; last?: boolean; danger?: boolean;
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={onPress ? 0.7 : 1}
    style={[styles.menuItem, last && styles.menuItemLast]}
  >
    <PIconBox bg={iconBg}>{icon}</PIconBox>
    <View style={styles.menuItemText}>
      <Text style={[styles.menuItemLabel, danger && { color: '#e11d48' }]}>{label}</Text>
      {sublabel ? <Text style={styles.menuItemSublabel} numberOfLines={1}>{sublabel}</Text> : null}
    </View>
    {rightEl !== undefined ? rightEl : onPress ? <ChevronRight color="#94a3b8" size={18} /> : null}
  </TouchableOpacity>
);

export const AccountSettingsScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user, session, updateProfile, deleteAccount } = useAuthStore();
  const {
    preferencesByUser,
    loading: loadingPreferences,
    saving: savingPreferences,
    fetchPreferences,
    updatePreference,
  } = useNotificationPreferenceStore();
  
  const [editingName, setEditingName]   = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [editingOperatingArea, setEditingOperatingArea] = useState(false);
  const [tempName, setTempName]         = useState(user?.name || '');
  const [tempPhone, setTempPhone]       = useState(user?.phone_number || '');
  const [tempOperatingArea, setTempOperatingArea] = useState(user?.operating_area || '');
  const [editingVehicle, setEditingVehicle] = useState(false);
  const [tempVehicleType, setTempVehicleType] = useState(user?.vehicle_type || '');
  const [tempVehiclePlate, setTempVehiclePlate] = useState(user?.vehicle_plate || '');
  const [savedName, setSavedName]       = useState(user?.name || '');
  const [saveSuccess, setSaveSuccess]   = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const driverId = user?.id
    ? 'ECO-' + user.id.replace(/-/g, '').slice(0, 4).toUpperCase()
    : 'ECO-0000';
  const accountEmail = session?.user?.email || user?.email || 'No email available';
  const notificationPreferences = user ? preferencesByUser[user.id] : undefined;
  const togglesDisabled = loadingPreferences || savingPreferences || !user;
  const vehicleType = user?.vehicle_type || 'Add vehicle type';
  const vehiclePlate = user?.vehicle_plate || 'Add license plate';
  const operatingArea = user?.operating_area || 'Add operating area';

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
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleSaveOperatingArea = async () => {
    setSavingProfile(true);
    const result = await updateProfile({ operating_area: tempOperatingArea.trim() || null });
    setSavingProfile(false);
    if (!result.success) {
      Alert.alert('Save failed', result.error || 'Unable to update your operating area.');
      return;
    }

    setEditingOperatingArea(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleSaveVehicle = async () => {
    setSavingProfile(true);
    const result = await updateProfile({
      vehicle_type: tempVehicleType.trim() || null,
      vehicle_plate: tempVehiclePlate.trim() || null,
    });
    setSavingProfile(false);
    if (!result.success) {
      Alert.alert('Save failed', result.error || 'Unable to update your vehicle info.');
      return;
    }

    setEditingVehicle(false);
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

  return (
    <View style={[styles.container, { backgroundColor: PRIMARY }]}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />
      <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: PRIMARY }}>
        <View style={styles.screenHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft color={TEXT_BLACK} size={24} />
          </TouchableOpacity>
          <Text style={styles.screenHeaderTitle}>Account Settings</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false} style={{ backgroundColor: '#ffffff' }}>
        {saveSuccess && (
          <View style={styles.toast}>
            <Check color={WHITE} size={14} />
            <Text style={styles.toastText}>Changes saved successfully!</Text>
          </View>
        )}

        {/* Profile mini-card */}
        <View style={[styles.profileCard, { marginTop: spacing.md }]}>
          <View style={styles.avatarRow}>
            <TouchableOpacity
              onPress={handlePickAvatar}
              activeOpacity={0.75}
              style={styles.avatarButton}
              accessibilityRole="button"
              accessibilityLabel="Edit profile picture"
            >
              <ProfileAvatar name={savedName} avatarUrl={user?.avatar_url} size={56} fallback="D" />
              <View style={styles.avatarEditBadge}>
                <Pencil color={WHITE} size={12} />
              </View>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.avatarName}>{savedName}</Text>
              <Text style={styles.avatarRole}>Eco Collector • {driverId}</Text>
            </View>
            <TouchableOpacity onPress={() => { setTempName(savedName); setEditingName(true); }} style={styles.editBtn}>
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
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditingName(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveName} disabled={savingProfile}>
                  <Text style={styles.saveBtnText}>{savingProfile ? 'Saving...' : 'Save'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Contact Info */}
        <PSectionLabel title="Contact Info" />
        <View style={styles.menuCard}>
          <PMenuItem iconBg="#e6f4f0" icon={<Mail color="#006948" size={18} />}
            label="Email Address" sublabel={accountEmail} />
          <PMenuItem iconBg="#e6f4f0" icon={<Phone color="#006948" size={18} />}
            label="Phone Number" sublabel={user?.phone_number || 'Add phone number'} onPress={() => { setTempPhone(user?.phone_number || ''); setEditingPhone(true); }} />
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
          <PMenuItem iconBg="#e6f4f0" icon={<MapPin color="#006948" size={18} />}
            label="Operating Area" sublabel={operatingArea} onPress={() => { setTempOperatingArea(user?.operating_area || ''); setEditingOperatingArea(true); }} last={!editingOperatingArea} />
          {editingOperatingArea && (
            <View style={styles.inlineEditBox}>
              <Text style={styles.fieldLabel}>OPERATING AREA</Text>
              <TextInput
                value={tempOperatingArea}
                onChangeText={setTempOperatingArea}
                style={styles.nameInput}
                autoFocus
                returnKeyType="done"
                placeholder="Jakarta Selatan, Depok, Bekasi"
                placeholderTextColor="#94a3b8"
                onSubmitEditing={handleSaveOperatingArea}
              />
              <View style={styles.editActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditingOperatingArea(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveOperatingArea} disabled={savingProfile}>
                  <Text style={styles.saveBtnText}>{savingProfile ? 'Saving...' : 'Save Area'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Vehicle Info */}
        <PSectionLabel title="Vehicle Info" />
        <View style={styles.menuCard}>
          <PMenuItem iconBg="#e6f4f0" icon={<Truck color="#006948" size={18} />}
            label="Vehicle Type" sublabel={vehicleType} onPress={() => { setTempVehicleType(user?.vehicle_type || ''); setTempVehiclePlate(user?.vehicle_plate || ''); setEditingVehicle(true); }} />
          <PMenuItem iconBg="#e6f4f0" icon={<CircleCheckBig color="#006948" size={18} />}
            label="License Plate" sublabel={vehiclePlate} onPress={() => { setTempVehicleType(user?.vehicle_type || ''); setTempVehiclePlate(user?.vehicle_plate || ''); setEditingVehicle(true); }} last={!editingVehicle} />
          {editingVehicle && (
            <View style={styles.inlineEditBox}>
              <Text style={styles.fieldLabel}>VEHICLE TYPE</Text>
              <TextInput
                value={tempVehicleType}
                onChangeText={setTempVehicleType}
                style={styles.nameInput}
                autoFocus
                returnKeyType="next"
                placeholder="Motorcycle, pickup truck, van"
                placeholderTextColor="#94a3b8"
              />
              <Text style={[styles.fieldLabel, { marginTop: 12 }]}>LICENSE PLATE</Text>
              <TextInput
                value={tempVehiclePlate}
                onChangeText={setTempVehiclePlate}
                style={styles.nameInput}
                autoCapitalize="characters"
                returnKeyType="done"
                placeholder="B 1234 ECO"
                placeholderTextColor="#94a3b8"
                onSubmitEditing={handleSaveVehicle}
              />
              <View style={styles.editActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditingVehicle(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveVehicle} disabled={savingProfile}>
                  <Text style={styles.saveBtnText}>{savingProfile ? 'Saving...' : 'Save Vehicle'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Notifications */}
        <PSectionLabel title="Notifications" />
        <View style={styles.menuCard}>
          <PMenuItem iconBg="#e6f4f0" icon={<Bell color="#006948" size={18} />}
            label="New Job Alerts" sublabel="When a pickup is available nearby"
            rightEl={<PToggle value={notificationPreferences?.pickup_enabled ?? true} onValueChange={(value) => handleTogglePreference('pickup_enabled', value)} disabled={togglesDisabled} />} />
          <PMenuItem iconBg="#e6f4f0" icon={<ShoppingBag color="#006948" size={18} />}
            label="Earnings Updates" sublabel="When earnings are credited"
            rightEl={<PToggle value={notificationPreferences?.reward_enabled ?? true} onValueChange={(value) => handleTogglePreference('reward_enabled', value)} disabled={togglesDisabled} />} />
          <PMenuItem iconBg="#e6f4f0" icon={<Tag color="#006948" size={18} />}
            label="Promotions & Tips" sublabel="Driver tips and special programs"
            rightEl={<PToggle value={notificationPreferences?.promo_enabled ?? false} onValueChange={(value) => handleTogglePreference('promo_enabled', value)} disabled={togglesDisabled} />} last />
        </View>

        {/* Security */}
        <PSectionLabel title="Security" />
        <View style={styles.menuCard}>
          <PMenuItem iconBg="#e6f4f0" icon={<Lock color="#006948" size={18} />}
            label="Change Password" sublabel="Update your login password"
            onPress={() => navigation.navigate('ChangePassword')} />
          <PMenuItem iconBg="#e6f4f0" icon={<ShieldCheck color="#006948" size={18} />}
            label="Two-Factor Auth" sublabel="Protect your account with an authenticator app"
            onPress={() => navigation.navigate('TwoFactorAuth')} last />
        </View>

        <PSectionLabel title="Account" />
        <View style={styles.menuCard}>
          <PMenuItem iconBg="#ffdad6" icon={<Trash2 color="#ba1a1a" size={18} />}
            label="Delete Account" sublabel="Permanently remove your data"
            onPress={() => setDeleteModalVisible(true)} danger last />
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>
      <DeleteAccountModal
        visible={deleteModalVisible}
        loading={deletingAccount}
        onCancel={() => setDeleteModalVisible(false)}
        onConfirm={handleDeleteAccount}
      />
    </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  screenHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, backgroundColor: WHITE, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  screenHeaderTitle: { fontSize: 18, fontWeight: '800', color: TEXT_BLACK },
  scrollContent: { paddingBottom: spacing.xl },
  toast: { alignSelf: 'center', backgroundColor: PRIMARY, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingVertical: 9, borderRadius: 24, marginHorizontal: spacing.lg, marginBottom: spacing.sm, marginTop: spacing.md },
  toastText: { color: WHITE, fontSize: 13, fontWeight: '700' },
  
  // Menu Shared
  iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: '#94a3b8', letterSpacing: 1.2, paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.sm },
  menuCard: { marginHorizontal: spacing.lg, backgroundColor: WHITE, borderRadius: 24, overflow: 'hidden', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 }, android: { elevation: 2 } }) },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: BORDER },
  menuItemLast: { borderBottomWidth: 0 },
  menuItemText: { flex: 1, minWidth: 0 },
  menuItemLabel: { fontSize: 16, fontWeight: '600', color: '#121c28' },
  menuItemSublabel: { fontSize: 13, color: TEXT_SOFT, marginTop: 2, fontWeight: '500' },

  // Profile Card
  profileCard: { marginHorizontal: spacing.lg, backgroundColor: WHITE, borderRadius: 24, padding: spacing.lg, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 }, android: { elevation: 2 } }) },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarButton: { width: 56, height: 56, position: 'relative' },
  avatarEditBadge: { position: 'absolute', right: -4, bottom: -4, width: 22, height: 22, borderRadius: 11, backgroundColor: PRIMARY, borderWidth: 2, borderColor: WHITE, justifyContent: 'center', alignItems: 'center' },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: PRIMARY, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 20, fontWeight: '800', color: WHITE },
  avatarName: { fontSize: 18, fontWeight: '800', color: TEXT_BLACK, marginBottom: 2 },
  avatarRole: { fontSize: 13, color: TEXT_SOFT, fontWeight: '600' },
  editBtn: { backgroundColor: PRIMARY_LIGHT, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  editBtnText: { color: PRIMARY, fontSize: 13, fontWeight: '700' },
  
  // Edit Name
  editNameBox: { marginTop: spacing.lg, backgroundColor: '#f8fafc', borderRadius: 16, padding: spacing.md, borderWidth: 1, borderColor: '#e2e8f0' },
  inlineEditBox: { backgroundColor: '#f8fafc', padding: spacing.md, borderTopWidth: 1, borderTopColor: BORDER },
  fieldLabel: { fontSize: 10, fontWeight: '800', color: '#94a3b8', letterSpacing: 1, marginBottom: 8 },
  nameInput: { backgroundColor: WHITE, borderWidth: 1.5, borderColor: PRIMARY, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontWeight: '600', color: TEXT_BLACK },
  editActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#cbd5e1', alignItems: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '700', color: TEXT_SOFT },
  saveBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: PRIMARY, alignItems: 'center' },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: WHITE },
});
