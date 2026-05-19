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
  Animated,
  TouchableOpacity
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

export const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      console.log('Attempting sign in for:', email);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        throw error;
      }
    } catch (error: any) {
      console.error('Final catch error:', error);
      Alert.alert('Error', error.message || 'An unknown error occurred');
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
                <Logo size={70} style={styles.logo} color={null} />
                <Text style={styles.brandText}>EcoSort</Text>
              </View>

              <Text style={styles.title}>Log in to track your impact</Text>

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

              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor={colors.textBlackSoft}
                secureTextEntry
              />

              <TouchableOpacity 
                style={styles.forgotBtn}
                onPress={() => navigation.navigate('ForgotPassword')}
              >
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>

              <Button 
                title={loading ? 'Processing...' : 'Sign In'} 
                onPress={handleSignIn} 
                loading={loading}
                style={styles.button}
              />
              
              <Button 
                title="New to EcoSort? Join Now" 
                onPress={() => navigation.navigate('Signup')} 
                variant="ghost"
                style={styles.switchBtn}
                textStyle={{ fontSize: 14 }}
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
    marginBottom: spacing.lg,
    textAlign: 'center',
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
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: spacing.sm,
  },
  forgotText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  switchBtn: {
    marginTop: spacing.md,
  },
});
