import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { ChangePasswordScreen } from '../ChangePasswordScreen';
import { supabase } from '../../../services/api/supabase';

jest.mock('../../../services/api/supabase', () => ({
  supabase: {
    auth: {
      updateUser: jest.fn(),
    },
  },
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: jest.fn(),
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
}));

describe('ChangePasswordScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  it('blocks mismatched passwords before calling Supabase', () => {
    const { getByPlaceholderText, getByText } = render(<ChangePasswordScreen />);

    fireEvent.changeText(getByPlaceholderText('Current password'), 'old-password');
    fireEvent.changeText(getByPlaceholderText('New password'), 'new-password');
    fireEvent.changeText(getByPlaceholderText('Confirm new password'), 'different');
    fireEvent.press(getByText('Update Password'));

    expect(supabase.auth.updateUser).not.toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Passwords do not match.');
  });

  it('updates the password through Supabase auth', async () => {
    (supabase.auth.updateUser as jest.Mock).mockResolvedValue({ error: null });
    const { getByPlaceholderText, getByText } = render(<ChangePasswordScreen />);

    fireEvent.changeText(getByPlaceholderText('Current password'), 'old-password');
    fireEvent.changeText(getByPlaceholderText('New password'), 'new-password');
    fireEvent.changeText(getByPlaceholderText('Confirm new password'), 'new-password');
    fireEvent.press(getByText('Update Password'));

    await waitFor(() => {
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'new-password',
        currentPassword: 'old-password',
      });
    });
  });
});
