import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Mail, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const EmailVerificationBanner = () => {
  const { user } = useAuth();
  const [sending, setSending] = useState(false);

  // Check if email is confirmed
  const isEmailConfirmed = user?.email_confirmed_at !== null && user?.email_confirmed_at !== undefined;

  const handleResendVerification = async () => {
    if (!user?.email) return;
    
    setSending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Verification email sent! Please check your inbox.');
      }
    } catch (error) {
      toast.error('Failed to send verification email. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (!user) return null;

  if (isEmailConfirmed) {
    return (
      <Alert className="bg-green-500/10 border-green-500/30 mb-6">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertDescription className="flex items-center justify-between">
          <span className="text-green-700 dark:text-green-400">
            <strong>Email verified:</strong> {user.email}
          </span>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="bg-amber-500/10 border-amber-500/30 mb-6">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <span className="text-amber-700 dark:text-amber-400">
          <strong>Email not verified:</strong> Please verify your email ({user.email}) to access all features.
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleResendVerification}
          disabled={sending}
          className="border-amber-500/50 hover:bg-amber-500/10"
        >
          {sending ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin mr-2" />
              Sending...
            </>
          ) : (
            <>
              <Mail className="h-3 w-3 mr-2" />
              Resend Verification
            </>
          )}
        </Button>
      </AlertDescription>
    </Alert>
  );
};
