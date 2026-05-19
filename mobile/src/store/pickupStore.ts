import { create } from 'zustand';
import { supabase } from '../services/api/supabase';
import { Database } from '../types/database.types';
import { useNotificationStore } from './notificationStore';
import { isPickupAddressReady } from '../utils/pickupLocation';
import { assertUserCanCreatePickupRequest } from '../utils/pickupRequest';

type PickupRequest = Database['public']['Tables']['pickup_requests']['Row'];

export interface CartItem {
  id: string;
  waste_type: 'plastic' | 'paper' | 'metal' | 'organic' | 'other';
  source: 'ai' | 'barcode';
  barcode?: string;
  productName?: string;
  image_uri?: string;
}

interface PickupState {
  requests: PickupRequest[];
  loading: boolean;
  cart: CartItem[];
  createRequest: (userId: string, location: { lat: number; lng: number; address: string }) => Promise<void>;
  fetchUserRequests: (userId: string) => Promise<void>;
  fetchPendingRequests: () => Promise<void>;
  fetchAssignedRequests: (collectorId: string) => Promise<void>;
  acceptRequest: (requestId: string, collectorId: string) => Promise<void>;
  markArrived: (requestId: string) => Promise<void>;
  submitCollection: (params: {
    requestId: string;
    userId: string;
    collectorId: string;
    classification: any;
    weight: number;
  }) => Promise<void>;
  completePickup: (requestId: string) => Promise<void>;
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  reorderRequests: (newRequests: any[]) => void;
}

