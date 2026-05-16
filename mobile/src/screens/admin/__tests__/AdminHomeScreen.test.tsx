jest.mock('expo', () => ({}));
import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { AdminHomeScreen } from '../AdminHomeScreen';
import { useAdminStore } from '../../../store/adminStore';
import { useAuthStore } from '../../../store/authStore';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    reset: jest.fn(),
  }),
}));

jest.mock('../../../store/adminStore');
jest.mock('../../../store/authStore');

jest.mock('../../../components/Logo', () => ({
  Logo: () => null,
}));

jest.mock('lucide-react-native', () => ({
  BarChart3: 'BarChart3Icon',
  CheckCircle: 'CheckCircleIcon',
  ChevronRight: 'ChevronRightIcon',
  Clock: 'ClockIcon',
  CreditCard: 'CreditCardIcon',
  HelpCircle: 'HelpCircleIcon',
  LayoutDashboard: 'LayoutDashboardIcon',
  LogOut: 'LogOutIcon',
  PackageCheck: 'PackageCheckIcon',
  Recycle: 'RecycleIcon',
  Scale: 'ScaleIcon',
  Settings: 'SettingsIcon',
  ShieldCheck: 'ShieldCheckIcon',
  Truck: 'TruckIcon',
  UserCircle: 'UserCircleIcon',
  Wallet: 'WalletIcon',
  XCircle: 'XCircleIcon',
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe('AdminHomeScreen', () => {
  const fetchOverviewData = jest.fn();
  const fetchAdminProfileData = jest.fn();
  const fetchPendingRewards = jest.fn();
  const fetchPendingWithdrawals = jest.fn();
  const approveReward = jest.fn();
  const rejectReward = jest.fn();
  const approveWithdrawal = jest.fn();
  const rejectWithdrawal = jest.fn();
  const logout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (useAdminStore as unknown as jest.Mock).mockReturnValue({
      pendingRewards: [],
      pendingWithdrawals: [],
      overviewMetrics: {
        activePickups: 4,
        completedToday: 9,
        collectedWeightToday: 128.5,
      },
      adminProfileMetrics: {
        pendingReviews: 7,
        activePickups: 4,
        totalUsers: 21,
        totalCollectors: 6,
      },
      liveFeed: [
        {
          id: 'feed-1',
          title: 'Pickup completed',
          description: 'Plastic bag collected',
          timestamp: 'Just now',
          type: 'pickup',
        },
      ],
      pendingRewards: [
        {
          id: 'reward-1',
          amount: 12500,
          created_at: '2026-05-16T08:30:00.000Z',
          users: { name: 'Reward User' },
        },
      ],
      pendingWithdrawals: [
        {
          id: 'withdrawal-1',
          amount: 50000,
          created_at: '2026-05-16T09:15:00.000Z',
          bank_name: 'BCA',
          account_number: '1234567890',
          account_holder_name: 'Withdrawal User',
          users: { name: 'Withdrawal User' },
        },
      ],
      loading: false,
      overviewLoading: false,
      fetchOverviewData,
      fetchAdminProfileData,
      fetchPendingRewards,
      fetchPendingWithdrawals,
      approveReward,
      rejectReward,
      approveWithdrawal,
      rejectWithdrawal,
    });

    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      user: { id: 'admin-1', name: 'Admin User', role: 'admin' },
      logout,
    });
  });

  it('renders the admin overview shell and live metrics without a notification action', async () => {
    const { getByText, queryByTestId } = render(<AdminHomeScreen />);

    expect(getByText('Admin Panel')).toBeTruthy();
    expect(queryByTestId('admin-notification-button')).toBeNull();
    expect(getByText("Today's Overview")).toBeTruthy();
    expect(getByText('Active Pickups')).toBeTruthy();
    expect(getByText('4')).toBeTruthy();
    expect(getByText('Completed Today')).toBeTruthy();
    expect(getByText('9')).toBeTruthy();
    expect(getByText('Collected Weight')).toBeTruthy();
    expect(getByText('128.5 kg')).toBeTruthy();
    expect(getByText('Live Feed')).toBeTruthy();
    expect(getByText('Pickup completed')).toBeTruthy();

    await waitFor(() => expect(fetchOverviewData).toHaveBeenCalledTimes(1));
  });

  it('shows three enabled admin nav items and switches to Earnings', async () => {
    const { getByTestId, getByText } = render(<AdminHomeScreen />);

    expect(getByText('Overview')).toBeTruthy();
    expect(getByText('Earnings')).toBeTruthy();
    expect(getByText('Profile')).toBeTruthy();

    expect(getByTestId('admin-nav-overview').props.accessibilityState.selected).toBe(true);
    expect(getByTestId('admin-nav-earnings').props.accessibilityState.disabled).toBe(false);
    expect(getByTestId('admin-nav-profile').props.accessibilityState.disabled).toBe(false);

    fireEvent.press(getByTestId('admin-nav-earnings'));
    expect(getByTestId('admin-nav-earnings').props.accessibilityState.selected).toBe(true);
    expect(getByText('Earnings Review')).toBeTruthy();

    await waitFor(() => {
      expect(fetchPendingRewards).toHaveBeenCalledTimes(1);
      expect(fetchPendingWithdrawals).toHaveBeenCalledTimes(1);
    });
  });

  it('renders rewards and withdrawal sections with actions', () => {
    const { getByTestId, getByText, getAllByText } = render(<AdminHomeScreen />);

    fireEvent.press(getByTestId('admin-nav-earnings'));
    expect(getByText('Rewards')).toBeTruthy();
    expect(getByText('Withdrawal')).toBeTruthy();
    expect(getByText('Reward User')).toBeTruthy();
    expect(getByText('+Rp 12,500')).toBeTruthy();

    fireEvent.press(getAllByText('Allow')[0]);
    expect(approveReward).toHaveBeenCalledWith('reward-1');

    fireEvent.press(getAllByText('Deny')[0]);
    expect(rejectReward).toHaveBeenCalledWith('reward-1');

    fireEvent.press(getByText('Withdrawal'));
    expect(getByText('Withdrawal User')).toBeTruthy();
    expect(getByText('BCA • 1234567890')).toBeTruthy();
    expect(getAllByText('Rp 50,000').length).toBeGreaterThan(0);

    fireEvent.press(getAllByText('Allow')[0]);
    expect(approveWithdrawal).toHaveBeenCalledWith('withdrawal-1');

    fireEvent.press(getAllByText('Deny')[0]);
    expect(rejectWithdrawal).toHaveBeenCalledWith('withdrawal-1');
  });

  it('renders admin profile actions and logs out from the profile tab', () => {
    const { getByTestId, getByText } = render(<AdminHomeScreen />);

    fireEvent.press(getByTestId('admin-nav-profile'));

    expect(getByText('Admin User')).toBeTruthy();
    expect(getByText('Admin')).toBeTruthy();
    expect(getByText('7')).toBeTruthy();
    expect(getByText('21')).toBeTruthy();
    expect(getByText('6')).toBeTruthy();
    expect(getByText('Settings')).toBeTruthy();
    expect(getByText('Account Settings')).toBeTruthy();
    expect(getByText('Help & Support')).toBeTruthy();
    expect(getByText('Log Out')).toBeTruthy();

    fireEvent.press(getByText('Log Out'));
    expect(logout).toHaveBeenCalledTimes(1);
    expect(fetchAdminProfileData).toHaveBeenCalledTimes(1);
  });
});
