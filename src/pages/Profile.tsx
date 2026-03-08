import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Loader2, Save, Pencil, X, User } from 'lucide-react';

interface ProfileData {
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  email: string | null;
}

const MAX_NAME_LENGTH = 100;
const MAX_BIO_LENGTH = 500;
const MAX_USERNAME_LENGTH = 50;

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<ProfileData>({
    full_name: '',
    username: '',
    avatar_url: '',
    bio: '',
    email: '',
  });

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('full_name, username, avatar_url, bio, email')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
      setForm({
        full_name: data.full_name || '',
        username: data.username || '',
        avatar_url: data.avatar_url || '',
        bio: data.bio || '',
        email: data.email || user.email || '',
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = async () => {
    if (!user) return;

    if (form.full_name && form.full_name.length > MAX_NAME_LENGTH) {
      toast.error(`Name must be under ${MAX_NAME_LENGTH} characters`);
      return;
    }
    if (form.bio && form.bio.length > MAX_BIO_LENGTH) {
      toast.error(`Bio must be under ${MAX_BIO_LENGTH} characters`);
      return;
    }
    if (form.username && form.username.length > MAX_USERNAME_LENGTH) {
      toast.error(`Username must be under ${MAX_USERNAME_LENGTH} characters`);
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          full_name: form.full_name || null,
          username: form.username || null,
          avatar_url: form.avatar_url || null,
          bio: form.bio || null,
        })
        .eq('id', user.id);

      if (error) throw error;

      setProfile({ ...form });
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        username: profile.username || '',
        avatar_url: profile.avatar_url || '',
        bio: profile.bio || '',
        email: profile.email || '',
      });
    }
    setIsEditing(false);
  };

  const initials = (form.full_name || form.email || '?')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={form.avatar_url || undefined} alt={form.full_name || 'User'} />
              <AvatarFallback className="bg-primary/10 text-primary text-lg">
                {initials || <User className="h-6 w-6" />}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-foreground">
                {profile?.full_name || 'Your Profile'}
              </CardTitle>
              <CardDescription>{profile?.email || user?.email}</CardDescription>
              {profile?.bio && !isEditing && (
                <p className="text-sm text-muted-foreground mt-1">{profile.bio}</p>
              )}
            </div>
            {!isEditing && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </CardHeader>

          {isEditing && (
            <>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={form.full_name || ''}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    maxLength={MAX_NAME_LENGTH}
                    placeholder="Your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={form.username || ''}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    maxLength={MAX_USERNAME_LENGTH}
                    placeholder="your-username"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="avatar_url">Avatar URL</Label>
                  <Input
                    id="avatar_url"
                    value={form.avatar_url || ''}
                    onChange={(e) => setForm({ ...form, avatar_url: e.target.value })}
                    placeholder="https://example.com/avatar.jpg"
                    type="url"
                  />
                  {form.avatar_url && (
                    <div className="mt-2">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={form.avatar_url} alt="Preview" />
                        <AvatarFallback>?</AvatarFallback>
                      </Avatar>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={form.bio || ''}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    maxLength={MAX_BIO_LENGTH}
                    placeholder="Tell us about yourself..."
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {(form.bio || '').length}/{MAX_BIO_LENGTH}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={form.email || ''}
                    disabled
                    className="opacity-60"
                  />
                  <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
                </div>
              </CardContent>

              <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleCancel} disabled={saving}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </CardFooter>
            </>
          )}
        </Card>
      </div>
    </PageWrapper>
  );
};

export default Profile;