export const usePickupStore = create<PickupState>((set, get) => ({
  requests: [],
  loading: false,
  cart: [],
  reorderRequests: (newRequests) => {
    set({ requests: newRequests });
  },
  createRequest: async (userId, location) => {
    set({ loading: true });

    try {
      if (!isPickupAddressReady(location.address)) {
        throw new Error('Please wait until the exact pickup address is loaded.');
      }

      await assertUserCanCreatePickupRequest(userId);

      const cartItems = get().cart;
      
      // Determine dominant type
      const counts: Record<string, number> = {};
      cartItems.forEach(item => {
        counts[item.waste_type] = (counts[item.waste_type] || 0) + 1;
      });
      
      let dominantType = 'other';
      let maxCount = 0;
      Object.entries(counts).forEach(([type, count]) => {
        if (count > maxCount) {
          maxCount = count;
          dominantType = type;
        }
      });

      // Descriptive hint with dominant type first
      const itemsList = cartItems.map(item => 
        `${item.waste_type}${item.productName ? ` (${item.productName})` : ''}`
      ).join(', ');
      
      const waste_hint = `${dominantType.toUpperCase()} Bag: ${itemsList}`;

      const { error } = await (supabase
        .from('pickup_requests') as any)
        .insert([
          { 
            user_id: userId, 
            location, 
            status: 'PENDING',
            waste_hint: waste_hint || 'Mixed waste',
          }
        ]);
      
      if (error) throw error;
      set({ cart: [] }); 
    } finally {
      set({ loading: false });
    }
  },
  fetchUserRequests: async (userId) => {
    set({ loading: true });
    const { data, error } = await (supabase
      .from('pickup_requests') as any)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    set({ requests: data || [], loading: false });
  },
  fetchPendingRequests: async () => {
    set({ loading: true });
    const { data, error } = await (supabase
      .from('pickup_requests') as any)
      .select('*')
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    set({ requests: data || [], loading: false });
  },
  fetchAssignedRequests: async (collectorId) => {
    set({ loading: true });
    const { data, error } = await (supabase
      .from('pickup_requests') as any)
      .select('*')
      .eq('collector_id', collectorId)
      .in('status', ['ASSIGNED', 'IN_PROGRESS'])
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    set({ requests: data || [], loading: false });
  },
  acceptRequest: async (requestId, collectorId) => {
    set({ loading: true });
    
    // 1. Get request info to know the user_id
    const { data: request, error: fetchError } = await (supabase
      .from('pickup_requests') as any)
      .select('user_id')
      .eq('id', requestId)
      .single();
    
    if (fetchError) throw fetchError;

    const { error } = await (supabase
      .from('pickup_requests') as any)
      .update({ 
        collector_id: collectorId, 
        status: 'ASSIGNED' 
      })
      .eq('id', requestId);
    
    if (error) throw error;

    // 2. Create Notification for User
    await useNotificationStore.getState().createNotification({
      userId: (request as any).user_id,
      title: 'Collector Assigned 🚛',
      message: 'A collector has accepted your request and is on their way.',
      type: 'pickup'
    });

    set({ loading: false });
  },
  markArrived: async (requestId) => {
    set({ loading: true });
    const { error } = await (supabase
      .from('pickup_requests') as any)
      .update({ status: 'IN_PROGRESS' })
      .eq('id', requestId);
    
    if (error) throw error;
    set({ loading: false });
  },
  submitCollection: async ({ requestId, userId, collectorId, classification, weight }) => {
    set({ loading: true });
    try {
      // 1. Update status to COMPLETED
      const { error: statusError } = await (supabase
        .from('pickup_requests') as any)
        .update({ status: 'COMPLETED' })
        .eq('id', requestId);
      if (statusError) throw statusError;

      // 2. Insert classification record
      const { error: classError } = await (supabase
        .from('waste_classifications') as any)
        .insert([{
          pickup_id: requestId,
          waste_type: classification.waste_type,
          confidence: classification.confidence,
          collector_weight_kg: weight,
          image_uri: classification.image_uri || null
        }]);
      if (classError) throw classError;

      // 3. Calculate Reward (Multiplier by Weight)
      const priceMap: Record<string, number> = {
        'plastic': 7000,
        'paper': 4000,
        'metal': 6000,
        'organic': 3000,
        'other': 2000
      };
      
      const baseAmount = priceMap[classification.waste_type] || 2000;
      const userAmount = Math.round(baseAmount * weight);
      const driverAmount = Math.round(5000 * weight); // Driver gets 5000/kg commission

      // 4. Create Pending Transactions for User AND Driver
      const transactions = [
        {
          user_id: userId,
          type: 'CREDIT',
          amount: userAmount,
          status: 'PENDING',
          ref_id: requestId
        },
        {
          user_id: collectorId,
          type: 'CREDIT',
          amount: driverAmount,
          status: 'PENDING',
          ref_id: requestId
        }
      ];

      const { error: txError } = await (supabase
        .from('transactions') as any)
        .insert(transactions);
      
      if (txError) throw txError;

      // 5. Create Notifications for User AND Driver
      await Promise.all([
        useNotificationStore.getState().createNotification({
          userId: userId,
          title: 'Collection Completed! ✅',
          message: `Your pickup is finished. A reward of Rp ${userAmount.toLocaleString()} is pending approval.`,
          type: 'pickup'
        }),
        useNotificationStore.getState().createNotification({
          userId: collectorId,
          title: 'Commission Earned! 💰',
          message: `You earned Rp ${driverAmount.toLocaleString()} for this collection. Pending admin approval.`,
          type: 'reward'
        })
      ]);

    } finally {
      set({ loading: false });
    }
  },
  completePickup: async (requestId) => {
    set({ loading: true });
    try {
      const { error } = await (supabase
        .from('pickup_requests') as any)
        .update({ status: 'COMPLETED' })
        .eq('id', requestId);

      if (error) throw error;
    } finally {
      set({ loading: false });
    }
  },
  addToCart: (item) => {
    set((state) => ({ cart: [...state.cart, item] }));
  },
  removeFromCart: (itemId) => {
    set((state) => ({ cart: state.cart.filter((i) => i.id !== itemId) }));
  },
  clearCart: () => {
    set({ cart: [] });
  },
}));
