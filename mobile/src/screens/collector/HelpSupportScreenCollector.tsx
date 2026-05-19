import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  Alert, 
  Linking, 
  Platform,
  LayoutAnimation,
  UIManager
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { spacing } from '../../services/theme/spacing';
import { 
  Search, X, MessageCircle, Mail, CheckCircle2, ChevronRight, ArrowLeft 
} from 'lucide-react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const PRIMARY = '#006948';
const PRIMARY_LIGHT = '#e6f4f0';
const TEXT_BLACK = '#0f172a';
const TEXT_SOFT = '#64748b';
const WHITE = '#ffffff';

type DriverFaqCategory = 'jobs' | 'earnings' | 'route' | 'app';
type Topic = 'jobs' | 'earnings' | 'technical' | 'other';

interface DriverFaq {
  id: number;
  q: string;
  a: string;
  category: DriverFaqCategory;
}

const DRIVER_CAT_COLORS: Record<DriverFaqCategory, { bg: string; text: string }> = {
  jobs:     { bg: '#dbeafe', text: '#1d4ed8' },
  earnings: { bg: '#fef3c7', text: '#b45309' },
  route:    { bg: '#e0f0ff', text: '#0284c7' },
  app:      { bg: '#f1f5f9', text: '#475569' },
};

const DRIVER_FAQS: DriverFaq[] = [
  { id: 1, category: 'jobs', q: 'How do I accept a new job?', a: 'Go to the Home tab to see available pickup requests. Tap "Accept" on any job card to claim it. The job will then appear in your Route tab.' },
  { id: 2, category: 'route', q: 'What does the TSP route optimization do?', a: 'When you have multiple active pickups, EcoSort automatically sorts them using the Nearest Neighbor algorithm to minimize your travel distance. Look for the green navigation badge in your Route tab.' },
  { id: 3, category: 'jobs', q: 'How do I verify a pickup?', a: 'Tap "Scan & Verify Pickup" on your current active job card. Follow the instructions to scan or manually log the weight in kg, then complete the collection.' },
  { id: 4, category: 'earnings', q: 'When do my earnings get credited?', a: 'Pending earnings are calculated during the active job. Once you mark a job as COMPLETED, earnings are credited to your Available Balance immediately.' },
  { id: 5, category: 'earnings', q: 'How do I withdraw my balance?', a: 'Tap "REDEEM" on the Home tab wallet card. Enter your preferred bank details and the amount. Process usually takes 1 business day.' },
  { id: 6, category: 'app', q: 'Why is my route not optimizing?', a: 'Ensure EcoSort has location permissions set to "Always" or "While Using". The TSP algorithm relies on your current live location to calculate the nearest stops.' },
];
const TOPICS: Topic[] = ['jobs', 'earnings', 'technical', 'other'];

const DriverFaqItem = ({ faq, isOpen, onToggle }: { faq: DriverFaq; isOpen: boolean; onToggle: () => void; }) => {
  const cat = DRIVER_CAT_COLORS[faq.category];
  return (
    <View style={[styles.faqWrapper, isOpen && styles.faqWrapperOpen]}>
      <TouchableOpacity onPress={onToggle} activeOpacity={0.75} style={styles.faqQuestion}>
        <View style={{ flex: 1 }}>
          <View style={[styles.catBadge, { backgroundColor: cat.bg }]}>
            <Text style={[styles.catText, { color: cat.text }]}>{faq.category.toUpperCase()}</Text>
          </View>
          <Text style={styles.questionText}>{faq.q}</Text>
        </View>
        <View style={{ transform: [{ rotate: isOpen ? '90deg' : '0deg' }] }}>
          <ChevronRight color="#94a3b8" size={18} />
        </View>
      </TouchableOpacity>
      {isOpen && (
        <View style={styles.faqAnswer}>
          <Text style={styles.answerText}>{faq.a}</Text>
        </View>
      )}
    </View>
  );
};

