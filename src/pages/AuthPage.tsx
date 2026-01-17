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
import { Brain, Mail, Lock, User, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react';
import { AnimatedTransition } from '@/components/AnimatedTransition';
import { useAnimateIn } from '@/lib/animations';
import { checkSupabaseHealth, getAuthErrorMessage } from '@/lib/supabase-health';

const AuthPage = () => {
  const [loading, setLoading] = useState(false);
  const [checkingHealth, setCheckingHealth] = useState(true);
  const [connectionHealthy, setConnectionHealthy] = useState(true);
  const [healthError, setHealthError] = useState<string>('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const navigate = useNavigate();
  const showContent = useAnimateIn(false, 300);

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
          data: {
            full_name: fullName,
            username: email.split('@')[0]
          }
        }
      });

      if (error) {
        toast.error(getAuthErrorMessage(error));
      } else {
        toast.success('Account created! Check your email to confirm your account.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? getAuthErrorMessage(error)
        : 'An unexpected error occurred';
      toast.error(errorMessage);
      
      // Recheck health if fetch failed
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        setConnectionHealthy(false);
        setHealthError('Connection lost. Please retry connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check connection health before attempting
    if (!connectionHealthy) {
      toast.error('Cannot connect to authentication service. Please retry connection.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Record failed login attempt for rate limiting
        try {
          // Get client IP (will be 0.0.0.0 from client-side, but server can log actual IP)
          const { data: result } = await supabase.rpc('record_failed_login', {
            p_email: email,
            p_ip_address: '0.0.0.0', // Client doesn't know real IP, server-side tracking preferred
            p_user_agent: navigator.userAgent
          });
          
          const typedResult = result as { blocked?: boolean } | null;
          if (typedResult?.blocked) {
            toast.error('Your access has been temporarily blocked due to too many failed attempts. Please try again later.');
            setLoading(false);
            return;
          }
        } catch (trackingError) {
          console.error('Failed to record login attempt:', trackingError);
        }
        
        toast.error(getAuthErrorMessage(error));
      } else {
        toast.success('Welcome back!');
        navigate('/dashboard');
      }
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? getAuthErrorMessage(error)
        : 'An unexpected error occurred';
      toast.error(errorMessage);
      
      // Recheck health if fetch failed
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        setConnectionHealthy(false);
        setHealthError('Connection lost. Please retry connection.');
      }
    } finally {
      setLoading(false);
    }
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

          {/* Auth Form */}
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
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loading || !connectionHealthy}
                    >
                      {loading ? 'Signing in...' : 'Sign In'}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
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
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loading || !connectionHealthy}
                    >
                      {loading ? 'Creating account...' : 'Create Account'}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

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