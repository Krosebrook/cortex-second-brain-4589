 import { useState } from 'react';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Shield, Loader2 } from 'lucide-react';
 import { supabase } from '@/integrations/supabase/client';
 import { toast } from 'sonner';
 import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
 
 interface MFAVerificationProps {
   factorId: string;
   onSuccess: () => void;
   onCancel: () => void;
 }
 
 export const MFAVerification = ({ factorId, onSuccess, onCancel }: MFAVerificationProps) => {
   const [code, setCode] = useState('');
   const [loading, setLoading] = useState(false);
 
   const handleVerify = async () => {
     if (code.length !== 6) {
       toast.error('Please enter a 6-digit code');
       return;
     }
 
     setLoading(true);
 
     try {
       const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
         factorId,
       });
 
       if (challengeError) {
         toast.error('Failed to create MFA challenge');
         return;
       }
 
       const { error: verifyError } = await supabase.auth.mfa.verify({
         factorId,
         challengeId: challengeData.id,
         code,
       });
 
       if (verifyError) {
         toast.error('Invalid verification code');
         setCode('');
         return;
       }
 
       onSuccess();
     } catch (error) {
       console.error('MFA verification error:', error);
       toast.error('Verification failed');
     } finally {
       setLoading(false);
     }
   };
 
   return (
     <Card className="w-full">
       <CardHeader className="text-center">
         <div className="flex justify-center mb-2">
           <Shield className="h-12 w-12 text-primary" />
         </div>
         <CardTitle>Two-Factor Authentication</CardTitle>
         <CardDescription>
           Enter the 6-digit code from your authenticator app
         </CardDescription>
       </CardHeader>
       <CardContent className="space-y-4">
         <div className="flex justify-center">
           <InputOTP
             maxLength={6}
             value={code}
             onChange={setCode}
             autoFocus
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
 
         <div className="flex gap-2">
           <Button
             variant="outline"
             onClick={onCancel}
             disabled={loading}
             className="flex-1"
           >
             Cancel
           </Button>
           <Button
             onClick={handleVerify}
             disabled={loading || code.length !== 6}
             className="flex-1"
           >
             {loading ? (
               <>
                 <Loader2 size={16} className="mr-2 animate-spin" />
                 Verifying...
               </>
             ) : (
               'Verify'
             )}
           </Button>
         </div>
       </CardContent>
     </Card>
   );
 };