import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { colors } from '../../services/theme/colors';
import { spacing } from '../../services/theme/spacing';
import { Button } from '../../components/Button';
import { usePickupStore } from '../../store/pickupStore';
import { supabase } from '../../services/api/supabase';
import { useAuthStore } from '../../store/authStore';
import { MapPin, ChevronLeft } from 'lucide-react-native';
import { isPickupAddressReady } from '../../utils/pickupLocation';
import { assertUserCanCreatePickupRequest } from '../../utils/pickupRequest';

export const PickLocationScreen = () => {
  const [location, setLocation] = useState<any>(null);
  const [address, setAddress] = useState('Fetching location...');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [usingHomeAddress, setUsingHomeAddress] = useState(false);
  const [addressResolving, setAddressResolving] = useState(false);
  const { cart, clearCart } = usePickupStore();
  const { user } = useAuthStore();
  const navigation = useNavigation<any>();
  const addressDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addressRequestRef = useRef(0);

  const resolveAddress = async (coords: { latitude: number; longitude: number }) => {
    const requestId = ++addressRequestRef.current;
    setAddressResolving(true);
    setAddress('Locating...');
    try {
      const reverseGeocode = await Location.reverseGeocodeAsync(coords);
      if (addressRequestRef.current !== requestId) return;

      if (reverseGeocode.length > 0) {
        const item = reverseGeocode[0];
        const exactAddress = `${item.street || ''} ${item.name || ''}, ${item.city || ''}, ${item.region || ''}`
          .replace(/\s+/g, ' ')
          .trim();
        setAddress(exactAddress || 'Address not found');
      } else {
        setAddress('Address not found');
      }
    } catch (e) {
      if (addressRequestRef.current === requestId) {
        setAddress('Address found at coordinates');
      }
    } finally {
      if (addressRequestRef.current === requestId) {
        setAddressResolving(false);
      }
    }
  };

  const scheduleAddressResolve = (coords: { latitude: number; longitude: number }) => {
    const requestId = ++addressRequestRef.current;
    if (addressDelayRef.current) {
      clearTimeout(addressDelayRef.current);
    }
    setAddressResolving(true);
    setAddress('Locating...');
    addressDelayRef.current = setTimeout(() => {
      if (addressRequestRef.current === requestId) {
        resolveAddress(coords);
      }
    }, 700);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      
      // Use home address if available
      if (user?.home_lat && user?.home_lng) {
        const homeCoords = {
          latitude: user.home_lat,
          longitude: user.home_lng,
        };
        setLocation(homeCoords);
        setUsingHomeAddress(true);
        const homeAddress = user.home_address || '';
        if (isPickupAddressReady(homeAddress)) {
          setAddress(homeAddress);
        } else {
          await resolveAddress(homeCoords);
        }
        setLoading(false);
        return;
      }

      // Otherwise, request GPS location
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Allow location access to set pickup point.');
        setLoading(false);
        return;
      }

      let position = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      setLocation(coords);
      await resolveAddress(coords);
      setLoading(false);
    })();

    return () => {
      if (addressDelayRef.current) {
        clearTimeout(addressDelayRef.current);
      }
    };
  }, [user]);

  const handleConfirmPickup = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to request a pickup.');
      return;
    }

    if (!location) {
      Alert.alert('Error', 'Please select a location.');
      return;
    }

    if (addressResolving || !isPickupAddressReady(address)) {
      Alert.alert('Address loading', 'Please wait until the exact pickup address is loaded.');
      return;
    }

    setSubmitting(true);

    // Serialize cart for waste_hint
    const wasteHint = cart.map(item => 
      item.source === 'barcode' 
        ? `${item.waste_type} (${item.productName})` 
        : `${item.waste_type} (AI Scan)`
    ).join(', ');

    try {
      await assertUserCanCreatePickupRequest(user.id);

      const { error } = await (supabase.from('pickup_requests') as any).insert({
        user_id: user.id,
        status: 'PENDING',
        location: {
          lat: location.latitude,
          lng: location.longitude,
          address: address,
        },
        waste_hint: wasteHint,
      });

      if (error) throw error;

      Alert.alert('Success!', 'Your pickup request has been submitted.', [
        {
          text: 'OK',
          onPress: () => {
            clearCart();
            navigation.navigate('UserHome');
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: '#006948' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#006948" />
      <SafeAreaView style={{ flex: 1, backgroundColor: '#006948' }} edges={['top', 'left', 'right']}>
        <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft color={colors.textBlack} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Pickup Point</Text>
      </View>

      <View style={styles.mapContainer}>
        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loaderText}>Locating...</Text>
          </View>
        ) : (
          <MapView
            style={styles.map}
            provider={PROVIDER_DEFAULT}
            initialRegion={{
              latitude: location?.latitude || -6.200000,
              longitude: location?.longitude || 106.816666,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            }}
            onRegionChangeComplete={(region) => {
              const nextLocation = {
                latitude: region.latitude,
                longitude: region.longitude,
              };
              setLocation(nextLocation);
              scheduleAddressResolve(nextLocation);
            }}
          >
            {location && <Marker coordinate={location} />}
          </MapView>
        )}
        <View style={styles.markerOverlay} pointerEvents="none">
          <MapPin size={40} color={colors.primary} />
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.addressBox}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={styles.addressLabel}>PICKUP ADDRESS</Text>
            {usingHomeAddress && (
              <View style={styles.homeBadge}>
                <Text style={styles.homeBadgeText}>Default Home</Text>
              </View>
            )}
          </View>
          <Text style={styles.addressText} numberOfLines={2}>{address}</Text>
        </View>
        
        <Button 
          title={addressResolving ? 'Loading address...' : 'Confirm Pickup Request'} 
          onPress={handleConfirmPickup}
          loading={submitting}
          disabled={!location || submitting || addressResolving || !isPickupAddressReady(address)}
        />
      </View>
        </View>
    </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutralWarm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textBlack,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  markerOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -40,
    marginLeft: -20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.neutralWarm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: spacing.sm,
    color: colors.textBlackSoft,
  },
  footer: {
    padding: spacing.xl,
    backgroundColor: colors.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  addressBox: {
    marginBottom: spacing.lg,
  },
  addressLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textBlackSoft,
    letterSpacing: 1,
    marginBottom: 4,
  },
  addressText: {
    fontSize: 16,
    color: colors.textBlack,
    fontWeight: '500',
  },
});
