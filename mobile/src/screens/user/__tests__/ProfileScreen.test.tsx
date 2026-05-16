jest.mock('expo', () => ({}));
import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { ProfileScreen } from '../ProfileScreen';
import { useAuthStore } from '../../../store/authStore';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: mockNavigate,
    }),
  };
});

jest.mock('../../../store/authStore');

jest.mock('../../../services/api/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    })),
  },
}));

jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe('ProfileScreen', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    (useAuthStore as any).mockReturnValue({
      user: { id: 'user-1', name: 'Test User', balance: 1000, role: 'user' },
      logout: jest.fn(),
    });
  });

  it('opens notifications from the header bell and omits the notifications menu row', async () => {
    const { getByTestId, queryByText } = render(<ProfileScreen />);

    expect(queryByText('Notifications')).toBeNull();

    fireEvent.press(getByTestId('profile-notification-button'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('Notification');
    });
  });
});
