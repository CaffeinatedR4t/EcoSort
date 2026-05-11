import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  StatusBar 
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
  Trash2
} from 'lucide-react-native';
import { spacing } from '../../services/theme/spacing';
import { colors } from '../../services/theme/colors';
import { Card } from '../../components/Card';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'pickup' | 'reward' | 'system';
  time: string;
  isRead: boolean;
}

export const NotificationScreen = () => {
  const navigation = useNavigation<any>();
  
  // Simulated notifications for now (Phase 2 will connect this to Supabase table)
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Reward Approved! 🎉',
      message: 'Your reward for the plastic pickup has been approved. Rp 7,000 added to wallet.',
      type: 'reward',
      time: '2 hours ago',
      isRead: false
    },
    {
      id: '2',
      title: 'Collector Assigned',
      message: 'A collector is on their way to pick up your waste bag.',
      type: 'pickup',
      time: '5 hours ago',
      isRead: true
    },
    {
      id: '3',
      title: 'Welcome to EcoSort!',
      message: 'Start scanning waste to earn real-world rewards and save the planet.',
      type: 'system',
      time: '1 day ago',
      isRead: true
    }
  ]);

  const getIcon = (type: string) => {
    switch(type) {
      case 'reward': return <Wallet color="#059669" size={20} />;
      case 'pickup': return <Truck color="#2563eb" size={20} />;
      default: return <Bell color="#64748b" size={20} />;
    }
  };

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const renderItem = ({ item }: { item: Notification }) => (
    <Card style={[styles.notificationCard, !item.isRead && styles.unreadCard]}>
      <View style={[styles.iconBox, { backgroundColor: item.isRead ? '#f1f5f9' : '#e0f2f1' }]}>
        {getIcon(item.type)}
      </View>
      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={[styles.title, !item.isRead && styles.unreadTitle]}>{item.title}</Text>
          {!item.isRead && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
        <Text style={styles.time}>{item.time}</Text>
      </View>
    </Card>
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
        <TouchableOpacity onPress={markAllRead}>
          <Text style={styles.markReadText}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Bell color="#cbd5e1" size={64} strokeWidth={1} />
            <Text style={styles.emptyText}>No notifications yet</Text>
            <Text style={styles.emptySub}>We'll alert you when there's an update on your pickups.</Text>
          </View>
        }
      />
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
    borderRadius: 22,
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
  listContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  notificationCard: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: 16,
    gap: spacing.md,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
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
    marginBottom: 6,
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
