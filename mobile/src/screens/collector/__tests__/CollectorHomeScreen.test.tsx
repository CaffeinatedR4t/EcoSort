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
    default: ({ children, ...props }: any) => <View testID="map-view" {...props}>{children}</View>,
    Marker: ({ children, anchor }: any) => <View testID="map-marker" anchor={anchor}>{children}</View>,
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

const mockRoutePickups = [
  {
    id: 'route-pickup-1',
    location: { lat: -6.2, lng: 106.8, address: 'Jakarta One' },
    waste_hint: 'PLASTIC Bag',
    created_at: new Date().toISOString(),
  },
  {
    id: 'route-pickup-2',
    location: { lat: -6.21, lng: 106.81, address: 'Jakarta Two' },
    waste_hint: 'PAPER Bag',
    created_at: new Date().toISOString(),
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

  it('uses the user-style driver home shell and removes mock-only profile data', async () => {
    const { getByText, getAllByText, getByTestId, queryByText, queryByTestId } = render(<CollectorHomeScreen />);

    expect(getByText('EcoSort')).toBeTruthy();
    expect(getByTestId('driver-home-header-shell')).toHaveStyle({
      backgroundColor: '#ffffff',
      borderRadius: 28,
    });
    expect(getByTestId('collector-screen-content')).toHaveStyle({ backgroundColor: '#ffffff' });
    expect(getByTestId('driver-finished-stat-icon')).toHaveStyle({
      backgroundColor: '#e0f2f1',
      borderRadius: 14,
    });
    expect(getByTestId('driver-collected-stat-icon')).toHaveStyle({
      backgroundColor: '#e0f2f1',
      borderRadius: 14,
    });
    expect(getByText(/Good (morning|afternoon|evening|night)/i)).toBeTruthy();
    expect(getByText('Driver')).toBeTruthy();
    expect(getByText('Eco Coins')).toBeTruthy();
    expect(getByText('Rp 10.000')).toBeTruthy();
    expect(getByText('Redeem')).toBeTruthy();
    expect(getByText('Pickup Requests')).toBeTruthy();
    expect(queryByText('AVAILABLE BALANCE')).toBeNull();
    expect(queryByText('TRANSFER')).toBeNull();
    expect(queryByText(/this week/i)).toBeNull();
    expect(getByText('Home')).toBeTruthy();
    expect(getByText('Route')).toBeTruthy();
    expect(getAllByText('History').length).toBeGreaterThanOrEqual(1);
    expect(getByText('Profile')).toBeTruthy();
    expect(queryByText('Log Out')).toBeNull();

    fireEvent.press(getByTestId('collector-notification-button'));
    expect(mockNavigate).toHaveBeenCalledWith('Notification');

    fireEvent.press(getByText('Redeem'));
    expect(mockNavigate).toHaveBeenCalledWith('Withdrawal');

    fireEvent.press(getByTestId('driver-wallet-history-button'));
    expect(mockNavigate).toHaveBeenCalledWith('TransactionHistory');

    fireEvent.press(getByText('Route'));

    await waitFor(() => {
      expect(getByText('EcoSort')).toBeTruthy();
      expect(getByTestId('route-notification-button')).toBeTruthy();
      expect(getByText('ACTIVE STOPS')).toBeTruthy();
      expect(getByTestId('collector-screen-content')).toHaveStyle({ backgroundColor: '#ffffff' });
      expect(getByTestId('route-header-wrapper')).toHaveStyle({
        paddingHorizontal: 24,
        paddingTop: 16,
        marginBottom: 32,
      });
    });

    mockNavigate.mockClear();
    fireEvent.press(getByTestId('route-notification-button'));
    expect(mockNavigate).toHaveBeenCalledWith('Notification');

    fireEvent.press(getByText('Profile'));

    await waitFor(() => {
      expect(queryByText('AVAILABLE BALANCE')).toBeNull();
      expect(queryByText('Redeem')).toBeNull();
      expect(getByText('EcoSort')).toBeTruthy();
      expect(getByTestId('profile-notification-button')).toBeTruthy();
      expect(getByTestId('collector-screen-content')).toHaveStyle({ backgroundColor: '#ffffff' });
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

  it('renders full route map pins inside non-clipping marker bounds', async () => {
    (usePickupStore as any).mockReturnValue({
      requests: mockRoutePickups,
      fetchPendingRequests: jest.fn(),
      fetchAssignedRequests: jest.fn(),
      acceptRequest: jest.fn(),
      loading: false,
      reorderRequests: jest.fn(),
    });

    const { getByText, getAllByTestId, getByTestId } = render(<CollectorHomeScreen />);

    fireEvent.press(getByText('Route'));

    await waitFor(() => {
      expect(getByTestId('map-view')).toBeTruthy();
      expect(getByTestId('route-map-marker-1')).toBeTruthy();
      expect(getByTestId('route-map-marker-2')).toBeTruthy();
    });

    expect(getAllByTestId('map-marker')).toHaveLength(2);
    expect(getByTestId('route-map-marker-1')).toHaveStyle({ width: 32, height: 32 });
    expect(getByTestId('route-map-pin-1')).toHaveStyle({ width: 32, height: 32 });
    expect(getByTestId('route-map-marker-2')).toHaveStyle({ width: 32, height: 32 });
    expect(getByTestId('route-map-pin-2')).toHaveStyle({ width: 32, height: 32 });
  });
});
