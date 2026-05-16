import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AppNavigator } from './src/navigation';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from './src/store/authStore';

const SystemSafeAreaBackground = () => {
  const insets = useSafeAreaInsets();

  return (
    <>
      <View
        pointerEvents="none"
        style={[styles.topSafeArea, { height: insets.top }]}
      />
      <View
        pointerEvents="none"
        style={[styles.bottomSafeArea, { height: insets.bottom }]}
      />
    </>
  );
};

export default function App() {
  const initializeAuth = useAuthStore(state => state.initialize);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <SafeAreaProvider>
      <SystemSafeAreaBackground />
      <AppNavigator />
      <StatusBar style="light" backgroundColor="#006948" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  topSafeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#006948',
    zIndex: 9999,
  },
  bottomSafeArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    zIndex: 9999,
  },
});
