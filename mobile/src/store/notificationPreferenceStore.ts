import { create } from 'zustand';
import { supabase } from '../services/api/supabase';
import { Database } from '../types/database.types';

export type NotificationPreference =
  Database['public']['Tables']['notification_preferences']['Row'];

type PreferenceKey =
  | 'pickup_enabled'
  | 'reward_enabled'
  | 'promo_enabled'
  | 'system_enabled';

const defaultPreferences = (userId: string): NotificationPreference => ({
  user_id: userId,
  pickup_enabled: true,
  reward_enabled: true,
  promo_enabled: false,
  system_enabled: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

interface NotificationPreferenceState {
  preferencesByUser: Record<string, NotificationPreference>;
  loading: boolean;
  saving: boolean;
  migrationRequired: boolean;
  fetchPreferences: (userId: string) => Promise<NotificationPreference>;
  updatePreference: (
    userId: string,
    key: PreferenceKey,
    value: boolean
  ) => Promise<{ success: boolean; error?: string }>;
  isNotificationEnabled: (
    userId: string,
    type: 'pickup' | 'reward' | 'promo' | 'system'
  ) => Promise<boolean>;
}

export const useNotificationPreferenceStore = create<NotificationPreferenceState>((set, get) => ({
  preferencesByUser: {},
  loading: false,
  saving: false,
  migrationRequired: false,

  fetchPreferences: async (userId) => {
    const cached = get().preferencesByUser[userId];
    if (cached) return cached;

    set({ loading: true });
    try {
      const { data, error } = await (supabase.from('notification_preferences') as any)
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        if (isMissingPreferencesTableError(error)) {
          const defaults = defaultPreferences(userId);
          set((state) => ({
            migrationRequired: true,
            preferencesByUser: { ...state.preferencesByUser, [userId]: defaults },
          }));
          return defaults;
        }
        throw error;
      }

      if (data) {
        set((state) => ({
          preferencesByUser: { ...state.preferencesByUser, [userId]: data },
        }));
        return data;
      }

      const defaults = defaultPreferences(userId);
      const { data: created, error: insertError } = await (supabase.from('notification_preferences') as any)
        .insert(defaults)
        .select()
        .single();

      if (insertError) {
        if (isMissingPreferencesTableError(insertError)) {
          set((state) => ({
            migrationRequired: true,
            preferencesByUser: { ...state.preferencesByUser, [userId]: defaults },
          }));
          return defaults;
        }
        throw insertError;
      }

      const preferences = created || defaults;
      set((state) => ({
        preferencesByUser: { ...state.preferencesByUser, [userId]: preferences },
      }));
      return preferences;
    } finally {
      set({ loading: false });
    }
  },

  updatePreference: async (userId, key, value) => {
    const previous = get().preferencesByUser[userId] || defaultPreferences(userId);
    const next = { ...previous, [key]: value, updated_at: new Date().toISOString() };

    set((state) => ({
      saving: true,
      preferencesByUser: { ...state.preferencesByUser, [userId]: next },
    }));

    const { error } = await (supabase.from('notification_preferences') as any)
      .upsert(next, { onConflict: 'user_id' });

    set({ saving: false });

    if (error) {
      if (isMissingPreferencesTableError(error)) {
        set({ migrationRequired: true });
        return {
          success: true,
          error: 'Notification preferences table is not migrated yet. Settings are saved locally for this session.',
        };
      }

      set((state) => ({
        preferencesByUser: { ...state.preferencesByUser, [userId]: previous },
      }));
      return { success: false, error: error.message };
    }

    return { success: true };
  },

  isNotificationEnabled: async (userId, type) => {
    const preferences = await get().fetchPreferences(userId);
    if (type === 'pickup') return preferences.pickup_enabled;
    if (type === 'reward') return preferences.reward_enabled;
    if (type === 'promo') return preferences.promo_enabled;
    return preferences.system_enabled;
  },
}));

const isMissingPreferencesTableError = (error: any) => {
  const message = String(error?.message || '').toLowerCase();
  return (
    error?.code === 'PGRST205' ||
    error?.code === '42P01' ||
    message.includes('notification_preferences') ||
    message.includes('schema cache')
  );
};
