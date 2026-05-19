import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Platform, 
  useWindowDimensions, 
  StatusBar 
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { 
  ChevronLeft, 
  User, 
  ScanLine, 
  Recycle, 
  Coins, 
  Camera, 
  MapPin, 
  ArrowRight,
  Sprout
} from 'lucide-react-native';
import { useThemeColors } from '../../hooks/useThemeColors';
import { spacing } from '../../services/theme/spacing';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';

export const GetStartedScreen = () => {
  const navigation = useNavigation<any>();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.primary }} edges={['top', 'left', 'right']}>
        <View style={{ flex: 1, backgroundColor: colors.background }}>
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft color={colors.textBlack} size={28} />
        </TouchableOpacity>
        
        <Text style={[styles.logoText, { color: colors.primary }]}>EcoSort</Text>
        
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={[styles.heroIconBox, { backgroundColor: colors.primary }]}>
            <View style={styles.heroIconInner}>
              <Recycle color={colors.white} size={40} />
            </View>
          </View>
          <Text style={[styles.title, { color: colors.textBlack }]}>Get Started</Text>
          <Text style={[styles.subtitle, { color: colors.textBlackSoft }]}>
            Your simple guide to mastering recycling and earning rewards.
          </Text>
        </View>

        {/* Steps Grid */}
        <View style={styles.stepsContainer}>
          {/* Step 1 - Full Width */}
          <Card style={[styles.stepCardFull, { backgroundColor: '#F0F9F6', borderColor: 'transparent' }]}>
            <View style={[styles.stepIconCircle, { backgroundColor: colors.primary }]}>
              <ScanLine color={colors.white} size={22} />
            </View>
            <Text style={[styles.stepTitle, { color: colors.textBlack }]}>1. Scan Items</Text>
            <Text style={[styles.stepText, { color: colors.textBlackSoft }]}>
              Point your camera at any trash. Our AI instantly identifies the material and tells you which bin it belongs in.
            </Text>
          </Card>

          {/* Steps 2 & 3 - Side by Side */}
          <View style={styles.stepsRow}>
            <Card style={[styles.stepCardHalf, { backgroundColor: '#EEF4FF', borderColor: 'transparent' }]}>
              <View style={[styles.stepIconCircle, { backgroundColor: '#40C2FD' }]}>
                <Recycle color={colors.white} size={18} />
              </View>
              <Text style={[styles.stepTitle, { color: colors.textBlack }]}>2. Sort Right</Text>
              <Text style={[styles.stepText, { color: colors.textBlackSoft }]}>
                Follow the color-coded bin guides.
              </Text>
            </Card>

            <Card style={[styles.stepCardHalf, { backgroundColor: '#FFEDD5', borderColor: 'transparent' }]}>
              <View style={[styles.stepIconCircle, { backgroundColor: '#825100' }]}>
                <Coins color={colors.white} size={18} />
              </View>
              <Text style={[styles.stepTitle, { color: colors.textBlack }]}>3. Get Rewarded</Text>
              <Text style={[styles.stepText, { color: colors.textBlackSoft }]}>
                Collect EcoCoins for every good deed.
              </Text>
            </Card>
          </View>
        </View>

        {/* Common Issues Section */}
        <View style={styles.issuesSection}>
          <Text style={[styles.issuesTitle, { color: colors.textBlack }]}>Common Issues</Text>
          
          <Card style={[styles.issueCard, { backgroundColor: colors.white, borderColor: '#E5E7EB' }]}>
            <View style={styles.issueHeader}>
              <Camera color={colors.primary} size={20} />
              <Text style={[styles.issueTitleText, { color: colors.textBlack }]}>Camera not working?</Text>
            </View>
            <Text style={[styles.issueText, { color: colors.textBlackSoft }]}>
              Ensure EcoSort has camera permissions in your device settings. Try restarting the app if the issue persists.
            </Text>
          </Card>

          <Card style={[styles.issueCard, { backgroundColor: colors.white, borderColor: '#E5E7EB' }]}>
            <View style={styles.issueHeader}>
              <MapPin color={colors.primary} size={20} />
              <Text style={[styles.issueTitleText, { color: colors.textBlack }]}>Can't find a bin?</Text>
            </View>
            <Text style={[styles.issueText, { color: colors.textBlackSoft }]}>
              Use the 'Map' feature in the Bins tab to locate verified public recycling and compost bins near you.
            </Text>
          </Card>
        </View>

        {/* Padding for sticky button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky Bottom Button */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.xl) }]}>
        <TouchableOpacity 
          style={[styles.startBtn, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('Scan')}
        >
          <Text style={styles.startBtnText}>Start Scanning</Text>
          <ArrowRight color={colors.white} size={20} />
        </TouchableOpacity>
      </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  logoText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  iconBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: spacing.lg,
  },
  heroSection: {
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  heroIconBox: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  heroIconInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    lineHeight: 26,
    fontWeight: '500',
  },
  stepsContainer: {
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  stepCardFull: {
    padding: spacing.xl,
    borderRadius: 24,
    borderWidth: 0,
  },
  stepsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  stepCardHalf: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: 24,
    borderWidth: 0,
    minHeight: 200,
  },
  stepIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  stepText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '400',
  },
  issuesSection: {
    marginBottom: spacing.xl,
  },
  issuesTitle: {
    fontSize: 34,
    fontWeight: '800',
    marginBottom: spacing.lg,
  },
  issueCard: {
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
  },
  issueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  issueTitleText: {
    fontSize: 18,
    fontWeight: '700',
  },
  issueText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '400',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingTop: spacing.md,
  },
  startBtn: {
    flexDirection: 'row',
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: '#006948',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  startBtnText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
});
