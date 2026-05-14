import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  Alert, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  useWindowDimensions,
  Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../services/theme/colors';
import { spacing } from '../../services/theme/spacing';
import { Button } from '../../components/Button';
import { Logo } from '../../components/Logo';
import { supabase } from '../../services/api/supabase';

const layout = {
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  }
};

export const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { width } = useWindowDimensions();
  const navigation = useNavigation<any>();
  
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(20))[0];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const handleResetRequest = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'ecosort://reset-password',
      });

      if (error) throw error;
      
      Alert.alert(
        'Success', 
        'If an account exists for this email, you will receive a password reset link.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom', 'left', 'right']}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.content}>
            <Animated.View style={[
              styles.form, 
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
            ]}>
              <View style={styles.brandGroup}>
                <Logo size={70} style={styles.logo} />
                <Text style={styles.brandText}>EcoSort</Text>
              </View>

              <Text style={styles.title}>Reset Password</Text>
              <Text style={styles.subtitle}>Enter your email to receive a password reset link.</Text>

              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="What's your email?"
                placeholderTextColor={colors.textBlackSoft}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <Button 
                title={loading ? 'Sending...' : 'Send Reset Link'} 
                onPress={handleResetRequest} 
                loading={loading}
                style={styles.button}
              />
              
              <Button 
                title="Back to Login" 
                onPress={() => navigation.navigate('Login')} 
                variant="ghost"
                style={styles.switchBtn}
              />
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  content: {
    flexGrow: 1,
    padding: spacing.xl,
    justifyContent: 'center',
  },
  brandGroup: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logo: {
    marginBottom: -32,
    zIndex: 10,
  },
  brandText: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -1,
    zIndex: 1,
  },
  form: {
    width: '100%',
    backgroundColor: colors.white,
    padding: spacing.xl,
    borderRadius: 24,
    ...layout.cardShadow,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textBlack,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.textBlackSoft,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textBlack,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.ceramic,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.neutralCool,
    fontSize: 16,
  },
  button: {
    marginTop: spacing.xl,
  },
  switchBtn: {
    marginTop: spacing.md,
  },
});
