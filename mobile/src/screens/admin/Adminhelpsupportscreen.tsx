import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  StatusBar,
  Linking,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  MessageCircle,
  Mail,
  Send,
  CheckCircle2,
  ShieldCheck,
  Recycle,
  Wallet,
  Truck,
  AlertTriangle,
  BarChart3,
} from 'lucide-react-native';
import { spacing } from '../../services/theme/spacing';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Types ────────────────────────────────────────────────────────────────────
type FaqCategory = 'pickups' | 'earnings' | 'collectors' | 'system';
type Topic = 'pickups' | 'earnings' | 'technical' | 'other';

interface AdminFaq {
  id: number;
  q: string;
  a: string;
  category: FaqCategory;
}

const CAT_COLORS: Record<FaqCategory, { bg: string; text: string }> = {
  pickups:    { bg: '#dbeafe', text: '#1d4ed8' },
  earnings:   { bg: '#fef3c7', text: '#b45309' },
  collectors: { bg: '#e0f2f1', text: '#006948' },
  system:     { bg: '#f3e8ff', text: '#7c3aed' },
};

const FAQS: AdminFaq[] = [
  {
    id: 1,
    category: 'pickups',
    q: 'How do I monitor active pickup requests?',
    a: 'Go to the Overview tab. The "Active Pickups" stat card shows how many pickups are currently assigned or in progress. The Live Feed below shows real-time updates of recent pickup activity.',
  },
  {
    id: 2,
    category: 'earnings',
    q: 'How do I approve or reject a reward?',
    a: 'Navigate to the Earnings tab and select the "Rewards" section. Each pending reward card shows the user name, amount, and date. Tap "Allow" to approve or "Deny" to reject. The user\'s balance is updated immediately upon approval.',
  },
  {
    id: 3,
    category: 'earnings',
    q: 'How do I process a withdrawal request?',
    a: 'Go to Earnings → Withdrawal. Each card shows the user\'s bank name, account number, account holder name, and amount. Verify the details, then tap "Allow" to approve or "Deny" to reject.',
  },
  {
    id: 4,
    category: 'collectors',
    q: 'How do I see which collector is assigned to a pickup?',
    a: 'Currently, collector assignments are visible in the Live Feed on the Overview tab. A full collector management panel is planned for a future admin update.',
  },
  {
    id: 5,
    category: 'system',
    q: 'The live feed is not updating. What should I do?',
    a: 'Try pulling down to refresh on the Overview tab. If Live Feed Updates is enabled in Settings, the feed should update automatically every 60 seconds. If the issue persists, check your internet connection or contact technical support.',
  },
  {
    id: 6,
    category: 'system',
    q: 'How do I enable real-time notifications?',
    a: 'Go to Settings (from the Profile tab) and enable the notification types you need under the Notifications section. Make sure to grant notification permissions to EcoSort in your device settings as well.',
  },
];

const TOPICS: Topic[] = ['pickups', 'earnings', 'technical', 'other'];

// ─── FAQ Item ─────────────────────────────────────────────────────────────────
const FaqItem = ({
  faq,
  isOpen,
  onToggle,
}: {
  faq: AdminFaq;
  isOpen: boolean;
  onToggle: () => void;
}) => {
  const cat = CAT_COLORS[faq.category];
  return (
    <View style={[faqStyles.wrapper, isOpen && faqStyles.wrapperOpen]}>
      <TouchableOpacity
        onPress={onToggle}
        activeOpacity={0.75}
        style={faqStyles.question}
      >
        <View style={{ flex: 1 }}>
          <View style={[faqStyles.catBadge, { backgroundColor: cat.bg }]}>
            <Text style={[faqStyles.catText, { color: cat.text }]}>
              {faq.category.toUpperCase()}
            </Text>
          </View>
          <Text style={faqStyles.questionText}>{faq.q}</Text>
        </View>
        <View style={{ transform: [{ rotate: isOpen ? '90deg' : '0deg' }] }}>
          <ChevronRight color="#94a3b8" size={18} />
        </View>
      </TouchableOpacity>
      {isOpen && (
        <View style={faqStyles.answer}>
          <Text style={faqStyles.answerText}>{faq.a}</Text>
        </View>
      )}
    </View>
  );
};

