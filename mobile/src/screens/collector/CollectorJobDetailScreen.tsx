import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  ScrollView, 
  Platform, 
  TextInput,
  Image,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { supabase } from '../../services/api/supabase';
import { colors } from '../../services/theme/colors';
import { spacing } from '../../services/theme/spacing';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { useAuthStore } from '../../store/authStore';
import { usePickupStore } from '../../store/pickupStore';
import { classifyWaste, GeminiClassification } from '../../services/api/gemini';
import { fetchRoute } from '../../services/api/routing';
import { 
  ChevronLeft, 
  MapPin, 
  Package, 
  CheckCircle2, 
  Clock, 
  Camera as CameraIcon,
  Scale,
  Sparkles,
  X,
  RefreshCw,
  Edit2
} from 'lucide-react-native';

const WASTE_TYPES = ['plastic', 'paper', 'metal', 'organic', 'other'];

export const CollectorJobDetailScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { job } = route.params;
  const { user } = useAuthStore();
  const { markArrived, submitCollection, loading } = usePickupStore();
  
  const [status, setStatus] = useState(job.status);
  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [photo, setPhoto] = useState<any>(null);
  const [weight, setWeight] = useState('');
  const [classification, setClassification] = useState<GeminiClassification | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isClassifying, setIsClassifying] = useState(false);
  const [isManual, setIsManual] = useState(false);
  
  // Map and Location States
  const [driverPos, setDriverPos] = useState<any>(null);
  const [routeCoords, setRouteCoords] = useState<any[]>([]);
  const [mapRegion, setMapRegion] = useState<any>(null);
  const mapRef = useRef<MapView>(null);
  const locationSubscription = useRef<any>(null);
  const trackingChannel = useRef<any>(null);
  const isSubscribed = useRef(false);

  const cameraRef = useRef<any>(null);

  // Initialize Realtime Channel and Location Watching
  useEffect(() => {
    let isMounted = true;

    const startTracking = async () => {
      const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
      if (locStatus !== 'granted') {
        return;
      }

      const current = await Location.getCurrentPositionAsync({});
      if (isMounted) {
        const coords = {
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
        };
        setDriverPos(coords);
        
        // Initial route fetch
        const initialRoute = await fetchRoute(coords, { 
          latitude: job.location.lat, 
          longitude: job.location.lng 
        });
        setRouteCoords(initialRoute);

        setMapRegion({
          ...coords,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }

      trackingChannel.current = supabase.channel(`job-tracking-${job.id}`);
      trackingChannel.current.subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          isSubscribed.current = true;
        }
      });

      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 10,
        },
        async (location) => {
          if (isMounted) {
            const newCoords = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            };
            setDriverPos(newCoords);
            
            // Update road route
            const newRoute = await fetchRoute(newCoords, { 
              latitude: job.location.lat, 
              longitude: job.location.lng 
            });
            setRouteCoords(newRoute);
            
            // Periodically update database (Persistence)
            supabase.from('users').update({ 
              current_lat: newCoords.latitude, 
              current_lng: newCoords.longitude 
            }).eq('id', user!.id).then();

            if (trackingChannel.current && isSubscribed.current) {
              trackingChannel.current.send({
                type: 'broadcast',
                event: 'location-update',
                payload: newCoords,
              });
            }
          }
        }
      );
    };

    if (status === 'ASSIGNED' || status === 'IN_PROGRESS') {
      startTracking();
    }

    return () => {
      isMounted = false;
      if (locationSubscription.current) locationSubscription.current.remove();
      if (trackingChannel.current) supabase.removeChannel(trackingChannel.current);
    };
  }, [job.id, status]);

  const handleArrived = async () => {
    try {
      await markArrived(job.id);
      setStatus('IN_PROGRESS');
      Alert.alert('Arrived', 'Status updated to IN PROGRESS. Please verify the bag contents.');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const takePhoto = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert('Permission Denied', 'Camera permission is required to verify collection.');
        return;
      }
    }
    setShowCamera(true);
  };

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    try {
      const capturedPhoto = await cameraRef.current.takePictureAsync({ base64: true });
      setPhoto(capturedPhoto);
      setShowCamera(false);
      
      setIsClassifying(true);
      const result = await classifyWaste(capturedPhoto.base64);
      setClassification(result);
      setSelectedType(result.waste_type); // Default to AI result
    } catch (error: any) {
      Alert.alert('Error', 'Failed to classify. You can select the type manually.');
      setSelectedType('other');
    } finally {
      setIsClassifying(false);
    }
  };

  const handleComplete = async () => {
    if (!weight || isNaN(Number(weight))) {
      Alert.alert('Invalid Weight', 'Please enter a valid weight in kg.');
      return;
    }
    if (!selectedType) {
      Alert.alert('Incomplete', 'Please verify the waste type first.');
      return;
    }

    const finalClassification = {
      waste_type: selectedType,
      confidence: classification?.confidence || (isManual && !photo ? 1.0 : 0.0),
      image_uri: photo?.uri || 'manual_entry'
    };

    Alert.alert(
      'Confirm Collection',
      `Submit collection for ${selectedType.toUpperCase()} bag (${weight}kg)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Submit', 
          onPress: async () => {
            try {
              console.log('Submitting collection:', { jobId: job.id, userId: job.user_id, collectorId: user!.id });
              await submitCollection({
                requestId: job.id, 
                userId: job.user_id, 
                collectorId: user!.id,
                classification: finalClassification, 
                weight: Number(weight)
              });
              Alert.alert('Success', 'Collection confirmed and submitted!', [
                { text: 'OK', onPress: () => navigation.navigate('CollectorHome') }
              ]);
            } catch (error: any) {
              console.error('Submission error:', error);
              Alert.alert('Error', error.message);
            }
          }
        }
      ]
    );
  };

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={styles.camera} facing="back" />
        <SafeAreaView style={styles.cameraOverlay}>
          <TouchableOpacity onPress={() => setShowCamera(false)} style={styles.closeCamera}>
            <X color={colors.white} size={32} />
          </TouchableOpacity>
          <View style={styles.captureBtnContainer}>
            <TouchableOpacity onPress={handleCapture} style={styles.captureBtn}>
              <View style={styles.captureBtnInner} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft color={colors.textBlack} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verification</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {(status === 'ASSIGNED' || status === 'IN_PROGRESS') && (
          <Card style={styles.mapCard}>
            <Text style={styles.sectionLabel}>NAVIGATION</Text>
            <View style={styles.mapWrapper}>
              {driverPos ? (
                <MapView
                  ref={mapRef}
                  style={styles.map}
                  provider={PROVIDER_DEFAULT}
                  initialRegion={mapRegion}
                  showsUserLocation={true}
                >
                  <Marker
                    coordinate={{ latitude: job.location.lat, longitude: job.location.lng }}
                    title="Pickup Location"
                  >
                    <View style={styles.destMarker}>
                      <MapPin color={colors.white} size={20} />
                    </View>
                  </Marker>
                  <Polyline
                    coordinates={routeCoords.length > 0 ? routeCoords : [driverPos, { latitude: job.location.lat, longitude: job.location.lng }]}
                    strokeColor={colors.primary}
                    strokeWidth={4}
                  />
                </MapView>
              ) : (
                <View style={styles.mapLoading}>
                  <ActivityIndicator color={colors.primary} />
                  <Text style={styles.loadingText}>Initializing Maps...</Text>
                </View>
              )}
            </View>
          </Card>
        )}

        <Card style={styles.mainCard}>
          <View style={[styles.statusBadge, status === 'IN_PROGRESS' && styles.statusBadgeActive]}>
            <Clock size={14} color={status === 'IN_PROGRESS' ? colors.white : colors.gold} />
            <Text style={[styles.statusText, status === 'IN_PROGRESS' && styles.statusTextActive]}>
              {status.replace('_', ' ')}
            </Text>
          </View>
          <Text style={styles.sectionLabel}>LOCATION</Text>
          <View style={styles.locationRow}>
            <MapPin size={20} color={colors.primary} />
            <Text style={styles.addressText}>{job.location.address}</Text>
          </View>
          <View style={styles.divider} />
          <Text style={styles.sectionLabel}>USER'S HINT</Text>
          <View style={styles.hintRow}>
            <Package size={20} color={colors.primary} />
            <Text style={styles.hintText}>{job.waste_hint || 'Mixed Bag'}</Text>
          </View>
        </Card>

        {status === 'ASSIGNED' ? (
          <View style={styles.actionContainer}>
            <Button title="I Have Arrived" onPress={handleArrived} loading={loading} style={styles.actionBtn} />
            <Text style={styles.actionHint}>Tap when you reach the user's location.</Text>
          </View>
        ) : status === 'IN_PROGRESS' ? (
          <View style={styles.verificationSection}>
            <Text style={styles.sectionTitle}>Verification Steps</Text>
            
            <TouchableOpacity 
              style={[styles.verificationCard, photo && styles.verificationCardFilled]}
              onPress={takePhoto}
              disabled={isClassifying}
            >
              {photo ? (
                <View style={styles.photoResult}>
                  <Image source={{ uri: photo.uri }} style={styles.capturedImage} />
                  <View style={styles.overlayHint}><Edit2 color="#fff" size={16} /><Text style={styles.overlayText}>Retake</Text></View>
                </View>
              ) : (
                <View style={styles.placeholderContent}>
                  <CameraIcon color={colors.primary} size={32} />
                  <Text style={styles.placeholderText}>Take Photo for AI</Text>
                </View>
              )}
            </TouchableOpacity>

            {!photo && !isManual && (
              <TouchableOpacity onPress={() => setIsManual(true)} style={{ alignItems: 'center', marginBottom: spacing.lg }}>
                <Text style={{ color: colors.primary, fontWeight: '700', textDecorationLine: 'underline' }}>Or Verify Manually (Skip AI)</Text>
              </TouchableOpacity>
            )}

            {(photo || isManual) && (
              <View style={styles.typeSelectionSection}>
                <Text style={styles.sectionLabel}>VERIFY WASTE TYPE</Text>
                <View style={styles.chipContainer}>
                  {WASTE_TYPES.map(type => (
                    <TouchableOpacity 
                      key={type}
                      style={[styles.chip, selectedType === type && styles.chipActive]}
                      onPress={() => setSelectedType(type)}
                    >
                      <Text style={[styles.chipText, selectedType === type && styles.chipTextActive]}>
                        {type.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {isClassifying && <ActivityIndicator color={colors.primary} style={{ marginTop: 8 }} />}
              </View>
            )}

            <View style={styles.weightCard}>
              <View style={styles.weightHeader}>
                <Scale color={colors.primary} size={20} />
                <Text style={styles.weightLabel}>Weight (kg)</Text>
              </View>
              <TextInput
                style={styles.weightInput}
                placeholder="0.0"
                keyboardType="decimal-pad"
                value={weight}
                onChangeText={setWeight}
              />
            </View>

            <Button 
              title="Complete Collection" 
              onPress={handleComplete}
              loading={loading}
              disabled={(!photo && !isManual) || !weight || isClassifying || !selectedType}
              style={styles.confirmBtn}
            />
          </View>
        ) : (
          <View style={styles.completedContainer}>
            <CheckCircle2 color={colors.success} size={64} />
            <Text style={styles.completedText}>Collection Completed</Text>
            <Button title="Back to Home" onPress={() => navigation.goBack()} variant="outline" />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutralWarm },
  header: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.md, backgroundColor: colors.white },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.neutralCool, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.textBlack },
  scrollContent: { padding: spacing.lg },
  mapCard: { padding: spacing.lg, borderRadius: 20, marginBottom: spacing.lg, backgroundColor: colors.white },
  mapWrapper: { height: 180, borderRadius: 16, overflow: 'hidden', marginTop: spacing.sm },
  map: { ...StyleSheet.absoluteFillObject },
  mapLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 12, color: colors.textBlackSoft },
  destMarker: { backgroundColor: colors.primary, padding: 8, borderRadius: 20, borderWidth: 2, borderColor: colors.white },
  mainCard: { padding: spacing.xl, borderRadius: 20, marginBottom: spacing.lg },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff9e6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', gap: 6, marginBottom: spacing.lg },
  statusBadgeActive: { backgroundColor: colors.primary },
  statusText: { fontSize: 12, fontWeight: '700', color: colors.gold, textTransform: 'uppercase' },
  statusTextActive: { color: colors.white },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: colors.textBlackSoft, letterSpacing: 1, marginBottom: spacing.xs },
  locationRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginBottom: spacing.xl },
  addressText: { flex: 1, fontSize: 15, color: colors.textBlack, fontWeight: '600' },
  divider: { height: 1, backgroundColor: colors.neutralCool, marginBottom: spacing.lg },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  hintText: { flex: 1, fontSize: 14, color: colors.primary, fontWeight: '700' },
  actionContainer: { padding: spacing.lg, alignItems: 'center', gap: spacing.md },
  actionBtn: { width: '100%', height: 56 },
  actionHint: { fontSize: 13, color: colors.textBlackSoft },
  verificationSection: { paddingTop: spacing.md },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: colors.textBlack, marginBottom: spacing.lg },
  verificationCard: { height: 160, backgroundColor: colors.white, borderRadius: 20, borderWidth: 2, borderColor: colors.neutralCool, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md, overflow: 'hidden' },
  verificationCardFilled: { borderStyle: 'solid', borderColor: colors.primary },
  placeholderContent: { alignItems: 'center', gap: spacing.sm },
  placeholderText: { fontSize: 14, fontWeight: '600', color: colors.primary },
  photoResult: { flex: 1, width: '100%' },
  capturedImage: { flex: 1, width: '100%' },
  overlayHint: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.5)', padding: 6, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 4 },
  overlayText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  typeSelectionSection: { marginBottom: spacing.lg },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.neutralCool },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12, fontWeight: '700', color: colors.textBlackSoft },
  chipTextActive: { color: colors.white },
  weightCard: { backgroundColor: colors.white, padding: spacing.lg, borderRadius: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
  weightHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  weightLabel: { fontSize: 16, fontWeight: '700', color: colors.textBlack },
  weightInput: { width: 80, height: 44, backgroundColor: colors.neutralCool, borderRadius: 12, textAlign: 'center', fontSize: 18, fontWeight: '800', color: colors.primary },
  confirmBtn: { height: 60, marginBottom: spacing.huge },
  completedContainer: { alignItems: 'center', paddingVertical: spacing.huge, gap: spacing.lg },
  completedText: { fontSize: 22, fontWeight: '800', color: colors.success },
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  cameraOverlay: { flex: 1, justifyContent: 'space-between' },
  closeCamera: { padding: spacing.lg, alignSelf: 'flex-start' },
  captureBtnContainer: { alignItems: 'center', paddingBottom: spacing.xxl },
  captureBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: colors.white },
  captureBtnInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.white },
});
