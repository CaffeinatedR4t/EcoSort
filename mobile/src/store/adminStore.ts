import { create } from 'zustand';
import { supabase } from '../services/api/supabase';

interface AdminState {
  pendingRewards: any[];
  pendingWithdrawals: any[];
  loading: boolean;
  fetchPendingRewards: () => Promise<void>;
  fetchPendingWithdrawals: () => Promise<void>;
  approveReward: (transactionId: string) => Promise<{ success: boolean; error?: string }>;
  rejectReward: (transactionId: string) => Promise<{ success: boolean; error?: string }>;
  approveWithdrawal: (withdrawalId: string) => Promise<{ success: boolean; error?: string }>;
  rejectWithdrawal: (withdrawalId: string) => Promise<{ success: boolean; error?: string }>;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  pendingRewards: [],
  pendingWithdrawals: [],
  loading: false,

  fetchPendingRewards: async () => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('transactions')
      .select('*, users(name)')
      .eq('status', 'PENDING')
      .eq('type', 'CREDIT')
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching pending rewards:', error);
    } else {
      set({ pendingRewards: data || [] });
    }
    set({ loading: false });
  },

  fetchPendingWithdrawals: async () => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('withdrawals')
      .select('*, users(name)')
      .eq('status', 'REQUESTED')
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching pending withdrawals:', error);
    } else {
      set({ pendingWithdrawals: data || [] });
    }
    set({ loading: false });
  },

  approveReward: async (transactionId) => {
    set({ loading: true });
    try {
      // 1. Get the transaction details
      const { data: tx, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .single();
      
      if (fetchError) throw fetchError;

      // 2. Update transaction status
      const { error: updateError } = await supabase
        .from('transactions')
        .update({ status: 'COMPLETED' })
        .eq('id', transactionId);
      
      if (updateError) throw updateError;

      // 3. Update user balance
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('balance')
        .eq('id', tx.user_id)
        .single();
      
      if (userError) throw userError;

      const { error: balanceError } = await supabase
        .from('users')
        .update({ balance: (user.balance || 0) + tx.amount })
        .eq('id', tx.user_id);
      
      if (balanceError) throw balanceError;

      await get().fetchPendingRewards();
      return { success: true };
    } catch (err: any) {
      console.error('Approve reward failed:', err);
      return { success: false, error: err.message };
    } finally {
      set({ loading: false });
    }
  },

  rejectReward: async (transactionId) => {
    set({ loading: true });
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ status: 'FAILED' })
        .eq('id', transactionId);
      
      if (error) throw error;
      await get().fetchPendingRewards();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      set({ loading: false });
    }
  },

  approveWithdrawal: async (withdrawalId) => {
    set({ loading: true });
    try {
      const { error } = await supabase
        .from('withdrawals')
        .update({ status: 'COMPLETED' })
        .eq('id', withdrawalId);
      
      if (error) throw error;
      await get().fetchPendingWithdrawals();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      set({ loading: false });
    }
  },

  rejectWithdrawal: async (withdrawalId) => {
    set({ loading: true });
    try {
      // 1. Get withdrawal details to refund balance
      const { data: withdrawal, error: fetchError } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('id', withdrawalId)
        .single();
      
      if (fetchError) throw fetchError;

      // 2. Update withdrawal status
      const { error: updateError } = await supabase
        .from('withdrawals')
        .update({ status: 'FAILED' })
        .eq('id', withdrawalId);
      
      if (updateError) throw updateError;

      // 3. Refund user balance
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('balance')
        .eq('id', withdrawal.user_id)
        .single();
      
      if (userError) throw userError;

      const { error: balanceError } = await supabase
        .from('users')
        .update({ balance: (user.balance || 0) + withdrawal.amount })
        .eq('id', withdrawal.user_id);
      
      if (balanceError) throw balanceError;

      // 4. Update transaction status
      await supabase
        .from('transactions')
        .update({ status: 'FAILED' })
        .eq('ref_id', withdrawalId);

      await get().fetchPendingWithdrawals();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      set({ loading: false });
    }
  },
}));
