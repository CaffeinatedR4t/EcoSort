import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, History } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { useThemeColors } from '../../hooks/useThemeColors';
import { spacing } from '../../services/theme/spacing';

export const TransactionHistoryScreen = () => {
  const navigation = useNavigation<any>();
  const { transactions } = useAuthStore();
  const colors = useThemeColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.primary }} edges={['top', 'left', 'right']}>
        <View style={styles.contentShell}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ChevronLeft color={colors.textBlack} size={24} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.textBlack }]}>History</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <History color={colors.primary} size={28} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.textBlack }]}>No transactions yet</Text>
              <Text style={[styles.emptyText, { color: colors.textBlackSoft }]}>
                Your wallet activity will appear here after pickups, rewards, or withdrawals.
              </Text>
            </View>
          ) : (
            transactions.map((tx) => (
              <View key={tx.id} style={styles.item}>
                <View style={styles.itemTop}>
                  <Text style={styles.itemType}>{tx.type}</Text>
                  <Text style={styles.itemAmount}>
                    {tx.type === 'DEBIT' ? '-' : '+'}Rp {Number(tx.amount || 0).toLocaleString('id-ID')}
                  </Text>
                </View>
                <Text style={styles.itemMeta}>{tx.status}</Text>
              </View>
            ))
          )}
        </ScrollView>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  contentShell: { flex: 1, backgroundColor: '#ffffff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#edf2f7',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 17, fontWeight: '700' },
  content: { padding: spacing.lg },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#e0f2f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
  emptyText: { fontSize: 13, lineHeight: 20, textAlign: 'center', maxWidth: 280 },
  item: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#e8edf2',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: { elevation: 1 },
    }),
  },
  itemTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  itemType: { fontSize: 14, fontWeight: '700', color: '#121c28', textTransform: 'capitalize' },
  itemAmount: { fontSize: 14, fontWeight: '800', color: '#006948' },
  itemMeta: { marginTop: 6, fontSize: 12, color: '#64748b', textTransform: 'capitalize' },
});
