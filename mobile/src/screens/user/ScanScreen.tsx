import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  Image, 
  Alert, 
  ActivityIndicator, 
  Platform,
  Modal,
  StatusBar
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../services/theme/colors';
import { spacing } from '../../services/theme/spacing';
import { BottomNav } from '../../components/BottomNav';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { usePickupStore, CartItem } from '../../store/pickupStore';
import { identifyBarcode } from '../../services/api/barcode';
import { classifyWaste } from '../../services/api/gemini';
import { 
  Camera, 
  Barcode, 
  Trash2, 
  X, 
  Sparkles, 
  ShoppingBag, 
  Recycle,
  ChevronRight,
  Package
} from 'lucide-react-native';

export const ScanScreen = () => {
  const [mode, setMode] = useState<'ai' | 'barcode'>('ai');
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [isCartVisible, setIsCartVisible] = useState(false);
  const navigation = useNavigation<any>();
  const { addToCart, cart, removeFromCart } = usePickupStore();
  const cameraRef = useRef<any>(null);
  const insets = useSafeAreaInsets();

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button title="Grant Permission" onPress={requestPermission} />
      </View>
    );
  }

  const handleScan = async () => {
    if (!cameraRef.current || scanning) return;
    setScanning(true);
    
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true });
      
      if (mode === 'barcode') {
        Alert.alert('Info', 'For barcode, please point at a valid code.');
      } else {
        const result = await classifyWaste(photo.base64);
        setResults(result);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setScanning(false);
    }
  };

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (mode !== 'barcode' || scanning) return;
    setScanning(true);
    try {
      const product = await identifyBarcode(data);
      setResults({
        waste_type: product.wasteType,
        confidence: 1.0,
        notes: `Identified via barcode: ${product.productName}`,
        barcode: data,
        productName: product.productName
      });
    } catch (error: any) {
      Alert.alert('Barcode Error', 'Could not identify product from barcode.');
    } finally {
      setScanning(false);
    }
  };

  const handleAdd = () => {
    if (!results) return;
    addToCart({
      id: Math.random().toString(36).substr(2, 9),
      waste_type: results.waste_type,
      source: mode,
      barcode: results.barcode,
      productName: results.productName
    });
    setResults(null);
    // Visual feedback without blocking Alert
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#006948" />
      <View style={styles.header}>
        <Text style={styles.title}>Scan Waste</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.actionBtn}
            onPress={() => setIsCartVisible(true)}
          >
            <ShoppingBag color={colors.primary} size={24} />
            {cart.length > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cart.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.dropoffBtn]}
            onPress={() => navigation.navigate('PickLocation')}
          >
            <Recycle color={colors.white} size={24} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.modeTabs}>
        <TouchableOpacity 
          style={[styles.tab, mode === 'ai' && styles.tabActive]}
          onPress={() => { setMode('ai'); setResults(null); }}
        >
          <Sparkles color={mode === 'ai' ? colors.white : colors.textBlackSoft} size={18} />
          <Text style={[styles.tabText, mode === 'ai' && styles.tabTextActive]}>AI Vision</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, mode === 'barcode' && styles.tabActive]}
          onPress={() => { setMode('barcode'); setResults(null); }}
        >
          <Barcode color={mode === 'barcode' ? colors.white : colors.textBlackSoft} size={18} />
          <Text style={[styles.tabText, mode === 'barcode' && styles.tabTextActive]}>Barcode</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
          onBarcodeScanned={mode === 'barcode' ? handleBarcodeScanned : undefined}
        >
          <View style={styles.overlay}>
            <View style={styles.scannerFrame} />
          </View>
        </CameraView>
      </View>

      <View style={[
        styles.controls, 
        { paddingBottom: Platform.OS === 'ios' ? insets.bottom + 120 : 140 }
      ]}>
        {results ? (
          <Card style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <View style={styles.typeBadge}>
                <Sparkles color={colors.white} size={14} />
                <Text style={styles.resultType}>{results.waste_type.toUpperCase()}</Text>
              </View>
              <TouchableOpacity onPress={() => setResults(null)}>
                <X color={colors.textBlackSoft} size={20} />
              </TouchableOpacity>
            </View>
            <Text style={styles.resultNotes}>{results.notes}</Text>
            <Button title="Add to Bag" onPress={handleAdd} style={styles.addBtn} />
          </Card>
        ) : mode === 'ai' ? (
          <TouchableOpacity 
            style={[styles.scanBtn, scanning && styles.scanBtnDisabled]} 
            onPress={handleScan}
            disabled={scanning}
          >
            {scanning ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Camera color={colors.white} size={32} />
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.barcodeHintContainer}>
            <Barcode color={colors.primary} size={32} />
            <Text style={styles.barcodeHintText}>Point camera at a barcode</Text>
          </View>
        )}
      </View>

      {/* Floating Checkout Button */}
      {cart.length > 0 && !results && (
        <TouchableOpacity 
          style={[styles.checkoutPill, { bottom: Platform.OS === 'ios' ? insets.bottom + 100 : 120 }]}
          onPress={() => navigation.navigate('PickLocation')}
        >
          <View style={styles.checkoutCount}>
            <Text style={styles.checkoutCountText}>{cart.length}</Text>
          </View>
          <Text style={styles.checkoutText}>Request Pickup</Text>
          <ChevronRight color={colors.white} size={20} />
        </TouchableOpacity>
      )}

      {/* Cart Bottom Sheet (Modal) */}
      <Modal
        visible={isCartVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsCartVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setIsCartVisible(false)}
        >
          <View style={[styles.bottomSheet, { paddingBottom: insets.bottom + spacing.lg }]}>
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetTitleRow}>
                <Text style={styles.sheetTitle}>Scanned Waste ({cart.length})</Text>
                <TouchableOpacity onPress={() => setIsCartVisible(false)}>
                  <X color={colors.textBlackSoft} size={24} />
                </TouchableOpacity>
              </View>
            </View>

            {cart.length > 0 ? (
              <>
                <FlatList
                  data={cart}
                  keyExtractor={(item) => item.id}
                  style={styles.cartList}
                  renderItem={({ item }) => (
                    <View style={styles.cartItem}>
                      <View style={[styles.cartItemIcon, { backgroundColor: colors.neutralCool }]}>
                        <Package color={colors.primary} size={20} />
                      </View>
                      <View style={styles.cartItemInfo}>
                        <Text style={styles.cartItemType}>{item.waste_type.toUpperCase()}</Text>
                        <Text style={styles.cartItemSource}>via {item.source}</Text>
                      </View>
                      <TouchableOpacity 
                        onPress={() => removeFromCart(item.id)}
                        style={styles.removeBtn}
                      >
                        <Trash2 color={colors.error} size={20} />
                      </TouchableOpacity>
                    </View>
                  )}
                />
                <Button 
                  title="Proceed to Drop-off" 
                  onPress={() => {
                    setIsCartVisible(false);
                    navigation.navigate('PickLocation');
                  }}
                  style={styles.sheetProceedBtn}
                />
              </>
            ) : (
              <View style={styles.emptyCart}>
                <ShoppingBag color={colors.ceramic} size={64} strokeWidth={1} />
                <Text style={styles.emptyCartText}>Your bag is empty.</Text>
                <Text style={styles.emptyCartSub}>Scan items to see them here.</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      <BottomNav activeRoute="Scan" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textBlack,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neutralCool,
  },
  dropoffBtn: {
    backgroundColor: colors.primary,
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.primary,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  cartBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  modeTabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    backgroundColor: colors.neutralCool,
    gap: 8,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textBlackSoft,
  },
  tabTextActive: {
    color: colors.white,
  },
  cameraContainer: {
    flex: 1,
    marginHorizontal: spacing.lg,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: colors.white,
    borderRadius: 24,
    backgroundColor: 'transparent',
  },
  controls: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    alignItems: 'center',
  },
  scanBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  scanBtnDisabled: {
    opacity: 0.7,
  },
  resultCard: {
    width: '100%',
    padding: spacing.md,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  resultType: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  resultNotes: {
    fontSize: 14,
    color: colors.textBlackSoft,
    marginBottom: spacing.md,
  },
  addBtn: {
    height: 44,
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  barcodeHintContainer: {
    padding: spacing.lg,
    backgroundColor: colors.neutralCool,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.ceramic,
    borderStyle: 'dashed',
  },
  barcodeHintText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textBlackSoft,
  },
  // Modal / Bottom Sheet Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    maxHeight: '80%',
  },
  sheetHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sheetHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.ceramic,
    marginBottom: spacing.md,
  },
  sheetTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textBlack,
  },
  cartList: {
    marginVertical: spacing.md,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutralCool,
  },
  cartItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemType: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textBlack,
  },
  cartItemSource: {
    fontSize: 12,
    color: colors.textBlackSoft,
  },
  removeBtn: {
    padding: spacing.sm,
  },
  sheetProceedBtn: {
    marginTop: spacing.md,
  },
  emptyCart: {
    paddingVertical: spacing.huge,
    alignItems: 'center',
  },
  emptyCartText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textBlack,
    marginTop: spacing.md,
  },
  emptyCartSub: {
    fontSize: 14,
    color: colors.textBlackSoft,
    marginTop: 4,
  },
  checkoutPill: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  checkoutCount: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkoutCountText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
  checkoutText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  resultType: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.white,
  },
});
