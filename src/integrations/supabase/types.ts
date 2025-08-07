export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
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
        ]
      }
      automatic_bills: {
        Row: {
          amount: number
          bill_name: string
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
          recurrence: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          bill_name: string
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
          recurrence?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          bill_name?: string
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
      pending_transfers: {
        Row: {
          amount: number
          claim_code: string
          created_at: string
          currency: string
          expires_at: string
          fees: number
          id: string
          recipient_email: string
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
          recipient_email: string
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
          recipient_email?: string
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
          country: string | null
          created_at: string
          full_name: string | null
          id: string
          id_card_number: string | null
          id_card_photo_url: string | null
          id_card_url: string | null
          is_banned: boolean | null
          is_verified: boolean | null
          phone: string
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
          country?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          id_card_number?: string | null
          id_card_photo_url?: string | null
          id_card_url?: string | null
          is_banned?: boolean | null
          is_verified?: boolean | null
          phone: string
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
          country?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          id_card_number?: string | null
          id_card_photo_url?: string | null
          id_card_url?: string | null
          is_banned?: boolean | null
          is_verified?: boolean | null
          phone?: string
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
      calculate_agent_monthly_performance: {
        Args:
          | Record<PropertyKey, never>
          | { agent_id_param: string; month_param: number; year_param: number }
        Returns: Record<string, unknown>[]
      }
      calculate_commission_rate: {
        Args: { volume: number }
        Returns: number
      }
      check_agent_exists: {
        Args: { agent_id_param: string }
        Returns: boolean
      }
      claim_pending_transfer: {
        Args:
          | Record<PropertyKey, never>
          | { claim_code_param: string; recipient_id: string }
        Returns: undefined
      }
      cleanup_expired_password_resets: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_new_agent: {
        Args: {
          user_id_param: string
          agent_id_param: string
          full_name_param: string
          phone_param: string
          country_param: string
        }
        Returns: undefined
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
          id: string
          full_name: string
          email: string
          phone: string
          country: string
        }[]
      }
      function_name: {
        Args: Record<PropertyKey, never>
        Returns: undefined
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
          agent_id: number
          total_performance: number
        }[]
      }
      get_agent_quota_status: {
        Args: { p_agent_id: string; p_date?: string }
        Returns: {
          total_deposits: number
          quota_achieved: boolean
          quota_reached_at: string
          reached_before_19h: boolean
          commission_rate: number
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
        Args: { user_id: string; amount: number }
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
          target_user_id: string
          deposit_amount: number
          deposit_currency: string
          target_currency: string
          exchange_rate?: number
          reference_number?: string
          notes?: string
        }
        Returns: string
      }
      process_money_transfer: {
        Args:
          | { sender_id: number; receiver_id: number; amount: number }
          | {
              sender_id: string
              recipient_identifier: string
              transfer_amount: number
              transfer_fees: number
            }
        Returns: undefined
      }
      process_password_reset: {
        Args: {
          phone_param: string
          full_name_param: string
          new_password_param: string
        }
        Returns: Json
      }
      savings_deposit: {
        Args: { p_user_id: string; p_account_id: string; p_amount: number }
        Returns: Json
      }
      savings_withdrawal: {
        Args:
          | { account_id: number; withdrawal_amount: number }
          | { p_user_id: string; p_account_id: string; p_amount: number }
        Returns: boolean
      }
      secure_increment_balance: {
        Args: {
          target_user_id: string
          amount: number
          operation_type?: string
          performed_by?: string
        }
        Returns: number
      }
      start_user_session: {
        Args: { p_user_agent?: string; p_ip_address?: unknown }
        Returns: string
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
          p_agent_id: string
          p_latitude: number
          p_longitude: number
          p_address: string
          p_zone?: string
        }
        Returns: undefined
      }
      update_session_activity: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      agent_status: "pending" | "active" | "suspended" | "rejected"
      user_role: "user" | "agent" | "admin" | "sub_admin"
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
      user_role: ["user", "agent", "admin", "sub_admin"],
    },
  },
} as const
