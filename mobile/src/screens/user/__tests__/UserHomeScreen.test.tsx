jest.mock('expo', () => ({}));
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import {
  UserHomeScreen,
  getHomeBannerVariant,
  getHomeBannerGreeting,
} from '../UserHomeScreen';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '../../../store/authStore';
import { usePickupStore } from '../../../store/pickupStore';
import { useNotificationStore } from '../../../store/notificationStore';

const mockNavigate = jest.fn();

// Mock navigation
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: mockNavigate,
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
    mockNavigate.mockClear();
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

  it('renders the Eco Coins balance', () => {
    const { getByText, queryByText } = render(
      <NavigationContainer>
        <UserHomeScreen />
      </NavigationContainer>
    );

    expect(getByText('Eco Coins')).toBeTruthy();
    expect(getByText('Rp 1.000')).toBeTruthy();
    expect(queryByText(/this week/i)).toBeNull();
  });

  it('maps the banner to the correct time of day asset', () => {
    expect(getHomeBannerVariant(6)).toBe('morning');
    expect(getHomeBannerVariant(13)).toBe('afternoon');
    expect(getHomeBannerVariant(18)).toBe('evening');
    expect(getHomeBannerVariant(23)).toBe('night');
  });

  it('builds the banner greeting from time of day and user name', () => {
    expect(getHomeBannerGreeting(6, 'Test User')).toBe('Good morning, Test User');
    expect(getHomeBannerGreeting(13, 'Test User')).toBe('Good afternoon, Test User');
    expect(getHomeBannerGreeting(18, 'Test User')).toBe('Good evening, Test User');
    expect(getHomeBannerGreeting(23, 'Test User')).toBe('Good night, Test User');
  });

  it('navigates to history and withdrawal from the wallet card', () => {
    const { getByText } = render(
      <NavigationContainer>
        <UserHomeScreen />
      </NavigationContainer>
    );

    fireEvent.press(getByText('Redeem'));
    fireEvent.press(getByText('History'));

    expect(mockNavigate).toHaveBeenCalledWith('Withdrawal');
    expect(mockNavigate).toHaveBeenCalledWith('TransactionHistory');
  });

  it('renders the split banner headline and removes the banner subcopy', () => {
    const { getByText, queryByText } = render(
      <NavigationContainer>
        <UserHomeScreen />
      </NavigationContainer>
    );

    expect(getByText(/Good (morning|afternoon|evening|night)/i)).toBeTruthy();
    expect(getByText('Test')).toBeTruthy();
    expect(queryByText('Pickups, rewards, and wallet balance in one place.')).toBeNull();
  });
});