export const HelpSupportScreen = () => {
  const navigation = useNavigation<any>();
  const [search, setSearch]   = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [topic, setTopic]     = useState<Topic>('jobs');
  const [message, setMessage] = useState('');
  const [sent, setSent]       = useState(false);
  const [sending, setSending] = useState(false);

  const filtered = DRIVER_FAQS.filter((f) => search === '' || f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase()));

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
      <SafeAreaView edges={['top', 'left', 'right']} style={{ backgroundColor: WHITE }}>
        <View style={styles.screenHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft color={TEXT_BLACK} size={24} />
          </TouchableOpacity>
          <Text style={styles.screenHeaderTitle}>Help & Support</Text>
          <View style={{ width: 44 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Search */}
        <View style={styles.searchWrapper}>
          <View style={styles.searchBar}>
            <Search color="#94a3b8" size={18} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search driver help articles..."
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
        <Text style={styles.sectionLabel}>{search ? `RESULTS FOR "${search.toUpperCase()}"` : 'DRIVER FAQ'}</Text>
        <View style={{ paddingHorizontal: spacing.lg }}>
          {filtered.length === 0 ? (
            <View style={styles.emptyBox}>
              <Search color="#cbd5e1" size={40} strokeWidth={1.5} />
              <Text style={styles.emptyTitle}>No results found</Text>
              <Text style={styles.emptySub}>Try using different keywords.</Text>
            </View>
          ) : (
            filtered.map((faq) => (
              <DriverFaqItem key={faq.id} faq={faq} isOpen={openFaq === faq.id} onToggle={() => toggleFaq(faq.id)} />
            ))
          )}
        </View>



        <Text style={styles.footer}>EcoSort Driver v1.0.0 • driver@ecosort.id</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

// ─── Styles ───
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  screenHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, backgroundColor: WHITE, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  screenHeaderTitle: { fontSize: 18, fontWeight: '800', color: TEXT_BLACK },
  scrollContent: { paddingBottom: spacing.xl },
  sectionLabel: { fontSize: 10, fontWeight: '800', color: '#94a3b8', letterSpacing: 1.2, paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.sm },
  fieldLabel: { fontSize: 10, fontWeight: '800', color: '#94a3b8', letterSpacing: 1, marginBottom: 8 },
  
  // Search
  searchWrapper: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: WHITE, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 }, android: { elevation: 2 } }) },
  searchInput: { flex: 1, fontSize: 15, color: TEXT_BLACK, padding: 0, fontWeight: '500' },
  
  // Contacts
  contactRow: { flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.lg },
  contactCard: { flex: 1, backgroundColor: WHITE, borderRadius: 20, padding: 16, alignItems: 'center', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 }, android: { elevation: 2 } }) },
  contactIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  contactLabel: { fontSize: 14, fontWeight: '700', color: TEXT_BLACK, marginBottom: 2 },
  contactSub: { fontSize: 12, color: TEXT_SOFT, textAlign: 'center', fontWeight: '500' },
  
  // FAQ Items
  faqWrapper: { backgroundColor: WHITE, borderRadius: 20, marginBottom: spacing.md, overflow: 'hidden', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 }, android: { elevation: 2 } }) },
  faqWrapperOpen: { borderWidth: 1.5, borderColor: PRIMARY },
  faqQuestion: { flexDirection: 'row', alignItems: 'flex-start', padding: spacing.lg, gap: 10 },
  catBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, marginBottom: 8 },
  catText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  questionText: { fontSize: 15, fontWeight: '700', color: TEXT_BLACK, lineHeight: 22 },
  faqAnswer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  answerText: { fontSize: 14, color: TEXT_SOFT, lineHeight: 22, marginTop: 12, fontWeight: '500' },
  
  // Empty State
  emptyBox: { backgroundColor: WHITE, borderRadius: 24, padding: 32, alignItems: 'center', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 }, android: { elevation: 2 } }) },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: TEXT_BLACK, marginTop: 12, marginBottom: 4 },
  emptySub: { fontSize: 14, color: TEXT_SOFT, fontWeight: '500' },
  
  // Ticket Form
  ticketCard: { marginHorizontal: spacing.lg, backgroundColor: WHITE, borderRadius: 24, padding: spacing.lg, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 }, android: { elevation: 2 } }) },
  topicRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  topicChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f1f5f9' },
  topicChipActive: { backgroundColor: PRIMARY },
  topicChipText: { fontSize: 13, fontWeight: '700', color: TEXT_SOFT },
  topicChipTextActive: { color: WHITE },
  messageInput: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 16, padding: 14, fontSize: 15, color: TEXT_BLACK, minHeight: 100, fontWeight: '500' },
  sendBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: PRIMARY, borderRadius: 14, height: 50, marginTop: 16 },
  sendBtnDisabled: { backgroundColor: '#cbd5e1' },
  sendBtnText: { fontSize: 15, fontWeight: '800', color: WHITE },
  
  // Sent state
  sentBox: { alignItems: 'center', paddingVertical: 20 },
  sentIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: PRIMARY_LIGHT, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  sentTitle: { fontSize: 18, fontWeight: '800', color: TEXT_BLACK, marginBottom: 6 },
  sentSub: { fontSize: 14, color: TEXT_SOFT, textAlign: 'center', fontWeight: '500' },
  
  // Footer
  footer: { textAlign: 'center', fontSize: 12, fontWeight: '600', color: '#94a3b8', marginTop: 30 },
});