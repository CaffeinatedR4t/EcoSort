import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Platform, 
  TextInput, 
  Switch 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { spacing } from '../../services/theme/spacing';
import { 
  Check, Mail, Phone, MapPin, Truck, CircleCheckBig, 
  Bell, ShoppingBag, Tag, ChevronRight, ArrowLeft 
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

const PToggle = ({ value, onValueChange }: { value: boolean; onValueChange: (v: boolean) => void }) => (
  <Switch
    value={value}
    onValueChange={onValueChange}
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
  const { user } = useAuthStore();
  
  const [notifJob, setNotifJob]         = useState(true);
  const [notifEarnings, setNotifEarnings] = useState(true);
  const [notifPromo, setNotifPromo]     = useState(false);
  const [editingName, setEditingName]   = useState(false);
  const [tempName, setTempName]         = useState(user?.name || '');
  const [savedName, setSavedName]       = useState(user?.name || '');
  const [saveSuccess, setSaveSuccess]   = useState(false);

  const driverId = user?.id
    ? 'ECO-' + user.id.replace(/-/g, '').slice(0, 4).toUpperCase()
    : 'ECO-0000';
  const initials = savedName
    .split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  const handleSaveName = () => {
    if (!tempName.trim()) return;
    setSavedName(tempName.trim());
    setEditingName(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top', 'left', 'right']} style={{ backgroundColor: WHITE }}>
        <View style={styles.screenHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft color={TEXT_BLACK} size={24} />
          </TouchableOpacity>
          <Text style={styles.screenHeaderTitle}>Account Settings</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {saveSuccess && (
          <View style={styles.toast}>
            <Check color={WHITE} size={14} />
            <Text style={styles.toastText}>Changes saved successfully!</Text>
          </View>
        )}

        {/* Profile mini-card */}
        <View style={[styles.profileCard, { marginTop: spacing.md }]}>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
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
                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveName}>
                  <Text style={styles.saveBtnText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Contact Info */}
        <PSectionLabel title="Contact Info" />
        <View style={styles.menuCard}>
          <PMenuItem iconBg="#e0f2fe" icon={<Mail color="#0284c7" size={18} />}
            label="Email Address" sublabel={user?.email || 'driver@ecosort.id'} onPress={() => {}} />
          <PMenuItem iconBg="#fef3c7" icon={<Phone color="#b45309" size={18} />}
            label="Phone Number" sublabel="+62 812 3456 7890" onPress={() => {}} />
          <PMenuItem iconBg="#ede9fe" icon={<MapPin color="#7c3aed" size={18} />}
            label="Operating Area" sublabel="Jakarta & surrounding" onPress={() => {}} last />
        </View>

        {/* Vehicle Info */}
        <PSectionLabel title="Vehicle Info" />
        <View style={styles.menuCard}>
          <PMenuItem iconBg="#e0f0ff" icon={<Truck color="#0284c7" size={18} />}
            label="Vehicle Type" sublabel="Pickup Truck (Standard)" onPress={() => {}} />
          <PMenuItem iconBg="#f0fdf4" icon={<CircleCheckBig color="#16a34a" size={18} />}
            label="License Plate" sublabel="B 1234 ECO" onPress={() => {}} last />
        </View>

        {/* Notifications */}
        <PSectionLabel title="Notifications" />
        <View style={styles.menuCard}>
          <PMenuItem iconBg="#dcfce7" icon={<Bell color="#16a34a" size={18} />}
            label="New Job Alerts" sublabel="When a pickup is available nearby"
            rightEl={<PToggle value={notifJob} onValueChange={setNotifJob} />} />
          <PMenuItem iconBg="#fef9c3" icon={<ShoppingBag color="#ca8a04" size={18} />}
            label="Earnings Updates" sublabel="When earnings are credited"
            rightEl={<PToggle value={notifEarnings} onValueChange={setNotifEarnings} />} />
          <PMenuItem iconBg="#fce7f3" icon={<Tag color="#db2777" size={18} />}
            label="Promotions & Tips" sublabel="Driver tips and special programs"
            rightEl={<PToggle value={notifPromo} onValueChange={setNotifPromo} />} last />
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9ff' },
  screenHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, backgroundColor: WHITE, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  screenHeaderTitle: { fontSize: 18, fontWeight: '800', color: TEXT_BLACK },
  scrollContent: { paddingBottom: spacing.xl },
  toast: { alignSelf: 'center', backgroundColor: PRIMARY, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingVertical: 9, borderRadius: 24, marginHorizontal: spacing.lg, marginBottom: spacing.sm, marginTop: spacing.md },
  toastText: { color: WHITE, fontSize: 13, fontWeight: '700' },
  
  // Menu Shared
  iconBox: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
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
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: PRIMARY, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 20, fontWeight: '800', color: WHITE },
  avatarName: { fontSize: 18, fontWeight: '800', color: TEXT_BLACK, marginBottom: 2 },
  avatarRole: { fontSize: 13, color: TEXT_SOFT, fontWeight: '600' },
  editBtn: { backgroundColor: PRIMARY_LIGHT, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  editBtnText: { color: PRIMARY, fontSize: 13, fontWeight: '700' },
  
  // Edit Name
  editNameBox: { marginTop: spacing.lg, backgroundColor: '#f8fafc', borderRadius: 16, padding: spacing.md, borderWidth: 1, borderColor: '#e2e8f0' },
  fieldLabel: { fontSize: 10, fontWeight: '800', color: '#94a3b8', letterSpacing: 1, marginBottom: 8 },
  nameInput: { backgroundColor: WHITE, borderWidth: 1.5, borderColor: PRIMARY, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontWeight: '600', color: TEXT_BLACK },
  editActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#cbd5e1', alignItems: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '700', color: TEXT_SOFT },
  saveBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: PRIMARY, alignItems: 'center' },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: WHITE },
});