import { create } from 'zustand';
import { supabase } from '../services/api/supabase';
import { useNotificationStore } from './notificationStore';

export interface AdminOverviewMetrics {
  activePickups: number;
  completedToday: number;
  collectedWeightToday: number;
}

export interface AdminProfileMetrics {
  pendingReviews: number;
  activePickups: number;
  totalUsers: number;
  totalCollectors: number;
}

export interface AdminLiveFeedItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'pickup' | 'reward' | 'withdrawal';
}

interface AdminState {
  pendingRewards: any[];
  pendingWithdrawals: any[];
  overviewMetrics: AdminOverviewMetrics;
  adminProfileMetrics: AdminProfileMetrics;
  liveFeed: AdminLiveFeedItem[];
  loading: boolean;
  overviewLoading: boolean;
  fetchOverviewData: () => Promise<void>;
  fetchAdminProfileData: () => Promise<void>;
  fetchPendingRewards: () => Promise<void>;
  fetchPendingWithdrawals: () => Promise<void>;
  approveReward: (transactionId: string) => Promise<{ success: boolean; error?: string }>;
  rejectReward: (transactionId: string) => Promise<{ success: boolean; error?: string }>;
  approveWithdrawal: (withdrawalId: string) => Promise<{ success: boolean; error?: string }>;
  rejectWithdrawal: (withdrawalId: string) => Promise<{ success: boolean; error?: string }>;
}

const emptyOverviewMetrics: AdminOverviewMetrics = {
  activePickups: 0,
  completedToday: 0,
  collectedWeightToday: 0,
};

const emptyAdminProfileMetrics: AdminProfileMetrics = {
  pendingReviews: 0,
  activePickups: 0,
  totalUsers: 0,
  totalCollectors: 0,
};

