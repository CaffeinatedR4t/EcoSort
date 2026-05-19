export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          role: 'user' | 'collector' | 'admin'
          balance: number
          current_lat: number | null
          current_lng: number | null
          home_address: string | null
          home_lat: number | null
          home_lng: number | null
          phone_number: string | null
          avatar_url: string | null
          vehicle_type: string | null
          vehicle_plate: string | null
          operating_area: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          role?: 'user' | 'collector' | 'admin'
          balance?: number
          current_lat?: number | null
          current_lng?: number | null
          home_address?: string | null
          home_lat?: number | null
          home_lng?: number | null
          phone_number?: string | null
          avatar_url?: string | null
          vehicle_type?: string | null
          vehicle_plate?: string | null
          operating_area?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          role?: 'user' | 'collector' | 'admin'
          balance?: number
          current_lat?: number | null
          current_lng?: number | null
          home_address?: string | null
          home_lat?: number | null
          home_lng?: number | null
          phone_number?: string | null
          avatar_url?: string | null
          vehicle_type?: string | null
          vehicle_plate?: string | null
          operating_area?: string | null
          created_at?: string
        }
      }
      pickup_requests: {
        Row: {
          id: string
          user_id: string
          collector_id: string | null
          status: 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
          location: { lat: number; lng: number; address: string }
          waste_hint: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          collector_id?: string | null
          status?: 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
          location: { lat: number; lng: number; address: string }
          waste_hint?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          collector_id?: string | null
          status?: 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
          location?: { lat: number; lng: number; address: string }
          waste_hint?: string | null
          created_at?: string
        }
      }
      waste_classifications: {
        Row: {
          id: string
          pickup_id: string
          image_uri: string | null
          waste_type: string
          confidence: number | null
          collector_weight_kg: number | null
          created_at: string
        }
        Insert: {
          id?: string
          pickup_id: string
          image_uri?: string | null
          waste_type: string
          confidence?: number | null
          collector_weight_kg?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          pickup_id?: string
          image_uri?: string | null
          waste_type?: string
          confidence?: number | null
          collector_weight_kg?: number | null
          created_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          type: 'CREDIT' | 'DEBIT'
          amount: number
          status: 'PENDING' | 'COMPLETED' | 'FAILED'
          ref_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'CREDIT' | 'DEBIT'
          amount: number
          status?: 'PENDING' | 'COMPLETED' | 'FAILED'
          ref_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'CREDIT' | 'DEBIT'
          amount?: number
          status?: 'PENDING' | 'COMPLETED' | 'FAILED'
          ref_id?: string | null
          created_at?: string
        }
      }
      withdrawals: {
        Row: {
          id: string
          user_id: string
          amount: number
          status: 'REQUESTED' | 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
          bank_name: string
          account_number: string
          account_holder_name: string
          external_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          status?: 'REQUESTED' | 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
          bank_name: string
          account_number: string
          account_holder_name: string
          external_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          status?: 'REQUESTED' | 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
          bank_name?: string
          account_number?: string
          account_holder_name?: string
          external_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: 'pickup' | 'reward' | 'promo' | 'system'
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type: 'pickup' | 'reward' | 'promo' | 'system'
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: 'pickup' | 'reward' | 'promo' | 'system'
          is_read?: boolean
          created_at?: string
        }
      }
      notification_preferences: {
        Row: {
          user_id: string
          pickup_enabled: boolean
          reward_enabled: boolean
          promo_enabled: boolean
          system_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          pickup_enabled?: boolean
          reward_enabled?: boolean
          promo_enabled?: boolean
          system_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          pickup_enabled?: boolean
          reward_enabled?: boolean
          promo_enabled?: boolean
          system_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
