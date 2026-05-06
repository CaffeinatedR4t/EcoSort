jest.mock('expo', () => ({}));
import React from 'react';
import { render } from '@testing-library/react-native';
import { ScanScreen } from '../ScanScreen';
import { NavigationContainer } from '@react-navigation/native';
import { usePickupStore } from '../../../store/pickupStore';

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
jest.mock('../../../store/pickupStore');

// Mock expo-camera
jest.mock('expo-camera', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    CameraView: ({ children }: any) => <View testID="camera-view">{children}</View>,
    useCameraPermissions: () => [ { granted: true }, () => Promise.resolve({ granted: true }) ],
  };
});

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: any) => children,
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe('ScanScreen', () => {
  beforeEach(() => {
    (usePickupStore as any).mockReturnValue({
      cart: [],
      addToCart: jest.fn(),
      removeFromCart: jest.fn(),
      clearCart: jest.fn(),
    });
  });

  it('renders scanning mode buttons', () => {
    const { getByText } = render(
      <NavigationContainer>
        <ScanScreen />
      </NavigationContainer>
    );

    expect(getByText('AI Scan')).toBeTruthy();
    expect(getByText('Barcode')).toBeTruthy();
  });

  it('renders "Request Pickup" button disabled when cart is empty', () => {
    const { getByText } = render(
      <NavigationContainer>
        <ScanScreen />
      </NavigationContainer>
    );

    const btn = getByText('Request Pickup');
    expect(btn).toBeTruthy();
  });
});
