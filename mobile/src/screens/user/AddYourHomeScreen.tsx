import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Platform, 
  StatusBar 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { 
  ChevronLeft, 
  Home, 
  MapPin, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react-native';
import { useThemeColors } from '../../hooks/useThemeColors';
import { spacing } from '../../services/theme/spacing';
import { Card } from '../../components/Card';

export const AddYourHomeScreen = () => {
  const navigation = useNavigation<any>();
  const colors = useThemeColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.primary }} edges={['top', 'left', 'right']}>
        <View style={{ flex: 1, backgroundColor: colors.white }}>
      
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
          <View style={[styles.heroIconBox, { backgroundColor: '#e1f5fe' }]}>
            <Home color="#03a9f4" size={48} />
          </View>
          <Text style={[styles.title, { color: colors.textBlack }]}>Add Your Home</Text>
          <Text style={[styles.subtitle, { color: colors.textBlackSoft }]}>
            Setup your primary pickup location for a seamless recycling experience.
          </Text>
        </View>

        {/* Steps Grid */}
        <View style={styles.stepsContainer}>
          <Card style={[styles.stepCard, { backgroundColor: '#F0F9F6', borderColor: 'transparent' }]}>
            <View style={[styles.stepIconCircle, { backgroundColor: colors.primary }]}>
              <MapPin color={colors.white} size={22} />
            </View>
            <View style={styles.stepInfo}>
              <Text style={[styles.stepTitle, { color: colors.textBlack }]}>1. Pin Your Address</Text>
              <Text style={[styles.stepText, { color: colors.textBlackSoft }]}>
                Precisely mark where our collectors should pick up your waste bags.
              </Text>
            </View>
          </Card>

          <Card style={[styles.stepCard, { backgroundColor: '#EEF4FF', borderColor: 'transparent' }]}>
            <View style={[styles.stepIconCircle, { backgroundColor: '#03a9f4' }]}>
              <CheckCircle2 color={colors.white} size={22} />
            </View>
            <View style={styles.stepInfo}>
              <Text style={[styles.stepTitle, { color: colors.textBlack }]}>2. Save for Later</Text>
              <Text style={[styles.stepText, { color: colors.textBlackSoft }]}>
                Your home address becomes the default for all future pickup requests.
              </Text>
            </View>
          </Card>

          <Card style={[styles.stepCard, { backgroundColor: '#F1F8E9', borderColor: 'transparent' }]}>
            <View style={[styles.stepIconCircle, { backgroundColor: '#8bc34a' }]}>
              <ShieldCheck color={colors.white} size={22} />
            </View>
            <View style={styles.stepInfo}>
              <Text style={[styles.stepTitle, { color: colors.textBlack }]}>3. Secure & Private</Text>
              <Text style={[styles.stepText, { color: colors.textBlackSoft }]}>
                We only share your location with assigned collectors when you request a pickup.
              </Text>
            </View>
          </Card>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Sticky Bottom Button */}
      <View style={[styles.footer, { paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.lg }]}>
        <TouchableOpacity 
          style={[styles.startBtn, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('SetHomeAddress')}
        >
          <Text style={styles.startBtnText}>Setup Home Address</Text>
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
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    lineHeight: 24,
    fontWeight: '500',
  },
  stepsContainer: {
    gap: spacing.md,
  },
  stepCard: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderRadius: 24,
    borderWidth: 0,
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  stepIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepInfo: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  stepText: {
    fontSize: 14,
    lineHeight: 20,
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
    fontSize: 18,
    fontWeight: '700',
  },
});
