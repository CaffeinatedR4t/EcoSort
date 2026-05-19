import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Lock } from 'lucide-react-native';
import { supabase } from '../../services/api/supabase';
import { spacing } from '../../services/theme/spacing';

export const ChangePasswordScreen = () => {
  const navigation = useNavigation<any>();
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleUpdatePassword = async () => {
    if (!currentPassword || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({
      password,
      currentPassword,
    } as any);
    setSaving(false);

    if (error) {
      Alert.alert('Update failed', error.message || 'Unable to update password.');
      return;
    }

    Alert.alert('Password updated', 'Your password has been changed successfully.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: '#006948' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#006948" />
      <SafeAreaView style={{ flex: 1, backgroundColor: '#006948' }} edges={['top', 'left', 'right']}>
        <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ChevronLeft color="#121c28" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Change Password</Text>
          <View style={{ width: 40 }} />
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: '#ffffff' }}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.iconCircle}>
              <Lock color="#006948" size={26} />
            </View>

            <Text style={styles.title}>Update your password</Text>
            <Text style={styles.subtitle}>Use your current password to confirm this account change.</Text>

            <Text style={styles.label}>CURRENT PASSWORD</Text>
            <TextInput
              value={currentPassword}
              onChangeText={setCurrentPassword}
              style={styles.input}
              secureTextEntry
              placeholder="Current password"
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.label}>NEW PASSWORD</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              secureTextEntry
              placeholder="New password"
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.label}>CONFIRM NEW PASSWORD</Text>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              style={styles.input}
              secureTextEntry
              placeholder="Confirm new password"
              placeholderTextColor="#94a3b8"
            />

            <TouchableOpacity
              style={[styles.primaryBtn, saving && styles.disabledBtn]}
              onPress={handleUpdatePassword}
              disabled={saving}
            >
              <Text style={styles.primaryBtnText}>{saving ? 'Updating...' : 'Update Password'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#121c28' },
  content: { padding: spacing.lg },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e0f2f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: { fontSize: 22, fontWeight: '800', color: '#121c28', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#64748b', lineHeight: 20, marginBottom: spacing.xl },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#121c28',
  },
  primaryBtn: {
    backgroundColor: '#006948',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  disabledBtn: { opacity: 0.6 },
  primaryBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
});
