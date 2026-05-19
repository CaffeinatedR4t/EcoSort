import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Platform, 
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../services/api/supabase';
import { useNotificationStore } from '../../store/notificationStore';
import { spacing } from '../../services/theme/spacing';
import { Card } from '../../components/Card';
import { BottomNav } from '../../components/BottomNav';
import { Logo } from '../../components/Logo';
import { ProfileAvatar } from '../../components/ProfileAvatar';
import { 
  Bell, 
  Recycle, 
  Award, 
  UserCircle,
  HelpCircle, 
  LogOut, 
  ChevronRight
} from 'lucide-react-native';

export const ProfileScreen = () => {
  const { user, logout } = useAuthStore();
  const { unreadCount, fetchNotifications } = useNotificationStore();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [totalWeight, setTotalWeight] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      
      const { data: pickups } = await (supabase
        .from('pickup_requests') as any)
        .select('id, waste_hint')
        .eq('user_id', user.id)
        .eq('status', 'COMPLETED');
        
      if (pickups && pickups.length > 0) {
        let itemsCount = 0;
        pickups.forEach((p: any) => {
          const parts = p.waste_hint?.split(':')?.[1];
          if (parts) {
            itemsCount += parts.split(',').length;
          } else {
            itemsCount += 1;
          }
        });
        setTotalItems(itemsCount);
        
        const pickupIds = pickups.map((p: any) => p.id);
        const { data: classifications } = await (supabase
          .from('waste_classifications') as any)
          .select('collector_weight_kg')
          .in('pickup_id', pickupIds);
            
        if (classifications) {
           const weight = classifications.reduce((acc: number, curr: any) => acc + (curr.collector_weight_kg || 0), 0);
           setTotalWeight(weight);
        }
      }
    };
    
    fetchStats();
    if (user) {
      fetchNotifications(user.id);
    }
  }, [user]);

  // Derived stats
  const level = Math.floor((user?.balance || 0) / 5000) + 1;
  const ranking = Math.max(1, Math.round(100 - ((user?.balance || 0) / 100000) * 100));
  const rankingText = `Top ${ranking}%`;

  return (
    <View style={[styles.container, { backgroundColor: '#006948' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#006948" />
      <SafeAreaView style={{ flex: 1, backgroundColor: '#006948' }} edges={['top', 'left', 'right']}>
        <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
        <ScrollView 
          contentContainerStyle={[
            styles.scrollContent, 
            { paddingBottom: Platform.OS === 'ios' ? insets.bottom + 100 : 120 }
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoGroup}>
              <View style={styles.logoPositioner}>
                <Logo size={32} />
              </View>
              <Text style={[styles.logoText, { color: '#006948' }]}>EcoSort</Text>
            </View>
            <TouchableOpacity
              testID="profile-notification-button"
              style={[styles.iconButton, { backgroundColor: '#fff' }]}
              onPress={() => navigation.navigate('Notification')}
            >
              <Bell color="#006948" size={22} />
              {unreadCount > 0 && (
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeTextCount}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={[styles.avatarWrapper, { backgroundColor: '#006948' }]}>
              <ProfileAvatar
                name={user?.name}
                avatarUrl={user?.avatar_url}
                size={92}
                fallback="U"
              />
            </View>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
            <Text style={styles.userTitle}>Eco Champion • Level {level}</Text>
          </View>

          {/* Carbon Card */}
          <View style={styles.carbonCard}>
            <View style={styles.carbonInfo}>
              <Text style={styles.carbonLabel}>Carbon Saved</Text>
              <View style={styles.carbonValueRow}>
                <Text style={styles.carbonValue}>{totalWeight.toFixed(0)}</Text>
                <Text style={styles.carbonUnit}>kg</Text>
              </View>
            </View>
            <View style={styles.co2Badge}>
              <Text style={styles.co2Text}>CO₂</Text>
            </View>
          </View>

          {/* Side-by-side Stats */}
          <View style={styles.statsRow}>
            <Card style={styles.smallStatCard}>
              <Recycle color="#006948" size={24} style={styles.statIcon} />
              <Text style={styles.smallStatValue}>{totalItems.toLocaleString()}</Text>
              <Text style={styles.smallStatLabel}>ITEMS</Text>
            </Card>
            <Card style={styles.smallStatCard}>
              <Award color="#006948" size={24} style={styles.statIcon} />
              <Text style={styles.smallStatValue}>{rankingText}</Text>
              <Text style={styles.smallStatLabel}>RANKING</Text>
            </Card>
          </View>

          {/* Menu List */}
          <Card style={styles.menuCard}>
            {/* Navigasi Account Settings */}
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => navigation.navigate('AccountSettings')}
            >
              <View style={[styles.menuIconBox, {backgroundColor: '#e6f4f0'}]}>
                <UserCircle color="#006948" size={20} />
              </View>
              <Text style={styles.menuText}>Account Settings</Text>
              <ChevronRight color="#9ca3af" size={20} />
            </TouchableOpacity>
            
            {/* Navigasi Help & Support */}
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => navigation.navigate('HelpSupport')}
            >
              <View style={[styles.menuIconBox, {backgroundColor: '#f1f5f9'}]}>
                <HelpCircle color="#006948" size={20} />
              </View>
              <Text style={styles.menuText}>Help & Support</Text>
              <ChevronRight color="#9ca3af" size={20} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.menuItem, {borderBottomWidth: 0}]} onPress={logout}>
              <View style={[styles.menuIconBox, {backgroundColor: '#ffdad6'}]}>
                <LogOut color="#ba1a1a" size={20} />
              </View>
              <Text style={[styles.menuText, {color: '#ba1a1a'}]}>Log Out</Text>
            </TouchableOpacity>
          </Card>

        </ScrollView>
        </View>
      </SafeAreaView>

      <BottomNav activeRoute="Profile" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    paddingLeft: 12,
    paddingTop: 8,
  },
  logoPositioner: {
    position: 'absolute',
    top: -2,
    left: -4,
    zIndex: 10,
    transform: [{ rotate: '-15deg' }],
  },
  logoText: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },

  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  badgeContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ba1a1a',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  badgeTextCount: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    marginTop: 40, // Space for overlapping avatar
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  avatarWrapper: {
    width: 100,
    height: 100,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -70,
    marginBottom: spacing.md,
    borderWidth: 4,
    borderColor: '#fff',
  },
  avatarImage: {
    width: 92,
    height: 92,
    borderRadius: 24,
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#121c28',
    marginBottom: 4,
  },
  userTitle: {
    fontSize: 14,
    color: '#757575',
    fontWeight: '500',
  },
  carbonCard: {
    backgroundColor: '#006948',
    borderRadius: 24,
    padding: spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#006948',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  carbonInfo: {
    flex: 1,
  },
  carbonLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  carbonValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  carbonValue: {
    fontSize: 48,
    fontWeight: '800',
    color: '#fff',
  },
  carbonUnit: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 4,
  },
  co2Badge: {
    width: 60,
    height: 60,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  co2Text: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  smallStatCard: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: 24,
    backgroundColor: '#fff',
  },
  statIcon: {
    marginBottom: spacing.md,
  },
  smallStatValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#121c28',
    marginBottom: 4,
  },
  smallStatLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#757575',
    letterSpacing: 1,
  },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: spacing.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  menuIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#121c28',
  },
});
