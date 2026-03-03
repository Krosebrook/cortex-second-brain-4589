import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export const useProfile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  const logProfileAccess = async (
    profileId: string,
    accessType: 'view' | 'update' | 'delete',
    success: boolean = true,
    failureReason?: string
  ) => {
    try {
      await supabase.from('profile_access_logs').insert({
        user_id: profileId,
        action: accessType,
        metadata: { success, failure_reason: failureReason || null },
      });
    } catch (error) {
      console.warn('Failed to log profile access:', error);
    }
  };

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user?.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading profile:', error);
        if (user?.id) {
          await logProfileAccess(user.id, 'view', false, error.message);
        }
        toast.error('Failed to load profile');
        return;
      }

      if (user?.id) {
        await logProfileAccess(user.id, 'view', true);
      }
      setProfile(data as Profile | null);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        await logProfileAccess(user.id, 'update', false, error.message);
        toast.error('Failed to update profile');
        return;
      }

      await logProfileAccess(user.id, 'update', true);
      await loadProfile();
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  return {
    profile,
    loading,
    updateProfile,
    refreshProfile: loadProfile
  };
};
