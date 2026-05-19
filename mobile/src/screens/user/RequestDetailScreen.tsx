import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, useWindowDimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { supabase } from '../../services/api/supabase';
import { fetchRoute } from '../../services/api/routing';
import { 
  ChevronLeft, 
  MapPin, 
  Calendar, 
  Clock, 
  User, 
  CheckCircle, 
  AlertCircle,
  Truck
} from 'lucide-react-native';
import { colors } from '../../services/theme/colors';
import { spacing } from '../../services/theme/spacing';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';

export const RequestDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { request } = route.params;
  const { width } = useWindowDimensions();

  const [driverPos, setDriverPos] = useState<any>(null);
  const [routeCoords, setRouteCoords] = useState<any[]>([]);
  const [collectorProfile, setCollectorProfile] = useState<any>(null);
  const collectorVehicle = [
    collectorProfile?.vehicle_type,
    collectorProfile?.vehicle_plate,
  ].filter(Boolean).join(' • ');

  // Fetch collector profile
  useEffect(() => {
    if (request.collector_id) {
      const fetchCollector = async () => {
        const { data } = await supabase
          .from('users')
          .select('name, phone_number, vehicle_type, vehicle_plate, operating_area, current_lat, current_lng')
          .eq('id', request.collector_id)
          .single();
        if (data) {
          setCollectorProfile(data);
          if (data.current_lat && data.current_lng) {
            const initialPos = {
              latitude: data.current_lat,
              longitude: data.current_lng,
            };
            setDriverPos(initialPos);

            // Fetch initial road route
            const initialRoute = await fetchRoute(initialPos, {
              latitude: request.location.lat,
              longitude: request.location.lng,
            });
            setRouteCoords(initialRoute);
          }
        }
      };
      fetchCollector();
    }
  }, [request.collector_id]);

  // Real-time tracking from Supabase
  useEffect(() => {
    let channel: any;

    if (request.status === 'ASSIGNED' || request.status === 'IN_PROGRESS') {
      channel = supabase.channel(`job-tracking-${request.id}`);
      
      channel
        .on('broadcast', { event: 'location-update' }, async (response: any) => {
          if (response.payload && typeof response.payload.latitude === 'number' && typeof response.payload.longitude === 'number') {
            const newPos = {
              latitude: response.payload.latitude,
              longitude: response.payload.longitude,
            };
            setDriverPos(newPos);

            // Update road route
            const newRoute = await fetchRoute(newPos, {
              latitude: request.location.lat,
              longitude: request.location.lng,
            });
            setRouteCoords(newRoute);
          }
        })
        .subscribe();
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [request.id, request.status, request.location]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return colors.primary;
      case 'PENDING': return colors.gold;
      case 'ASSIGNED':
      case 'IN_PROGRESS': return colors.greenAccent;
      case 'CANCELLED': return colors.error;
      default: return colors.textBlackSoft;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle color={colors.primary} size={20} />;
      default: return <Clock color={getStatusColor(status)} size={20} />;
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.headerSafe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ChevronLeft color={colors.textBlack} size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tracking Pickup</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Map View */}
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: request.location.lat,
              longitude: request.location.lng,
              latitudeDelta: 0.015,
              longitudeDelta: 0.015,
            }}
          >
            <Marker
              coordinate={{ latitude: request.location.lat, longitude: request.location.lng }}
              title="Your Location"
              pinColor={colors.primary}
            />
            {driverPos && (request.status === 'ASSIGNED' || request.status === 'IN_PROGRESS') && (
              <>
                <Marker
                  coordinate={driverPos}
                  title="Driver"
                >
                  <View style={styles.driverMarker}>
                    <Truck color="#fff" size={16} />
                  </View>
                </Marker>
                <Polyline
                  coordinates={routeCoords.length > 0 ? routeCoords : [driverPos, { latitude: request.location.lat, longitude: request.location.lng }]}
                  strokeColor={colors.primary}
                  strokeWidth={3}
                  lineDashPattern={[5, 5]}
                />
              </>
            )}
          </MapView>
          
          <Card style={styles.floatingStatusCard}>
            <View style={styles.statusHeader}>
              {getStatusIcon(request.status)}
              <Text style={[styles.statusText, { color: getStatusColor(request.status) }]}>
                {request.status.replace('_', ' ')}
              </Text>
            </View>
            <Text style={styles.requestId}>ID: {request.id.split('-')[0].toUpperCase()}</Text>
          </Card>
        </View>

        {/* Driver Info Card */}
        {request.collector_id && (
          <Card style={styles.driverCard}>
            <View style={styles.driverInfo}>
              <View style={styles.driverAvatar}>
                <User color={colors.primary} size={24} />
              </View>
              <View style={styles.driverText}>
                <Text style={styles.driverName}>
                  {collectorProfile?.name || 'Assigned collector'}
                </Text>
                <Text style={styles.driverMeta}>
                  {collectorVehicle || collectorProfile?.phone_number || 'Collector assigned'}
                </Text>
              </View>
            </View>
          </Card>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Pickup Location</Text>
          <Card style={styles.locationCard}>
            <View style={styles.locationInfo}>
              <MapPin color={colors.primary} size={24} />
              <Text style={styles.addressText}>{request.location.address}</Text>
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Details</Text>
          <Card style={styles.detailsCard}>
            <View style={styles.detailItem}>
              <Calendar color={colors.textBlackSoft} size={20} />
              <View style={styles.detailTextContent}>
                <Text style={styles.detailLabel}>Requested Date</Text>
                <Text style={styles.detailValue}>
                  {new Date(request.created_at).toLocaleDateString()}
                </Text>
              </View>
            </View>
            
            <View style={styles.divider} />

            <View style={styles.detailItem}>
              <Clock color={colors.textBlackSoft} size={20} />
              <View style={styles.detailTextContent}>
                <Text style={styles.detailLabel}>Requested Time</Text>
                <Text style={styles.detailValue}>
                  {new Date(request.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          </Card>
        </View>

        {request.status === 'PENDING' && (
          <View style={styles.infoBox}>
            <AlertCircle color={colors.gold} size={20} />
            <Text style={styles.infoText}>
              A collector will be assigned to your request shortly. Please wait.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerSafe: {
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textBlack,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  mapContainer: {
    height: 300,
    width: '100%',
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  floatingStatusCard: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    padding: spacing.md,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 2,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  requestId: {
    fontSize: 11,
    color: colors.textBlackSoft,
    fontWeight: '600',
  },
  driverMarker: {
    backgroundColor: colors.primary,
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
  },
  driverCard: {
    margin: spacing.lg,
    marginTop: -30, // Overlap the map slightly
    padding: spacing.lg,
    borderRadius: 20,
    zIndex: 10,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f1f8e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  driverText: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textBlack,
  },
  driverMeta: {
    fontSize: 12,
    color: colors.textBlackSoft,
    marginTop: 2,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textBlackSoft,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
    marginLeft: 4,
  },
  locationCard: {
    padding: spacing.lg,
  },
  locationInfo: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  addressText: {
    flex: 1,
    fontSize: 15,
    color: colors.textBlack,
    lineHeight: 22,
    fontWeight: '600',
  },
  detailsCard: {
    padding: spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  detailTextContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.textBlackSoft,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: colors.textBlack,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.neutralCool,
    marginHorizontal: spacing.md,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(251, 188, 5, 0.1)',
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    borderRadius: 12,
    gap: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.textBlack,
    lineHeight: 18,
  },
});
