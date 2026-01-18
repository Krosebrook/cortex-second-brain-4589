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
  bio?: string;
  role?: string;
  created_at: string;
  updated_at: string;
  preferences?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface UpdateProfileData {
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  preferences?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

class UserServiceImpl extends BaseService {
  /**
   * Get the current user profile
   */
  async getCurrentUser(): Promise<UserProfile | null> {
    return this.executeWithRetry('getCurrentUser', async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) throw authError;
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      return this.handleSupabaseResult(data, error);
    });
  }

  /**
   * Get a user profile by ID
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    return this.executeWithRetry('getUserProfile', async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      return this.handleSupabaseResult(data, error);
    });
  }

  /**
   * Get multiple user profiles by IDs
   */
  async getUserProfiles(userIds: string[]): Promise<UserProfile[]> {
    return this.executeWithRetry('getUserProfiles', async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);

      return this.handleSupabaseResult(data, error) || [];
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
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      return this.handleSupabaseResult(data, error);
    });
  }

  /**
   * Update user preferences
   */
  async updatePreferences(preferences: Record<string, unknown>): Promise<UserProfile> {
    return this.executeWithRetry('updatePreferences', async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) throw authError;
      if (!user) throw new Error('User not authenticated');

      // Get current profile to merge preferences
      const currentProfile = await this.getCurrentUser();
      const mergedPreferences = {
        ...currentProfile?.preferences,
        ...preferences,
      };

      const { data, error } = await supabase
        .from('profiles')
        .update({
          preferences: mergedPreferences,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      return this.handleSupabaseResult(data, error);
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
   * Search users by name or email
   */
  async searchUsers(query: string, limit: number = 10): Promise<UserProfile[]> {
    return this.executeWithRetry('searchUsers', async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(limit);

      return this.handleSupabaseResult(data, error) || [];
    });
  }

  /**
   * Get user activity statistics
   */
  async getUserStats(userId?: string): Promise<{
    chatCount: number;
    knowledgeCount: number;
    messageCount: number;
    lastActive: string | null;
  }> {
    return this.executeWithRetry('getUserStats', async () => {
      const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;
      
      if (!targetUserId) throw new Error('User ID required');

      // Get chat count
      const { count: chatCount } = await supabase
        .from('chats')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', targetUserId);

      // Get knowledge count
      const { count: knowledgeCount } = await supabase
        .from('knowledge_items')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', targetUserId);

      // Get message count
      const { count: messageCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', targetUserId);

      // Get last activity
      const { data: lastMessage } = await supabase
        .from('messages')
        .select('created_at')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return {
        chatCount: chatCount || 0,
        knowledgeCount: knowledgeCount || 0,
        messageCount: messageCount || 0,
        lastActive: lastMessage?.created_at || null,
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

      // Mark profile as deleted
      const { error } = await supabase
        .from('profiles')
        .update({
          metadata: { deleted: true, deleted_at: new Date().toISOString() },
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      // Sign out user
      await supabase.auth.signOut();
    });
  }

  /**
   * Check if full name is available (not already in use)
   * Note: full_name is not necessarily unique and may contain spaces
   */
  async isFullNameAvailable(fullName: string): Promise<boolean> {
    return this.executeWithRetry('isFullNameAvailable', async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('full_name', fullName)
        .limit(1);

      if (error) throw error;
      return !data || data.length === 0;
    });
  }
}

// Export singleton instance
export const UserService = new UserServiceImpl();
export default UserService;
