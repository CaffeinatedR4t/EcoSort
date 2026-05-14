import { create } from 'zustand';
import { supabase } from '../services/api/supabase';
import { Database } from '../types/database.types';

type Notification = Database['public']['Tables']['notifications']['Row'];

interface NotificationState {
  notifications: Notification[];
  loading: boolean;
  unreadCount: number;
  fetchNotifications: (userId: string) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  createNotification: (params: {
    userId: string;
    title: string;
    message: string;
    type: 'pickup' | 'reward' | 'system';
  }) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  loading: false,
  unreadCount: 0,

  fetchNotifications: async (userId) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const unreadCount = data?.filter((n) => !n.is_read).length || 0;
      set({ notifications: data || [], unreadCount });
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      set({ loading: false });
    }
  },

  markAsRead: async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
      
      // Update local state
      set((state) => {
        const updated = state.notifications.map((n) => 
          n.id === notificationId ? { ...n, is_read: true } : n
        );
        const unreadCount = updated.filter((n) => !n.is_read).length;
        return { notifications: updated, unreadCount };
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  },

  markAllAsRead: async (userId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      
      // Update local state
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
        unreadCount: 0
      }));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  },

  deleteNotification: async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
      
      // Update local state
      set((state) => {
        const updated = state.notifications.filter((n) => n.id !== notificationId);
        const unreadCount = updated.filter((n) => !n.is_read).length;
        return { notifications: updated, unreadCount };
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  },

  createNotification: async ({ userId, title, message, type }) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert([
          {
            user_id: userId,
            title,
            message,
            type,
            is_read: false
          }
        ]);

      if (error) throw error;
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }
}));
