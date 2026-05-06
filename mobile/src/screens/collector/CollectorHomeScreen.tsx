import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Alert, 
  RefreshControl, 
  TouchableOpacity, 
  StatusBar,
  Platform,
  useWindowDimensions
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../services/theme/colors';
import { spacing } from '../../services/theme/spacing';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { useAuthStore } from '../../store/authStore';
import { usePickupStore } from '../../store/pickupStore';
import { LogOut, Package, Map as MapIcon, Navigation } from 'lucide-react-native';

export const CollectorHomeScreen = () => {
  const { user, logout } = useAuthStore();
  const { requests, fetchPendingRequests, fetchAssignedRequests, acceptRequest, loading } = usePickupStore();
  const [tab, setTab] = useState<'available' | 'active'>('available');
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  useEffect(() => {
    loadData();
  }, [tab]);

  const loadData = async () => {
    if (!user) return;
    if (tab === 'available') {
      await fetchPendingRequests();
    } else {
      await fetchAssignedRequests(user.id);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAccept = async (requestId: string) => {
    if (!user) return;
    try {
      await acceptRequest(requestId, user.id);
      Alert.alert('Success', 'Job accepted! It is now in your active route.');
      setTab('active');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const renderJobItem = ({ item }: { item: typeof requests[0] }) => (
    <Card style={styles.jobCard}>
      <TouchableOpacity 
        style={styles.jobInfo} 
        onPress={() => tab === 'active' && navigation.navigate('CollectorJobDetail', { job: item })}
        disabled={tab === 'available'}
      >
        <Package color={colors.primary} size={24} />
        <View style={styles.jobText}>
          <Text style={styles.jobAddress} numberOfLines={1}>{item.location.address}</Text>
          <Text style={styles.jobDate}>{new Date(item.created_at).toLocaleTimeString()}</Text>
          {tab === 'active' && <Text style={styles.jobHint}>{item.waste_hint}</Text>}
        </View>
      </TouchableOpacity>
      
      {tab === 'available' ? (
        <Button 
          title="Accept" 
          onPress={() => handleAccept(item.id)} 
          loading={loading}
          style={styles.acceptBtn}
          textStyle={{ fontSize: 14 }}
        />
      ) : (
        <Navigation color={colors.primary} size={20} />
      )}
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Collector Mode</Text>
          <Text style={styles.userName}>{user?.name}</Text>
        </View>
        <LogOut color={colors.error} size={24} onPress={logout} />
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tab, tab === 'available' && styles.tabActive]} 
          onPress={() => setTab('available')}
        >
          <Text style={[styles.tabText, tab === 'available' && styles.tabTextActive]}>Available</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, tab === 'active' && styles.tabActive]} 
          onPress={() => setTab('active')}
        >
          <Text style={[styles.tabText, tab === 'active' && styles.tabTextActive]}>Active ({requests.length})</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <FlatList
          data={requests}
          renderItem={renderJobItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Package color={colors.textBlackSoft} size={48} style={{ opacity: 0.2 }} />
              <Text style={styles.emptyText}>
                {tab === 'available' ? 'No available pickups right now.' : 'You have no active jobs.'}
              </Text>
            </View>
          }
        />
      </View>

      {tab === 'active' && requests.length > 0 && (
        <View style={styles.floatingContainer}>
          <Button 
            title="Optimize Route" 
            onPress={() => Alert.alert('Coming Soon', 'TSP Route Optimization will be available in Phase 3.')} 
            style={styles.routeBtn}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutralWarm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.ceramic,
  },
  greeting: {
    fontSize: 14,
    color: colors.textBlackSoft,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textBlack,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    padding: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textBlackSoft,
  },
  tabTextActive: {
    color: colors.white,
  },
  statsRow: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textBlackSoft,
    marginTop: 2,
  },
  section: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textBlack,
  },
  listContent: {
    paddingBottom: 100,
  },
  jobCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  jobInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  jobText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  jobAddress: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textBlack,
  },
  jobDate: {
    fontSize: 12,
    color: colors.textBlackSoft,
  },
  jobHint: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  acceptBtn: {
    height: 36,
    paddingHorizontal: spacing.md,
    marginLeft: spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textBlackSoft,
    marginTop: spacing.md,
  },
  floatingContainer: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.lg,
    right: spacing.lg,
  },
  routeBtn: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
});
