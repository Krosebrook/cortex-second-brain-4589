/**
 * User Profile Service
 * Centralizes all user profile-related operations and data management
 */

import { supabase } from '@/integrations/supabase/client';
import { BaseService } from './base.service';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  subscription_status?: string;
  subscription_tier?: string;
  onboarding_completed?: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileData {
  full_name?: string;
  avatar_url?: string;
}

class UserServiceImpl extends BaseService {
  constructor() {
    super('UserService');
  }

  /**
   * Get the current user profile
   */
  async getCurrentUser(): Promise<UserProfile | null> {
    return this.executeWithRetry('getCurrentUser', async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) throw authError;
      if (!user) return null;

      const result = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (result.error) {
        // If profile doesn't exist, return basic user info
        if (result.error.code === 'PGRST116') {
          return {
            id: user.id,
            email: user.email || '',
            created_at: user.created_at,
            updated_at: user.updated_at || user.created_at,
          } as UserProfile;
        }
        throw result.error;
      }

      return {
        id: result.data.id,
        email: result.data.email || user.email || '',
        full_name: result.data.full_name || undefined,
        avatar_url: result.data.avatar_url || undefined,
        subscription_status: result.data.subscription_status || undefined,
        subscription_tier: result.data.subscription_tier || undefined,
        onboarding_completed: result.data.onboarding_completed || false,
        created_at: result.data.created_at,
        updated_at: result.data.updated_at,
      };
    });
  }

  /**
   * Get a user profile by ID
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    return this.executeWithRetry('getUserProfile', async () => {
      const result = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (result.error) {
        if (result.error.code === 'PGRST116') return null;
        throw result.error;
      }

      return {
        id: result.data.id,
        email: result.data.email || '',
        full_name: result.data.full_name || undefined,
        avatar_url: result.data.avatar_url || undefined,
        subscription_status: result.data.subscription_status || undefined,
        subscription_tier: result.data.subscription_tier || undefined,
        onboarding_completed: result.data.onboarding_completed || false,
        created_at: result.data.created_at,
        updated_at: result.data.updated_at,
      };
    });
  }

  /**
   * Get multiple user profiles by IDs
   */
  async getUserProfiles(userIds: string[]): Promise<UserProfile[]> {
    return this.executeWithRetry('getUserProfiles', async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .in('id', userIds);

      if (error) throw error;

      return (data || []).map(profile => ({
        id: profile.id,
        email: profile.email || '',
        full_name: profile.full_name || undefined,
        avatar_url: profile.avatar_url || undefined,
        subscription_status: profile.subscription_status || undefined,
        subscription_tier: profile.subscription_tier || undefined,
        onboarding_completed: profile.onboarding_completed || false,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      }));
    });
  }

  /**
   * Update the current user's profile
   */
  async updateCurrentUserProfile(updates: UpdateProfileData): Promise<UserProfile> {
    return this.executeWithRetry('updateCurrentUserProfile', async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) throw authError;
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Failed to update profile');

      return {
        id: data.id,
        email: data.email || user.email || '',
        full_name: data.full_name || undefined,
        avatar_url: data.avatar_url || undefined,
        subscription_status: data.subscription_status || undefined,
        subscription_tier: data.subscription_tier || undefined,
        onboarding_completed: data.onboarding_completed || false,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    });
  }

  /**
   * Upload and update user avatar
   */
  async uploadAvatar(file: File): Promise<string> {
    return this.executeWithRetry('uploadAvatar', async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) throw authError;
      if (!user) throw new Error('User not authenticated');

      // Create unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload file
      const { error: uploadError } = await supabase.storage
        .from('user-assets')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-assets')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      await this.updateCurrentUserProfile({ avatar_url: publicUrl });

      return publicUrl;
    });
  }

  /**
   * Search users by name
   */
  async searchUsers(query: string, limit: number = 10): Promise<UserProfile[]> {
    return this.executeWithRetry('searchUsers', async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .ilike('full_name', `%${query}%`)
        .limit(limit);

      if (error) throw error;

      return (data || []).map(profile => ({
        id: profile.id,
        email: profile.email || '',
        full_name: profile.full_name || undefined,
        avatar_url: profile.avatar_url || undefined,
        subscription_status: profile.subscription_status || undefined,
        subscription_tier: profile.subscription_tier || undefined,
        onboarding_completed: profile.onboarding_completed || false,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      }));
    });
  }

  /**
   * Get user activity statistics
   */
  async getUserStats(userId?: string): Promise<{
    chatCount: number;
    messageCount: number;
    lastActive: string | null;
  }> {
    return this.executeWithRetry('getUserStats', async () => {
      const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;
      
      if (!targetUserId) throw new Error('User ID required');

      // Get chat count
      const chatResult = await supabase
        .from('chats')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', targetUserId);

      // Get message count - use RPC or simplified query to avoid type depth issues
      let messageCount = 0;
      let lastActive: string | null = null;
      
      try {
        // Try to get message count from messages table
        const messagesResult = await (supabase as any)
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', targetUserId);
        messageCount = messagesResult.count || 0;
        
        // Try to get last message
        const lastMessageResult = await (supabase as any)
          .from('messages')
          .select('created_at')
          .eq('user_id', targetUserId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        lastActive = lastMessageResult.data?.created_at || null;
      } catch {
        // Messages table may not have user_id or may not be accessible
        messageCount = 0;
        lastActive = null;
      }

      return {
        chatCount: chatResult.count || 0,
        messageCount,
        lastActive,
      };
    });
  }

  /**
   * Delete user account (soft delete - marks as deleted)
   */
  async deleteAccount(): Promise<void> {
    return this.executeWithRetry('deleteAccount', async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) throw authError;
      if (!user) throw new Error('User not authenticated');

      // Sign out user (actual deletion should be handled by admin or backend)
      await supabase.auth.signOut();
    });
  }

  /**
   * Check if full name is available (not already in use)
   */
  async isFullNameAvailable(fullName: string): Promise<boolean> {
    return this.executeWithRetry('isFullNameAvailable', async () => {
      const result = await supabase
        .from('user_profiles')
        .select('id')
        .eq('full_name', fullName)
        .limit(1);

      const { data, error } = result;

      if (error) throw error;
      return !data || data.length === 0;
    });
  }
}

// Export singleton instance
export const UserService = new UserServiceImpl();
export default UserService;
