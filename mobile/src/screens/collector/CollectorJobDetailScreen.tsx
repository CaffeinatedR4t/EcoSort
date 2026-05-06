import React, { useState, useRef } from 'react';
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
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { colors } from '../../services/theme/colors';
import { spacing } from '../../services/theme/spacing';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { useAuthStore } from '../../store/authStore';
import { usePickupStore } from '../../store/pickupStore';
import { classifyWaste, GeminiClassification } from '../../services/api/gemini';
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
  RefreshCw
} from 'lucide-react-native';

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
  const [isClassifying, setIsClassifying] = useState(false);
  
  const cameraRef = useRef<any>(null);

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
      
      // Run AI Classification
      setIsClassifying(true);
      const result = await classifyWaste(capturedPhoto.base64);
      setClassification(result);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to capture or classify image.');
    } finally {
      setIsClassifying(false);
    }
  };

  const handleComplete = async () => {
    if (!weight || isNaN(Number(weight))) {
      Alert.alert('Invalid Weight', 'Please enter a valid weight in kg.');
      return;
    }
    if (!classification) {
      Alert.alert('Incomplete', 'Please verify the waste with AI first.');
      return;
    }

    Alert.alert(
      'Confirm Collection',
      `Submit collection for ${classification.waste_type.toUpperCase()} bag (${weight}kg)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Submit', 
          onPress: async () => {
            try {
              await submitCollection(
                job.id, 
                job.user_id, 
                { ...classification, image_uri: photo.uri }, 
                Number(weight)
              );
              Alert.alert('Success', 'Collection confirmed and submitted!', [
                { text: 'OK', onPress: () => navigation.navigate('CollectorHome') }
              ]);
            } catch (error: any) {
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
            <Text style={styles.actionTitle}>On-site Actions</Text>
            <Button 
              title="I Have Arrived" 
              onPress={handleArrived}
              loading={loading}
              style={styles.actionBtn}
            />
            <Text style={styles.actionHint}>Tap this when you reach the user's location.</Text>
          </View>
        ) : status === 'IN_PROGRESS' ? (
          <View style={styles.verificationSection}>
            <Text style={styles.sectionTitle}>Verification Steps</Text>
            
            {/* Camera / Photo Section */}
            <TouchableOpacity 
              style={[styles.verificationCard, photo && styles.verificationCardFilled]}
              onPress={takePhoto}
              disabled={isClassifying}
            >
              {photo ? (
                <View style={styles.photoResult}>
                  <Image source={{ uri: photo.uri }} style={styles.capturedImage} />
                  <View style={styles.classificationResult}>
                    {isClassifying ? (
                      <ActivityIndicator color={colors.primary} />
                    ) : (
                      <>
                        <Sparkles color={colors.primary} size={20} />
                        <View>
                          <Text style={styles.classType}>
                            {classification?.waste_type.toUpperCase() || 'IDENTIFYING...'}
                          </Text>
                          <Text style={styles.classConf}>
                            Confidence: {((classification?.confidence || 0) * 100).toFixed(0)}%
                          </Text>
                        </View>
                        <RefreshCw color={colors.textBlackSoft} size={18} style={{ marginLeft: 'auto' }} />
                      </>
                    )}
                  </View>
                </View>
              ) : (
                <View style={styles.placeholderContent}>
                  <CameraIcon color={colors.primary} size={32} />
                  <Text style={styles.placeholderText}>Take Photo for AI Verification</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Weight Input */}
            <View style={styles.weightCard}>
              <View style={styles.weightHeader}>
                <Scale color={colors.primary} size={20} />
                <Text style={styles.weightLabel}>Scale Weight (kg)</Text>
              </View>
              <TextInput
                style={styles.weightInput}
                placeholder="0.0"
                keyboardType="decimal-pad"
                value={weight}
                onChangeText={setWeight}
              />
            </View>

            <View style={styles.footerActions}>
              <Button 
                title="Complete Collection" 
                onPress={handleComplete}
                loading={loading}
                disabled={!photo || !weight || isClassifying}
                style={styles.confirmBtn}
              />
              <Text style={styles.footerNote}>
                Verification data will be sent for admin approval.
              </Text>
            </View>
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
  container: {
    flex: 1,
    backgroundColor: colors.neutralWarm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.white,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutralCool,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textBlack,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  mainCard: {
    padding: spacing.xl,
    borderRadius: 20,
    marginBottom: spacing.lg,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff9e6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 6,
    marginBottom: spacing.lg,
  },
  statusBadgeActive: {
    backgroundColor: colors.primary,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.gold,
    textTransform: 'uppercase',
  },
  statusTextActive: {
    color: colors.white,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textBlackSoft,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  addressText: {
    flex: 1,
    fontSize: 15,
    color: colors.textBlack,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.neutralCool,
    marginBottom: spacing.lg,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  hintText: {
    flex: 1,
    fontSize: 14,
    color: colors.primary,
    fontWeight: '700',
  },
  actionContainer: {
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textBlack,
  },
  actionBtn: {
    width: '100%',
    height: 56,
  },
  actionHint: {
    fontSize: 13,
    color: colors.textBlackSoft,
    textAlign: 'center',
  },
  verificationSection: {
    paddingTop: spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textBlack,
    marginBottom: spacing.lg,
  },
  verificationCard: {
    height: 180,
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.neutralCool,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  verificationCardFilled: {
    borderStyle: 'solid',
    borderColor: colors.primary,
  },
  placeholderContent: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  placeholderText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  photoResult: {
    flex: 1,
    width: '100%',
  },
  capturedImage: {
    flex: 1,
    width: '100%',
  },
  classificationResult: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  classType: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  classConf: {
    fontSize: 12,
    color: colors.textBlackSoft,
  },
  weightCard: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  weightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  weightLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textBlack,
  },
  weightInput: {
    width: 80,
    height: 44,
    backgroundColor: colors.neutralCool,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  footerActions: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  confirmBtn: {
    height: 60,
  },
  footerNote: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.textBlackSoft,
    fontStyle: 'italic',
  },
  completedContainer: {
    alignItems: 'center',
    paddingVertical: spacing.huge,
    gap: spacing.lg,
  },
  completedText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.success,
  },
  // Camera Modal Styles
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  closeCamera: {
    padding: spacing.lg,
    alignSelf: 'flex-start',
  },
  captureBtnContainer: {
    alignItems: 'center',
    paddingBottom: spacing.xxl,
  },
  captureBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: colors.white,
  },
  captureBtnInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.white,
  },
});
