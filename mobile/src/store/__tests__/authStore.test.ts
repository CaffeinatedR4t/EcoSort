import { useAuthStore } from '../authStore';
import { supabase } from '../../services/api/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

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
    AsyncStorage.clear();
    useAuthStore.setState({
      user: null,
      session: null,
      transactions: [],
      withdrawals: [],
      initialized: false,
    });
  });

  it('clears a pending offline profile draft after a successful profile update', async () => {
    const eq = jest.fn().mockResolvedValue({ error: null });
    const update = jest.fn(() => ({ eq }));
    (supabase.from as jest.Mock).mockReturnValue({ update });

    await AsyncStorage.setItem(
      'offline_profile_update:user-1',
      JSON.stringify({ name: 'Offline Name', updated_at: '2026-05-19T00:00:00.000Z' })
    );

    useAuthStore.setState({
      user: { id: 'user-1', name: 'User', role: 'user', balance: 0, phone_number: null },
      session: { user: { id: 'user-1', email: 'user@ecosort.test' } },
    });

    const result = await useAuthStore.getState().updateProfile({ name: 'Online Name' });

    expect(result).toEqual({ success: true });
    expect(update).toHaveBeenCalledWith({ name: 'Online Name' });
    expect(await AsyncStorage.getItem('offline_profile_update:user-1')).toBeNull();
    expect(useAuthStore.getState().user?.name).toBe('Online Name');
  });

  it('stores name and phone as an offline draft when profile update fails from network', async () => {
    const eq = jest.fn().mockResolvedValue({ error: { message: 'Network request failed' } });
    const update = jest.fn(() => ({ eq }));
    (supabase.from as jest.Mock).mockReturnValue({ update });

    useAuthStore.setState({
      user: { id: 'user-1', name: 'User', role: 'user', balance: 0, phone_number: null },
      session: { user: { id: 'user-1', email: 'user@ecosort.test' } },
    });

    const result = await useAuthStore.getState().updateProfile({
      name: 'Offline User',
      phone_number: '+62 812',
      avatar_url: 'https://example.test/avatar.png',
    });

    expect(result).toEqual({ success: true, offline: true });
    expect(useAuthStore.getState().user).toMatchObject({
      name: 'Offline User',
      phone_number: '+62 812',
    });
    expect(useAuthStore.getState().user?.avatar_url).toBeUndefined();

    const draft = JSON.parse((await AsyncStorage.getItem('offline_profile_update:user-1')) || '{}');
    expect(draft).toMatchObject({
      name: 'Offline User',
      phone_number: '+62 812',
    });
    expect(draft.updated_at).toBeTruthy();
  });

  it('does not store an offline draft for non-network profile update errors', async () => {
    const eq = jest.fn().mockResolvedValue({ error: { message: 'permission denied' } });
    const update = jest.fn(() => ({ eq }));
    (supabase.from as jest.Mock).mockReturnValue({ update });

    useAuthStore.setState({
      user: { id: 'user-1', name: 'User', role: 'user', balance: 0, phone_number: null },
      session: { user: { id: 'user-1', email: 'user@ecosort.test' } },
    });

    const result = await useAuthStore.getState().updateProfile({ name: 'Blocked User' });

    expect(result).toEqual({ success: false, error: 'permission denied' });
    expect(await AsyncStorage.getItem('offline_profile_update:user-1')).toBeNull();
    expect(useAuthStore.getState().user?.name).toBe('User');
  });

  it('syncs a pending offline profile draft when fetching profile', async () => {
    const profile = { id: 'user-1', name: 'Server User', role: 'user', balance: 0, phone_number: null };
    const maybeSingle = jest.fn().mockResolvedValue({ data: profile, error: null });
    const fetchEq = jest.fn(() => ({ maybeSingle }));
    const select = jest.fn(() => ({ eq: fetchEq }));
    const updateEq = jest.fn().mockResolvedValue({ error: null });
    const update = jest.fn(() => ({ eq: updateEq }));
    (supabase.from as jest.Mock).mockReturnValue({ select, update });

    await AsyncStorage.setItem(
      'offline_profile_update:user-1',
      JSON.stringify({
        name: 'Offline User',
        phone_number: '+62 812',
        updated_at: '2026-05-19T00:00:00.000Z',
      })
    );

    useAuthStore.setState({
      session: { user: { id: 'user-1', email: 'user@ecosort.test' } },
    });

    await useAuthStore.getState().fetchProfile();

    expect(update).toHaveBeenCalledWith({ name: 'Offline User', phone_number: '+62 812' });
    expect(await AsyncStorage.getItem('offline_profile_update:user-1')).toBeNull();
    expect(useAuthStore.getState().user).toMatchObject({
      name: 'Offline User',
      phone_number: '+62 812',
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

  it('deletes the current public user profile and signs out', async () => {
    const eq = jest.fn().mockResolvedValue({ error: null });
    const deleteFn = jest.fn(() => ({ eq }));
    (supabase.from as jest.Mock).mockReturnValue({ delete: deleteFn });
    (supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null });

    useAuthStore.setState({
      user: { id: 'user-1', name: 'User', role: 'user', balance: 0 },
      session: { user: { id: 'user-1' } },
      transactions: [{ id: 'tx-1' }],
      withdrawals: [{ id: 'wd-1' }],
    });

    const result = await useAuthStore.getState().deleteAccount();

    expect(result).toEqual({ success: true });
    expect(supabase.from).toHaveBeenCalledWith('users');
    expect(deleteFn).toHaveBeenCalled();
    expect(eq).toHaveBeenCalledWith('id', 'user-1');
    expect(supabase.auth.signOut).toHaveBeenCalled();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().transactions).toEqual([]);
  });
});
