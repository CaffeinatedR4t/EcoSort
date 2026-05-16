jest.mock('expo', () => ({}));
import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { CollectorHomeScreen } from '../CollectorHomeScreen';
import { useAuthStore } from '../../../store/authStore';
import { usePickupStore } from '../../../store/pickupStore';
import { useNotificationStore } from '../../../store/notificationStore';

jest.mock('../../../store/authStore');
jest.mock('../../../store/pickupStore');
jest.mock('../../../store/notificationStore');

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: { Balanced: 3 },
}));

jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: ({ children }: any) => <View testID="map-view">{children}</View>,
    Marker: ({ children }: any) => <View>{children}</View>,
    PROVIDER_DEFAULT: 'default',
  };
});

jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const mockCompletedPickups = [
  {
    id: 'pickup-1',
    location: { lat: -6.2, lng: 106.8, address: 'Jakarta' },
    waste_hint: 'PLASTIC Bag',
    created_at: new Date().toISOString(),
    waste_classifications: [{ waste_type: 'plastic', collector_weight_kg: 2.5 }],
  },
];

const createSupabaseQuery = () => {
  const query: any = {
    select: jest.fn(() => query),
    eq: jest.fn(() => query),
    order: jest.fn(() => Promise.resolve({ data: mockCompletedPickups, error: null })),
  };
  return query;
};

jest.mock('../../../services/api/supabase', () => ({
  supabase: {
    from: jest.fn(() => createSupabaseQuery()),
  },
}));

describe('CollectorHomeScreen', () => {
  const logoutMock = jest.fn();

  beforeEach(() => {
    logoutMock.mockClear();
    mockNavigate.mockClear();
    (useAuthStore as any).mockReturnValue({
      user: { id: 'collector-1', name: 'Driver One', balance: 10000, role: 'collector' },
      logout: logoutMock,
    });
    (usePickupStore as any).mockReturnValue({
      requests: [],
      fetchPendingRequests: jest.fn(),
      fetchAssignedRequests: jest.fn(),
      acceptRequest: jest.fn(),
      loading: false,
      reorderRequests: jest.fn(),
    });
    (useNotificationStore as any).mockReturnValue({
      unreadCount: 3,
      fetchNotifications: jest.fn(),
    });
  });

  it('uses user-style collector navigation and removes mock-only profile data', async () => {
    const { getByText, getByTestId, queryByText, queryByTestId } = render(<CollectorHomeScreen />);

    expect(getByTestId('collector-home-bg-circle')).toBeTruthy();
    expect(getByText('EcoSort')).toBeTruthy();
    expect(getByText('AVAILABLE BALANCE')).toBeTruthy();
    expect(getByText('Rp 10.000')).toBeTruthy();
    expect(getByText('REDEEM')).toBeTruthy();
    expect(getByText('TRANSFER')).toBeTruthy();
    expect(queryByText(/this week/i)).toBeNull();
    expect(getByText('Home')).toBeTruthy();
    expect(getByText('Route')).toBeTruthy();
    expect(getByText('History')).toBeTruthy();
    expect(getByText('Profile')).toBeTruthy();
    expect(queryByText('Log Out')).toBeNull();

    fireEvent.press(getByTestId('collector-notification-button'));
    expect(mockNavigate).toHaveBeenCalledWith('Notification');

    fireEvent.press(getByText('REDEEM'));
    expect(mockNavigate).toHaveBeenCalledWith('Withdrawal');

    fireEvent.press(getByText('Route'));

    await waitFor(() => {
      expect(getByText('EcoSort')).toBeTruthy();
      expect(getByTestId('route-notification-button')).toBeTruthy();
      expect(getByText('ACTIVE STOPS')).toBeTruthy();
    });

    mockNavigate.mockClear();
    fireEvent.press(getByTestId('route-notification-button'));
    expect(mockNavigate).toHaveBeenCalledWith('Notification');

    fireEvent.press(getByText('Profile'));

    await waitFor(() => {
      expect(queryByText('AVAILABLE BALANCE')).toBeNull();
      expect(queryByText('REDEEM')).toBeNull();
      expect(getByText('EcoSort')).toBeTruthy();
      expect(getByTestId('profile-notification-button')).toBeTruthy();
      expect(queryByText('Profile')).toBeTruthy();
      expect(queryByText('Senior Collector')).toBeNull();
      expect(queryByText('Compactor Truck')).toBeNull();
      expect(queryByText('ECO-99X')).toBeNull();
      expect(queryByText('1,240')).toBeNull();
      expect(queryByText('4.5t')).toBeNull();
      expect(getByText('Vehicle details not configured')).toBeTruthy();
      expect(getByText('Log Out')).toBeTruthy();
    });
    expect(queryByTestId('collector-home-bg-circle')).toBeNull();

    mockNavigate.mockClear();
    fireEvent.press(getByTestId('profile-notification-button'));
    expect(mockNavigate).toHaveBeenCalledWith('Notification');

    fireEvent.press(getByText('Log Out'));
    expect(logoutMock).toHaveBeenCalledTimes(1);
  });
});
