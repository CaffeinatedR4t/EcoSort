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
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          role?: 'user' | 'collector' | 'admin'
          balance?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          role?: 'user' | 'collector' | 'admin'
          balance?: number
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
    }
  }
}
