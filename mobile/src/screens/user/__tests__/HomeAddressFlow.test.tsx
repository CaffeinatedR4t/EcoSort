jest.mock('expo', () => ({}));
import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { AccountSettingsScreen } from '../Accountsettingsscreen';
import { SetHomeAddressScreen } from '../SetHomeAddressScreen';
import { useAuthStore } from '../../../store/authStore';
import { supabase } from '../../../services/api/supabase';
import * as Location from 'expo-location';

jest.mock('../../../store/authStore');

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('expo-location', () => ({
  geocodeAsync: jest.fn(),
  reverseGeocodeAsync: jest.fn(),
}));

const mockUpdate = jest.fn();
const mockEq = jest.fn();
const mockInsert = jest.fn();

jest.mock('../../../services/api/supabase', () => ({
  supabase: {
    from: jest.fn((table: string) => {
      if (table === 'users') {
        return {
          update: mockUpdate,
        };
      }

      if (table === 'pickup_requests') {
        return {
          insert: mockInsert,
        };
      }

      return {};
    }),
  },
}));

describe('Home address setup flow', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockGoBack.mockClear();
    mockUpdate.mockReset();
    mockEq.mockReset();
    mockInsert.mockReset();
    (Location.geocodeAsync as jest.Mock).mockReset();
    (Location.reverseGeocodeAsync as jest.Mock).mockReset();

    (useAuthStore as any).mockReturnValue({
      user: {
        id: 'user-1',
        name: 'User One',
        email: 'user@ecosort.test',
        balance: 0,
        role: 'user',
        home_address: 'Jl. Existing Home, Jakarta',
        home_lat: -6.2,
        home_lng: 106.8,
      },
      fetchProfile: jest.fn(),
    });
  });

  it('opens a separate Set Home Address page from Account Settings', () => {
    const { getByText, queryByText } = render(<AccountSettingsScreen />);

    expect(getByText('Home Address')).toBeTruthy();
    expect(getByText('Jl. Existing Home, Jakarta')).toBeTruthy();
    expect(queryByText('Jl. Kebon Jeruk No. 12, Jakarta')).toBeNull();

    fireEvent.press(getByText('Home Address'));

    expect(mockNavigate).toHaveBeenCalledWith('SetHomeAddress');
  });

  it('searches and saves home address to the user profile without creating a pickup request', async () => {
    const fetchProfile = jest.fn();
    (useAuthStore as any).mockReturnValue({
      user: { id: 'user-1', name: 'User One', balance: 0, role: 'user' },
      fetchProfile,
    });
    (Location.geocodeAsync as jest.Mock).mockResolvedValue([
      { latitude: -6.1754, longitude: 106.8272 },
    ]);
    (Location.reverseGeocodeAsync as jest.Mock).mockResolvedValue([
      {
        name: 'Monas',
        street: 'Medan Merdeka',
        city: 'Jakarta Pusat',
        region: 'DKI Jakarta',
      },
    ]);
    mockEq.mockResolvedValue({ error: null });
    mockUpdate.mockReturnValue({ eq: mockEq });

    const { getByPlaceholderText, getByText, getByTestId, getAllByText } = render(<SetHomeAddressScreen />);

    fireEvent.changeText(getByPlaceholderText('Search home address'), 'Monas Jakarta');
    fireEvent.press(getByText('Search'));

    await waitFor(() => {
      expect(getAllByText('Monas Medan Merdeka, Jakarta Pusat, DKI Jakarta').length).toBeGreaterThan(0);
    });

    fireEvent.press(getByTestId('home-address-result-0'));
    await waitFor(() => {
      expect(getByTestId('save-home-address-button').props.disabled).not.toBe(true);
    });
    fireEvent.press(getByTestId('save-home-address-button'));

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('users');
      expect(mockUpdate).toHaveBeenCalledWith({
        home_address: 'Monas Medan Merdeka, Jakarta Pusat, DKI Jakarta',
        home_lat: -6.1754,
        home_lng: 106.8272,
      });
      expect(mockEq).toHaveBeenCalledWith('id', 'user-1');
      expect(fetchProfile).toHaveBeenCalledTimes(1);
      expect(mockGoBack).toHaveBeenCalledTimes(1);
    });
    expect((supabase.from as jest.Mock)).not.toHaveBeenCalledWith('pickup_requests');
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('shows address recommendations while typing before pressing search', async () => {
    (Location.geocodeAsync as jest.Mock).mockResolvedValue([
      { latitude: -6.1754, longitude: 106.8272 },
      { latitude: -6.1865, longitude: 106.8341 },
    ]);
    (Location.reverseGeocodeAsync as jest.Mock)
      .mockResolvedValueOnce([
        {
          name: 'Monas',
          street: 'Medan Merdeka',
          city: 'Jakarta Pusat',
          region: 'DKI Jakarta',
        },
      ])
      .mockResolvedValueOnce([
        {
          name: 'Gambir Station',
          street: 'Merdeka Timur',
          city: 'Jakarta Pusat',
          region: 'DKI Jakarta',
        },
      ]);

    const { getByPlaceholderText, getByText } = render(<SetHomeAddressScreen />);

    fireEvent.changeText(getByPlaceholderText('Search home address'), 'Monas Jakarta');

    await waitFor(() => {
      expect(getByText('Recommended addresses')).toBeTruthy();
      expect(getByText('Monas Medan Merdeka, Jakarta Pusat, DKI Jakarta')).toBeTruthy();
      expect(getByText('Gambir Station Merdeka Timur, Jakarta Pusat, DKI Jakarta')).toBeTruthy();
    });
    expect(Location.geocodeAsync).toHaveBeenCalledWith('Monas Jakarta');
  });
});