const faqStyles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e8edf2',
    marginBottom: 8,
    overflow: 'hidden',
  },
  wrapperOpen: { borderColor: '#006948' },
  question: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    gap: 10,
  },
  catBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    marginBottom: 6,
  },
  catText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  questionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#121c28',
    lineHeight: 20,
  },
  answer: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  answerText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 22,
    marginTop: 10,
  },
});

// ─── Screen ───────────────────────────────────────────────────────────────────
export const AdminHelpSupportScreen = () => {
  const navigation = useNavigation<any>();

  const [search, setSearch]   = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [topic, setTopic]     = useState<Topic>('pickups');
  const [message, setMessage] = useState('');
  const [sent, setSent]       = useState(false);
  const [sending, setSending] = useState(false);

  const filtered = FAQS.filter(
    (f) =>
      search === '' ||
      f.q.toLowerCase().includes(search.toLowerCase()) ||
      f.a.toLowerCase().includes(search.toLowerCase())
  );

  const toggleFaq = (id: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenFaq(openFaq === id ? null : id);
  };

  const handleSend = () => {
    if (!message.trim()) return;
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSent(true);
      setMessage('');
      setTimeout(() => setSent(false), 4000);
    }, 1000);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <ChevronLeft color="#121c28" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Help & Support</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero */}
          <View style={styles.hero}>
            <View style={styles.heroIconBox}>
              <ShieldCheck color="#006948" size={30} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>Admin Help Center</Text>
              <Text style={styles.heroSub}>
                Find answers or contact the technical team.
              </Text>
            </View>
          </View>

          {/* Quick stats row */}
          <View style={styles.quickRow}>
            {[
              { icon: <Truck color="#1d4ed8" size={18} />, bg: '#dbeafe', label: 'Pickups' },
              { icon: <Wallet color="#b45309" size={18} />, bg: '#fef3c7', label: 'Earnings' },
              { icon: <Recycle color="#006948" size={18} />, bg: '#e0f2f1', label: 'Collectors' },
              { icon: <BarChart3 color="#7c3aed" size={18} />, bg: '#f3e8ff', label: 'System' },
            ].map((item, i) => (
              <TouchableOpacity
                key={i}
                style={styles.quickCard}
                onPress={() => {
                  const cats: FaqCategory[] = ['pickups', 'earnings', 'collectors', 'system'];
                  setSearch(cats[i]);
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.quickIcon, { backgroundColor: item.bg }]}>
                  {item.icon}
                </View>
                <Text style={styles.quickLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Search */}
          <View style={styles.searchWrapper}>
            <View style={styles.searchBar}>
              <Search color="#94a3b8" size={16} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search admin help articles..."
                placeholderTextColor="#94a3b8"
                style={styles.searchInput}
                returnKeyType="search"
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <X color="#94a3b8" size={16} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Contact */}
          {search === '' && (
            <>
              <Text style={styles.sectionHeader}>Contact Technical Support</Text>
              <View style={styles.contactRow}>
                <TouchableOpacity
                  style={styles.contactCard}
                  activeOpacity={0.75}
                  onPress={() => Alert.alert('Admin Support', 'Connecting to priority support line...')}
                >
                  <View style={[styles.contactIcon, { backgroundColor: '#dbeafe' }]}>
                    <MessageCircle color="#1d4ed8" size={20} />
                  </View>
                  <Text style={styles.contactLabel}>Priority Chat</Text>
                  <Text style={styles.contactSub}>Admin support line</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.contactCard}
                  activeOpacity={0.75}
                  onPress={() => Linking.openURL('mailto:admin@ecosort.id')}
                >
                  <View style={[styles.contactIcon, { backgroundColor: '#e0f2f1' }]}>
                    <Mail color="#006948" size={20} />
                  </View>
                  <Text style={styles.contactLabel}>Email Team</Text>
                  <Text style={styles.contactSub}>admin@ecosort.id</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* FAQ */}
          <Text style={styles.sectionHeader}>
            {search ? `Results for "${search}"` : 'Admin FAQ'}
          </Text>
          <View style={styles.faqList}>
            {filtered.length === 0 ? (
              <View style={styles.emptyBox}>
                <Search color="#cbd5e1" size={36} strokeWidth={1.5} />
                <Text style={styles.emptyTitle}>No results found</Text>
                <Text style={styles.emptySub}>Try different keywords or contact support</Text>
              </View>
            ) : (
              filtered.map((faq) => (
                <FaqItem
                  key={faq.id}
                  faq={faq}
                  isOpen={openFaq === faq.id}
                  onToggle={() => toggleFaq(faq.id)}
                />
              ))
            )}
          </View>

          {/* Send message */}
          {search === '' && (
            <>
              <Text style={styles.sectionHeader}>Send a Message</Text>
              <View style={styles.ticketCard}>
                {sent ? (
                  <View style={styles.sentBox}>
                    <View style={styles.sentIcon}>
                      <CheckCircle2 color="#006948" size={28} />
                    </View>
                    <Text style={styles.sentTitle}>Message Sent!</Text>
                    <Text style={styles.sentSub}>
                      The technical team will respond within 4 business hours.
                    </Text>
                  </View>
                ) : (
                  <>
                    <Text style={styles.fieldLabel}>TOPIC</Text>
                    <View style={styles.topicRow}>
                      {TOPICS.map((t) => (
                        <TouchableOpacity
                          key={t}
                          onPress={() => setTopic(t)}
                          style={[
                            styles.topicChip,
                            topic === t && styles.topicChipActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.topicChipText,
                              topic === t && styles.topicChipTextActive,
                            ]}
                          >
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={[styles.fieldLabel, { marginTop: 14 }]}>
                      YOUR MESSAGE
                    </Text>
                    <TextInput
                      value={message}
                      onChangeText={setMessage}
                      placeholder="Describe the issue in detail..."
                      placeholderTextColor="#94a3b8"
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                      style={styles.messageInput}
                    />

                    <TouchableOpacity
                      onPress={handleSend}
                      disabled={!message.trim() || sending}
                      style={[
                        styles.sendBtn,
                        (!message.trim() || sending) && styles.sendBtnDisabled,
                      ]}
                      activeOpacity={0.8}
                    >
                      <Send color="#ffffff" size={16} />
                      <Text style={styles.sendBtnText}>
                        {sending ? 'Sending...' : 'Send Message'}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </>
          )}

          <Text style={styles.footer}>
            EcoSort Admin v1.0.0 • admin@ecosort.id
          </Text>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#121c28' },
  scroll: { paddingTop: spacing.lg },
  hero: {
    marginHorizontal: spacing.lg,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#e8edf2',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  heroIconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#e0f2f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: { fontSize: 17, fontWeight: '800', color: '#121c28', marginBottom: 4 },
  heroSub: { fontSize: 13, color: '#64748b', lineHeight: 18 },
  quickRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  quickCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e8edf2',
  },
  quickIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  quickLabel: { fontSize: 11, fontWeight: '700', color: '#475569' },
  searchWrapper: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: '#e8edf2',
  },
  searchInput: { flex: 1, fontSize: 14, color: '#121c28', padding: 0 },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  contactRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: spacing.lg,
  },
  contactCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e8edf2',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6 },
      android: { elevation: 1 },
    }),
  },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactLabel: { fontSize: 13, fontWeight: '700', color: '#121c28', marginBottom: 2 },
  contactSub: { fontSize: 11, color: '#64748b', textAlign: 'center' },
  faqList: { paddingHorizontal: spacing.lg },
  emptyBox: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e8edf2',
    padding: 28,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#121c28',
    marginTop: 10,
    marginBottom: 4,
  },
  emptySub: { fontSize: 12, color: '#64748b', textAlign: 'center' },
  ticketCard: {
    marginHorizontal: spacing.lg,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#e8edf2',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 1,
    marginBottom: 8,
  },
  topicRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  topicChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  topicChipActive: { backgroundColor: '#006948' },
  topicChipText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  topicChipTextActive: { color: '#ffffff' },
  messageInput: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#121c28',
    minHeight: 90,
    lineHeight: 20,
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#006948',
    borderRadius: 14,
    paddingVertical: 13,
    marginTop: 12,
  },
  sendBtnDisabled: { backgroundColor: '#e2e8f0' },
  sendBtnText: { fontSize: 14, fontWeight: '700', color: '#ffffff' },
  sentBox: { alignItems: 'center', paddingVertical: 16 },
  sentIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#e0f2f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  sentTitle: { fontSize: 15, fontWeight: '700', color: '#121c28', marginBottom: 4 },
  sentSub: { fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 18 },
  footer: {
    textAlign: 'center',
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 24,
  },
});