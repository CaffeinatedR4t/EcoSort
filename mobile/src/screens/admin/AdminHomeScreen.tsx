import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl, 
  Alert,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAdminStore } from '../../store/adminStore';
import { useAuthStore } from '../../store/authStore';
import { useNavigation } from '@react-navigation/native';
import { spacing } from '../../services/theme/spacing';
import { Card } from '../../components/Card';
import { Logo } from '../../components/Logo';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Wallet, 
  Recycle, 
  ChevronRight,
  LogOut
} from 'lucide-react-native';

export const AdminHomeScreen = () => {
  const navigation = useNavigation<any>();
  const { 
    pendingRewards, 
    pendingWithdrawals, 
    loading, 
    fetchPendingRewards, 
    fetchPendingWithdrawals,
    approveReward,
    rejectReward,
    approveWithdrawal,
    rejectWithdrawal
  } = useAdminStore();
  
  const { logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'REWARDS' | 'WITHDRAWALS'>('REWARDS');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Logout', 
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
            // Force reset navigation to ensure we go to auth stack
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          } catch (err) {
            console.error('Logout error:', err);
            Alert.alert('Error', 'Failed to log out. Please try again.');
          }
        }
      }
    ]);
  };

  const loadData = async () => {
    await Promise.all([
      fetchPendingRewards(),
      fetchPendingWithdrawals()
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleApproveReward = (id: string, amount: number, userName: string) => {
    Alert.alert(
      'Approve Reward',
      `Approve Rp ${amount.toLocaleString()} for ${userName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Approve', onPress: () => approveReward(id) }
      ]
    );
  };

  const handleRejectReward = (id: string) => {
    Alert.alert(
      'Reject Reward',
      'Are you sure you want to reject this reward?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reject', style: 'destructive', onPress: () => rejectReward(id) }
      ]
    );
  };

  const handleApproveWithdrawal = (id: string, amount: number, userName: string) => {
    Alert.alert(
      'Approve Withdrawal',
      `Mark Rp ${amount.toLocaleString()} withdrawal for ${userName} as COMPLETED?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => approveWithdrawal(id) }
      ]
    );
  };

  const handleRejectWithdrawal = (id: string) => {
    Alert.alert(
      'Reject Withdrawal',
      'Reject this withdrawal? The amount will be refunded to the user.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reject', style: 'destructive', onPress: () => rejectWithdrawal(id) }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <View style={styles.logoGroup}>
            <Logo size={32} />
            <Text style={styles.logoText}>Admin Panel</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <LogOut color="#e11d48" size={20} />
          </TouchableOpacity>
        </View>

        <View style={styles.tabBar}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'REWARDS' && styles.activeTab]}
            onPress={() => setActiveTab('REWARDS')}
          >
            <Recycle color={activeTab === 'REWARDS' ? '#006948' : '#9ca3af'} size={20} />
            <Text style={[styles.tabText, activeTab === 'REWARDS' && styles.activeTabText]}>Rewards</Text>
            {pendingRewards.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingRewards.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'WITHDRAWALS' && styles.activeTab]}
            onPress={() => setActiveTab('WITHDRAWALS')}
          >
            <Wallet color={activeTab === 'WITHDRAWALS' ? '#006948' : '#9ca3af'} size={20} />
            <Text style={[styles.tabText, activeTab === 'WITHDRAWALS' && styles.activeTabText]}>Withdrawals</Text>
            {pendingWithdrawals.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingWithdrawals.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {loading && !refreshing ? (
            <ActivityIndicator size="large" color="#006948" style={{ marginTop: 40 }} />
          ) : activeTab === 'REWARDS' ? (
            pendingRewards.length > 0 ? (
              pendingRewards.map(reward => (
                <Card key={reward.id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{reward.users?.name}</Text>
                      <Text style={styles.itemDate}>
                        {new Date(reward.created_at).toLocaleDateString()} • {new Date(reward.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    <Text style={styles.rewardAmount}>+Rp {reward.amount.toLocaleString()}</Text>
                  </View>
                  
                  <View style={styles.divider} />
                  
                  <View style={styles.actionRow}>
                    <TouchableOpacity 
                      style={[styles.actionBtn, styles.rejectBtn]}
                      onPress={() => handleRejectReward(reward.id)}
                    >
                      <XCircle color="#e11d48" size={20} />
                      <Text style={styles.rejectText}>Reject</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.actionBtn, styles.approveBtn]}
                      onPress={() => handleApproveReward(reward.id, reward.amount, reward.users?.name)}
                    >
                      <CheckCircle color="#006948" size={20} />
                      <Text style={styles.approveText}>Approve</Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Clock color="#9ca3af" size={48} />
                <Text style={styles.emptyText}>No pending rewards</Text>
              </View>
            )
          ) : (
            pendingWithdrawals.length > 0 ? (
              pendingWithdrawals.map(draw => (
                <Card key={draw.id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{draw.users?.name}</Text>
                      <Text style={styles.itemDate}>
                        {new Date(draw.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text style={styles.drawAmount}>-Rp {draw.amount.toLocaleString()}</Text>
                  </View>
                  
                  <View style={styles.bankInfo}>
                    <Text style={styles.bankLabel}>BANK DETAILS</Text>
                    <Text style={styles.bankDetail}>{draw.bank_name} • {draw.account_number}</Text>
                    <Text style={styles.bankDetail}>{draw.account_holder_name}</Text>
                  </View>
                  
                  <View style={styles.divider} />
                  
                  <View style={styles.actionRow}>
                    <TouchableOpacity 
                      style={[styles.actionBtn, styles.rejectBtn]}
                      onPress={() => handleRejectWithdrawal(draw.id)}
                    >
                      <XCircle color="#e11d48" size={20} />
                      <Text style={styles.rejectText}>Reject</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.actionBtn, styles.approveBtn]}
                      onPress={() => handleApproveWithdrawal(draw.id, draw.amount, draw.users?.name)}
                    >
                      <CheckCircle color="#006948" size={20} />
                      <Text style={styles.approveText}>Complete</Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Clock color="#9ca3af" size={48} />
                <Text style={styles.emptyText}>No pending withdrawals</Text>
              </View>
            )
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  logoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#006948',
  },
  logoutBtn: {
    padding: 8,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: spacing.xs,
    gap: spacing.xs,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: '#f1f8e9',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
  },
  activeTabText: {
    color: '#006948',
  },
  badge: {
    backgroundColor: '#006948',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  scrollContent: {
    padding: spacing.lg,
  },
  itemCard: {
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: 20,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 2,
  },
  itemDate: {
    fontSize: 12,
    color: '#64748b',
  },
  rewardAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#059669',
  },
  drawAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#e11d48',
  },
  bankInfo: {
    backgroundColor: '#f8fafc',
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  bankLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 1,
    marginBottom: 4,
  },
  bankDetail: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginBottom: spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  rejectBtn: {
    borderColor: '#fee2e2',
    backgroundColor: '#fff1f2',
  },
  approveBtn: {
    borderColor: '#dcfce7',
    backgroundColor: '#f0fdf4',
  },
  rejectText: {
    color: '#e11d48',
    fontSize: 14,
    fontWeight: '700',
  },
  approveText: {
    color: '#006948',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '600',
  },
});
