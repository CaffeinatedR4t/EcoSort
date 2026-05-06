import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  KeyboardAvoidingView, 
  Platform,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { useThemeColors } from '../../hooks/useThemeColors';
import { spacing } from '../../services/theme/spacing';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ChevronLeft, Landmark, CreditCard, User, Wallet } from 'lucide-react-native';

export const WithdrawalScreen = () => {
  const { user, requestWithdrawal } = useAuthStore();
  const navigation = useNavigation();
  const colors = useThemeColors();

  const [amount, setAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);

  const balance = user?.balance || 0;

  const handleWithdraw = async () => {
    const withdrawAmount = parseInt(amount);

    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (withdrawAmount < 10000) {
      Alert.alert('Error', 'Minimum withdrawal is Rp 10,000');
      return;
    }

    if (withdrawAmount > balance) {
      Alert.alert('Error', 'Insufficient balance');
      return;
    }

    if (!bankName || !accountNumber || !accountHolderName) {
      Alert.alert('Error', 'Please fill in all bank details');
      return;
    }

    setLoading(true);
    const result = await requestWithdrawal({
      amount: withdrawAmount,
      bank_name: bankName,
      account_number: accountNumber,
      account_holder_name: accountHolderName,
    });
    setLoading(false);

    if (result.success) {
      Alert.alert(
        'Success', 
        'Withdrawal request submitted! It will be processed within 24 hours.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } else {
      Alert.alert('Error', result.error || 'Failed to submit withdrawal request');
    }
  };

  const setMaxAmount = () => {
    setAmount(balance.toString());
  };

  return (
    <View style={[styles.container, { backgroundColor: '#f2f0eb' }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f2f0eb" />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
            >
              <ChevronLeft color="#006948" size={28} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Withdraw Funds</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Balance Card */}
            <Card style={styles.balanceCard}>
              <View style={styles.balanceHeader}>
                <Wallet color="#006948" size={20} />
                <Text style={styles.balanceLabel}>Current Balance</Text>
              </View>
              <Text style={styles.balanceText}>Rp {balance.toLocaleString()}</Text>
            </Card>

            {/* Amount Input */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Withdrawal Amount</Text>
              <View style={styles.amountInputContainer}>
                <Text style={styles.currencyPrefix}>Rp</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                  placeholderTextColor="#9e9e9e"
                />
                <TouchableOpacity onPress={setMaxAmount} style={styles.maxBtn}>
                  <Text style={styles.maxBtnText}>MAX</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.hintText}>Minimum withdrawal: Rp 10,000</Text>
            </View>

            {/* Bank Details */}
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Bank Details</Text>
            </View>

            <Card style={styles.formCard}>
              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <Landmark color="#006948" size={20} />
                </View>
                <View style={styles.inputFieldWrapper}>
                  <Text style={styles.fieldLabel}>Bank Name</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="e.g. BCA, Mandiri, BNI"
                    value={bankName}
                    onChangeText={setBankName}
                    placeholderTextColor="#9e9e9e"
                  />
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <CreditCard color="#006948" size={20} />
                </View>
                <View style={styles.inputFieldWrapper}>
                  <Text style={styles.fieldLabel}>Account Number</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="Enter your account number"
                    keyboardType="numeric"
                    value={accountNumber}
                    onChangeText={setAccountNumber}
                    placeholderTextColor="#9e9e9e"
                  />
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <User color="#006948" size={20} />
                </View>
                <View style={styles.inputFieldWrapper}>
                  <Text style={styles.fieldLabel}>Account Holder Name</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="Name as it appears on bank account"
                    value={accountHolderName}
                    onChangeText={setAccountHolderName}
                    placeholderTextColor="#9e9e9e"
                  />
                </View>
              </View>
            </Card>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Please ensure all bank details are correct. EcoSort is not responsible for transfers to incorrect accounts.
              </Text>
            </View>

            <Button 
              title="Confirm Withdrawal" 
              onPress={handleWithdraw}
              loading={loading}
              style={styles.withdrawBtn}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#121c28',
  },
  scrollContent: {
    padding: spacing.lg,
  },
  balanceCard: {
    padding: spacing.lg,
    alignItems: 'center',
    backgroundColor: '#fff',
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: '#edebe9',
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#757575',
    fontWeight: '600',
  },
  balanceText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#006948',
  },
  inputSection: {
    marginBottom: spacing.xl,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#121c28',
    marginBottom: spacing.md,
    letterSpacing: 0.5,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: spacing.lg,
    height: 64,
    borderWidth: 1,
    borderColor: '#edebe9',
  },
  currencyPrefix: {
    fontSize: 20,
    fontWeight: '700',
    color: '#121c28',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: '#006948',
  },
  maxBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f1f8e9',
    borderRadius: 8,
  },
  maxBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#006948',
  },
  hintText: {
    fontSize: 12,
    color: '#757575',
    marginTop: 8,
    fontStyle: 'italic',
  },
  sectionTitleRow: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#121c28',
  },
  formCard: {
    padding: 0,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#edebe9',
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  inputIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f8e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  inputFieldWrapper: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9e9e9e',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  fieldInput: {
    fontSize: 16,
    fontWeight: '600',
    color: '#121c28',
    padding: 0,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginLeft: 72,
  },
  infoBox: {
    backgroundColor: 'rgba(0, 105, 72, 0.05)',
    padding: spacing.lg,
    borderRadius: 16,
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(0, 105, 72, 0.1)',
  },
  infoText: {
    fontSize: 13,
    color: '#1E3932',
    lineHeight: 18,
    textAlign: 'center',
  },
  withdrawBtn: {
    marginBottom: spacing.xl,
  },
});
