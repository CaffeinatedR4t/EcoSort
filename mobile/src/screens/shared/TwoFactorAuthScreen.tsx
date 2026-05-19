import React, { useEffect, useState } from 'react';
import {
  Alert,
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
import { SvgXml } from 'react-native-svg';
import { ChevronLeft, ShieldCheck } from 'lucide-react-native';
import { supabase } from '../../services/api/supabase';
import { spacing } from '../../services/theme/spacing';

type TotpFactor = {
  id: string;
  status?: string;
  friendly_name?: string;
};

const qrXmlFromSupabase = (qrCode?: string) => {
  if (!qrCode) return '';
  if (qrCode.startsWith('data:image/svg+xml;utf8,')) {
    return decodeURIComponent(qrCode.replace('data:image/svg+xml;utf8,', ''));
  }
  return qrCode;
};

export const TwoFactorAuthScreen = () => {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [factor, setFactor] = useState<TotpFactor | null>(null);
  const [pendingFactorId, setPendingFactorId] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');

  const loadFactors = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.mfa.listFactors();
    setLoading(false);

    if (error) {
      Alert.alert('Unable to load 2FA', error.message);
      return;
    }

    const verifiedTotp = data?.totp?.find((item: TotpFactor) => item.status === 'verified') || null;
    setFactor(verifiedTotp);
  };

  useEffect(() => {
    loadFactors();
  }, []);

  const handleStartEnrollment = async () => {
    setEnrolling(true);
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'EcoSort Authenticator',
    } as any);
    setEnrolling(false);

    if (error) {
      Alert.alert('Unable to start 2FA', error.message);
      return;
    }

    setPendingFactorId(data.id);
    setQrCode(qrXmlFromSupabase(data.totp?.qr_code));
    setSecret(data.totp?.secret || '');
  };

  const handleVerifyEnrollment = async () => {
    if (!pendingFactorId || !code.trim()) {
      Alert.alert('Verification code required', 'Enter the 6-digit code from your authenticator app.');
      return;
    }

    setVerifying(true);
    const challenge = await supabase.auth.mfa.challenge({ factorId: pendingFactorId });
    if (challenge.error) {
      setVerifying(false);
      Alert.alert('Verification failed', challenge.error.message);
      return;
    }

    const verify = await supabase.auth.mfa.verify({
      factorId: pendingFactorId,
      challengeId: challenge.data.id,
      code: code.trim(),
    });
    setVerifying(false);

    if (verify.error) {
      Alert.alert('Verification failed', verify.error.message);
      return;
    }

    setCode('');
    setPendingFactorId('');
    setQrCode('');
    setSecret('');
    await loadFactors();
    Alert.alert('Two-factor enabled', 'Your account is now protected with an authenticator app.');
  };

  const handleDisable = () => {
    if (!factor) return;

    Alert.alert('Disable Two-Factor Auth', 'Remove authenticator protection from this account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disable',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
          if (error) {
            Alert.alert('Unable to disable 2FA', error.message);
            return;
          }
          setFactor(null);
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ChevronLeft color="#121c28" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Two-Factor Auth</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" style={{ backgroundColor: '#ffffff' }}>
          <View style={styles.iconCircle}>
            <ShieldCheck color="#006948" size={28} />
          </View>

          <Text style={styles.title}>Authenticator app</Text>
          <Text style={styles.subtitle}>
            Add a second verification step using a 6-digit code from your authenticator app.
          </Text>

          <View style={styles.statusCard}>
            <Text style={styles.statusLabel}>STATUS</Text>
            <Text style={styles.statusValue}>
              {loading ? 'Checking...' : factor ? 'Enabled' : 'Not enabled'}
            </Text>
          </View>

          {!factor && !pendingFactorId ? (
            <TouchableOpacity style={styles.primaryBtn} onPress={handleStartEnrollment} disabled={enrolling || loading}>
              <Text style={styles.primaryBtnText}>{enrolling ? 'Starting...' : 'Set Up Two-Factor Auth'}</Text>
            </TouchableOpacity>
          ) : null}

          {pendingFactorId ? (
            <View style={styles.enrollCard}>
              {qrCode ? <SvgXml xml={qrCode} width={220} height={220} style={styles.qr} /> : null}
              {secret ? (
                <>
                  <Text style={styles.secretLabel}>MANUAL SETUP KEY</Text>
                  <Text selectable style={styles.secretText}>{secret}</Text>
                </>
              ) : null}

              <Text style={styles.label}>VERIFICATION CODE</Text>
              <TextInput
                value={code}
                onChangeText={setCode}
                style={styles.input}
                keyboardType="number-pad"
                maxLength={6}
                placeholder="123456"
                placeholderTextColor="#94a3b8"
              />

              <TouchableOpacity style={styles.primaryBtn} onPress={handleVerifyEnrollment} disabled={verifying}>
                <Text style={styles.primaryBtnText}>{verifying ? 'Verifying...' : 'Enable Two-Factor Auth'}</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {factor ? (
            <TouchableOpacity style={styles.dangerBtn} onPress={handleDisable}>
              <Text style={styles.dangerBtnText}>Disable Two-Factor Auth</Text>
            </TouchableOpacity>
          ) : null}
        </ScrollView>
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
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#e0f2f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: { fontSize: 22, fontWeight: '800', color: '#121c28', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#64748b', lineHeight: 20, marginBottom: spacing.lg },
  statusCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#e8edf2',
    marginBottom: spacing.lg,
  },
  statusLabel: { fontSize: 11, fontWeight: '800', color: '#64748b', letterSpacing: 1 },
  statusValue: { fontSize: 18, fontWeight: '800', color: '#121c28', marginTop: 4 },
  enrollCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#e8edf2',
  },
  qr: { alignSelf: 'center', marginBottom: spacing.md },
  secretLabel: { fontSize: 11, fontWeight: '800', color: '#64748b', letterSpacing: 1 },
  secretText: {
    color: '#121c28',
    fontSize: 13,
    fontWeight: '700',
    backgroundColor: '#f8fafc',
    padding: spacing.sm,
    borderRadius: 10,
    marginTop: 6,
    marginBottom: spacing.md,
  },
  label: { fontSize: 11, fontWeight: '800', color: '#64748b', letterSpacing: 1, marginBottom: 8 },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 18,
    color: '#121c28',
    textAlign: 'center',
    letterSpacing: 3,
  },
  primaryBtn: {
    backgroundColor: '#006948',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  primaryBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
  dangerBtn: {
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.md,
    ...Platform.select({ android: { elevation: 1 } }),
  },
  dangerBtnText: { color: '#e11d48', fontSize: 15, fontWeight: '800' },
});
