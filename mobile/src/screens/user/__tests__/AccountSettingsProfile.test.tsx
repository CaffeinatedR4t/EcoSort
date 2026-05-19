jest.mock('expo', () => ({}));
import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { AccountSettingsScreen } from '../Accountsettingsscreen';
import { useAuthStore } from '../../../store/authStore';
import { useNotificationPreferenceStore } from '../../../store/notificationPreferenceStore';

jest.mock('../../../store/authStore');
jest.mock('../../../store/notificationPreferenceStore');

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => <>{children}</>,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe('AccountSettings profile editing', () => {
  const mockPreferences = {
    user_id: 'user-1',
    pickup_enabled: true,
    reward_enabled: true,
    promo_enabled: false,
    system_enabled: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useNotificationPreferenceStore as any).mockReturnValue({
      preferencesByUser: { 'user-1': mockPreferences },
      loading: false,
      saving: false,
      fetchPreferences: jest.fn().mockResolvedValue(mockPreferences),
      updatePreference: jest.fn().mockResolvedValue({ success: true }),
    });
  });

  it('shows the Supabase auth email as read-only without mock fallback text', () => {
    const updateProfile = jest.fn().mockResolvedValue({ success: true });
    (useAuthStore as any).mockReturnValue({
      user: {
        id: 'user-1',
        name: 'Alice User',
        role: 'user',
        balance: 0,
        phone_number: '+62 812 1111 2222',
      },
      session: {
        user: {
          email: 'alice@ecosort.test',
        },
      },
      updateProfile,
    });

    const { getByText, queryByText } = render(<AccountSettingsScreen />);

    expect(getByText('alice@ecosort.test')).toBeTruthy();
    expect(queryByText('budi.santoso@email.com')).toBeNull();

    fireEvent.press(getByText('Email Address'));
    expect(queryByText('PHONE NUMBER')).toBeNull();
    expect(updateProfile).not.toHaveBeenCalled();
  });

  it('saves profile name and phone through separate editors', async () => {
    const updateProfile = jest.fn().mockResolvedValue({ success: true });
    (useAuthStore as any).mockReturnValue({
      user: {
        id: 'user-1',
        name: 'Alice User',
        role: 'user',
        balance: 0,
        phone_number: '+62 812 1111 2222',
      },
      updateProfile,
    });

    const { getByText, getAllByDisplayValue, queryByText } = render(<AccountSettingsScreen />);

    fireEvent.press(getByText('Edit'));
    fireEvent.changeText(getAllByDisplayValue('Alice User')[0], 'Alice Updated');
    expect(queryByText('PHONE NUMBER')).toBeNull();
    fireEvent.press(getByText('Save'));

    await waitFor(() => {
      expect(updateProfile).toHaveBeenCalledWith({
        name: 'Alice Updated',
      });
    });

    fireEvent.press(getByText('Phone Number'));
    fireEvent.changeText(getAllByDisplayValue('+62 812 1111 2222')[0], '+62 812 9999 0000');
    fireEvent.press(getByText('Save'));

    await waitFor(() => {
      expect(updateProfile).toHaveBeenCalledWith({
        phone_number: '+62 812 9999 0000',
      });
    });
  });

  it('saves notification toggles and removes dark mode settings', () => {
    const updatePreference = jest.fn().mockResolvedValue({ success: true });
    (useNotificationPreferenceStore as any).mockReturnValue({
      preferencesByUser: { 'user-1': mockPreferences },
      loading: false,
      saving: false,
      fetchPreferences: jest.fn().mockResolvedValue(mockPreferences),
      updatePreference,
    });
    (useAuthStore as any).mockReturnValue({
      user: {
        id: 'user-1',
        name: 'Alice User',
        role: 'user',
        balance: 0,
        phone_number: '+62 812 1111 2222',
      },
      session: { user: { email: 'alice@ecosort.test' } },
      updateProfile: jest.fn(),
    });

    const { getByText, getAllByRole, queryByText } = render(<AccountSettingsScreen />);

    expect(getByText('Notifications')).toBeTruthy();
    expect(queryByText('Appearance')).toBeNull();
    expect(queryByText('Dark Mode')).toBeNull();

    fireEvent(getAllByRole('switch')[0], 'valueChange', false);

    expect(updatePreference).toHaveBeenCalledWith('user-1', 'pickup_enabled', false);
  });

  it('requires typed confirmation before deleting the account', async () => {
    const deleteAccount = jest.fn().mockResolvedValue({ success: true });
    (useAuthStore as any).mockReturnValue({
      user: {
        id: 'user-1',
        name: 'Alice User',
        role: 'user',
        balance: 0,
        phone_number: '+62 812 1111 2222',
      },
      session: { user: { email: 'alice@ecosort.test' } },
      updateProfile: jest.fn(),
      deleteAccount,
    });

    const { getByText, getByPlaceholderText, queryByText } = render(<AccountSettingsScreen />);

    fireEvent.press(getByText('Delete Account'));

    expect(getByText('This action permanently removes your EcoSort profile and app data.')).toBeTruthy();
    fireEvent.press(getByText('Delete my account'));
    expect(deleteAccount).not.toHaveBeenCalled();

    fireEvent.changeText(getByPlaceholderText('delete account'), 'wrong text');
    fireEvent.press(getByText('Delete my account'));
    expect(deleteAccount).not.toHaveBeenCalled();

    fireEvent.changeText(getByPlaceholderText('delete account'), 'delete account');
    fireEvent.press(getByText('Delete my account'));

    await waitFor(() => {
      expect(deleteAccount).toHaveBeenCalledTimes(1);
    });
    expect(queryByText('This action permanently removes your EcoSort profile and app data.')).toBeNull();
  });
});
