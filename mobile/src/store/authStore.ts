import { create } from 'zustand';
import { supabase } from '../services/api/supabase';

interface UserProfile {
  id: string;
  name: string;
  email?: string;
  role: 'user' | 'collector' | 'admin';
  balance: number;
  current_lat?: number | null;
  current_lng?: number | null;
  home_address?: string | null;
  home_lat?: number | null;
  home_lng?: number | null;
  phone_number?: string | null;
  avatar_url?: string | null;
  vehicle_type?: string | null;
  vehicle_plate?: string | null;
  operating_area?: string | null;
}

const normalizeProfile = (profile: any, authEmail?: string | null): UserProfile => {
  const role = String(profile?.role || 'user').trim().toLowerCase();

  return {
    ...profile,
    email: authEmail || profile?.email,
    role: role === 'admin' || role === 'collector' ? role : 'user',
    balance: Number(profile?.balance || 0),
  };
};

interface AuthState {
  user: UserProfile | null;
  session: any | null;
  transactions: any[];
  withdrawals: any[];
  initialized: boolean;
  setUser: (user: UserProfile | null) => void;
  setSession: (session: any | null) => void;
  initialize: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: {
    name?: string;
    phone_number?: string | null;
    avatar_url?: string | null;
    vehicle_type?: string | null;
    vehicle_plate?: string | null;
    operating_area?: string | null;
  }) => Promise<{ success: boolean; error?: string }>;
  fetchTransactions: () => Promise<void>;
  fetchWithdrawals: () => Promise<void>;
  requestWithdrawal: (data: {
    amount: number;
    bank_name: string;
    account_number: string;
    account_holder_name: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  transactions: [],
  withdrawals: [],
  initialized: false,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  initialize: async () => {
    if (get().initialized) return;

    // 1. Get initial session
    const { data: { session } } = await supabase.auth.getSession();
    set({ session, initialized: true });

    if (session?.user) {
      // 2. Fetch profile from public.users
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
      
      if (profile) {
        set({ user: normalizeProfile(profile, session.user.email) });
      }
    }

    // 3. Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.email);
      set({ session, user: null });
      
      if (session?.user) {
        try {
          // Add a tiny delay to allow profile creation to finish if this was a sign-up
          if (event === 'SIGNED_IN') {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }

          const { data: profile, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();
          
          if (error) {
            console.warn('Profile fetch error:', error.message);
            return;
          }

          if (profile) {
            set({ user: normalizeProfile(profile, session.user.email) });
          } else {
            console.warn('No profile found for user ID:', session.user.id);
          }
        } catch (err) {
          console.error('Error in onAuthStateChange profile fetch:', err);
        }
      } else {
        set({ user: null });
      }
    });
  },
  fetchProfile: async () => {
    const userId = get().session?.user?.id;
    if (!userId) return;

    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    if (profile && !error) {
      const authEmail = get().session?.user?.email;
      set({ user: normalizeProfile(profile, authEmail) });
    }
  },
  updateProfile: async (profileData) => {
    const userId = get().user?.id || get().session?.user?.id;
    const user = get().user;
    if (!userId || !user) return { success: false, error: 'Not authenticated' };

    const updates = Object.fromEntries(
      Object.entries(profileData).filter(([, value]) => value !== undefined)
    );

    if (Object.keys(updates).length === 0) {
      return { success: true };
    }

    const { error } = await (supabase.from('users') as any)
      .update(updates)
      .eq('id', userId);

    if (error) return { success: false, error: error.message };

    set({ user: normalizeProfile({ ...user, ...updates }) });
    return { success: true };
  },
  fetchTransactions: async () => {
    const userId = get().session?.user?.id;
    if (!userId) return;

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching transactions:', error);
    } else {
      set({ transactions: data || [] });
    }
  },
  fetchWithdrawals: async () => {
    const userId = get().session?.user?.id;
    if (!userId) return;

    const { data, error } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching withdrawals:', error);
    } else {
      set({ withdrawals: data || [] });
    }
  },
  requestWithdrawal: async (withdrawalData) => {
    const userId = get().session?.user?.id;
    const user = get().user;
    if (!userId || !user) return { success: false, error: 'Not authenticated' };

    if (user.balance < withdrawalData.amount) {
      return { success: false, error: 'Insufficient balance' };
    }

    try {
      // 1. Create withdrawal record
      const { data: withdrawal, error: withdrawalError } = await supabase
        .from('withdrawals')
        .insert({
          user_id: userId,
          amount: withdrawalData.amount,
          bank_name: withdrawalData.bank_name,
          account_number: withdrawalData.account_number,
          account_holder_name: withdrawalData.account_holder_name,
          status: 'REQUESTED'
        })
        .select()
        .single();

      if (withdrawalError) throw withdrawalError;

      // 2. Create transaction record (DEBIT - COMPLETED)
      // Actually, for withdrawals, we should probably set it to PENDING until approved?
      // No, the system says withdrawal is REQUESTED. When admin approves, it moves to COMPLETED.
      // But the balance should be deducted immediately or at least "locked".
      
      // Let's deduct balance immediately to prevent double-spending.
      const newBalance = user.balance - withdrawalData.amount;
      const { error: updateError } = await supabase
        .from('users')
        .update({ balance: newBalance })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Update local state
      set({ user: { ...user, balance: newBalance } });

      // Create a transaction record for the withdrawal
      await supabase.from('transactions').insert({
        user_id: userId,
        type: 'DEBIT',
        amount: withdrawalData.amount,
        status: 'COMPLETED', // Transaction is completed once balance is deducted
        ref_id: withdrawal.id
      });

      // Refresh data
      await Promise.all([
        get().fetchTransactions(),
        get().fetchWithdrawals()
      ]);

      return { success: true };
    } catch (err: any) {
      console.error('Withdrawal request failed:', err);
      return { success: false, error: err.message };
    }
  },
  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, transactions: [], withdrawals: [] });
  },
  deleteAccount: async () => {
    const userId = get().user?.id || get().session?.user?.id;
    if (!userId) return { success: false, error: 'Not authenticated' };

    const { error } = await (supabase.from('users') as any)
      .delete()
      .eq('id', userId);

    if (error) return { success: false, error: error.message };

    await supabase.auth.signOut();
    set({ user: null, session: null, transactions: [], withdrawals: [] });
    return { success: true };
  },
}));
