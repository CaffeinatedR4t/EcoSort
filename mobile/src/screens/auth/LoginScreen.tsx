import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const { width } = useWindowDimensions();

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage('');
    }, 3000);
  };

  const handleAuth = async () => {
    if (!email || !password || (isSignUp && !name)) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        // Sign Up
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
          
          // 1. Immediately sign out to stop the navigation jump
          await supabase.auth.signOut();
          
          console.log('Creating profile...');
          // 2. Direct insert for profile
          const isCollector = email.toLowerCase().includes('collector') || email.toLowerCase().includes('driver');
          const { error: profileError } = await (supabase
            .from('users') as any)
            .insert([
              { 
                id: data.user.id, 
                name, 
                role: (isCollector ? 'collector' : 'user') as any,
                balance: 0 
              }
            ]);
          
          if (profileError && profileError.code !== '23505') {
            console.error('Profile creation error:', profileError);
            throw profileError;
          }
          
          console.log('Showing success toast and redirecting');
          showToast('Sign up is success');
          setIsSignUp(false);
          setPassword('');
        }
      } else {
        // Sign In
        console.log('Attempting sign in for:', email);
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          console.error('Sign in error:', error);
          throw error;
        }
      }
    } catch (error: any) {
      console.error('Final catch error:', error);
      Alert.alert('Error', error.message || 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
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
          <View style={styles.header}>
            <Logo size={100} style={styles.logoImage} />
            <Text style={styles.logoText}>EcoSort</Text>
            <Text style={styles.subtitle}>Clean. Green. Rewarded.</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.title}>{isSignUp ? 'Create Account' : 'Welcome Back'}</Text>
            
            {isSignUp && (
              <>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="John Doe"
                  placeholderTextColor={colors.textBlackSoft}
                />
              </>
            )}

            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="name@domain.com"
              placeholderTextColor={colors.textBlackSoft}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.textBlackSoft}
              secureTextEntry
            />

            <Button 
              title={loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')} 
              onPress={handleAuth} 
              loading={loading}
              style={styles.button}
            />
            
            <Button 
              title={isSignUp ? 'Already have an account? Sign In' : 'New to EcoSort? Join Now'} 
              onPress={() => setIsSignUp(!isSignUp)} 
              variant="ghost"
              style={styles.switchBtn}
              textStyle={{ fontSize: 14 }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutralWarm,
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
  header: {
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  logoImage: {
    marginBottom: -46,
    zIndex: 10,
  },
  logoText: {
    fontSize: 42,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: -1,
    zIndex: 1,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textBlackSoft,
    marginTop: spacing.xs,
  },
  form: {
    width: '100%',
    backgroundColor: colors.white,
    padding: spacing.xl,
    borderRadius: 16,
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