const formatRelativeTime = (value: string) => {
  const diffMs = Date.now() - new Date(value).getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

const getPickupFeedTitle = (status: string) => {
  if (status === 'COMPLETED') return 'Pickup completed';
  if (status === 'IN_PROGRESS') return 'Pickup in progress';
  if (status === 'ASSIGNED') return 'Collector assigned';
  return 'New pickup request';
};

const getTransactionFeedTitle = (status: string) => {
  if (status === 'COMPLETED') return 'Reward approved';
  if (status === 'FAILED') return 'Reward rejected';
  return 'Reward awaiting approval';
};

const getWithdrawalFeedTitle = (status: string) => {
  if (status === 'COMPLETED') return 'Withdrawal completed';
  if (status === 'FAILED') return 'Withdrawal rejected';
  return 'Withdrawal requested';
};

export const useAdminStore = create<AdminState>((set, get) => ({
  pendingRewards: [],
  pendingWithdrawals: [],
  overviewMetrics: emptyOverviewMetrics,
  adminProfileMetrics: emptyAdminProfileMetrics,
  liveFeed: [],
  loading: false,
  overviewLoading: false,

  fetchOverviewData: async () => {
    set({ overviewLoading: true });

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayIso = today.toISOString();

      const { count: activePickupsCount, error: activeError } = await (supabase
        .from('pickup_requests') as any)
        .select('id', { count: 'exact', head: true })
        .in('status', ['ASSIGNED', 'IN_PROGRESS']);

      if (activeError) throw activeError;

      const { data: completedPickups, error: completedError } = await (supabase
        .from('pickup_requests') as any)
        .select('id')
        .eq('status', 'COMPLETED')
        .gte('created_at', todayIso);

      if (completedError) throw completedError;

      const completedIds = (completedPickups || []).map((pickup: any) => pickup.id);
      let collectedWeightToday = 0;

      if (completedIds.length > 0) {
        const { data: classifications, error: classificationsError } = await (supabase
          .from('waste_classifications') as any)
          .select('collector_weight_kg')
          .in('pickup_id', completedIds);

        if (classificationsError) throw classificationsError;

        collectedWeightToday = (classifications || []).reduce(
          (total: number, item: any) => total + (Number(item.collector_weight_kg) || 0),
          0
        );
      }

      const { data: recentPickups, error: feedError } = await (supabase
        .from('pickup_requests') as any)
        .select('id, status, waste_hint, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (feedError) throw feedError;

      const { data: recentTransactions, error: transactionsError } = await (supabase
        .from('transactions') as any)
        .select('id, type, amount, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (transactionsError) throw transactionsError;

      const { data: recentWithdrawals, error: withdrawalsError } = await (supabase
        .from('withdrawals') as any)
        .select('id, amount, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (withdrawalsError) throw withdrawalsError;

      const pickupFeed = (recentPickups || []).map((pickup: any) => ({
        id: pickup.id,
        title: getPickupFeedTitle(pickup.status),
        description: pickup.waste_hint || 'Pickup request updated',
        timestamp: formatRelativeTime(pickup.created_at),
        type: 'pickup',
        createdAt: pickup.created_at,
      }));

      const transactionFeed = (recentTransactions || []).map((transaction: any) => ({
        id: transaction.id,
        title: getTransactionFeedTitle(transaction.status),
        description: `${transaction.type === 'DEBIT' ? 'Debit' : 'Credit'} Rp ${Number(transaction.amount || 0).toLocaleString()}`,
        timestamp: formatRelativeTime(transaction.created_at),
        type: 'reward',
        createdAt: transaction.created_at,
      }));

      const withdrawalFeed = (recentWithdrawals || []).map((withdrawal: any) => ({
        id: withdrawal.id,
        title: getWithdrawalFeedTitle(withdrawal.status),
        description: `Payout Rp ${Number(withdrawal.amount || 0).toLocaleString()}`,
        timestamp: formatRelativeTime(withdrawal.created_at),
        type: 'withdrawal',
        createdAt: withdrawal.created_at,
      }));

      const liveFeed = [...pickupFeed, ...transactionFeed, ...withdrawalFeed]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
        .map(({ createdAt, ...item }) => item as AdminLiveFeedItem);

      set({
        overviewMetrics: {
          activePickups: activePickupsCount || 0,
          completedToday: completedIds.length,
          collectedWeightToday,
        },
        liveFeed,
      });
    } catch (err) {
      console.error('Error fetching admin overview:', err);
      set({
        overviewMetrics: emptyOverviewMetrics,
        liveFeed: [],
      });
    } finally {
      set({ overviewLoading: false });
    }
  },

  fetchAdminProfileData: async () => {
    set({ loading: true });

    try {
      const [
        pendingRewardsResult,
        pendingWithdrawalsResult,
        activePickupsResult,
        usersResult,
        collectorsResult,
      ] = await Promise.all([
        (supabase
          .from('transactions') as any)
          .select('id', { count: 'exact', head: true })
          .eq('status', 'PENDING')
          .eq('type', 'CREDIT'),
        (supabase
          .from('withdrawals') as any)
          .select('id', { count: 'exact', head: true })
          .eq('status', 'REQUESTED'),
        (supabase
          .from('pickup_requests') as any)
          .select('id', { count: 'exact', head: true })
          .in('status', ['ASSIGNED', 'IN_PROGRESS']),
        (supabase
          .from('users') as any)
          .select('id', { count: 'exact', head: true })
          .eq('role', 'user'),
        (supabase
          .from('users') as any)
          .select('id', { count: 'exact', head: true })
          .eq('role', 'collector'),
      ]);

      const firstError = [
        pendingRewardsResult,
        pendingWithdrawalsResult,
        activePickupsResult,
        usersResult,
        collectorsResult,
      ].find((result) => result.error)?.error;

      if (firstError) throw firstError;

      set({
        adminProfileMetrics: {
          pendingReviews: (pendingRewardsResult.count || 0) + (pendingWithdrawalsResult.count || 0),
          activePickups: activePickupsResult.count || 0,
          totalUsers: usersResult.count || 0,
          totalCollectors: collectorsResult.count || 0,
        },
      });
    } catch (err) {
      console.error('Error fetching admin profile metrics:', err);
      set({ adminProfileMetrics: emptyAdminProfileMetrics });
    } finally {
      set({ loading: false });
    }
  },

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

      // 4. Create Notification
      await useNotificationStore.getState().createNotification({
        userId: tx.user_id,
        title: 'Reward Approved! 🎉',
        message: `Your reward of Rp ${tx.amount.toLocaleString()} has been approved and added to your wallet.`,
        type: 'reward'
      });

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
