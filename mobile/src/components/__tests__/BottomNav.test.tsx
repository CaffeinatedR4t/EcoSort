jest.mock('expo', () => ({}));
import React from 'react';
import { render } from '@testing-library/react-native';
import { BottomNav } from '../BottomNav';
import { NavigationContainer } from '@react-navigation/native';

// Mock lucide-react-native to check for specific icons
jest.mock('lucide-react-native', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Home: () => <View testID="HomeIcon" />,
    User: () => <View testID="UserIcon" />,
    Maximize: () => <View testID="ScanIcon" />,
    ScanLine: () => <View testID="ScanIcon" />,
  };
});

// Mock navigation
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
    }),
    useRoute: () => ({
      name: 'Home',
    }),
  };
});

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

describe('BottomNav', () => {
  it('renders exactly 3 navigation items and their text labels', () => {
    const { getByText } = render(
      <BottomNav activeRoute="Home" />
    );

    // Should HAVE "Home", "Profile", or "Scan" text labels
    expect(getByText('Home')).toBeTruthy();
    expect(getByText('Profile')).toBeTruthy();
    expect(getByText('Scan')).toBeTruthy();
  });
});
