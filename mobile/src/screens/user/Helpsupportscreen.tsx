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
  Camera,
  MapPin,
  Coins,
  Truck,
  Recycle,
  CheckCircle2,
  Send,
} from 'lucide-react-native';
import { spacing } from '../../services/theme/spacing';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Types ────────────────────────────────────────────────────────────────────
type FaqCategory = 'pickup' | 'scan' | 'rewards' | 'bins';

interface Faq {
  id: number;
  q: string;
  a: string;
  category: FaqCategory;
  icon: React.ReactNode;
}

// ─── Category badge colors ─────────────────────────────────────────────────────
const CAT_COLORS: Record<FaqCategory, { bg: string; text: string }> = {
  pickup: { bg: '#dbeafe', text: '#1d4ed8' },
  scan:   { bg: '#e0f2f1', text: '#006948' },
  rewards:{ bg: '#fef3c7', text: '#b45309' },
  bins:   { bg: '#f3e8ff', text: '#7c3aed' },
};

// ─── FAQ Data ─────────────────────────────────────────────────────────────────
const FAQS: Faq[] = [
  {
    id: 1,
    q: 'How do I request a pickup?',
    a: 'Go to the Scan tab, scan your waste items using AI Vision or Barcode mode, then tap "Request Pickup". Confirm your location on the map and submit. A collector will be assigned shortly.',
    category: 'pickup',
    icon: <Truck color="#1d4ed8" size={18} />,
  },
  {
    id: 2,
    q: 'Why is my camera not working?',
    a: 'Ensure EcoSort has camera permissions in your device settings (Settings → Apps → EcoSort → Permissions → Camera). If the issue persists after granting permission, try force-closing and reopening the app.',
    category: 'scan',
    icon: <Camera color="#006948" size={18} />,
  },
  {
    id: 3,
    q: 'How do EcoCoins work?',
    a: 'EcoCoins are earned every time a collector verifies and completes your pickup. The amount depends on the weight and type of waste collected. You can redeem EcoCoins as Rupiah via the Withdrawal feature on the Home screen.',
    category: 'rewards',
    icon: <Coins color="#b45309" size={18} />,
  },
  {
    id: 4,
    q: 'How long does a pickup take?',
    a: 'Pickup times vary based on collector availability in your area. Most pickups are completed within 30 minutes to 2 hours of requesting. You can track the collector\'s real-time location in the Active Pickups section on the Home screen.',
    category: 'pickup',
    icon: <Truck color="#1d4ed8" size={18} />,
  },
  {
    id: 5,
    q: "Can't find a recycling bin nearby?",
    a: 'Use the Map feature in the Bins tab to locate verified public recycling and compost bins near you. The map is regularly updated with new bin locations across the city.',
    category: 'bins',
    icon: <MapPin color="#7c3aed" size={18} />,
  },
  {
    id: 6,
    q: 'How do I withdraw my balance?',
    a: 'Go to your Home screen, tap "Redeem" on the wallet card, enter the amount (minimum Rp 10.000), and fill in your bank details. Withdrawals are processed within 1–2 business days.',
    category: 'rewards',
    icon: <Coins color="#b45309" size={18} />,
  },
  {
    id: 7,
    q: 'What waste types does EcoSort accept?',
    a: 'EcoSort accepts plastic, paper, cardboard, metal, glass, and organic waste. Our AI scanner can identify most common household waste types. Items are sorted and routed to the appropriate recycling facility.',
    category: 'scan',
    icon: <Recycle color="#006948" size={18} />,
  },
];

const TOPICS = ['pickup', 'scan', 'rewards', 'other'] as const;
type Topic = (typeof TOPICS)[number];

// ─── FAQ Item ──────────────────────────────────────────────────────────────────
const FaqItem = ({ faq, isOpen, onToggle }: {
  faq: Faq;
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
        <View style={faqStyles.questionLeft}>
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
  wrapperOpen: {
    borderColor: '#006948',
  },
  question: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    gap: 10,
  },
  questionLeft: { flex: 1 },
  catBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    marginBottom: 6,
  },
  catText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
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

// ─── Main Screen ──────────────────────────────────────────────────────────────
export const HelpSupportScreen = () => {
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [topic, setTopic] = useState<Topic>('pickup');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
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
    // Simulate API call
    setTimeout(() => {
      setSending(false);
      setSent(true);
      setMessage('');
      setTimeout(() => setSent(false), 4000);
    }, 1000);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#006948" />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
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
              <MessageCircle color="#ffffff" size={28} />
            </View>
            <Text style={styles.heroTitle}>How can we help?</Text>
            <Text style={styles.heroSub}>
              Search our knowledge base or contact us directly
            </Text>

            {/* Search bar */}
            <View style={styles.searchBar}>
              <Search color="#94a3b8" size={18} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search help articles..."
                placeholderTextColor="#94a3b8"
                style={styles.searchInput}
                returnKeyType="search"
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <X color="#94a3b8" size={18} />
                </TouchableOpacity>
              )}
            </View>
          </View>



          {/* FAQ */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>
              {search ? `Results for "${search}"` : 'Frequently Asked'}
            </Text>

            {filtered.length === 0 ? (
              <View style={styles.emptyBox}>
                <Search color="#cbd5e1" size={40} strokeWidth={1.5} />
                <Text style={styles.emptyTitle}>No results found</Text>
                <Text style={styles.emptySub}>
                  Try different keywords or contact us below
                </Text>
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



          {/* Footer */}
          <Text style={styles.footer}>
            EcoSort v1.0.0 • support@ecosort.id
          </Text>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  safeArea: { flex: 1 },

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
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#121c28',
  },

  scroll: { paddingBottom: 20 },

  // Hero
  hero: {
    backgroundColor: '#006948',
    padding: spacing.xl,
    paddingBottom: 28,
    alignItems: 'center',
  },
  heroIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 6,
  },
  heroSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 20,
    textAlign: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: '100%',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#121c28',
    padding: 0,
  },

  // Section
  section: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },

  // Contact
  contactRow: { flexDirection: 'row', gap: 12 },
  contactCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
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
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  contactLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#121c28',
    marginBottom: 3,
  },
  contactSub: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
  },

  // Empty
  emptyBox: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e8edf2',
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#121c28',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
  },

  // Ticket / Message form
  ticketCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#e8edf2',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
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
  topicChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  topicChipTextActive: { color: '#ffffff' },
  messageInput: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#121c28',
    minHeight: 100,
    lineHeight: 21,
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#006948',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#006948',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  sendBtnDisabled: {
    backgroundColor: '#e2e8f0',
    shadowOpacity: 0,
    elevation: 0,
  },
  sendBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },

  // Sent state
  sentBox: { alignItems: 'center', paddingVertical: 20 },
  sentIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e0f2f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  sentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#121c28',
    marginBottom: 6,
  },
  sentSub: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
  },

  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 24,
  },
});
