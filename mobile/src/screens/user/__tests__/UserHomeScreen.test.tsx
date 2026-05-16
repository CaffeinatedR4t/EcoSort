jest.mock('expo', () => ({}));
import React from 'react';
import { render } from '@testing-library/react-native';
import { UserHomeScreen } from '../UserHomeScreen';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '../../../store/authStore';
import { usePickupStore } from '../../../store/pickupStore';
import { useNotificationStore } from '../../../store/notificationStore';

// Mock navigation
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
    }),
  };
});

// Mock stores
jest.mock('../../../store/authStore');
jest.mock('../../../store/pickupStore');
jest.mock('../../../store/notificationStore');

// Mock supabase
jest.mock('../../../services/api/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
  },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock expo-status-bar
jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: any) => children,
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe('UserHomeScreen', () => {
  beforeEach(() => {
    (useAuthStore as any).mockReturnValue({
      user: { id: '1', name: 'Test User', balance: 1000, role: 'user' },
      transactions: [],
      fetchTransactions: jest.fn(),
      fetchProfile: jest.fn(),
    });
    (usePickupStore as any).mockReturnValue({
      requests: [],
      fetchUserRequests: jest.fn(),
      loading: false,
    });
    (useNotificationStore as any).mockReturnValue({
      unreadCount: 0,
      fetchNotifications: jest.fn(),
    });
  });

  it('does NOT render the "Request Now" button', () => {
    const { queryByText } = render(
      <NavigationContainer>
        <UserHomeScreen />
      </NavigationContainer>
    );

    expect(queryByText('Request Now')).toBeNull();
  });

  it('renders the Wallet balance', () => {
    const { getByText, queryByText } = render(
      <NavigationContainer>
        <UserHomeScreen />
      </NavigationContainer>
    );

    expect(getByText('Rp 1,000')).toBeTruthy();
    expect(queryByText(/this week/i)).toBeNull();
  });
});
