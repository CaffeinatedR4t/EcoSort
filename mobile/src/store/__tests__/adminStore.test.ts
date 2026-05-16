import { useAdminStore } from '../adminStore';
import { supabase } from '../../services/api/supabase';

jest.mock('../../services/api/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock('../notificationStore', () => ({
  useNotificationStore: {
    getState: () => ({
      createNotification: jest.fn(),
    }),
  },
}));

describe('adminStore Supabase-backed dashboard data', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAdminStore.setState({
      pendingRewards: [],
      pendingWithdrawals: [],
      adminProfileMetrics: {
        pendingReviews: 0,
        activePickups: 0,
        totalUsers: 0,
        totalCollectors: 0,
      },
      loading: false,
      overviewLoading: false,
    });
  });

  it('fetches admin profile metrics from Supabase instead of deriving mock values', async () => {
    const countResponses: Record<string, number> = {
      'transactions:status:PENDING:type:CREDIT': 3,
      'withdrawals:status:REQUESTED': 2,
      'pickup_requests:status:ASSIGNED,IN_PROGRESS': 4,
      'users:role:user': 12,
      'users:role:collector': 5,
    };

    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      const filters: string[] = [];
      const query: any = {
        select: jest.fn(() => query),
        eq: jest.fn((column: string, value: string) => {
          filters.push(`${column}:${value}`);
          return query;
        }),
        in: jest.fn((column: string, values: string[]) => {
          filters.push(`${column}:${values.join(',')}`);
          return query;
        }),
        then: (resolve: any) => {
          const key = `${table}:${filters.join(':')}`;
          resolve({ count: countResponses[key] ?? 0, error: null });
        },
      };
      return query;
    });

    await useAdminStore.getState().fetchAdminProfileData();

    expect(useAdminStore.getState().adminProfileMetrics).toEqual({
      pendingReviews: 5,
      activePickups: 4,
      totalUsers: 12,
      totalCollectors: 5,
    });
  });
});
