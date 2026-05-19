import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { TwoFactorAuthScreen } from '../TwoFactorAuthScreen';
import { supabase } from '../../../services/api/supabase';

jest.mock('../../../services/api/supabase', () => ({
  supabase: {
    auth: {
      mfa: {
        listFactors: jest.fn(),
        enroll: jest.fn(),
        challenge: jest.fn(),
        verify: jest.fn(),
        unenroll: jest.fn(),
      },
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

describe('TwoFactorAuthScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.auth.mfa.listFactors as jest.Mock).mockResolvedValue({
      data: { totp: [] },
      error: null,
    });
  });

  it('enrolls and verifies a TOTP factor', async () => {
    (supabase.auth.mfa.enroll as jest.Mock).mockResolvedValue({
      data: {
        id: 'factor-1',
        totp: {
          qr_code: '<svg></svg>',
          secret: 'SECRET123',
        },
      },
      error: null,
    });
    (supabase.auth.mfa.challenge as jest.Mock).mockResolvedValue({
      data: { id: 'challenge-1' },
      error: null,
    });
    (supabase.auth.mfa.verify as jest.Mock).mockResolvedValue({ data: {}, error: null });

    const { getByText, getByPlaceholderText } = render(<TwoFactorAuthScreen />);

    await waitFor(() => {
      expect(getByText('Set Up Two-Factor Auth')).toBeTruthy();
    });

    fireEvent.press(getByText('Set Up Two-Factor Auth'));

    await waitFor(() => {
      expect(getByText('SECRET123')).toBeTruthy();
    });

    fireEvent.changeText(getByPlaceholderText('123456'), '123456');
    fireEvent.press(getByText('Enable Two-Factor Auth'));

    await waitFor(() => {
      expect(supabase.auth.mfa.challenge).toHaveBeenCalledWith({ factorId: 'factor-1' });
      expect(supabase.auth.mfa.verify).toHaveBeenCalledWith({
        factorId: 'factor-1',
        challengeId: 'challenge-1',
        code: '123456',
      });
    });
  });
});
