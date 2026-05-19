import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';

// Screens
import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignupScreen } from '../screens/auth/SignupScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { ResetPasswordScreen } from '../screens/auth/ResetPasswordScreen';
import { ChangePasswordScreen } from '../screens/shared/ChangePasswordScreen';
import { TwoFactorAuthScreen } from '../screens/shared/TwoFactorAuthScreen';
import { UserHomeScreen } from '../screens/user/UserHomeScreen';
import { GetStartedScreen } from '../screens/user/GetStartedScreen';
import { ScanScreen } from '../screens/user/ScanScreen';
import { PickLocationScreen } from '../screens/user/PickLocationScreen';
import { ProfileScreen } from '../screens/user/ProfileScreen';
import { RequestDetailScreen } from '../screens/user/RequestDetailScreen';
import { WithdrawalScreen } from '../screens/user/WithdrawalScreen';
import { NotificationScreen } from '../screens/user/NotificationScreen';
import { PrivacyScreen } from '../screens/user/PrivacyScreen';
import { AddYourHomeScreen } from '../screens/user/AddYourHomeScreen';
import { SetHomeAddressScreen } from '../screens/user/SetHomeAddressScreen';
import { AccountSettingsScreen } from '../screens/user/Accountsettingsscreen';
import { TransactionHistoryScreen } from '../screens/user/TransactionHistoryScreen';
import { HelpSupportScreen } from '../screens/user/Helpsupportscreen';
import { CollectorHomeScreen } from '../screens/collector/CollectorHomeScreen';
import { CollectorJobDetailScreen } from '../screens/collector/CollectorJobDetailScreen';
import { AccountSettingsScreen as AccountSettingScreenCollector } from '../screens/collector/AccountSettingsScreenCollector';
import { HelpSupportScreen as HelpSupportScreenCollector} from '../screens/collector/HelpSupportScreenCollector';
import { AdminHomeScreen } from '../screens/admin/AdminHomeScreen';
import { AdminAccountSettingsScreen as Adminaccountsettingscreen } from '../screens/admin/Adminaccountsettingsscreen';
import { AdminHelpSupportScreen } from '../screens/admin/Adminhelpsupportscreen';

const Stack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();
const UserStack = createNativeStackNavigator();

const AuthNavigator = () => (
  <AuthStack.Navigator 
    screenOptions={{ 
      headerShown: false,
      animation: 'fade',
    }}
  >
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Signup" component={SignupScreen} />
    <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    <AuthStack.Screen name="ResetPassword" component={ResetPasswordScreen} />
  </AuthStack.Navigator>
);
const CollectorStack = createNativeStackNavigator();
const AdminStack = createNativeStackNavigator();

const UserNavigator = () => (
  <UserStack.Navigator screenOptions={{ headerShown: false }}>
    <UserStack.Screen name="UserHome" component={UserHomeScreen} options={{ animation: 'none' }} />
    <UserStack.Screen name="GetStarted" component={GetStartedScreen} />
    <UserStack.Screen name="Scan" component={ScanScreen} options={{ animation: 'none' }} />
    <UserStack.Screen name="PickLocation" component={PickLocationScreen} />
    <UserStack.Screen name="Profile" component={ProfileScreen} options={{ animation: 'none' }} />
    <UserStack.Screen name="RequestDetail" component={RequestDetailScreen} />
    <UserStack.Screen name="Withdrawal" component={WithdrawalScreen} />
    <UserStack.Screen name="Notification" component={NotificationScreen} />
    <UserStack.Screen name="Privacy" component={PrivacyScreen} />
    <UserStack.Screen name="AddYourHome" component={AddYourHomeScreen} />
    <UserStack.Screen name="SetHomeAddress" component={SetHomeAddressScreen} />
    <UserStack.Screen name="AccountSettings" component={AccountSettingsScreen} />
    <UserStack.Screen name="TransactionHistory" component={TransactionHistoryScreen} />
    <UserStack.Screen name="ChangePassword" component={ChangePasswordScreen} />
    <UserStack.Screen name="TwoFactorAuth" component={TwoFactorAuthScreen} />
    <UserStack.Screen name="HelpSupport" component={HelpSupportScreen} />
  </UserStack.Navigator>
);

const CollectorNavigator = () => (
  <CollectorStack.Navigator screenOptions={{ headerShown: false }}>
    <CollectorStack.Screen name="CollectorHome" component={CollectorHomeScreen} />
    <CollectorStack.Screen name="CollectorJobDetail" component={CollectorJobDetailScreen} />
    <CollectorStack.Screen name="Withdrawal" component={WithdrawalScreen} />
    <CollectorStack.Screen name="TransactionHistory" component={TransactionHistoryScreen} />
    <CollectorStack.Screen name="Notification" component={NotificationScreen} />
    <CollectorStack.Screen name="AccountSettings" component={AccountSettingScreenCollector} />
    <CollectorStack.Screen name="ChangePassword" component={ChangePasswordScreen} />
    <CollectorStack.Screen name="TwoFactorAuth" component={TwoFactorAuthScreen} />
    <CollectorStack.Screen name="HelpSupport" component={HelpSupportScreen} />
  </CollectorStack.Navigator>
);

const AdminNavigator = () => (
    <AdminStack.Navigator screenOptions={{ headerShown: false }}>
    <AdminStack.Screen name="AdminHome" component={AdminHomeScreen} />
    <AdminStack.Screen name="Notification" component={NotificationScreen} />
    <AdminStack.Screen name="AdminAccountSettings" component={Adminaccountsettingscreen} />
    <AdminStack.Screen name="ChangePassword" component={ChangePasswordScreen} />
    <AdminStack.Screen name="TwoFactorAuth" component={TwoFactorAuthScreen} />
    <AdminStack.Screen name="AdminHelpSupport" component={AdminHelpSupportScreen} />
  </AdminStack.Navigator>
);

export const AppNavigator = () => {
  const { user } = useAuthStore();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
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
