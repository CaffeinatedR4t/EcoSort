import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';

// Screens
import { LoginScreen } from '../screens/auth/LoginScreen';
import { UserHomeScreen } from '../screens/user/UserHomeScreen';
import { GetStartedScreen } from '../screens/user/GetStartedScreen';
import { ScanScreen } from '../screens/user/ScanScreen';
import { PickLocationScreen } from '../screens/user/PickLocationScreen';
import { ProfileScreen } from '../screens/user/ProfileScreen';
import { RequestDetailScreen } from '../screens/user/RequestDetailScreen';
import { WithdrawalScreen } from '../screens/user/WithdrawalScreen';
import { NotificationScreen } from '../screens/user/NotificationScreen';
import { PrivacyScreen } from '../screens/user/PrivacyScreen';
import { CollectorHomeScreen } from '../screens/collector/CollectorHomeScreen';
import { CollectorJobDetailScreen } from '../screens/collector/CollectorJobDetailScreen';
import { AdminHomeScreen } from '../screens/admin/AdminHomeScreen';

const Stack = createNativeStackNavigator();
const UserStack = createNativeStackNavigator();
const CollectorStack = createNativeStackNavigator();
const AdminStack = createNativeStackNavigator();

const UserNavigator = () => (
  <UserStack.Navigator screenOptions={{ headerShown: false }}>
    <UserStack.Screen name="UserHome" component={UserHomeScreen} />
    <UserStack.Screen name="GetStarted" component={GetStartedScreen} />
    <UserStack.Screen name="Scan" component={ScanScreen} />
    <UserStack.Screen name="PickLocation" component={PickLocationScreen} />
    <UserStack.Screen name="Profile" component={ProfileScreen} />
    <UserStack.Screen name="RequestDetail" component={RequestDetailScreen} />
    <UserStack.Screen name="Withdrawal" component={WithdrawalScreen} />
    <UserStack.Screen name="Notification" component={NotificationScreen} />
    <UserStack.Screen name="Privacy" component={PrivacyScreen} />
  </UserStack.Navigator>
);

const CollectorNavigator = () => (
  <CollectorStack.Navigator screenOptions={{ headerShown: false }}>
    <CollectorStack.Screen name="CollectorHome" component={CollectorHomeScreen} />
    <CollectorStack.Screen name="CollectorJobDetail" component={CollectorJobDetailScreen} />
  </CollectorStack.Navigator>
);

const AdminNavigator = () => (
  <AdminStack.Navigator screenOptions={{ headerShown: false }}>
    <AdminStack.Screen name="AdminHome" component={AdminHomeScreen} />
  </AdminStack.Navigator>
);

export const AppNavigator = () => {
  const { user } = useAuthStore();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Auth" component={LoginScreen} />
        ) : user.role === 'admin' ? (
          <Stack.Screen name="AdminMain" component={AdminNavigator} />
        ) : user.role === 'collector' ? (
          <Stack.Screen name="CollectorMain" component={CollectorNavigator} />
        ) : (
          <Stack.Screen name="UserMain" component={UserNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
