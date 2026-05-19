import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { RequestDetailScreen } from '../RequestDetailScreen';
import { supabase } from '../../../services/api/supabase';

const mockGoBack = jest.fn();
const request = {
  id: 'pickup-1',
  collector_id: 'collector-1',
  status: 'ASSIGNED',
  created_at: '2026-05-19T01:00:00.000Z',
  location: { lat: -6.2, lng: 106.8, address: 'Jakarta' },
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
  useRoute: () => ({ params: { request } }),
}));

jest.mock('../../../services/api/supabase', () => ({
  supabase: {
    from: jest.fn(),
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
    })),
    removeChannel: jest.fn(),
  },
}));

jest.mock('../../../services/api/routing', () => ({
  fetchRoute: jest.fn().mockResolvedValue([]),
}));

jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: ({ children }: any) => <View testID="map-view">{children}</View>,
    Marker: ({ children }: any) => <View testID="map-marker">{children}</View>,
    Polyline: () => <View testID="map-polyline" />,
  };
});

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
}));

describe('RequestDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const single = jest.fn().mockResolvedValue({
      data: {
        name: 'Driver One',
        phone_number: '+62 812',
        vehicle_type: 'Motorcycle',
        vehicle_plate: 'B 1234 ECO',
        current_lat: -6.21,
        current_lng: 106.81,
      },
      error: null,
    });
    const eq = jest.fn(() => ({ single }));
    const select = jest.fn(() => ({ eq }));
    (supabase.from as jest.Mock).mockReturnValue({ select });
  });

  it('uses actual collector profile data and removes mock contact/rating UI', async () => {
    const { getByText, queryByText } = render(<RequestDetailScreen />);

    await waitFor(() => expect(getByText('Driver One')).toBeTruthy());

    expect(getByText('Motorcycle • B 1234 ECO')).toBeTruthy();
    expect(queryByText('EcoSort Partner')).toBeNull();
    expect(queryByText(/Official Collector/)).toBeNull();
    expect(queryByText(/⭐/)).toBeNull();
    expect(queryByText('Call')).toBeNull();
    expect(queryByText('Chat')).toBeNull();
  });
});
