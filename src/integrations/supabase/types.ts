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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_generations: {
        Row: {
          created_at: string
          id: number
          model: string
          output: string
          prompt: string
          tokens_used: number
          type: string
        }
        Insert: {
          created_at?: string
          id?: number
          model?: string
          output: string
          prompt: string
          tokens_used?: number
          type: string
        }
        Update: {
          created_at?: string
          id?: number
          model?: string
          output?: string
          prompt?: string
          tokens_used?: number
          type?: string
        }
        Relationships: []
      }
      blocked_ips: {
        Row: {
          blocked_by_user_id: string | null
          blocked_until: string | null
          created_at: string
          id: string
          ip_address: string
          permanent: boolean | null
          reason: string
        }
        Insert: {
          blocked_by_user_id?: string | null
          blocked_until?: string | null
          created_at?: string
          id?: string
          ip_address: string
          permanent?: boolean | null
          reason?: string
        }
        Update: {
          blocked_by_user_id?: string | null
          blocked_until?: string | null
          created_at?: string
          id?: string
          ip_address?: string
          permanent?: boolean | null
          reason?: string
        }
        Relationships: []
      }
      brand_profiles: {
        Row: {
          created_at: string
          description: string
          id: number
          is_default: boolean
          keywords: Json
          name: string
          target_audience: string
          tone: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: number
          is_default?: boolean
          keywords?: Json
          name: string
          target_audience?: string
          tone?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: number
          is_default?: boolean
          keywords?: Json
          name?: string
          target_audience?: string
          tone?: string
        }
        Relationships: []
      }
      brand_voice_profiles: {
        Row: {
          avoid_words: Json
          brand_values: Json
          color_palette: Json
          created_at: string
          description: string | null
          example_content: Json | null
          id: string
          industry: string | null
          is_default: boolean | null
          logo_url: string | null
          name: string
          personality: Json
          preferred_phrases: Json
          target_audience: string | null
          tone: string | null
          updated_at: string
          user_id: string | null
          vocabulary_level: string | null
          writing_style: string | null
        }
        Insert: {
          avoid_words?: Json
          brand_values?: Json
          color_palette?: Json
          created_at?: string
          description?: string | null
          example_content?: Json | null
          id?: string
          industry?: string | null
          is_default?: boolean | null
          logo_url?: string | null
          name: string
          personality?: Json
          preferred_phrases?: Json
          target_audience?: string | null
          tone?: string | null
          updated_at?: string
          user_id?: string | null
          vocabulary_level?: string | null
          writing_style?: string | null
        }
        Update: {
          avoid_words?: Json
          brand_values?: Json
          color_palette?: Json
          created_at?: string
          description?: string | null
          example_content?: Json | null
          id?: string
          industry?: string | null
          is_default?: boolean | null
          logo_url?: string | null
          name?: string
          personality?: Json
          preferred_phrases?: Json
          target_audience?: string | null
          tone?: string | null
          updated_at?: string
          user_id?: string | null
          vocabulary_level?: string | null
          writing_style?: string | null
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string
          id: number
          product_id: number
          quantity: number
          selected_color: string | null
          selected_size: string | null
          session_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          product_id: number
          quantity?: number
          selected_color?: string | null
          selected_size?: string | null
          session_id: string
        }
        Update: {
          created_at?: string
          id?: number
          product_id?: number
          quantity?: number
          selected_color?: string | null
          selected_size?: string | null
          session_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          description: string | null
          id: string
          image: string | null
          name: string
          parent_id: string | null
          slug: string
        }
        Insert: {
          description?: string | null
          id?: string
          image?: string | null
          name: string
          parent_id?: string | null
          slug: string
        }
        Update: {
          description?: string | null
          id?: string
          image?: string | null
          name?: string
          parent_id?: string | null
          slug?: string
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
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          order_index?: number | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          order_index?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      content_library: {
        Row: {
          content: string
          created_at: string
          id: number
          is_favorite: boolean
          platform: string | null
          product_id: number | null
          title: string
          type: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: number
          is_favorite?: boolean
          platform?: string | null
          product_id?: number | null
          title: string
          type: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: number
          is_favorite?: boolean
          platform?: string | null
          product_id?: number | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      failed_login_attempts: {
        Row: {
          attempted_at: string
          city: string | null
          country: string | null
          country_code: string | null
          email: string
          id: string
          ip_address: string | null
          region: string | null
          user_agent: string | null
        }
        Insert: {
          attempted_at?: string
          city?: string | null
          country?: string | null
          country_code?: string | null
          email: string
          id?: string
          ip_address?: string | null
          region?: string | null
          user_agent?: string | null
        }
        Update: {
          attempted_at?: string
          city?: string | null
          country?: string | null
          country_code?: string | null
          email?: string
          id?: string
          ip_address?: string | null
          region?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      filter_presets: {
        Row: {
          created_at: string
          filters: Json
          id: string
          is_default: boolean | null
          name: string
          order_index: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          filters?: Json
          id?: string
          is_default?: boolean | null
          name: string
          order_index?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          filters?: Json
          id?: string
          is_default?: boolean | null
          name?: string
          order_index?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      knowledge_base: {
        Row: {
          category: string | null
          content: string
          created_at: string
          deleted_at: string | null
          id: string
          is_favorite: boolean | null
          source_url: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
          version: number | null
        }
        Insert: {
          category?: string | null
          content?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_favorite?: boolean | null
          source_url?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
          version?: number | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_favorite?: boolean | null
          source_url?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
          version?: number | null
        }
        Relationships: []
      }
      marketing_campaigns: {
        Row: {
          ai_provider: string | null
          brand_voice_id: string | null
          budget: number | null
          channels: Json
          clicks: number | null
          conversions: number | null
          created_at: string
          description: string | null
          end_date: string | null
          generated_assets: Json | null
          generation_cost: number | null
          id: string
          impressions: number | null
          name: string
          objective: string | null
          platforms: Json
          revenue: number | null
          spent: number | null
          start_date: string | null
          status: string | null
          target_audience: Json | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          ai_provider?: string | null
          brand_voice_id?: string | null
          budget?: number | null
          channels?: Json
          clicks?: number | null
          conversions?: number | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          generated_assets?: Json | null
          generation_cost?: number | null
          id?: string
          impressions?: number | null
          name: string
          objective?: string | null
          platforms?: Json
          revenue?: number | null
          spent?: number | null
          start_date?: string | null
          status?: string | null
          target_audience?: Json | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          ai_provider?: string | null
          brand_voice_id?: string | null
          budget?: number | null
          channels?: Json
          clicks?: number | null
          conversions?: number | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          generated_assets?: Json | null
          generation_cost?: number | null
          id?: string
          impressions?: number | null
          name?: string
          objective?: string | null
          platforms?: Json
          revenue?: number | null
          spent?: number | null
          start_date?: string | null
          status?: string | null
          target_audience?: Json | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      marketplace_listings: {
        Row: {
          created_at: string
          custom_description: string | null
          custom_price: number | null
          custom_title: string | null
          external_id: string | null
          generated_images: Json
          id: number
          listing_data: Json | null
          marketplace: string
          product_id: number
          published_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          custom_description?: string | null
          custom_price?: number | null
          custom_title?: string | null
          external_id?: string | null
          generated_images?: Json
          id?: number
          listing_data?: Json | null
          marketplace: string
          product_id: number
          published_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          custom_description?: string | null
          custom_price?: number | null
          custom_title?: string | null
          external_id?: string | null
          generated_images?: Json
          id?: number
          listing_data?: Json | null
          marketplace?: string
          product_id?: number
          published_at?: string | null
          status?: string
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
          user_id: string
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
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
      notifications: {
        Row: {
          action_label: string | null
          action_url: string | null
          archived_at: string | null
          category: Database["public"]["Enums"]["notification_category"] | null
          created_at: string
          expires_at: string | null
          id: string
          is_archived: boolean | null
          is_read: boolean | null
          message: string
          metadata: Json | null
          read_at: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"] | null
          user_id: string
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          archived_at?: string | null
          category?: Database["public"]["Enums"]["notification_category"] | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_archived?: boolean | null
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          read_at?: string | null
          title: string
          type?: Database["public"]["Enums"]["notification_type"] | null
          user_id: string
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          archived_at?: string | null
          category?: Database["public"]["Enums"]["notification_category"] | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_archived?: boolean | null
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          read_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"] | null
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: number
          price: number
          product_id: number
          product_image: string | null
          product_name: string
          quantity: number
        }
        Insert: {
          id?: string
          order_id: number
          price: number
          product_id: number
          product_image?: string | null
          product_name: string
          quantity?: number
        }
        Update: {
          id?: string
          order_id?: number
          price?: number
          product_id?: number
          product_image?: string | null
          product_name?: string
          quantity?: number
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string
          customer_name: string
          external_order_id: string | null
          id: number
          marketplace: string
          product_id: number | null
          product_title: string
          quantity: number
          status: string
          total_amount: number
        }
        Insert: {
          created_at?: string
          customer_name?: string
          external_order_id?: string | null
          id?: number
          marketplace: string
          product_id?: number | null
          product_title: string
          quantity?: number
          status?: string
          total_amount: number
        }
        Update: {
          created_at?: string
          customer_name?: string
          external_order_id?: string | null
          id?: number
          marketplace?: string
          product_id?: number | null
          product_title?: string
          quantity?: number
          status?: string
          total_amount?: number
        }
        Relationships: []
      }
      password_reset_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          token: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          token: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      product_concepts: {
        Row: {
          ai_provider: string | null
          brand_voice_id: string | null
          created_at: string
          generated_description: string | null
          generated_features: Json
          generated_images: Json | null
          generated_tags: Json
          generated_title: string | null
          generation_cost: number | null
          hero_image_url: string | null
          id: string
          linked_product_id: number | null
          marketplace: string | null
          price_range: string | null
          prompt: string
          published_to_products: boolean | null
          quality_score: number | null
          seo_description: string | null
          seo_keywords: Json
          seo_title: string | null
          status: string | null
          target_platforms: Json
          updated_at: string
          user_id: string | null
        }
        Insert: {
          ai_provider?: string | null
          brand_voice_id?: string | null
          created_at?: string
          generated_description?: string | null
          generated_features?: Json
          generated_images?: Json | null
          generated_tags?: Json
          generated_title?: string | null
          generation_cost?: number | null
          hero_image_url?: string | null
          id?: string
          linked_product_id?: number | null
          marketplace?: string | null
          price_range?: string | null
          prompt: string
          published_to_products?: boolean | null
          quality_score?: number | null
          seo_description?: string | null
          seo_keywords?: Json
          seo_title?: string | null
          status?: string | null
          target_platforms?: Json
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          ai_provider?: string | null
          brand_voice_id?: string | null
          created_at?: string
          generated_description?: string | null
          generated_features?: Json
          generated_images?: Json | null
          generated_tags?: Json
          generated_title?: string | null
          generation_cost?: number | null
          hero_image_url?: string | null
          id?: string
          linked_product_id?: number | null
          marketplace?: string | null
          price_range?: string | null
          prompt?: string
          published_to_products?: boolean | null
          quality_score?: number | null
          seo_description?: string | null
          seo_keywords?: Json
          seo_title?: string | null
          status?: string | null
          target_platforms?: Json
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string
          created_at: string
          description: string
          id: number
          images: Json
          inventory_count: number
          price: number
          sku: string
          status: string
          tags: Json
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string
          id?: number
          images?: Json
          inventory_count?: number
          price?: number
          sku?: string
          status?: string
          tags?: Json
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: number
          images?: Json
          inventory_count?: number
          price?: number
          sku?: string
          status?: string
          tags?: Json
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profile_access_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          resource_id: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resource_id?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resource_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      publishing_queue: {
        Row: {
          created_at: string
          error_message: string | null
          external_id: string | null
          external_url: string | null
          id: string
          platform: string
          priority: number | null
          product_id: number
          published_at: string | null
          quality_score: number | null
          retry_count: number | null
          safeguards_passed: boolean | null
          scheduled_for: string | null
          status: string | null
          trademark_cleared: boolean | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          external_id?: string | null
          external_url?: string | null
          id?: string
          platform: string
          priority?: number | null
          product_id: number
          published_at?: string | null
          quality_score?: number | null
          retry_count?: number | null
          safeguards_passed?: boolean | null
          scheduled_for?: string | null
          status?: string | null
          trademark_cleared?: boolean | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          external_id?: string | null
          external_url?: string | null
          id?: string
          platform?: string
          priority?: number | null
          product_id?: number
          published_at?: string | null
          quality_score?: number | null
          retry_count?: number | null
          safeguards_passed?: boolean | null
          scheduled_for?: string | null
          status?: string | null
          trademark_cleared?: boolean | null
        }
        Relationships: []
      }
      rate_limit_config: {
        Row: {
          block_duration_minutes: number
          config_key: string
          enabled: boolean | null
          id: string
          max_attempts: number
          time_window_minutes: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          block_duration_minutes?: number
          config_key: string
          enabled?: boolean | null
          id?: string
          max_attempts?: number
          time_window_minutes?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          block_duration_minutes?: number
          config_key?: string
          enabled?: boolean | null
          id?: string
          max_attempts?: number
          time_window_minutes?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      security_alerts: {
        Row: {
          alert_type: string
          email_sent: boolean | null
          email_sent_at: string | null
          event_data: Json | null
          id: string
          ip_address: string | null
          severity: string
          triggered_at: string
          user_id: string | null
        }
        Insert: {
          alert_type: string
          email_sent?: boolean | null
          email_sent_at?: string | null
          event_data?: Json | null
          id?: string
          ip_address?: string | null
          severity?: string
          triggered_at?: string
          user_id?: string | null
        }
        Update: {
          alert_type?: string
          email_sent?: boolean | null
          email_sent_at?: string | null
          event_data?: Json | null
          id?: string
          ip_address?: string | null
          severity?: string
          triggered_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      social_analytics: {
        Row: {
          engagement_rate: number | null
          follower_count: number | null
          id: string
          platform: string
          posts_count: number | null
          snapshot_date: string
          total_comments: number | null
          total_likes: number | null
          total_shares: number | null
          total_views: number | null
          user_id: string | null
        }
        Insert: {
          engagement_rate?: number | null
          follower_count?: number | null
          id?: string
          platform: string
          posts_count?: number | null
          snapshot_date?: string
          total_comments?: number | null
          total_likes?: number | null
          total_shares?: number | null
          total_views?: number | null
          user_id?: string | null
        }
        Update: {
          engagement_rate?: number | null
          follower_count?: number | null
          id?: string
          platform?: string
          posts_count?: number | null
          snapshot_date?: string
          total_comments?: number | null
          total_likes?: number | null
          total_shares?: number | null
          total_views?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      social_content: {
        Row: {
          caption: string | null
          created_at: string
          failed_reason: string | null
          id: string
          media_type: string | null
          media_uri: string | null
          platforms: Json
          published_at: string | null
          scheduled_at: string | null
          status: string
          tags: Json
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          failed_reason?: string | null
          id?: string
          media_type?: string | null
          media_uri?: string | null
          platforms?: Json
          published_at?: string | null
          scheduled_at?: string | null
          status?: string
          tags?: Json
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          failed_reason?: string | null
          id?: string
          media_type?: string | null
          media_uri?: string | null
          platforms?: Json
          published_at?: string | null
          scheduled_at?: string | null
          status?: string
          tags?: Json
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      social_platforms: {
        Row: {
          access_token: string | null
          avatar: string | null
          connected: boolean | null
          connected_at: string | null
          created_at: string
          display_name: string | null
          follower_count: number | null
          id: string
          platform: string
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string | null
          username: string
        }
        Insert: {
          access_token?: string | null
          avatar?: string | null
          connected?: boolean | null
          connected_at?: string | null
          created_at?: string
          display_name?: string | null
          follower_count?: number | null
          id?: string
          platform: string
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string | null
          username: string
        }
        Update: {
          access_token?: string | null
          avatar?: string | null
          connected?: boolean | null
          connected_at?: string | null
          created_at?: string
          display_name?: string | null
          follower_count?: number | null
          id?: string
          platform?: string
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string | null
          username?: string
        }
        Relationships: []
      }
      style_profiles: {
        Row: {
          aesthetics: Json
          colors: Json
          created_at: string
          id: number
          lifestyle: string | null
          occasions: Json
          patterns: Json
          session_id: string
          style_dna: Json | null
        }
        Insert: {
          aesthetics?: Json
          colors?: Json
          created_at?: string
          id?: number
          lifestyle?: string | null
          occasions?: Json
          patterns?: Json
          session_id: string
          style_dna?: Json | null
        }
        Update: {
          aesthetics?: Json
          colors?: Json
          created_at?: string
          id?: number
          lifestyle?: string | null
          occasions?: Json
          patterns?: Json
          session_id?: string
          style_dna?: Json | null
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          ai_credits_limit: number | null
          created_at: string
          features: Json | null
          id: string
          interval: string
          is_active: boolean | null
          name: string
          price: number
          product_limit: number | null
          storage_limit: number | null
          stripe_price_id: string | null
          team_members_limit: number | null
        }
        Insert: {
          ai_credits_limit?: number | null
          created_at?: string
          features?: Json | null
          id?: string
          interval?: string
          is_active?: boolean | null
          name: string
          price: number
          product_limit?: number | null
          storage_limit?: number | null
          stripe_price_id?: string | null
          team_members_limit?: number | null
        }
        Update: {
          ai_credits_limit?: number | null
          created_at?: string
          features?: Json | null
          id?: string
          interval?: string
          is_active?: boolean | null
          name?: string
          price?: number
          product_limit?: number | null
          storage_limit?: number | null
          stripe_price_id?: string | null
          team_members_limit?: number | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          created_at: string
          email: string
          id: string
          invited_at: string | null
          joined_at: string | null
          name: string | null
          role: string
          status: string
          team_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          invited_at?: string | null
          joined_at?: string | null
          name?: string | null
          role?: string
          status?: string
          team_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          invited_at?: string | null
          joined_at?: string | null
          name?: string | null
          role?: string
          status?: string
          team_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      teams: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          plan: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
          plan?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          plan?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      usage_tracking: {
        Row: {
          action_type: string
          created_at: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          ai_credits_limit: number
          ai_credits_used: number
          created_at: string
          id: string
          password: string
          subscription_tier: string
          username: string
        }
        Insert: {
          ai_credits_limit?: number
          ai_credits_used?: number
          created_at?: string
          id?: string
          password: string
          subscription_tier?: string
          username: string
        }
        Update: {
          ai_credits_limit?: number
          ai_credits_used?: number
          created_at?: string
          id?: string
          password?: string
          subscription_tier?: string
          username?: string
        }
        Relationships: []
      }
      wardrobe_items: {
        Row: {
          category: string
          color: string | null
          created_at: string
          id: number
          image_url: string | null
          last_worn: string | null
          name: string
          session_id: string
          tags: Json
          wear_count: number
        }
        Insert: {
          category: string
          color?: string | null
          created_at?: string
          id?: number
          image_url?: string | null
          last_worn?: string | null
          name: string
          session_id: string
          tags?: Json
          wear_count?: number
        }
        Update: {
          category?: string
          color?: string | null
          created_at?: string
          id?: number
          image_url?: string | null
          last_worn?: string | null
          name?: string
          session_id?: string
          tags?: Json
          wear_count?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_unread_notification_count: { Args: never; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      mark_all_notifications_read: { Args: never; Returns: undefined }
      mark_notification_read: {
        Args: { notification_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      notification_category:
        | "general"
        | "chat"
        | "knowledge"
        | "project"
        | "design"
        | "security"
        | "billing"
        | "collaboration"
      notification_type:
        | "info"
        | "success"
        | "warning"
        | "error"
        | "mention"
        | "comment"
        | "share"
        | "system"
        | "security"
        | "update"
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
      app_role: ["admin", "moderator", "user"],
      notification_category: [
        "general",
        "chat",
        "knowledge",
        "project",
        "design",
        "security",
        "billing",
        "collaboration",
      ],
      notification_type: [
        "info",
        "success",
        "warning",
        "error",
        "mention",
        "comment",
        "share",
        "system",
        "security",
        "update",
      ],
    },
  },
} as const
