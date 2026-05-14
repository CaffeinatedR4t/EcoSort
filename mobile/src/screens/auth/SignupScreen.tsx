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
  TouchableOpacity,
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

export const SignupScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const { width, height } = useWindowDimensions();
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

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage('');
    }, 3000);
  };

  const handleSignup = async () => {
    if (!email || !password || !name) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      console.log('Attempting sign up for:', email);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error('Sign up error:', error);
        throw error;
      }

      if (data.user) {
        console.log('User created in auth.users, signing out to prevent auto-login jump...');
        await supabase.auth.signOut();
        
        console.log('Creating profile...');
        const emailLower = email.toLowerCase();
        const isAdmin = emailLower.includes('admin');
        const isCollector = emailLower.includes('collector') || emailLower.includes('driver');
        
        let role = 'user';
        if (isAdmin) role = 'admin';
        else if (isCollector) role = 'collector';

        const { error: profileError } = await (supabase
          .from('users') as any)
          .insert([
            { 
              id: data.user.id, 
              name, 
              role: role as any,
              balance: 0 
            }
          ]);
        
        if (profileError && profileError.code !== '23505') {
          console.error('Profile creation error:', profileError);
          throw profileError;
        }
        
        console.log('Showing success toast and redirecting');
        showToast('Sign up is success');
        navigation.navigate('Login');
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
        {toastMessage ? (
          <View style={[styles.toast, { width: width - spacing.xl * 2 }]}>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        ) : null}
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
              
              <Text style={styles.title}>Create your account</Text>
              
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="John Doe"
                placeholderTextColor={colors.textBlackSoft}
              />

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

              <Button 
                title={loading ? 'Processing...' : 'Sign Up'} 
                onPress={handleSignup} 
                loading={loading}
                style={styles.button}
              />
              
              <Button 
                title="Already have an account? Sign In" 
                onPress={() => navigation.navigate('Login')} 
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
  toast: {
    position: 'absolute',
    top: 50,
    left: spacing.xl,
    right: spacing.xl,
    backgroundColor: colors.houseGreen,
    padding: spacing.md,
    borderRadius: 8,
    zIndex: 1000,
    alignItems: 'center',
    ...layout.cardShadow,
  },
  toastText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 16,
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
  switchBtn: {
    marginTop: spacing.md,
  },
});
