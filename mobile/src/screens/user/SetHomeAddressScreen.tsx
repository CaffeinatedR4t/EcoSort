import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import {
  ChevronLeft,
  Crosshair,
  Home,
  LocateFixed,
  MapPin,
  Search,
} from 'lucide-react-native';
import { spacing } from '../../services/theme/spacing';
import { supabase } from '../../services/api/supabase';
import { useAuthStore } from '../../store/authStore';

type AddressResult = {
  id: string;
  address: string;
  lat: number;
  lng: number;
};

const formatReverseAddress = (item: any, fallback: string) => {
  const streetLine = [item?.name, item?.street].filter(Boolean).join(' ').trim();
  const cityLine = [item?.district, item?.city, item?.region].filter(Boolean).join(', ').trim();
  const address = [streetLine, cityLine].filter(Boolean).join(', ');
  return address || fallback;
};

export const SetHomeAddressScreen = () => {
  const navigation = useNavigation<any>();
  const { user, fetchProfile } = useAuthStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AddressResult[]>([]);
  const [selected, setSelected] = useState<AddressResult | null>(
    user?.home_address && user.home_lat != null && user.home_lng != null
      ? {
          id: 'saved-home',
          address: user.home_address,
          lat: user.home_lat,
          lng: user.home_lng,
        }
      : null
  );
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const recommendationRequestRef = useRef(0);

  const buildAddressResults = async (searchText: string, limit = 5) => {
    const geocoded = await Location.geocodeAsync(searchText);
    const topResults = geocoded.slice(0, limit);

    return Promise.all(
      topResults.map(async (location, index) => {
        const coords = {
          latitude: location.latitude,
          longitude: location.longitude,
        };

        try {
          const reverse = await Location.reverseGeocodeAsync(coords);
          return {
            id: `${location.latitude}-${location.longitude}-${index}`,
            address: formatReverseAddress(reverse[0], searchText),
            lat: location.latitude,
            lng: location.longitude,
          };
        } catch {
          return {
            id: `${location.latitude}-${location.longitude}-${index}`,
            address: `${searchText} (${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)})`,
            lat: location.latitude,
            lng: location.longitude,
          };
        }
      })
    );
  };

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setResults([]);
      return;
    }

    const requestId = recommendationRequestRef.current + 1;
    recommendationRequestRef.current = requestId;

    const timer = setTimeout(async () => {
      try {
        const recommendations = await buildAddressResults(trimmed, 4);
        if (recommendationRequestRef.current !== requestId) return;
        setResults(recommendations);
      } catch {
        if (recommendationRequestRef.current === requestId) {
          setResults([]);
        }
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const searchAddress = async () => {
    const trimmed = query.trim();
    if (!trimmed) {
      Alert.alert('Search address', 'Enter your home address first.');
      return;
    }

    setSearching(true);
    try {
      const mapped = await buildAddressResults(trimmed);
      if (mapped.length === 0) {
        setResults([]);
        Alert.alert('Address not found', 'Try a more specific street, building, or area name.');
        return;
      }

      setResults(mapped);
      setSelected(mapped[0]);
    } catch (error: any) {
      Alert.alert('Search failed', error?.message || 'Unable to search this address.');
    } finally {
      setSearching(false);
    }
  };

  const useCurrentLocation = async () => {
    setSearching(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Allow location access to use your current location.');
        return;
      }

      const position = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      const reverse = await Location.reverseGeocodeAsync(coords);
      const current = {
        id: 'current-location',
        address: formatReverseAddress(reverse[0], 'Current location'),
        lat: coords.latitude,
        lng: coords.longitude,
      };

      setQuery(current.address);
      setResults([current]);
      setSelected(current);
    } catch (error: any) {
      Alert.alert('Location failed', error?.message || 'Unable to use current location.');
    } finally {
      setSearching(false);
    }
  };

  const saveHomeAddress = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to save your home address.');
      return;
    }

    if (!selected) {
      Alert.alert('Select address', 'Choose an address before saving.');
      return;
    }

    setSaving(true);
    try {
      const { error } = await (supabase.from('users') as any)
        .update({
          home_address: selected.address,
          home_lat: selected.lat,
          home_lng: selected.lng,
        })
        .eq('id', user.id);

      if (error) throw error;

      await fetchProfile();
      Alert.alert('Home saved', 'Your home address has been updated.');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Save failed', error?.message || 'Unable to save your home address.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ChevronLeft color="#121c28" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Set Home Address</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          style={{ backgroundColor: '#ffffff' }}
        >
          <View style={styles.heroCard}>
            <View style={styles.heroIcon}>
              <Home color="#006948" size={28} />
            </View>
            <Text style={styles.heroTitle}>Where should collectors go?</Text>
            <Text style={styles.heroText}>
              Search your home first, choose the best match, then save it as your default pickup address.
            </Text>
          </View>

          <View style={styles.searchCard}>
            <Text style={styles.label}>HOME ADDRESS</Text>
            <View style={styles.searchRow}>
              <View style={styles.inputWrap}>
                <Search color="#94a3b8" size={18} />
                <TextInput
                  placeholder="Search home address"
                  placeholderTextColor="#94a3b8"
                  value={query}
                  onChangeText={setQuery}
                  style={styles.input}
                  returnKeyType="search"
                  onSubmitEditing={searchAddress}
                />
              </View>
              <TouchableOpacity
                style={[styles.searchBtn, searching && styles.disabledBtn]}
                onPress={searchAddress}
                disabled={searching}
              >
                {searching ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.searchBtnText}>Search</Text>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.currentBtn} onPress={useCurrentLocation} disabled={searching}>
              <LocateFixed color="#006948" size={18} />
              <Text style={styles.currentBtnText}>Use current location</Text>
            </TouchableOpacity>
          </View>

          {results.length > 0 && (
            <View style={styles.resultsCard}>
              <Text style={styles.sectionTitle}>Recommended addresses</Text>
              {results.map((item, index) => {
                const isSelected = selected?.id === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    testID={`home-address-result-${index}`}
                    style={[styles.resultItem, isSelected && styles.resultItemSelected]}
                    onPress={() => setSelected(item)}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.resultIcon, isSelected && styles.resultIconSelected]}>
                      <MapPin color={isSelected ? '#ffffff' : '#006948'} size={18} />
                    </View>
                    <View style={styles.resultTextWrap}>
                      <Text style={styles.resultTitle} numberOfLines={2}>
                        {item.address}
                      </Text>
                      <Text style={styles.resultMeta}>
                        {item.lat.toFixed(5)}, {item.lng.toFixed(5)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <View style={styles.previewCard}>
            <View style={styles.previewTop}>
              <Crosshair color="#006948" size={20} />
              <Text style={styles.sectionTitle}>Selected Home</Text>
            </View>
            <Text style={selected ? styles.previewAddress : styles.previewEmpty}>
              {selected?.address || 'Search and select your home address.'}
            </Text>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.lg }]}>
          <TouchableOpacity
            testID="save-home-address-button"
            style={[styles.saveBtn, (!selected || saving) && styles.disabledBtn]}
            onPress={saveHomeAddress}
            disabled={!selected || saving}
          >
            {saving ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>Save Home Address</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  safeArea: { flex: 1, backgroundColor: '#ffffff' },
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
  scroll: { padding: spacing.lg },
  heroCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#e8edf2',
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#e0f2f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#121c28', marginBottom: 6 },
  heroText: { fontSize: 14, lineHeight: 21, color: '#64748b', fontWeight: '500' },
  searchCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#e8edf2',
  },
  label: { fontSize: 11, color: '#64748b', fontWeight: '800', letterSpacing: 1, marginBottom: 10 },
  searchRow: { flexDirection: 'row', gap: spacing.sm },
  inputWrap: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: 8,
  },
  input: { flex: 1, color: '#121c28', fontSize: 15, fontWeight: '600' },
  searchBtn: {
    height: 48,
    minWidth: 88,
    borderRadius: 14,
    backgroundColor: '#006948',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  searchBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
  currentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: spacing.md,
    paddingVertical: 10,
  },
  currentBtnText: { color: '#006948', fontSize: 14, fontWeight: '700' },
  resultsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#e8edf2',
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#121c28' },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  resultItemSelected: { backgroundColor: '#f0fdf4', marginHorizontal: -8, paddingHorizontal: 8, borderRadius: 14 },
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#e0f2f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultIconSelected: { backgroundColor: '#006948' },
  resultTextWrap: { flex: 1 },
  resultTitle: { fontSize: 14, color: '#121c28', fontWeight: '700', lineHeight: 19 },
  resultMeta: { fontSize: 12, color: '#64748b', marginTop: 3, fontWeight: '500' },
  previewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#e8edf2',
  },
  previewTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.sm },
  previewAddress: { fontSize: 15, color: '#121c28', fontWeight: '700', lineHeight: 21 },
  previewEmpty: { fontSize: 14, color: '#94a3b8', fontWeight: '600', lineHeight: 20 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  saveBtn: {
    height: 56,
    borderRadius: 18,
    backgroundColor: '#006948',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
  disabledBtn: { opacity: 0.55 },
});
