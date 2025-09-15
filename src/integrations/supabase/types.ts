export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_deposits: {
        Row: {
          admin_id: string
          amount: number
          converted_amount: number
          created_at: string
          currency: string
          deposit_type: string
          exchange_rate: number
          id: string
          notes: string | null
          reference_number: string | null
          status: string
          target_currency: string
          target_user_id: string
          updated_at: string
        }
        Insert: {
          admin_id: string
          amount: number
          converted_amount: number
          created_at?: string
          currency?: string
          deposit_type?: string
          exchange_rate?: number
          id?: string
          notes?: string | null
          reference_number?: string | null
          status?: string
          target_currency: string
          target_user_id: string
          updated_at?: string
        }
        Update: {
          admin_id?: string
          amount?: number
          converted_amount?: number
          created_at?: string
          currency?: string
          deposit_type?: string
          exchange_rate?: number
          id?: string
          notes?: string | null
          reference_number?: string | null
          status?: string
          target_currency?: string
          target_user_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      agent_challenges: {
        Row: {
          agent_id: string
          completed: boolean
          created_at: string
          current_operations: number
          date: string
          id: string
          reward_points: number
          target_operations: number
          updated_at: string
        }
        Insert: {
          agent_id: string
          completed?: boolean
          created_at?: string
          current_operations?: number
          date: string
          id?: string
          reward_points?: number
          target_operations: number
          updated_at?: string
        }
        Update: {
          agent_id?: string
          completed?: boolean
          created_at?: string
          current_operations?: number
          date?: string
          id?: string
          reward_points?: number
          target_operations?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_challenges_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "auth_users_agents_view"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_complaints: {
        Row: {
          agent_id: string
          complaint_type: string
          created_at: string
          description: string | null
          id: string
          resolved_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          agent_id: string
          complaint_type: string
          created_at?: string
          description?: string | null
          id?: string
          resolved_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          agent_id?: string
          complaint_type?: string
          created_at?: string
          description?: string | null
          id?: string
          resolved_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_complaints_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_complaints_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_daily_quotas: {
        Row: {
          agent_id: string
          created_at: string
          date: string
          id: string
          quota_achieved: boolean
          quota_reached_at: string | null
          total_deposits: number
          updated_at: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          date?: string
          id?: string
          quota_achieved?: boolean
          quota_reached_at?: string | null
          total_deposits?: number
          updated_at?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          date?: string
          id?: string
          quota_achieved?: boolean
          quota_reached_at?: string | null
          total_deposits?: number
          updated_at?: string
        }
        Relationships: []
      }
      agent_location_history: {
        Row: {
          address: string
          agent_id: string
          id: string
          latitude: number
          longitude: number
          timestamp: string
        }
        Insert: {
          address: string
          agent_id: string
          id?: string
          latitude: number
          longitude: number
          timestamp?: string
        }
        Update: {
          address?: string
          agent_id?: string
          id?: string
          latitude?: number
          longitude?: number
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_location_history_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_locations: {
        Row: {
          address: string
          agent_id: string
          created_at: string
          id: string
          is_active: boolean
          latitude: number
          longitude: number
          updated_at: string
          zone: string | null
        }
        Insert: {
          address: string
          agent_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          latitude: number
          longitude: number
          updated_at?: string
          zone?: string | null
        }
        Update: {
          address?: string
          agent_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          latitude?: number
          longitude?: number
          updated_at?: string
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_locations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_monthly_performance: {
        Row: {
          agent_id: string
          base_commission: number
          commission_rate: number
          complaints_count: number
          created_at: string
          id: string
          international_transfers_count: number
          international_transfers_volume: number
          month: number
          no_complaint_bonus: number
          total_earnings: number
          total_transactions: number
          total_volume: number
          transaction_bonus: number
          transferred_to_balance: number | null
          updated_at: string
          volume_bonus: number
          withdrawals_count: number
          withdrawals_volume: number
          year: number
        }
        Insert: {
          agent_id: string
          base_commission?: number
          commission_rate?: number
          complaints_count?: number
          created_at?: string
          id?: string
          international_transfers_count?: number
          international_transfers_volume?: number
          month: number
          no_complaint_bonus?: number
          total_earnings?: number
          total_transactions?: number
          total_volume?: number
          transaction_bonus?: number
          transferred_to_balance?: number | null
          updated_at?: string
          volume_bonus?: number
          withdrawals_count?: number
          withdrawals_volume?: number
          year: number
        }
        Update: {
          agent_id?: string
          base_commission?: number
          commission_rate?: number
          complaints_count?: number
          created_at?: string
          id?: string
          international_transfers_count?: number
          international_transfers_volume?: number
          month?: number
          no_complaint_bonus?: number
          total_earnings?: number
          total_transactions?: number
          total_volume?: number
          transaction_bonus?: number
          transferred_to_balance?: number | null
          updated_at?: string
          volume_bonus?: number
          withdrawals_count?: number
          withdrawals_volume?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "agent_monthly_performance_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_reports: {
        Row: {
          agent_id: string
          amount_to_add: number
          created_at: string
          current_balance: number
          end_date: string
          id: string
          period: string
          report_date: string
          start_date: string
          total_commissions: number
          total_deposits: number
          total_transfers: number
          total_withdrawals: number
          updated_at: string
        }
        Insert: {
          agent_id: string
          amount_to_add?: number
          created_at?: string
          current_balance?: number
          end_date: string
          id?: string
          period: string
          report_date?: string
          start_date: string
          total_commissions?: number
          total_deposits?: number
          total_transfers?: number
          total_withdrawals?: number
          updated_at?: string
        }
        Update: {
          agent_id?: string
          amount_to_add?: number
          created_at?: string
          current_balance?: number
          end_date?: string
          id?: string
          period?: string
          report_date?: string
          start_date?: string
          total_commissions?: number
          total_deposits?: number
          total_transfers?: number
          total_withdrawals?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_reports_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "auth_users_agents_view"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          agent_id: string
          birth_date: string | null
          birth_place: string | null
          commission_balance: number
          country: string
          created_at: string
          full_name: string
          id: string
          identity_photo: string | null
          nationality: string | null
          phone: string
          status: Database["public"]["Enums"]["agent_status"]
          transactions_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_id: string
          birth_date?: string | null
          birth_place?: string | null
          commission_balance?: number
          country: string
          created_at?: string
          full_name: string
          id?: string
          identity_photo?: string | null
          nationality?: string | null
          phone: string
          status?: Database["public"]["Enums"]["agent_status"]
          transactions_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_id?: string
          birth_date?: string | null
          birth_place?: string | null
          commission_balance?: number
          country?: string
          created_at?: string
          full_name?: string
          id?: string
          identity_photo?: string | null
          nationality?: string | null
          phone?: string
          status?: Database["public"]["Enums"]["agent_status"]
          transactions_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "auth_users_agents_view"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "auth_users_agents_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_audit_logs_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      automatic_bills: {
        Row: {
          amount: number
          bill_name: string
          bill_type: string | null
          created_at: string
          due_date: string
          id: string
          is_automated: boolean
          last_payment_date: string | null
          max_attempts: number
          meter_number: string | null
          next_due_date: string | null
          payment_attempts: number
          payment_number: string | null
          priority: number
          provider: string | null
          provider_name: string | null
          provider_number: string | null
          recurrence: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          bill_name: string
          bill_type?: string | null
          created_at?: string
          due_date: string
          id?: string
          is_automated?: boolean
          last_payment_date?: string | null
          max_attempts?: number
          meter_number?: string | null
          next_due_date?: string | null
          payment_attempts?: number
          payment_number?: string | null
          priority?: number
          provider?: string | null
          provider_name?: string | null
          provider_number?: string | null
          recurrence?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          bill_name?: string
          bill_type?: string | null
          created_at?: string
          due_date?: string
          id?: string
          is_automated?: boolean
          last_payment_date?: string | null
          max_attempts?: number
          meter_number?: string | null
          next_due_date?: string | null
          payment_attempts?: number
          payment_number?: string | null
          priority?: number
          provider?: string | null
          provider_name?: string | null
          provider_number?: string | null
          recurrence?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bill_notifications: {
        Row: {
          bill_id: string
          created_at: string
          id: string
          is_read: boolean
          notification_type: string
          sent_at: string
          user_id: string
        }
        Insert: {
          bill_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          notification_type: string
          sent_at?: string
          user_id: string
        }
        Update: {
          bill_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          notification_type?: string
          sent_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bill_notifications_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "automatic_bills"
            referencedColumns: ["id"]
          },
        ]
      }
      bill_payment_history: {
        Row: {
          amount: number
          attempt_number: number
          balance_after: number | null
          balance_before: number
          bill_id: string
          created_at: string
          error_message: string | null
          id: string
          payment_date: string
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          attempt_number?: number
          balance_after?: number | null
          balance_before: number
          bill_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          payment_date?: string
          status: string
          user_id: string
        }
        Update: {
          amount?: number
          attempt_number?: number
          balance_after?: number | null
          balance_before?: number
          bill_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          payment_date?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bill_payment_history_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "automatic_bills"
            referencedColumns: ["id"]
          },
        ]
      }
      bill_payment_numbers: {
        Row: {
          bill_type: string
          country: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          payment_number: string
          provider_name: string
          updated_at: string
        }
        Insert: {
          bill_type: string
          country: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          payment_number: string
          provider_name: string
          updated_at?: string
        }
        Update: {
          bill_type?: string
          country?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          payment_number?: string
          provider_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      cities: {
        Row: {
          country_id: number
          id: number
          name: string
        }
        Insert: {
          country_id: number
          id?: never
          name: string
        }
        Update: {
          country_id?: number
          id?: never
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "cities_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_tiers: {
        Row: {
          commission_rate: number
          created_at: string
          id: string
          max_volume: number | null
          min_volume: number
          tier_name: string
        }
        Insert: {
          commission_rate: number
          created_at?: string
          id?: string
          max_volume?: number | null
          min_volume: number
          tier_name: string
        }
        Update: {
          commission_rate?: number
          created_at?: string
          id?: string
          max_volume?: number | null
          min_volume?: number
          tier_name?: string
        }
        Relationships: []
      }
      countries: {
        Row: {
          code: string
          id: number
          name: string
        }
        Insert: {
          code: string
          id?: never
          name: string
        }
        Update: {
          code?: string
          id?: never
          name?: string
        }
        Relationships: []
      }
      customer_support_messages: {
        Row: {
          category: string | null
          created_at: string
          id: string
          message: string
          priority: string
          read_at: string | null
          responded_at: string | null
          responded_by: string | null
          response: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          message: string
          priority?: string
          read_at?: string | null
          responded_at?: string | null
          responded_by?: string | null
          response?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          message?: string
          priority?: string
          read_at?: string | null
          responded_at?: string | null
          responded_by?: string | null
          response?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_support_messages_responded_by_fkey"
            columns: ["responded_by"]
            isOneToOne: false
            referencedRelation: "auth_users_agents_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_support_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "auth_users_agents_view"
            referencedColumns: ["id"]
          },
        ]
      }
      flutterwave_transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          customer_email: string | null
          flw_ref: string | null
          id: string
          payment_method: string | null
          status: string
          transaction_id: string
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          customer_email?: string | null
          flw_ref?: string | null
          id?: string
          payment_method?: string | null
          status?: string
          transaction_id: string
          updated_at?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          customer_email?: string | null
          flw_ref?: string | null
          id?: string
          payment_method?: string | null
          status?: string
          transaction_id?: string
          updated_at?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flutterwave_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "auth_users_agents_view"
            referencedColumns: ["id"]
          },
        ]
      }
      identity_verifications: {
        Row: {
          created_at: string | null
          id: string
          id_card_url: string | null
          selfie_url: string | null
          status: string
          updated_at: string | null
          user_id: string
          verification_notes: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          id_card_url?: string | null
          selfie_url?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          id_card_url?: string | null
          selfie_url?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "identity_verifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "auth_users_agents_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "identity_verifications_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "auth_users_agents_view"
            referencedColumns: ["id"]
          },
        ]
      }
      kyc_verifications: {
        Row: {
          created_at: string
          document_birth_date: string | null
          document_expiry_date: string | null
          document_name: string | null
          document_number: string | null
          document_verification_passed: boolean | null
          face_match_score: number | null
          face_verification_passed: boolean | null
          id: string
          id_document_type: string | null
          id_document_url: string | null
          selfie_url: string | null
          status: string
          updated_at: string
          user_id: string
          verification_notes: string | null
          verification_provider: string | null
          verification_score: number | null
          verified_at: string | null
          verified_by: string | null
          video_url: string | null
        }
        Insert: {
          created_at?: string
          document_birth_date?: string | null
          document_expiry_date?: string | null
          document_name?: string | null
          document_number?: string | null
          document_verification_passed?: boolean | null
          face_match_score?: number | null
          face_verification_passed?: boolean | null
          id?: string
          id_document_type?: string | null
          id_document_url?: string | null
          selfie_url?: string | null
          status?: string
          updated_at?: string
          user_id: string
          verification_notes?: string | null
          verification_provider?: string | null
          verification_score?: number | null
          verified_at?: string | null
          verified_by?: string | null
          video_url?: string | null
        }
        Update: {
          created_at?: string
          document_birth_date?: string | null
          document_expiry_date?: string | null
          document_name?: string | null
          document_number?: string | null
          document_verification_passed?: boolean | null
          face_match_score?: number | null
          face_verification_passed?: boolean | null
          id?: string
          id_document_type?: string | null
          id_document_url?: string | null
          selfie_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          verification_notes?: string | null
          verification_provider?: string | null
          verification_score?: number | null
          verified_at?: string | null
          verified_by?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kyc_verifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "auth_users_agents_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kyc_verifications_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "auth_users_agents_view"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_payments: {
        Row: {
          amount: number
          business_name: string
          created_at: string
          currency: string
          description: string | null
          id: string
          merchant_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          business_name: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          merchant_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          business_name?: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          merchant_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      monthly_bonuses: {
        Row: {
          bonus_amount: number
          bonus_type: string
          created_at: string
          description: string | null
          id: string
          requirement_value: number
        }
        Insert: {
          bonus_amount: number
          bonus_type: string
          created_at?: string
          description?: string | null
          id?: string
          requirement_value: number
        }
        Update: {
          bonus_amount?: number
          bonus_type?: string
          created_at?: string
          description?: string | null
          id?: string
          requirement_value?: number
        }
        Relationships: []
      }
      notification_recipients: {
        Row: {
          id: string
          notification_id: string
          read_at: string | null
          sent_at: string
          status: string
          user_id: string
        }
        Insert: {
          id?: string
          notification_id: string
          read_at?: string | null
          sent_at?: string
          status?: string
          user_id: string
        }
        Update: {
          id?: string
          notification_id?: string
          read_at?: string | null
          sent_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_recipients_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_recipients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "auth_users_agents_view"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          notification_type: string
          priority: string
          sent_by: string | null
          target_country: string | null
          target_role: string | null
          target_users: string[] | null
          title: string
          total_recipients: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          notification_type: string
          priority?: string
          sent_by?: string | null
          target_country?: string | null
          target_role?: string | null
          target_users?: string[] | null
          title: string
          total_recipients?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          notification_type?: string
          priority?: string
          sent_by?: string | null
          target_country?: string | null
          target_role?: string | null
          target_users?: string[] | null
          title?: string
          total_recipients?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "auth_users_agents_view"
            referencedColumns: ["id"]
          },
        ]
      }
      password_reset_requests: {
        Row: {
          created_at: string
          expires_at: string
          full_name: string
          id: string
          new_password: string
          phone: string
          status: string
          updated_at: string
          user_id: string | null
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string
          full_name: string
          id?: string
          new_password: string
          phone: string
          status?: string
          updated_at?: string
          user_id?: string | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          full_name?: string
          id?: string
          new_password?: string
          phone?: string
          status?: string
          updated_at?: string
          user_id?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
      payment_callbacks: {
        Row: {
          callback_data: Json
          created_at: string
          id: string
          payment_session_id: string
          processed: boolean | null
          provider: string
          signature: string | null
          verified: boolean | null
        }
        Insert: {
          callback_data: Json
          created_at?: string
          id?: string
          payment_session_id: string
          processed?: boolean | null
          provider: string
          signature?: string | null
          verified?: boolean | null
        }
        Update: {
          callback_data?: Json
          created_at?: string
          id?: string
          payment_session_id?: string
          processed?: boolean | null
          provider?: string
          signature?: string | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_callbacks_payment_session_id_fkey"
            columns: ["payment_session_id"]
            isOneToOne: false
            referencedRelation: "payment_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_numbers: {
        Row: {
          admin_name: string | null
          admin_type: string
          country: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_default: boolean
          phone_number: string
          provider: string
          service_type: string
          updated_at: string
        }
        Insert: {
          admin_name?: string | null
          admin_type?: string
          country: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          phone_number: string
          provider: string
          service_type?: string
          updated_at?: string
        }
        Update: {
          admin_name?: string | null
          admin_type?: string
          country?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          phone_number?: string
          provider?: string
          service_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_sessions: {
        Row: {
          amount: number
          callback_data: Json | null
          checkout_url: string | null
          created_at: string
          currency: string
          expires_at: string
          id: string
          payment_method: string
          provider: string
          provider_transaction_id: string | null
          session_id: string
          status: string
          updated_at: string
          user_id: string
          ussd_code: string | null
        }
        Insert: {
          amount: number
          callback_data?: Json | null
          checkout_url?: string | null
          created_at?: string
          currency?: string
          expires_at?: string
          id?: string
          payment_method: string
          provider: string
          provider_transaction_id?: string | null
          session_id: string
          status?: string
          updated_at?: string
          user_id: string
          ussd_code?: string | null
        }
        Update: {
          amount?: number
          callback_data?: Json | null
          checkout_url?: string | null
          created_at?: string
          currency?: string
          expires_at?: string
          id?: string
          payment_method?: string
          provider?: string
          provider_transaction_id?: string | null
          session_id?: string
          status?: string
          updated_at?: string
          user_id?: string
          ussd_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "auth_users_agents_view"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_transfers: {
        Row: {
          amount: number
          claim_code: string
          created_at: string
          currency: string
          expires_at: string
          fees: number
          id: string
          recipient_email: string | null
          recipient_phone: string | null
          sender_id: string
          status: string
        }
        Insert: {
          amount: number
          claim_code: string
          created_at?: string
          currency?: string
          expires_at?: string
          fees: number
          id?: string
          recipient_email?: string | null
          recipient_phone?: string | null
          sender_id: string
          status?: string
        }
        Update: {
          amount?: number
          claim_code?: string
          created_at?: string
          currency?: string
          expires_at?: string
          fees?: number
          id?: string
          recipient_email?: string | null
          recipient_phone?: string | null
          sender_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_transfers_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "auth_users_agents_view"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          balance: number
          banned_at: string | null
          banned_reason: string | null
          birth_date: string | null
          country: string | null
          created_at: string
          full_name: string | null
          id: string
          id_card_number: string | null
          id_card_photo_url: string | null
          id_card_url: string | null
          is_banned: boolean | null
          is_verified: boolean | null
          kyc_completed_at: string | null
          kyc_status: string | null
          phone: string
          pin_code: string | null
          pin_created_at: string | null
          requires_kyc: boolean | null
          requires_pin_setup: boolean | null
          role: Database["public"]["Enums"]["user_role"]
          selfie_url: string | null
          verified_at: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          balance?: number
          banned_at?: string | null
          banned_reason?: string | null
          birth_date?: string | null
          country?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          id_card_number?: string | null
          id_card_photo_url?: string | null
          id_card_url?: string | null
          is_banned?: boolean | null
          is_verified?: boolean | null
          kyc_completed_at?: string | null
          kyc_status?: string | null
          phone: string
          pin_code?: string | null
          pin_created_at?: string | null
          requires_kyc?: boolean | null
          requires_pin_setup?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
          selfie_url?: string | null
          verified_at?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          balance?: number
          banned_at?: string | null
          banned_reason?: string | null
          birth_date?: string | null
          country?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          id_card_number?: string | null
          id_card_photo_url?: string | null
          id_card_url?: string | null
          is_banned?: boolean | null
          is_verified?: boolean | null
          kyc_completed_at?: string | null
          kyc_status?: string | null
          phone?: string
          pin_code?: string | null
          pin_created_at?: string | null
          requires_kyc?: boolean | null
          requires_pin_setup?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
          selfie_url?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "auth_users_agents_view"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          attempts: number
          created_at: string
          id: string
          operation_type: string
          user_id: string
          window_start: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          id?: string
          operation_type: string
          user_id: string
          window_start?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          id?: string
          operation_type?: string
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      receipts: {
        Row: {
          created_at: string
          id: string
          items: Json
          metadata: Json | null
          title: string
          total: number
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          items: Json
          metadata?: Json | null
          title: string
          total: number
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          items?: Json
          metadata?: Json | null
          title?: string
          total?: number
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recharges: {
        Row: {
          amount: number
          country: string
          created_at: string
          id: string
          payment_method: string
          payment_phone: string
          payment_provider: string
          provider_transaction_id: string | null
          status: string
          transaction_reference: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          country: string
          created_at?: string
          id?: string
          payment_method: string
          payment_phone: string
          payment_provider: string
          provider_transaction_id?: string | null
          status?: string
          transaction_reference: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          country?: string
          created_at?: string
          id?: string
          payment_method?: string
          payment_phone?: string
          payment_provider?: string
          provider_transaction_id?: string | null
          status?: string
          transaction_reference?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recharges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "auth_users_agents_view"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_codes: {
        Row: {
          created_at: string
          id: string
          referral_code: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          referral_code: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          referral_code?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "auth_users_agents_view"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          activated: boolean | null
          activated_at: string | null
          amount_credited: number | null
          created_at: string
          credit_applique: boolean
          credited_at: string | null
          id: string
          referral_code: string
          referred_user_id: string
          referrer_id: string
          status: string
          updated_at: string
        }
        Insert: {
          activated?: boolean | null
          activated_at?: string | null
          amount_credited?: number | null
          created_at?: string
          credit_applique?: boolean
          credited_at?: string | null
          id?: string
          referral_code: string
          referred_user_id: string
          referrer_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          activated?: boolean | null
          activated_at?: string | null
          amount_credited?: number | null
          created_at?: string
          credit_applique?: boolean
          credited_at?: string | null
          id?: string
          referral_code?: string
          referred_user_id?: string
          referrer_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_user_id_fkey"
            columns: ["referred_user_id"]
            isOneToOne: true
            referencedRelation: "auth_users_agents_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "auth_users_agents_view"
            referencedColumns: ["id"]
          },
        ]
      }
      savings_accounts: {
        Row: {
          auto_deposit_amount: number | null
          auto_deposit_frequency: string | null
          balance: number
          created_at: string
          id: string
          interest_rate: number | null
          name: string
          target_amount: number | null
          target_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_deposit_amount?: number | null
          auto_deposit_frequency?: string | null
          balance?: number
          created_at?: string
          id?: string
          interest_rate?: number | null
          name: string
          target_amount?: number | null
          target_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_deposit_amount?: number | null
          auto_deposit_frequency?: string | null
          balance?: number
          created_at?: string
          id?: string
          interest_rate?: number | null
          name?: string
          target_amount?: number | null
          target_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "savings_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "auth_users_agents_view"
            referencedColumns: ["id"]
          },
        ]
      }
      sendflow_commission_payments: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          merchant_id: string
          payment_date: string
          updated_at: string | null
        }
        Insert: {
          amount?: number
          created_at?: string | null
          id?: string
          merchant_id: string
          payment_date?: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          merchant_id?: string
          payment_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sendflow_commission_payments_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "auth_users_agents_view"
            referencedColumns: ["id"]
          },
        ]
      }
      sub_admin_daily_requests: {
        Row: {
          created_at: string
          date: string
          id: string
          request_type: string
          sub_admin_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          request_type: string
          sub_admin_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          request_type?: string
          sub_admin_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sub_admin_daily_requests_sub_admin_id_fkey"
            columns: ["sub_admin_id"]
            isOneToOne: false
            referencedRelation: "auth_users_agents_view"
            referencedColumns: ["id"]
          },
        ]
      }
      sub_admin_quota_settings: {
        Row: {
          created_at: string
          daily_limit: number
          id: string
          sub_admin_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          daily_limit?: number
          id?: string
          sub_admin_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          daily_limit?: number
          id?: string
          sub_admin_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sub_admin_quota_settings_sub_admin_id_fkey"
            columns: ["sub_admin_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sub_admin_settings: {
        Row: {
          created_at: string
          daily_request_limit: number
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_request_limit?: number
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_request_limit?: number
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sub_admin_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "auth_users_agents_view"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          setting_key: string
          setting_value: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key: string
          setting_value: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      system_status: {
        Row: {
          component: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          status_type: string
          updated_at: string
        }
        Insert: {
          component: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          status_type: string
          updated_at?: string
        }
        Update: {
          component?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          status_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      transaction_limits: {
        Row: {
          created_at: string | null
          daily_limit: number
          id: string
          operation_type: string
          single_limit: number
          updated_at: string | null
          user_role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string | null
          daily_limit?: number
          id?: string
          operation_type: string
          single_limit?: number
          updated_at?: string | null
          user_role: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string | null
          daily_limit?: number
          id?: string
          operation_type?: string
          single_limit?: number
          updated_at?: string | null
          user_role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      transaction_limits_config: {
        Row: {
          country: string | null
          created_at: string | null
          daily_limit: number
          id: string
          is_active: boolean | null
          monthly_limit: number | null
          operation_type: string
          single_limit: number
          updated_at: string | null
          user_role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          daily_limit?: number
          id?: string
          is_active?: boolean | null
          monthly_limit?: number | null
          operation_type: string
          single_limit?: number
          updated_at?: string | null
          user_role: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          country?: string | null
          created_at?: string | null
          daily_limit?: number
          id?: string
          is_active?: boolean | null
          monthly_limit?: number | null
          operation_type?: string
          single_limit?: number
          updated_at?: string | null
          user_role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      transfers: {
        Row: {
          amount: number
          created_at: string
          currency: string
          fees: number
          id: string
          is_deleted: boolean | null
          recipient_country: string
          recipient_full_name: string
          recipient_id: string | null
          recipient_phone: string
          sender_id: string
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency: string
          fees: number
          id?: string
          is_deleted?: boolean | null
          recipient_country: string
          recipient_full_name: string
          recipient_id?: string | null
          recipient_phone: string
          sender_id: string
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          fees?: number
          id?: string
          is_deleted?: boolean | null
          recipient_country?: string
          recipient_full_name?: string
          recipient_id?: string | null
          recipient_phone?: string
          sender_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfers_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "auth_users_agents_view"
            referencedColumns: ["id"]
          },
        ]
      }
      user_requests: {
        Row: {
          amount: number
          created_at: string
          id: string
          notes: string | null
          operation_type: string
          payment_method: string | null
          payment_phone: string | null
          processed_at: string | null
          processed_by: string | null
          rejection_reason: string | null
          request_type: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          notes?: string | null
          operation_type: string
          payment_method?: string | null
          payment_phone?: string | null
          processed_at?: string | null
          processed_by?: string | null
          rejection_reason?: string | null
          request_type: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          operation_type?: string
          payment_method?: string | null
          payment_phone?: string | null
          processed_at?: string | null
          processed_by?: string | null
          rejection_reason?: string | null
          request_type?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string
          id: string
          ip_address: unknown | null
          is_active: boolean
          last_activity: string
          session_start: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: unknown | null
          is_active?: boolean
          last_activity?: string
          session_start?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: unknown | null
          is_active?: boolean
          last_activity?: string
          session_start?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawal_requests: {
        Row: {
          agent_id: string
          agent_name: string
          agent_phone: string
          amount: number
          approved_at: string | null
          completed_at: string | null
          created_at: string
          id: string
          rejected_at: string | null
          status: string
          user_id: string
          withdrawal_phone: string
        }
        Insert: {
          agent_id: string
          agent_name: string
          agent_phone: string
          amount: number
          approved_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          rejected_at?: string | null
          status?: string
          user_id: string
          withdrawal_phone: string
        }
        Update: {
          agent_id?: string
          agent_name?: string
          agent_phone?: string
          amount?: number
          approved_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          rejected_at?: string | null
          status?: string
          user_id?: string
          withdrawal_phone?: string
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          agent_id: string | null
          amount: number
          created_at: string
          id: string
          is_deleted: boolean | null
          status: string
          updated_at: string
          user_id: string
          verification_code: string | null
          withdrawal_phone: string
        }
        Insert: {
          agent_id?: string | null
          amount: number
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          status?: string
          updated_at?: string
          user_id: string
          verification_code?: string | null
          withdrawal_phone: string
        }
        Update: {
          agent_id?: string | null
          amount?: number
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          status?: string
          updated_at?: string
          user_id?: string
          verification_code?: string | null
          withdrawal_phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "auth_users_agents_view"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      auth_users_agents_view: {
        Row: {
          created_at: string | null
          email: string | null
          id: string | null
          last_sign_in_at: string | null
          raw_user_meta_data: Json | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          last_sign_in_at?: string | null
          raw_user_meta_data?: Json | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          last_sign_in_at?: string | null
          raw_user_meta_data?: Json | null
        }
        Relationships: []
      }
    }
    Functions: {
      activate_referral_bonus: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      agent_process_withdrawal_with_commission: {
        Args: {
          p_agent_id: string
          p_amount: number
          p_client_id: string
          p_client_phone: string
        }
        Returns: Json
      }
      calculate_agent_monthly_performance: {
        Args:
          | Record<PropertyKey, never>
          | { agent_id_param: string; month_param: number; year_param: number }
        Returns: string
      }
      calculate_commission_rate: {
        Args: { volume: number }
        Returns: number
      }
      check_agent_exists: {
        Args: { agent_id_param: string }
        Returns: boolean
      }
      check_rate_limit: {
        Args: {
          p_max_attempts?: number
          p_operation_type: string
          p_user_id: string
          p_window_minutes?: number
        }
        Returns: boolean
      }
      claim_pending_transfer: {
        Args:
          | Record<PropertyKey, never>
          | { claim_code_param: string; recipient_id: string }
        Returns: boolean
      }
      cleanup_expired_password_resets: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired_payment_sessions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_rate_limits: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_new_agent: {
        Args: {
          agent_id_param: string
          country_param: string
          full_name_param: string
          phone_param: string
          user_id_param: string
        }
        Returns: undefined
      }
      create_pin_session: {
        Args: { user_phone: string }
        Returns: Json
      }
      deactivate_agent_location: {
        Args: { p_agent_id: string }
        Returns: undefined
      }
      end_user_session: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      find_recipient: {
        Args: { search_term: string }
        Returns: {
          country: string
          full_name: string
          id: string
          phone: string
          role: Database["public"]["Enums"]["user_role"]
        }[]
      }
      function_name: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_referral_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_agent_by_user_id: {
        Args: { user_id_param: string }
        Returns: {
          agent_id: string
          birth_date: string | null
          birth_place: string | null
          commission_balance: number
          country: string
          created_at: string
          full_name: string
          id: string
          identity_photo: string | null
          nationality: string | null
          phone: string
          status: Database["public"]["Enums"]["agent_status"]
          transactions_count: number
          updated_at: string
          user_id: string
        }[]
      }
      get_agent_current_month_performance: {
        Args: Record<PropertyKey, never> | { agent_id_param: string }
        Returns: {
          base_commission: number
          commission_rate: number
          complaints_count: number
          no_complaint_bonus: number
          tier_name: string
          total_earnings: number
          total_transactions: number
          total_volume: number
          transaction_bonus: number
          volume_bonus: number
        }[]
      }
      get_agent_quota_status: {
        Args: { p_agent_id: string; p_date?: string }
        Returns: {
          agent_id: string
          date: string
          quota_achieved: boolean
          quota_reached_at: string
          total_deposits: number
        }[]
      }
      get_user_role: {
        Args: { user_id_param: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      increment_agent_commission: {
        Args: { agent_user_id: string; commission_amount: number }
        Returns: number
      }
      increment_balance: {
        Args: { amount: number; user_id: string }
        Returns: number
      }
      is_admin: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      is_admin_or_sub_admin: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      is_agent: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      is_agent_or_admin: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      is_sub_admin: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      is_user_banned: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      is_verified_agent: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      process_automatic_bill_payment: {
        Args: { bill_id_param: string }
        Returns: Json
      }
      process_international_deposit: {
        Args: {
          deposit_amount: number
          deposit_currency: string
          exchange_rate?: number
          notes?: string
          reference_number?: string
          target_currency: string
          target_user_id: string
        }
        Returns: string
      }
      process_money_transfer: {
        Args:
          | { amount: number; receiver_id: number; sender_id: number }
          | {
              recipient_identifier: string
              sender_id: string
              transfer_amount: number
              transfer_fees: number
            }
        Returns: string
      }
      process_password_reset: {
        Args: {
          full_name_param: string
          new_password_param: string
          phone_param: string
        }
        Returns: Json
      }
      process_withdrawal_transaction: {
        Args: {
          p_agent_id: string
          p_amount: number
          p_client_id: string
          p_commission: number
        }
        Returns: Json
      }
      savings_deposit: {
        Args: { p_account_id: string; p_amount: number; p_user_id: string }
        Returns: Json
      }
      savings_withdrawal: {
        Args:
          | { account_id: number; withdrawal_amount: number }
          | { p_account_id: string; p_amount: number; p_user_id: string }
        Returns: boolean
      }
      secure_increment_balance: {
        Args: {
          amount: number
          operation_type?: string
          performed_by?: string
          target_user_id: string
        }
        Returns: number
      }
      set_user_pin: {
        Args: { pin_param: string; user_id_param: string }
        Returns: boolean
      }
      start_user_session: {
        Args: { p_ip_address?: unknown; p_user_agent?: string }
        Returns: string
      }
      sync_agent_identity_photos: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      sync_all_identity_photos: {
        Args: Record<PropertyKey, never>
        Returns: {
          photo_url: string
          sync_status: string
          user_id: string
        }[]
      }
      transfer_monthly_commissions_to_balance: {
        Args: {
          agent_id_param: string
          month_param?: number
          year_param?: number
        }
        Returns: number
      }
      update_agent_daily_quota: {
        Args: { p_agent_id: string; p_deposit_amount: number }
        Returns: boolean
      }
      update_agent_location: {
        Args: {
          p_address: string
          p_agent_id: string
          p_latitude: number
          p_longitude: number
          p_zone?: string
        }
        Returns: undefined
      }
      update_session_activity: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      verify_user_pin: {
        Args: { pin_param: string; user_id_param: string }
        Returns: boolean
      }
    }
    Enums: {
      agent_status: "pending" | "active" | "suspended" | "rejected"
      user_role:
        | "user"
        | "agent"
        | "admin"
        | "sub_admin"
        | "merchant"
        | "provider"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      agent_status: ["pending", "active", "suspended", "rejected"],
      user_role: [
        "user",
        "agent",
        "admin",
        "sub_admin",
        "merchant",
        "provider",
      ],
    },
  },
} as const
