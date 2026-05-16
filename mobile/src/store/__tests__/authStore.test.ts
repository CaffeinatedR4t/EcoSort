import { useAuthStore } from '../authStore';
import { supabase } from '../../services/api/supabase';

jest.mock('../../services/api/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(),
  },
}));

describe('authStore role routing state', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      user: null,
      session: null,
      transactions: [],
      withdrawals: [],
      initialized: false,
    });
  });

  it('clears a stale user while loading the newly signed-in admin profile', async () => {
    let authCallback: any;
    const adminSession = { user: { id: 'admin-1', email: 'admin@ecosort.test' } };
    const adminProfile = { id: 'admin-1', name: 'Admin', role: 'admin', balance: 0 };
    const maybeSingle = jest.fn(async () => ({ data: adminProfile, error: null }));
    const eq = jest.fn(() => ({ maybeSingle }));
    const select = jest.fn(() => ({ eq }));

    (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: null } });
    (supabase.auth.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
      authCallback = callback;
      return { data: { subscription: { unsubscribe: jest.fn() } } };
    });
    (supabase.from as jest.Mock).mockReturnValue({ select });

    await useAuthStore.getState().initialize();
    useAuthStore.getState().setUser({ id: 'user-1', name: 'User', role: 'user', balance: 0 });

    const authPromise = authCallback('SIGNED_IN', adminSession);

    expect(useAuthStore.getState().user).toBeNull();

    await authPromise;
    expect(useAuthStore.getState().user?.role).toBe('admin');
  });
});
