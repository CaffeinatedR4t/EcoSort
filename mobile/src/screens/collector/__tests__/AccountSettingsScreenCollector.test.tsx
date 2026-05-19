jest.mock('expo', () => ({}));
import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { AccountSettingsScreen } from '../AccountSettingsScreenCollector';
import { useAuthStore } from '../../../store/authStore';
import { useNotificationPreferenceStore } from '../../../store/notificationPreferenceStore';

jest.mock('../../../store/authStore');
jest.mock('../../../store/notificationPreferenceStore');
jest.mock('../../../utils/profile', () => ({
  pickAndUploadProfileAvatar: jest.fn(),
  getProfileInitials: jest.fn(() => 'DO'),
}));

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

describe('Collector account settings', () => {
  const updateProfile = jest.fn().mockResolvedValue({ success: true });

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuthStore as any).mockReturnValue({
      user: {
        id: 'collector-1',
        name: 'Driver One',
        role: 'collector',
        balance: 10000,
        phone_number: '+62 812 1111 2222',
        vehicle_type: 'Motorcycle',
        vehicle_plate: 'B 7788 ECO',
        operating_area: 'Jakarta Selatan',
      },
      session: { user: { email: 'driver@ecosort.test' } },
      updateProfile,
      deleteAccount: jest.fn().mockResolvedValue({ success: true }),
    });
    (useNotificationPreferenceStore as any).mockReturnValue({
      preferencesByUser: {},
      loading: false,
      saving: false,
      fetchPreferences: jest.fn().mockResolvedValue(null),
      updatePreference: jest.fn().mockResolvedValue({ success: true }),
    });
  });

  it('removes user-only home address while keeping vehicle info editable', async () => {
    const { getByText, getAllByDisplayValue, queryByText } = render(<AccountSettingsScreen />);

    expect(queryByText('Home Address')).toBeNull();
    expect(getByText('Vehicle Type')).toBeTruthy();
    expect(getByText('Motorcycle')).toBeTruthy();
    expect(getByText('License Plate')).toBeTruthy();
    expect(getByText('B 7788 ECO')).toBeTruthy();
    expect(getByText('Operating Area')).toBeTruthy();
    expect(getByText('Jakarta Selatan')).toBeTruthy();

    fireEvent.press(getByText('Vehicle Type'));
    fireEvent.changeText(getAllByDisplayValue('Motorcycle')[0], 'Pickup Truck');
    fireEvent.changeText(getAllByDisplayValue('B 7788 ECO')[0], 'B 1234 ECO');
    fireEvent.press(getByText('Save Vehicle'));

    await waitFor(() => {
      expect(updateProfile).toHaveBeenCalledWith({
        vehicle_type: 'Pickup Truck',
        vehicle_plate: 'B 1234 ECO',
      });
    });

    fireEvent.press(getByText('Operating Area'));
    fireEvent.changeText(getAllByDisplayValue('Jakarta Selatan')[0], 'Jakarta Selatan, Depok');
    fireEvent.press(getByText('Save Area'));

    await waitFor(() => {
      expect(updateProfile).toHaveBeenCalledWith({
        operating_area: 'Jakarta Selatan, Depok',
      });
    });
  });
});
