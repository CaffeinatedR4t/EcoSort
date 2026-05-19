import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { UrlTile, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, MapPin } from 'lucide-react-native';
import { colors } from '../../services/theme/colors';
import { spacing } from '../../services/theme/spacing';
import { Button } from '../../components/Button';
import { usePickupStore } from '../../store/pickupStore';
import { useAuthStore } from '../../store/authStore';
import { isPickupAddressReady } from '../../utils/pickupLocation';

const INITIAL_REGION: Region = {
  latitude: -6.200000,
  longitude: 106.816666,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

export const PickLocationScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { createRequest, fetchUserRequests, loading } = usePickupStore();
  
  const [region, setRegion] = useState<Region>(INITIAL_REGION);
  const [address, setAddress] = useState<string>('Locating...');
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  
  const mapRef = useRef<MapView>(null);
  const addressDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addressRequestRef = useRef(0);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please enable location permissions to use this feature.');
        return;
      }
      setPermissionGranted(true);
      
      try {
        let location = await Location.getCurrentPositionAsync({});
        const newRegion = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        };
        setRegion(newRegion);
        mapRef.current?.animateToRegion(newRegion, 1000);
        reverseGeocode(newRegion.latitude, newRegion.longitude);
      } catch (error) {
        console.warn('Error getting current location:', error);
      }
    })();

    return () => {
      if (addressDelayRef.current) {
        clearTimeout(addressDelayRef.current);
      }
    };
  }, []);

  const reverseGeocode = async (lat: number, lon: number) => {
    const requestId = ++addressRequestRef.current;
    setIsReverseGeocoding(true);
    setAddress('Locating...');
    try {
      // Using free OSM Nominatim API
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
        {
          headers: {
            'User-Agent': 'EcoSort-App', // Recommended by OSM policy
          },
        }
      );
      const data = await response.json();
      if (addressRequestRef.current !== requestId) return;

      if (data && data.display_name) {
        setAddress(data.display_name);
      } else {
        setAddress('Address not found');
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      if (addressRequestRef.current === requestId) {
        setAddress('Error fetching address');
      }
    } finally {
      if (addressRequestRef.current === requestId) {
        setIsReverseGeocoding(false);
      }
    }
  };

  const scheduleReverseGeocode = (lat: number, lon: number) => {
    const requestId = ++addressRequestRef.current;
    if (addressDelayRef.current) {
      clearTimeout(addressDelayRef.current);
    }
    setIsReverseGeocoding(true);
    setAddress('Locating...');
    addressDelayRef.current = setTimeout(() => {
      if (addressRequestRef.current === requestId) {
        reverseGeocode(lat, lon);
      }
    }, 700);
  };

  const onRegionChangeComplete = (newRegion: Region) => {
    setRegion(newRegion);
    scheduleReverseGeocode(newRegion.latitude, newRegion.longitude);
  };

  const handleConfirm = async () => {
    if (!user) return;
    if (isReverseGeocoding || !isPickupAddressReady(address)) {
      Alert.alert('Address loading', 'Please wait until the exact pickup address is loaded.');
      return;
    }

    try {
      const locationData = {
        lat: region.latitude,
        lng: region.longitude,
        address: address
      };

      await createRequest(user.id, locationData);
      Alert.alert('Success', 'Pickup request submitted! A collector will be assigned soon.');
      await fetchUserRequests(user.id);
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={INITIAL_REGION}
          onRegionChangeComplete={onRegionChangeComplete}
          showsUserLocation={permissionGranted}
          showsMyLocationButton={false}
        >
          {/* OpenStreetMap Tiles for $0 cost */}
          <UrlTile 
            urlTemplate="https://a.tile.openstreetmap.de/{z}/{x}/{y}.png"
            maximumZ={19}
            flipY={false}
          />
        </MapView>
        
        {/* Fixed Center Pin */}
        <View style={styles.pinContainer} pointerEvents="none">
          <View style={styles.pinWrapper}>
            <MapPin color={colors.primary} size={40} fill={colors.white} />
            <View style={styles.pinShadow} />
          </View>
        </View>

        {/* Header Controls */}
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft color={colors.textBlack} size={28} />
        </TouchableOpacity>
      </View>

      {/* Bottom Address Card */}
      <View style={styles.bottomCard}>
        <View style={styles.addressContainer}>
          <Text style={styles.addressLabel}>PICKUP LOCATION</Text>
          {isReverseGeocoding ? (
            <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
          ) : (
            <Text style={styles.addressText} numberOfLines={2}>
              {address}
            </Text>
          )}
        </View>

        <Button 
          title={isReverseGeocoding ? 'Loading address...' : loading ? 'Requesting...' : 'Confirm Pickup Location'} 
          onPress={handleConfirm} 
          loading={loading}
          disabled={isReverseGeocoding || !isPickupAddressReady(address)}
          style={styles.confirmBtn}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  webFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.neutralWarm,
  },
  webFallbackText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textBlack,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  webFallbackSub: {
    fontSize: 16,
    color: colors.textBlackSoft,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  pinContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinWrapper: {
    alignItems: 'center',
    marginBottom: 40, // Offset to point accurately to center
  },
  pinShadow: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.3)',
    marginTop: -2,
  },
  backButton: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  bottomCard: {
    backgroundColor: colors.white,
    padding: spacing.xl,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  addressContainer: {
    marginBottom: spacing.xl,
  },
  addressLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textBlackSoft,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  addressText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textBlack,
    lineHeight: 22,
  },
  loader: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  confirmBtn: {
    width: '100%',
  },
});
