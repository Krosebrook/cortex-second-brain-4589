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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_actions: {
        Row: {
          action_type: string
          admin_user_id: string
          created_at: string
          details: Json
          id: string
          target_ip: unknown
          target_user_id: string | null
        }
        Insert: {
          action_type: string
          admin_user_id: string
          created_at?: string
          details?: Json
          id?: string
          target_ip?: unknown
          target_user_id?: string | null
        }
        Update: {
          action_type?: string
          admin_user_id?: string
          created_at?: string
          details?: Json
          id?: string
          target_ip?: unknown
          target_user_id?: string | null
        }
        Relationships: []
      }
      agent_executions: {
        Row: {
          agent_id: string | null
          completed_at: string | null
          cost_usd: number | null
          error_message: string | null
          execution_time_ms: number | null
          id: string
          input_data: Json | null
          output_data: Json | null
          started_at: string | null
          status: string | null
          tokens_used: number | null
          user_id: string | null
        }
        Insert: {
          agent_id?: string | null
          completed_at?: string | null
          cost_usd?: number | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          started_at?: string | null
          status?: string | null
          tokens_used?: number | null
          user_id?: string | null
        }
        Update: {
          agent_id?: string | null
          completed_at?: string | null
          cost_usd?: number | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          started_at?: string | null
          status?: string | null
          tokens_used?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_executions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_executions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agents: {
        Row: {
          configuration: Json | null
          created_at: string | null
          id: string
          last_run_at: string | null
          name: string
          project_id: string | null
          status: Database["public"]["Enums"]["agent_status"] | null
          total_runs: number | null
          type: string
          updated_at: string | null
        }
        Insert: {
          configuration?: Json | null
          created_at?: string | null
          id?: string
          last_run_at?: string | null
          name: string
          project_id?: string | null
          status?: Database["public"]["Enums"]["agent_status"] | null
          total_runs?: number | null
          type: string
          updated_at?: string | null
        }
        Update: {
          configuration?: Json | null
          created_at?: string | null
          id?: string
          last_run_at?: string | null
          name?: string
          project_id?: string | null
          status?: Database["public"]["Enums"]["agent_status"] | null
          total_runs?: number | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_agents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage_logs: {
        Row: {
          cost_usd: number | null
          created_at: string | null
          id: string
          model: string | null
          project_id: string | null
          provider: string
          total_tokens: number | null
          user_id: string | null
        }
        Insert: {
          cost_usd?: number | null
          created_at?: string | null
          id?: string
          model?: string | null
          project_id?: string | null
          provider: string
          total_tokens?: number | null
          user_id?: string | null
        }
        Update: {
          cost_usd?: number | null
          created_at?: string | null
          id?: string
          model?: string | null
          project_id?: string | null
          provider?: string
          total_tokens?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_ips: {
        Row: {
          blocked_by_user_id: string | null
          blocked_until: string | null
          created_at: string
          id: string
          ip_address: unknown
          permanent: boolean
          reason: string
        }
        Insert: {
          blocked_by_user_id?: string | null
          blocked_until?: string | null
          created_at?: string
          id?: string
          ip_address: unknown
          permanent?: boolean
          reason: string
        }
        Update: {
          blocked_by_user_id?: string | null
          blocked_until?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          permanent?: boolean
          reason?: string
        }
        Relationships: []
      }
      chats: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          order_index: number | null
          title: string
          updated_at: string
          user_id: string
          version: number | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          order_index?: number | null
          title: string
          updated_at?: string
          user_id: string
          version?: number | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          order_index?: number | null
          title?: string
          updated_at?: string
          user_id?: string
          version?: number | null
        }
        Relationships: []
      }
      deployments: {
        Row: {
          created_at: string | null
          id: string
          project_id: string | null
          provider: string
          status: string | null
          url: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          project_id?: string | null
          provider: string
          status?: string | null
          url?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          project_id?: string | null
          provider?: string
          status?: string | null
          url?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deployments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deployments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      design_comments: {
        Row: {
          comment: string
          created_at: string
          design_id: string
          id: string
          user_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          design_id: string
          id?: string
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          design_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      design_history: {
        Row: {
          change_description: string | null
          created_at: string
          design_data: Json
          design_id: string
          id: string
          user_id: string
          version_number: number
        }
        Insert: {
          change_description?: string | null
          created_at?: string
          design_data: Json
          design_id: string
          id?: string
          user_id: string
          version_number: number
        }
        Update: {
          change_description?: string | null
          created_at?: string
          design_data?: Json
          design_id?: string
          id?: string
          user_id?: string
          version_number?: number
        }
        Relationships: []
      }
      design_shares: {
        Row: {
          created_at: string
          design_id: string
          expires_at: string | null
          id: string
          permissions: string
          share_token: string
          shared_by: string
          shared_with: string | null
        }
        Insert: {
          created_at?: string
          design_id: string
          expires_at?: string | null
          id?: string
          permissions: string
          share_token: string
          shared_by: string
          shared_with?: string | null
        }
        Update: {
          created_at?: string
          design_id?: string
          expires_at?: string | null
          id?: string
          permissions?: string
          share_token?: string
          shared_by?: string
          shared_with?: string | null
        }
        Relationships: []
      }
      design_templates: {
        Row: {
          category: string
          created_at: string
          description: string | null
          download_count: number
          id: string
          is_featured: boolean
          is_premium: boolean
          name: string
          tags: string[] | null
          template_data: Json | null
          thumbnail_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          download_count?: number
          id?: string
          is_featured?: boolean
          is_premium?: boolean
          name: string
          tags?: string[] | null
          template_data?: Json | null
          thumbnail_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          download_count?: number
          id?: string
          is_featured?: boolean
          is_premium?: boolean
          name?: string
          tags?: string[] | null
          template_data?: Json | null
          thumbnail_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      error_alert_configs: {
        Row: {
          alert_name: string
          created_at: string
          email_enabled: boolean
          error_types: string[]
          id: string
          in_app_enabled: boolean
          is_enabled: boolean
          last_triggered_at: string | null
          severity_level: string
          threshold_count: number
          threshold_minutes: number
          updated_at: string
          user_id: string
        }
        Insert: {
          alert_name: string
          created_at?: string
          email_enabled?: boolean
          error_types: string[]
          id?: string
          in_app_enabled?: boolean
          is_enabled?: boolean
          last_triggered_at?: string | null
          severity_level?: string
          threshold_count?: number
          threshold_minutes?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          alert_name?: string
          created_at?: string
          email_enabled?: boolean
          error_types?: string[]
          id?: string
          in_app_enabled?: boolean
          is_enabled?: boolean
          last_triggered_at?: string | null
          severity_level?: string
          threshold_count?: number
          threshold_minutes?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      error_logs: {
        Row: {
          created_at: string
          error_code: string | null
          error_type: string
          id: string
          ip_address: unknown
          message: string | null
          metadata: Json | null
          path: string
          stack_trace: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_code?: string | null
          error_type: string
          id?: string
          ip_address?: unknown
          message?: string | null
          metadata?: Json | null
          path: string
          stack_trace?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_code?: string | null
          error_type?: string
          id?: string
          ip_address?: unknown
          message?: string | null
          metadata?: Json | null
          path?: string
          stack_trace?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      error_notifications: {
        Row: {
          alert_config_id: string | null
          created_at: string
          error_log_id: string | null
          id: string
          is_read: boolean
          message: string
          severity: string
          title: string
          user_id: string
        }
        Insert: {
          alert_config_id?: string | null
          created_at?: string
          error_log_id?: string | null
          id?: string
          is_read?: boolean
          message: string
          severity?: string
          title: string
          user_id: string
        }
        Update: {
          alert_config_id?: string | null
          created_at?: string
          error_log_id?: string | null
          id?: string
          is_read?: boolean
          message?: string
          severity?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "error_notifications_alert_config_id_fkey"
            columns: ["alert_config_id"]
            isOneToOne: false
            referencedRelation: "error_alert_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "error_notifications_error_log_id_fkey"
            columns: ["error_log_id"]
            isOneToOne: false
            referencedRelation: "error_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      failed_login_attempts: {
        Row: {
          attempted_at: string
          email: string
          id: string
          ip_address: unknown
          user_agent: string | null
        }
        Insert: {
          attempted_at?: string
          email: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
        }
        Update: {
          attempted_at?: string
          email?: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
        }
        Relationships: []
      }
      filter_presets: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          filters: Json
          icon: string | null
          id: string
          is_default: boolean | null
          last_used_at: string | null
          name: string
          scope: string
          sort_order: number | null
          updated_at: string | null
          usage_count: number | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          filters: Json
          icon?: string | null
          id?: string
          is_default?: boolean | null
          last_used_at?: string | null
          name: string
          scope: string
          sort_order?: number | null
          updated_at?: string | null
          usage_count?: number | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          filters?: Json
          icon?: string | null
          id?: string
          is_default?: boolean | null
          last_used_at?: string | null
          name?: string
          scope?: string
          sort_order?: number | null
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      ip_geolocation: {
        Row: {
          cached_at: string
          city: string | null
          country: string | null
          country_code: string | null
          ip_address: unknown
          latitude: number | null
          longitude: number | null
          region: string | null
        }
        Insert: {
          cached_at?: string
          city?: string | null
          country?: string | null
          country_code?: string | null
          ip_address: unknown
          latitude?: number | null
          longitude?: number | null
          region?: string | null
        }
        Update: {
          cached_at?: string
          city?: string | null
          country?: string | null
          country_code?: string | null
          ip_address?: unknown
          latitude?: number | null
          longitude?: number | null
          region?: string | null
        }
        Relationships: []
      }
      knowledge_base: {
        Row: {
          content: string | null
          created_at: string
          deleted_at: string | null
          id: string
          order_index: number | null
          source_url: string | null
          tags: string[] | null
          title: string
          type: string | null
          updated_at: string
          user_id: string
          version: number | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          order_index?: number | null
          source_url?: string | null
          tags?: string[] | null
          title: string
          type?: string | null
          updated_at?: string
          user_id: string
          version?: number | null
        }
        Update: {
          content?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          order_index?: number | null
          source_url?: string | null
          tags?: string[] | null
          title?: string
          type?: string | null
          updated_at?: string
          user_id?: string
          version?: number | null
        }
        Relationships: []
      }
      kv_store_2c46ec52: {
        Row: {
          key: string
          value: Json
        }
        Insert: {
          key: string
          value: Json
        }
        Update: {
          key?: string
          value?: Json
        }
        Relationships: []
      }
      kv_store_88829a40: {
        Row: {
          key: string
          value: Json
        }
        Insert: {
          key: string
          value: Json
        }
        Update: {
          key?: string
          value?: Json
        }
        Relationships: []
      }
      kv_store_8c5e19c9: {
        Row: {
          key: string
          value: Json
        }
        Insert: {
          key: string
          value: Json
        }
        Update: {
          key?: string
          value?: Json
        }
        Relationships: []
      }
      kv_store_9e168049: {
        Row: {
          key: string
          value: Json
        }
        Insert: {
          key: string
          value: Json
        }
        Update: {
          key?: string
          value?: Json
        }
        Relationships: []
      }
      kv_store_9f867aa4: {
        Row: {
          key: string
          value: Json
        }
        Insert: {
          key: string
          value: Json
        }
        Update: {
          key?: string
          value?: Json
        }
        Relationships: []
      }
      kv_store_c7a988f8: {
        Row: {
          key: string
          tenant_id: string
          value: Json
        }
        Insert: {
          key: string
          tenant_id: string
          value: Json
        }
        Update: {
          key?: string
          tenant_id?: string
          value?: Json
        }
        Relationships: []
      }
      kv_store_e259a3bb: {
        Row: {
          key: string
          tenant_id: string | null
          user_id: string
          value: Json
        }
        Insert: {
          key: string
          tenant_id?: string | null
          user_id: string
          value: Json
        }
        Update: {
          key?: string
          tenant_id?: string | null
          user_id?: string
          value?: Json
        }
        Relationships: []
      }
      kv_store_e6e09e19: {
        Row: {
          key: string
          value: Json
        }
        Insert: {
          key: string
          value: Json
        }
        Update: {
          key?: string
          value?: Json
        }
        Relationships: []
      }
      kv_store_f091804d: {
        Row: {
          key: string
          value: Json
        }
        Insert: {
          key: string
          value: Json
        }
        Update: {
          key?: string
          value?: Json
        }
        Relationships: []
      }
      messages: {
        Row: {
          chat_id: string
          content: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          base_price: number | null
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          base_price?: number | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          base_price?: number | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profile_access_logs: {
        Row: {
          access_type: string
          accessed_profile_id: string
          accessor_user_id: string | null
          created_at: string
          failure_reason: string | null
          id: string
          ip_address: unknown
          metadata: Json | null
          success: boolean
          user_agent: string | null
        }
        Insert: {
          access_type: string
          accessed_profile_id: string
          accessor_user_id?: string | null
          created_at?: string
          failure_reason?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          success?: boolean
          user_agent?: string | null
        }
        Update: {
          access_type?: string
          accessed_profile_id?: string
          accessor_user_id?: string | null
          created_at?: string
          failure_reason?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          success?: boolean
          user_agent?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          api_calls_limit: number | null
          api_calls_used: number | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          status: string | null
          subscription_tier: string | null
          updated_at: string | null
          user_id: string | null
          username: string | null
        }
        Insert: {
          api_calls_limit?: number | null
          api_calls_used?: number | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          status?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
          user_id?: string | null
          username?: string | null
        }
        Update: {
          api_calls_limit?: number | null
          api_calls_used?: number | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          status?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
          user_id?: string | null
          username?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string | null
          description: string | null
          framework: string | null
          id: string
          name: string
          status: string | null
          updated_at: string | null
          user_id: string | null
          visibility: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          framework?: string | null
          id?: string
          name: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          visibility?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          framework?: string | null
          id?: string
          name?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_reports: {
        Row: {
          created_at: string
          enabled: boolean
          filters: Json
          frequency: string
          id: string
          last_run_at: string | null
          next_run_at: string | null
          recipients: Json
          report_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          filters?: Json
          frequency: string
          id?: string
          last_run_at?: string | null
          next_run_at?: string | null
          recipients?: Json
          report_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          filters?: Json
          frequency?: string
          id?: string
          last_run_at?: string | null
          next_run_at?: string | null
          recipients?: Json
          report_type?: string
          user_id?: string
        }
        Relationships: []
      }
      security_alert_rules: {
        Row: {
          alert_type: string
          created_at: string
          enabled: boolean
          id: string
          last_triggered_at: string | null
          notification_emails: Json
          threshold: number
          time_window_minutes: number
          updated_at: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          enabled?: boolean
          id?: string
          last_triggered_at?: string | null
          notification_emails?: Json
          threshold?: number
          time_window_minutes?: number
          updated_at?: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          enabled?: boolean
          id?: string
          last_triggered_at?: string | null
          notification_emails?: Json
          threshold?: number
          time_window_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      security_alerts: {
        Row: {
          alert_type: string
          email_sent: boolean
          email_sent_at: string | null
          event_data: Json
          id: string
          ip_address: unknown
          severity: string
          triggered_at: string
          user_id: string | null
        }
        Insert: {
          alert_type: string
          email_sent?: boolean
          email_sent_at?: string | null
          event_data?: Json
          id?: string
          ip_address?: unknown
          severity: string
          triggered_at?: string
          user_id?: string | null
        }
        Update: {
          alert_type?: string
          email_sent?: boolean
          email_sent_at?: string | null
          event_data?: Json
          id?: string
          ip_address?: unknown
          severity?: string
          triggered_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          severity: string
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          severity: string
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          severity?: string
        }
        Relationships: []
      }
      security_whitelist: {
        Row: {
          added_by_user_id: string | null
          created_at: string
          id: string
          ip_address: unknown
          reason: string
          user_id: string | null
        }
        Insert: {
          added_by_user_id?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          reason: string
          user_id?: string | null
        }
        Update: {
          added_by_user_id?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          reason?: string
          user_id?: string | null
        }
        Relationships: []
      }
      subscription_history: {
        Row: {
          ended_at: string | null
          id: string
          metadata: Json | null
          started_at: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_subscription_id: string | null
          tier: Database["public"]["Enums"]["subscription_tier"]
          user_id: string | null
        }
        Insert: {
          ended_at?: string | null
          id?: string
          metadata?: Json | null
          started_at?: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_subscription_id?: string | null
          tier: Database["public"]["Enums"]["subscription_tier"]
          user_id?: string | null
        }
        Update: {
          ended_at?: string | null
          id?: string
          metadata?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      threat_response_rules: {
        Row: {
          actions: Json
          cooldown_minutes: number
          created_at: string
          description: string | null
          enabled: boolean
          id: string
          priority: number
          rule_name: string
          trigger_condition: Json
          updated_at: string
        }
        Insert: {
          actions?: Json
          cooldown_minutes?: number
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          priority?: number
          rule_name: string
          trigger_condition: Json
          updated_at?: string
        }
        Update: {
          actions?: Json
          cooldown_minutes?: number
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          priority?: number
          rule_name?: string
          trigger_condition?: Json
          updated_at?: string
        }
        Relationships: []
      }
      threat_responses: {
        Row: {
          action_taken: string
          event_id: string | null
          executed_at: string
          id: string
          reversed_at: string | null
          rule_id: string | null
          success: boolean
        }
        Insert: {
          action_taken: string
          event_id?: string | null
          executed_at?: string
          id?: string
          reversed_at?: string | null
          rule_id?: string | null
          success?: boolean
        }
        Update: {
          action_taken?: string
          event_id?: string | null
          executed_at?: string
          id?: string
          reversed_at?: string | null
          rule_id?: string | null
          success?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "threat_responses_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "threat_response_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_tracking: {
        Row: {
          created_at: string | null
          date: string | null
          feature: string
          id: string
          metadata: Json | null
          usage_count: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          date?: string | null
          feature: string
          id?: string
          metadata?: Json | null
          usage_count?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string | null
          feature?: string
          id?: string
          metadata?: Json | null
          usage_count?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usage_tracking_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity: {
        Row: {
          activity_data: Json | null
          activity_type: string
          created_at: string
          id: string
          ip_address: unknown
          user_agent: string | null
          user_id: string
        }
        Insert: {
          activity_data?: Json | null
          activity_type: string
          created_at?: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id: string
        }
        Update: {
          activity_data?: Json | null
          activity_type?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_api_keys: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          key_hash: string
          last_used_at: string | null
          name: string
          permissions: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          key_hash: string
          last_used_at?: string | null
          name: string
          permissions?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          key_hash?: string
          last_used_at?: string | null
          name?: string
          permissions?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_api_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_favorites: {
        Row: {
          created_at: string
          id: string
          item_id: string
          item_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          item_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          onboarding_completed: boolean | null
          stripe_customer_id: string | null
          subscription_status:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          subscription_tier:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          trial_ends_at: string | null
          updated_at: string | null
          usage_limits: Json | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          onboarding_completed?: boolean | null
          stripe_customer_id?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          subscription_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          trial_ends_at?: string | null
          updated_at?: string | null
          usage_limits?: Json | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean | null
          stripe_customer_id?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          subscription_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          trial_ends_at?: string | null
          updated_at?: string | null
          usage_limits?: Json | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bootstrap_admin: { Args: { target_user: string }; Returns: undefined }
      current_tenant: { Args: never; Returns: string }
      current_tenant_id: { Args: never; Returns: string }
      current_user_id: { Args: never; Returns: string }
      current_user_role: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_preset_usage: {
        Args: { preset_id: string }
        Returns: undefined
      }
      is_claims_admin: { Args: never; Returns: boolean }
      log_profile_access: {
        Args: {
          p_access_type: string
          p_accessed_profile_id: string
          p_failure_reason?: string
          p_metadata?: Json
          p_success?: boolean
        }
        Returns: string
      }
      log_security_event: {
        Args: { p_event_data?: Json; p_event_type: string; p_severity?: string }
        Returns: string
      }
      user_can_create_project: { Args: { user_id: string }; Returns: boolean }
    }
    Enums: {
      agent_status: "idle" | "running" | "error" | "completed"
      app_role: "admin" | "moderator" | "user"
      project_status: "active" | "paused" | "completed" | "archived"
      subscription_status: "active" | "canceled" | "past_due" | "trialing"
      subscription_tier: "starter" | "professional" | "enterprise"
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
      agent_status: ["idle", "running", "error", "completed"],
      app_role: ["admin", "moderator", "user"],
      project_status: ["active", "paused", "completed", "archived"],
      subscription_status: ["active", "canceled", "past_due", "trialing"],
      subscription_tier: ["starter", "professional", "enterprise"],
    },
  },
} as const
