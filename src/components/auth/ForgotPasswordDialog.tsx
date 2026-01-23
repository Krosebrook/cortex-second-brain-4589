import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Mail, Loader2, CheckCircle2, KeyRound } from 'lucide-react';
import { useRecaptcha } from '@/hooks/useRecaptcha';

interface ForgotPasswordDialogProps {
  trigger?: React.ReactNode;
}

export const ForgotPasswordDialog = ({ trigger }: ForgotPasswordDialogProps) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  
  const {
    isLoaded: recaptchaLoaded,
    isVerified: recaptchaVerified,
    error: recaptchaError,
    token: recaptchaToken,
    resetRecaptcha,
    recaptchaContainerId,
  } = useRecaptcha('recaptcha-forgot-password');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recaptchaVerified) {
      toast.error('Please complete the reCAPTCHA verification.');
      return;
    }

    if (!email) {
      toast.error('Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
        captchaToken: recaptchaToken || undefined,
      });

      if (error) {
        toast.error(error.message);
        resetRecaptcha();
      } else {
        setSent(true);
        toast.success('Password reset email sent!');
      }
    } catch (error) {
      toast.error('Failed to send reset email. Please try again.');
      resetRecaptcha();
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset state when closing
      setEmail('');
      setSent(false);
      resetRecaptcha();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="link" className="px-0 text-primary">
            Forgot your password?
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            Reset Password
          </DialogTitle>
          <DialogDescription>
            Enter your email address and we'll send you a link to reset your password.
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="flex flex-col items-center py-6 space-y-4">
            <div className="p-3 rounded-full bg-green-500/10">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <div className="text-center">
              <h3 className="font-medium text-foreground">Check your email</h3>
              <p className="text-sm text-muted-foreground mt-1">
                We've sent a password reset link to <strong>{email}</strong>
              </p>
            </div>
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* reCAPTCHA Widget */}
            <div className="space-y-2">
              <div className="flex items-center justify-center">
                {!recaptchaLoaded ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Loading reCAPTCHA...</span>
                  </div>
                ) : (
                  <div id={recaptchaContainerId} />
                )}
              </div>
              {recaptchaVerified && (
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm">Verified</span>
                </div>
              )}
              {recaptchaError && (
                <p className="text-sm text-destructive text-center">{recaptchaError}</p>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !recaptchaVerified}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
