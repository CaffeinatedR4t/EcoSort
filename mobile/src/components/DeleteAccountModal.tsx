import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { spacing } from '../services/theme/spacing';

const confirmationText = 'delete account';

export const DeleteAccountModal = ({
  visible,
  loading,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) => {
  const [typedText, setTypedText] = useState('');
  const canDelete = typedText.trim().toLowerCase() === confirmationText;

  const handleCancel = () => {
    setTypedText('');
    onCancel();
  };

  const handleConfirm = () => {
    if (!canDelete || loading) return;
    setTypedText('');
    onConfirm();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <AlertTriangle color="#e11d48" size={26} />
          </View>
          <Text style={styles.title}>Delete Account</Text>
          <Text style={styles.message}>
            This action permanently removes your EcoSort profile and app data.
          </Text>
          <Text style={styles.warning}>
            This cannot be undone. You will be signed out after the deletion finishes.
          </Text>
          <Text style={styles.label}>Type "delete account" to continue</Text>
          <TextInput
            value={typedText}
            onChangeText={setTypedText}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="delete account"
            placeholderTextColor="#94a3b8"
            style={styles.input}
          />
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} disabled={loading}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.deleteBtn, (!canDelete || loading) && styles.deleteBtnDisabled]}
              onPress={handleConfirm}
              disabled={!canDelete || loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.deleteText}>Delete my account</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.48)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 18,
      },
      android: { elevation: 8 },
    }),
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#fff1f2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: { fontSize: 20, fontWeight: '800', color: '#121c28', marginBottom: 8 },
  message: { fontSize: 14, color: '#334155', lineHeight: 20 },
  warning: { fontSize: 13, color: '#e11d48', lineHeight: 19, marginTop: 8, fontWeight: '600' },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 1,
    marginTop: spacing.lg,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#121c28',
  },
  actions: { flexDirection: 'row', gap: 10, marginTop: spacing.lg },
  cancelBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelText: { color: '#475569', fontWeight: '800', fontSize: 14 },
  deleteBtn: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#e11d48',
    paddingVertical: 12,
    alignItems: 'center',
  },
  deleteBtnDisabled: { opacity: 0.45 },
  deleteText: { color: '#ffffff', fontWeight: '800', fontSize: 14 },
});
