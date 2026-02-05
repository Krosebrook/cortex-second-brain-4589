import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Brain, Mail, Lock, User, ArrowRight, AlertCircle, RefreshCw, ShieldAlert, CheckCircle2, Loader2 } from 'lucide-react';
import { AnimatedTransition } from '@/components/AnimatedTransition';
import { useAnimateIn } from '@/lib/animations';
import { checkSupabaseHealth, getAuthErrorMessage } from '@/lib/supabase-health';
import { useRecaptcha } from '@/hooks/useRecaptcha';
import { ForgotPasswordDialog } from '@/components/auth/ForgotPasswordDialog';
 import { MFAVerification } from '@/components/auth/MFAVerification';

interface LockoutStatus {
  isLocked: boolean;
  remainingAttempts: number;
  lockoutUntil: string | null;
  lockoutReason: string | null;
}

const AuthPage = () => {
  const [loading, setLoading] = useState(false);
  const [checkingHealth, setCheckingHealth] = useState(true);
  const [connectionHealthy, setConnectionHealthy] = useState(true);
  const [healthError, setHealthError] = useState<string>('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [lockoutStatus, setLockoutStatus] = useState<LockoutStatus | null>(null);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [showMFA, setShowMFA] = useState(false);
  const navigate = useNavigate();
  const showContent = useAnimateIn(false, 300);
  
  // reCAPTCHA hooks - separate instances for login and signup
  const { 
    isLoaded: loginRecaptchaLoaded, 
    isVerified: loginRecaptchaVerified, 
    error: loginRecaptchaError, 
    token: loginRecaptchaToken, 
    resetRecaptcha: resetLoginRecaptcha, 
    recaptchaContainerId: loginRecaptchaContainerId 
  } = useRecaptcha('recaptcha-login');
  
  const { 
    isLoaded: signupRecaptchaLoaded, 
    isVerified: signupRecaptchaVerified, 
    error: signupRecaptchaError, 
    token: signupRecaptchaToken, 
    resetRecaptcha: resetSignupRecaptcha, 
    recaptchaContainerId: signupRecaptchaContainerId 
  } = useRecaptcha('recaptcha-signup');

  useEffect(() => {
    const initializePage = async () => {
      // First check Supabase health
      const health = await checkSupabaseHealth();
      setConnectionHealthy(health.isHealthy);
      setHealthError(health.error || '');
      setCheckingHealth(false);

      // Then check if user is already logged in
      if (health.isHealthy) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            navigate('/dashboard');
          }
        } catch (error) {
          console.error('Session check error:', error);
        }
      }
    };

    initializePage();
  }, [navigate]);

  const handleRetryConnection = async () => {
    setCheckingHealth(true);
    const health = await checkSupabaseHealth();
    setConnectionHealthy(health.isHealthy);
    setHealthError(health.error || '');
    setCheckingHealth(false);

    if (health.isHealthy) {
      toast.success('Connection restored!');
    } else {
      toast.error('Still unable to connect. Please try again later.');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check connection health before attempting
    if (!connectionHealthy) {
      toast.error('Cannot connect to authentication service. Please retry connection.');
      return;
    }

    // Check reCAPTCHA verification for signup
    if (!signupRecaptchaVerified) {
      toast.error('Please complete the reCAPTCHA verification.');
      return;
    }

    setLoading(true);

    try {
      // Enhanced password validation
      if (password.length < 8) {
        toast.error('Password must be at least 8 characters long');
        setLoading(false);
        return;
      }

      const redirectUrl = `${window.location.origin}/dashboard`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          captchaToken: signupRecaptchaToken || undefined,
          data: {
            full_name: fullName,
            username: email.split('@')[0]
          }
        }
      });

      if (error) {
        toast.error(getAuthErrorMessage(error));
        resetSignupRecaptcha();
      } else {
        toast.success('Account created! Check your email to confirm your account.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? getAuthErrorMessage(error)
        : 'An unexpected error occurred';
      toast.error(errorMessage);
      resetSignupRecaptcha();
      
      // Recheck health if fetch failed
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        setConnectionHealthy(false);
        setHealthError('Connection lost. Please retry connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const checkAccountLockout = async (emailToCheck: string): Promise<LockoutStatus | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('account-lockout', {
        body: { email: emailToCheck },
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (error) {
        console.warn('Lockout check failed:', error);
        return null;
      }

      return data as LockoutStatus;
    } catch (err) {
      console.warn('Lockout check error:', err);
      return null;
    }
  };

  const recordLoginFailure = async (emailToRecord: string, reason?: string): Promise<LockoutStatus | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('account-lockout?action=record-failure', {
        body: { email: emailToRecord, reason },
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (error) {
        console.warn('Failed to record login failure:', error);
        return null;
      }

      return data as LockoutStatus;
    } catch (err) {
      console.warn('Record failure error:', err);
      return null;
    }
  };

  const clearLoginAttempts = async (emailToClear: string): Promise<void> => {
    try {
      await supabase.functions.invoke('account-lockout?action=record-success', {
        body: { email: emailToClear },
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      console.warn('Failed to clear login attempts:', err);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check connection health before attempting
    if (!connectionHealthy) {
      toast.error('Cannot connect to authentication service. Please retry connection.');
      return;
    }

    // Check reCAPTCHA verification
    if (!loginRecaptchaVerified) {
      toast.error('Please complete the reCAPTCHA verification.');
      return;
    }

    setLoading(true);

    try {
      // Check if account is locked before attempting login
      const lockout = await checkAccountLockout(email);
      if (lockout?.isLocked) {
        setLockoutStatus(lockout);
        toast.error(lockout.lockoutReason || 'Account is temporarily locked');
        setLoading(false);
        resetLoginRecaptcha();
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          captchaToken: loginRecaptchaToken || undefined,
        },
      });

      if (error) {
        // Check if this is an MFA challenge required scenario
        // Supabase returns specific indicators when MFA is needed
        const { data: factorsData } = await supabase.auth.mfa.listFactors();
        const totpFactor = factorsData?.totp?.find(f => f.status === 'verified');
        
        if (totpFactor && error.message?.toLowerCase().includes('requires')) {
          setMfaFactorId(totpFactor.id);
          setShowMFA(true);
          setLoading(false);
          return;
        }

        // Record failed login attempt via edge function
        const failureStatus = await recordLoginFailure(email, error.message);
        
        if (failureStatus?.isLocked) {
          setLockoutStatus(failureStatus);
          toast.error('Too many failed attempts. Account temporarily locked.');
        } else if (failureStatus) {
          setLockoutStatus(failureStatus);
          toast.error(`${getAuthErrorMessage(error)}. ${failureStatus.remainingAttempts} attempts remaining.`);
        } else {
          toast.error(getAuthErrorMessage(error));
        }
        // Reset reCAPTCHA on failed login
        resetLoginRecaptcha();
      } else {
        // Clear failed attempts on successful login
        await clearLoginAttempts(email);
        setLockoutStatus(null);
        toast.success('Welcome back!');
        navigate('/dashboard');
      }
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? getAuthErrorMessage(error)
        : 'An unexpected error occurred';
      toast.error(errorMessage);
      resetLoginRecaptcha();
      
      // Recheck health if fetch failed
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        setConnectionHealthy(false);
        setHealthError('Connection lost. Please retry connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMFASuccess = async () => {
    setShowMFA(false);
    setMfaFactorId(null);
    await clearLoginAttempts(email);
    toast.success('Welcome back!');
    navigate('/dashboard');
  };

  const handleMFACancel = () => {
    setShowMFA(false);
    setMfaFactorId(null);
    resetLoginRecaptcha();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-background flex items-center justify-center p-4">
      <AnimatedTransition show={showContent} animation="slide-up">
        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Brain className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Tessa AI</h1>
            </div>
            <p className="text-muted-foreground">
              Your personal AI assistant for knowledge management
            </p>
          </div>

          {/* Connection Error Alert */}
          {!connectionHealthy && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span className="flex-1">{healthError || 'Cannot connect to authentication service'}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetryConnection}
                  disabled={checkingHealth}
                  className="ml-2"
                >
                  {checkingHealth ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Retry
                    </>
                  )}
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Account Lockout Alert */}
          {lockoutStatus?.isLocked && (
            <Alert variant="destructive">
              <ShieldAlert className="h-4 w-4" />
              <AlertDescription>
                <strong>Account Locked</strong>
                <p className="text-sm mt-1">
                  {lockoutStatus.lockoutReason || 'Too many failed login attempts.'}
                  {lockoutStatus.lockoutUntil && (
                    <span className="block mt-1">
                      Try again after: {new Date(lockoutStatus.lockoutUntil).toLocaleTimeString()}
                    </span>
                  )}
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* Auth Form */}
          {showMFA && mfaFactorId ? (
            <MFAVerification 
              factorId={mfaFactorId}
              onSuccess={handleMFASuccess}
              onCancel={handleMFACancel}
            />
          ) : (
            <Card className="w-full">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center">Welcome</CardTitle>
              <CardDescription className="text-center">
                Sign in to your account or create a new one
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                
                <TabsContent value="signin">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type="password"
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    
                    {/* reCAPTCHA Widget for Login */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-center">
                        {!loginRecaptchaLoaded ? (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">Loading reCAPTCHA...</span>
                          </div>
                        ) : (
                          <div id={loginRecaptchaContainerId} />
                        )}
                      </div>
                      {loginRecaptchaVerified && (
                        <div className="flex items-center justify-center gap-2 text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="text-sm">Verified</span>
                        </div>
                      )}
                      {loginRecaptchaError && (
                        <p className="text-sm text-destructive text-center">{loginRecaptchaError}</p>
                      )}
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loading || !connectionHealthy || !loginRecaptchaVerified}
                    >
                      {loading ? 'Signing in...' : 'Sign In'}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    
                    {/* Forgot Password Link */}
                    <div className="text-center">
                      <ForgotPasswordDialog />
                    </div>
                  </form>
                </TabsContent>
                
                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="fullName"
                          type="text"
                          placeholder="Enter your full name"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="Create a password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10"
                          minLength={8}
                          required
                        />
                      </div>
                    </div>
                    
                    {/* reCAPTCHA Widget for Signup */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-center">
                        {!signupRecaptchaLoaded ? (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">Loading reCAPTCHA...</span>
                          </div>
                        ) : (
                          <div id={signupRecaptchaContainerId} />
                        )}
                      </div>
                      {signupRecaptchaVerified && (
                        <div className="flex items-center justify-center gap-2 text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="text-sm">Verified</span>
                        </div>
                      )}
                      {signupRecaptchaError && (
                        <p className="text-sm text-destructive text-center">{signupRecaptchaError}</p>
                      )}
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loading || !connectionHealthy || !signupRecaptchaVerified}
                    >
                      {loading ? 'Creating account...' : 'Create Account'}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
            </Card>
          )}

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground">
            <p>
              By signing up, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </AnimatedTransition>
    </div>
  );
};

export default AuthPage;