import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  StatusBar,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { 
  ChevronLeft, 
  Bell, 
  Truck, 
  CheckCircle2, 
  Wallet, 
  Recycle,
  Clock,
  Trash2,
  X
} from 'lucide-react-native';
import { spacing } from '../../services/theme/spacing';
import { colors } from '../../services/theme/colors';
import { Card } from '../../components/Card';
import { useNotificationStore } from '../../store/notificationStore';
import { useAuthStore } from '../../store/authStore';

export const NotificationScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const { 
    notifications, 
    loading, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotificationStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications(user.id);
    }
  }, [user]);

  const onRefresh = async () => {
    if (user) {
      setRefreshing(true);
      await fetchNotifications(user.id);
      setRefreshing(false);
    }
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'reward': return <Wallet color="#006948" size={20} />;
      case 'pickup': return <Truck color="#006948" size={20} />;
      default: return <Bell color="#006948" size={20} />;
    }
  };

  const handleMarkAllRead = () => {
    if (user) markAllAsRead(user.id);
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      activeOpacity={0.7} 
      onPress={() => !item.is_read && markAsRead(item.id)}
    >
      <Card style={[styles.notificationCard, !item.is_read && styles.unreadCard]}>
        <View style={[styles.iconBox, { backgroundColor: item.is_read ? '#f1f5f9' : '#e0f2f1' }]}>
          {getIcon(item.type)}
        </View>
        <View style={styles.content}>
          <View style={styles.row}>
            <Text style={[styles.title, !item.is_read && styles.unreadTitle]} numberOfLines={1}>{item.title}</Text>
            <TouchableOpacity 
              onPress={() => deleteNotification(item.id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X color="#94a3b8" size={16} />
            </TouchableOpacity>
          </View>
          <Text style={styles.message} numberOfLines={3}>{item.message}</Text>
          <View style={styles.footer}>
            <Text style={styles.time}>{new Date(item.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</Text>
            {!item.is_read && <View style={styles.unreadDot} />}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft color={colors.textBlack} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={handleMarkAllRead}>
          <Text style={styles.markReadText}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Bell color="#cbd5e1" size={64} strokeWidth={1} />
              <Text style={styles.emptyText}>No notifications yet</Text>
              <Text style={styles.emptySub}>We'll alert you when there's an update on your pickups.</Text>
            </View>
          }
        />
      )}
      </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  markReadText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#006948',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: 100, // Space for bottom nav
  },
  notificationCard: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: 16,
    gap: spacing.md,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: spacing.md,
  },
  unreadCard: {
    borderColor: '#e0f2f1',
    backgroundColor: '#f9fdfd',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
    marginRight: 8,
  },
  unreadTitle: {
    color: '#1e293b',
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#006948',
  },
  message: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  time: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
    paddingHorizontal: spacing.xxl,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#475569',
    marginTop: spacing.lg,
  },
  emptySub: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  }
});

