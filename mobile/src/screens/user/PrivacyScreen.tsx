import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  StatusBar 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { 
  ChevronLeft, 
  ShieldCheck, 
  Lock, 
  Eye, 
  MapPin, 
  Smartphone,
  CheckCircle2
} from 'lucide-react-native';
import { useThemeColors } from '../../hooks/useThemeColors';
import { spacing } from '../../services/theme/spacing';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';

export const PrivacyScreen = () => {
  const navigation = useNavigation<any>();
  const colors = useThemeColors();

  const sections = [
    {
      title: 'Identity & Data',
      desc: 'We store your email and name to manage your wallet and reward history. Your data is encrypted and never sold to third parties.',
      icon: <Lock color="#2196f3" size={24} />,
      bg: '#e3f2fd'
    },
    {
      title: 'Location Services',
      desc: 'We use your location only when you request a pickup. This helps our collectors find you accurately. You can disable this in settings anytime.',
      icon: <MapPin color="#4caf50" size={24} />,
      bg: '#e8f5e9'
    },
    {
      title: 'AI Image Processing',
      desc: 'Photos taken during scanning are processed by Gemini AI to classify waste. We do not store personal identifiable information from these photos.',
      icon: <Eye color="#ff9800" size={24} />,
      bg: '#fff3e0'
    },
    {
      title: 'Wallet Safety',
      desc: 'Your balance represents real-world rewards. For withdrawals, we securely process bank details and only store what is necessary for the transaction.',
      icon: <ShieldCheck color="#673ab7" size={24} />,
      bg: '#f3e5f5'
    }
  ];

  return (
    <View style={[styles.container, { backgroundColor: '#006948' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#006948" />
      <SafeAreaView style={{ flex: 1, backgroundColor: '#006948' }} edges={['top', 'left', 'right']}>
        <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft color={colors.textBlack} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Data & Privacy</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <View style={[styles.heroIconBox, { backgroundColor: '#e0f2f1' }]}>
            <ShieldCheck color="#006948" size={48} />
          </View>
          <Text style={styles.heroTitle}>Your Privacy Matters</Text>
          <Text style={styles.heroSubtitle}>
            At EcoSort, we are committed to protecting your data while making the planet greener.
          </Text>
        </View>

        <View style={styles.sectionsContainer}>
          {sections.map((item, index) => (
            <Card key={index} style={styles.infoCard}>
              <View style={[styles.iconBox, { backgroundColor: item.bg }]}>
                {item.icon}
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.sectionTitle}>{item.title}</Text>
                <Text style={styles.sectionDesc}>{item.desc}</Text>
              </View>
            </Card>
          ))}
        </View>

        <View style={styles.footer}>
          <View style={styles.trustBadge}>
            <CheckCircle2 color="#006948" size={20} />
            <Text style={styles.trustText}>Verified Secure System</Text>
          </View>
          <Button 
            title="I Understand" 
            onPress={() => navigation.goBack()} 
            style={styles.actionBtn}
          />
          <Text style={styles.versionText}>Version 1.0.0 • Last updated May 2026</Text>
        </View>
      </ScrollView>
        </View>
    </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  scrollContent: {
    padding: spacing.lg,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingVertical: spacing.lg,
  },
  heroIconBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.xl,
  },
  sectionsContainer: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  infoCard: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderRadius: 20,
    gap: spacing.lg,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  sectionDesc: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },
  footer: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.lg,
    backgroundColor: '#f1f8e9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  trustText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#006948',
  },
  actionBtn: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  versionText: {
    fontSize: 12,
    color: '#94a3b8',
  }
});
