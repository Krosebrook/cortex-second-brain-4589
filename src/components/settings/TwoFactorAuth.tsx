 import { useState, useEffect } from 'react';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Label } from '@/components/ui/label';
 import { Alert, AlertDescription } from '@/components/ui/alert';
 import { Badge } from '@/components/ui/badge';
 import { Shield, ShieldCheck, ShieldOff, Loader2, Copy, Check, AlertTriangle } from 'lucide-react';
 import { supabase } from '@/integrations/supabase/client';
 import { toast } from 'sonner';
 import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
 
 type MFAStatus = 'loading' | 'disabled' | 'pending_verification' | 'enabled';
 
 interface Factor {
   id: string;
   friendly_name?: string;
   factor_type: string;
   status: string;
 }
 
 export const TwoFactorAuth = () => {
   const [status, setStatus] = useState<MFAStatus>('loading');
   const [factors, setFactors] = useState<Factor[]>([]);
   const [qrCode, setQrCode] = useState<string>('');
   const [secret, setSecret] = useState<string>('');
   const [factorId, setFactorId] = useState<string>('');
   const [verificationCode, setVerificationCode] = useState('');
   const [loading, setLoading] = useState(false);
   const [copied, setCopied] = useState(false);
   const [disableCode, setDisableCode] = useState('');
 
   useEffect(() => {
     checkMFAStatus();
   }, []);
 
   const checkMFAStatus = async () => {
     try {
       const { data, error } = await supabase.auth.mfa.listFactors();
       
       if (error) {
         console.error('MFA list error:', error);
         setStatus('disabled');
         return;
       }
 
       const totpFactors = data.totp || [];
       setFactors(totpFactors);
 
       // Check for verified factors
       const verifiedFactor = totpFactors.find(f => f.status === 'verified');
       const unverifiedFactor = totpFactors.find(f => f.status === 'unverified');
 
       if (verifiedFactor) {
         setStatus('enabled');
       } else if (unverifiedFactor) {
         setStatus('pending_verification');
         setFactorId(unverifiedFactor.id);
       } else {
         setStatus('disabled');
       }
     } catch (error) {
       console.error('MFA check error:', error);
       setStatus('disabled');
     }
   };
 
   const handleEnroll = async () => {
     setLoading(true);
     
     try {
       const { data, error } = await supabase.auth.mfa.enroll({
         factorType: 'totp',
         friendlyName: 'Authenticator App',
       });
 
       if (error) {
         toast.error(error.message || 'Failed to start 2FA setup');
         return;
       }
 
       if (data.totp) {
         setQrCode(data.totp.qr_code);
         setSecret(data.totp.secret);
         setFactorId(data.id);
         setStatus('pending_verification');
       }
     } catch (error) {
       console.error('MFA enroll error:', error);
       toast.error('Failed to start 2FA setup');
     } finally {
       setLoading(false);
     }
   };
 
   const handleVerify = async () => {
     if (verificationCode.length !== 6) {
       toast.error('Please enter a 6-digit code');
       return;
     }
 
     setLoading(true);
 
     try {
       const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
         factorId,
       });
 
       if (challengeError) {
         toast.error(challengeError.message || 'Failed to create challenge');
         return;
       }
 
       const { error: verifyError } = await supabase.auth.mfa.verify({
         factorId,
         challengeId: challengeData.id,
         code: verificationCode,
       });
 
       if (verifyError) {
         toast.error(verifyError.message || 'Invalid verification code');
         return;
       }
 
       toast.success('Two-factor authentication enabled successfully!');
       setStatus('enabled');
       setQrCode('');
       setSecret('');
       setVerificationCode('');
       await checkMFAStatus();
     } catch (error) {
       console.error('MFA verify error:', error);
       toast.error('Verification failed');
     } finally {
       setLoading(false);
     }
   };
 
   const handleDisable = async () => {
     if (disableCode.length !== 6) {
       toast.error('Please enter your 6-digit code to confirm');
       return;
     }
 
     setLoading(true);
 
     try {
       const verifiedFactor = factors.find(f => f.status === 'verified');
       
       if (!verifiedFactor) {
         toast.error('No active 2FA factor found');
         return;
       }
 
       // First verify the code
       const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
         factorId: verifiedFactor.id,
       });
 
       if (challengeError) {
         toast.error('Failed to verify code');
         return;
       }
 
       const { error: verifyError } = await supabase.auth.mfa.verify({
         factorId: verifiedFactor.id,
         challengeId: challengeData.id,
         code: disableCode,
       });
 
       if (verifyError) {
         toast.error('Invalid verification code');
         return;
       }
 
       // Now unenroll
       const { error: unenrollError } = await supabase.auth.mfa.unenroll({
         factorId: verifiedFactor.id,
       });
 
       if (unenrollError) {
         toast.error(unenrollError.message || 'Failed to disable 2FA');
         return;
       }
 
       toast.success('Two-factor authentication disabled');
       setStatus('disabled');
       setDisableCode('');
       setFactors([]);
     } catch (error) {
       console.error('MFA disable error:', error);
       toast.error('Failed to disable 2FA');
     } finally {
       setLoading(false);
     }
   };
 
   const handleCancelSetup = async () => {
     if (factorId) {
       try {
         await supabase.auth.mfa.unenroll({ factorId });
       } catch {
         // Ignore errors during cancel
       }
     }
     setStatus('disabled');
     setQrCode('');
     setSecret('');
     setVerificationCode('');
     setFactorId('');
   };
 
   const copySecret = async () => {
     await navigator.clipboard.writeText(secret);
     setCopied(true);
     toast.success('Secret copied to clipboard');
     setTimeout(() => setCopied(false), 2000);
   };
 
   if (status === 'loading') {
     return (
       <Card className="border-border/50">
         <CardContent className="flex items-center justify-center py-8">
           <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
         </CardContent>
       </Card>
     );
   }
 
   return (
     <Card className="border-border/50">
       <CardHeader>
         <div className="flex items-center justify-between">
           <div className="flex items-center gap-2">
             <Shield size={20} className="text-foreground" />
             <CardTitle className="text-foreground">Two-Factor Authentication</CardTitle>
           </div>
           {status === 'enabled' && (
             <Badge variant="default" className="bg-primary">
               <ShieldCheck size={14} className="mr-1" />
               Enabled
             </Badge>
           )}
           {status === 'disabled' && (
             <Badge variant="secondary">
               <ShieldOff size={14} className="mr-1" />
               Disabled
             </Badge>
           )}
         </div>
         <CardDescription>
           Add an extra layer of security using a TOTP authenticator app
         </CardDescription>
       </CardHeader>
       <CardContent className="space-y-4">
         {status === 'disabled' && (
           <>
             <Alert>
               <AlertTriangle className="h-4 w-4" />
               <AlertDescription>
                 Two-factor authentication adds an extra layer of security to your account. 
                 You'll need an authenticator app like Google Authenticator, Authy, or 1Password.
               </AlertDescription>
             </Alert>
             <Button onClick={handleEnroll} disabled={loading} className="w-full">
               {loading ? (
                 <>
                   <Loader2 size={16} className="mr-2 animate-spin" />
                   Setting up...
                 </>
               ) : (
                 <>
                   <Shield size={16} className="mr-2" />
                   Enable Two-Factor Authentication
                 </>
               )}
             </Button>
           </>
         )}
 
         {status === 'pending_verification' && (
           <div className="space-y-4">
             <div className="text-center space-y-4">
               <p className="text-sm text-muted-foreground">
                 Scan this QR code with your authenticator app
               </p>
               {qrCode && (
                 <div className="flex justify-center">
                   <div className="p-4 bg-white rounded-lg">
                     <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
                   </div>
                 </div>
               )}
             </div>
 
             {secret && (
               <div className="space-y-2">
                 <Label className="text-sm text-muted-foreground">
                   Or enter this code manually:
                 </Label>
                 <div className="flex items-center gap-2">
                   <code className="flex-1 p-2 bg-muted rounded text-sm font-mono break-all">
                     {secret}
                   </code>
                   <Button variant="outline" size="icon" onClick={copySecret}>
                     {copied ? <Check size={16} /> : <Copy size={16} />}
                   </Button>
                 </div>
               </div>
             )}
 
             <div className="space-y-2">
               <Label htmlFor="verification-code">Enter verification code</Label>
               <div className="flex justify-center">
                 <InputOTP
                   maxLength={6}
                   value={verificationCode}
                   onChange={setVerificationCode}
                 >
                   <InputOTPGroup>
                     <InputOTPSlot index={0} />
                     <InputOTPSlot index={1} />
                     <InputOTPSlot index={2} />
                     <InputOTPSlot index={3} />
                     <InputOTPSlot index={4} />
                     <InputOTPSlot index={5} />
                   </InputOTPGroup>
                 </InputOTP>
               </div>
             </div>
 
             <div className="flex gap-2">
               <Button
                 variant="outline"
                 onClick={handleCancelSetup}
                 disabled={loading}
                 className="flex-1"
               >
                 Cancel
               </Button>
               <Button
                 onClick={handleVerify}
                 disabled={loading || verificationCode.length !== 6}
                 className="flex-1"
               >
                 {loading ? (
                   <>
                     <Loader2 size={16} className="mr-2 animate-spin" />
                     Verifying...
                   </>
                 ) : (
                   'Verify & Enable'
                 )}
               </Button>
             </div>
           </div>
         )}
 
         {status === 'enabled' && (
           <div className="space-y-4">
            <Alert className="border-primary/50 bg-primary/10">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <AlertDescription className="text-primary">
                 Two-factor authentication is active. Your account has enhanced security.
               </AlertDescription>
             </Alert>
 
             <div className="pt-4 border-t border-border">
               <p className="text-sm text-muted-foreground mb-3">
                 To disable 2FA, enter a code from your authenticator app:
               </p>
               <div className="space-y-3">
                 <div className="flex justify-center">
                   <InputOTP
                     maxLength={6}
                     value={disableCode}
                     onChange={setDisableCode}
                   >
                     <InputOTPGroup>
                       <InputOTPSlot index={0} />
                       <InputOTPSlot index={1} />
                       <InputOTPSlot index={2} />
                       <InputOTPSlot index={3} />
                       <InputOTPSlot index={4} />
                       <InputOTPSlot index={5} />
                     </InputOTPGroup>
                   </InputOTP>
                 </div>
                 <Button
                   variant="destructive"
                   onClick={handleDisable}
                   disabled={loading || disableCode.length !== 6}
                   className="w-full"
                 >
                   {loading ? (
                     <>
                       <Loader2 size={16} className="mr-2 animate-spin" />
                       Disabling...
                     </>
                   ) : (
                     <>
                       <ShieldOff size={16} className="mr-2" />
                       Disable Two-Factor Authentication
                     </>
                   )}
                 </Button>
               </div>
             </div>
           </div>
         )}
       </CardContent>
     </Card>
   );
 };