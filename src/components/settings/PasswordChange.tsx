 import { useState } from 'react';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Lock, Eye, EyeOff, Check, X, Loader2 } from 'lucide-react';
 import { supabase } from '@/integrations/supabase/client';
 import { toast } from 'sonner';
 
 interface PasswordRequirement {
   label: string;
   test: (password: string) => boolean;
 }
 
 const passwordRequirements: PasswordRequirement[] = [
   { label: 'At least 8 characters', test: (p) => p.length >= 8 },
   { label: 'Contains uppercase letter', test: (p) => /[A-Z]/.test(p) },
   { label: 'Contains lowercase letter', test: (p) => /[a-z]/.test(p) },
   { label: 'Contains a number', test: (p) => /\d/.test(p) },
   { label: 'Contains special character', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
 ];
 
 export const PasswordChange = () => {
   const [currentPassword, setCurrentPassword] = useState('');
   const [newPassword, setNewPassword] = useState('');
   const [confirmPassword, setConfirmPassword] = useState('');
   const [showCurrentPassword, setShowCurrentPassword] = useState(false);
   const [showNewPassword, setShowNewPassword] = useState(false);
   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
   const [loading, setLoading] = useState(false);
 
   const allRequirementsMet = passwordRequirements.every((req) => req.test(newPassword));
   const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
   const canSubmit = allRequirementsMet && passwordsMatch && currentPassword.length > 0;
 
   const handlePasswordChange = async (e: React.FormEvent) => {
     e.preventDefault();
     
     if (!canSubmit) {
       toast.error('Please meet all password requirements');
       return;
     }
 
     setLoading(true);
 
     try {
       // First verify current password by re-authenticating
       const { data: { user } } = await supabase.auth.getUser();
       
       if (!user?.email) {
         toast.error('Unable to verify current user');
         return;
       }
 
       // Re-authenticate with current password
       const { error: signInError } = await supabase.auth.signInWithPassword({
         email: user.email,
         password: currentPassword,
       });
 
       if (signInError) {
         toast.error('Current password is incorrect');
         return;
       }
 
       // Update to new password
       const { error: updateError } = await supabase.auth.updateUser({
         password: newPassword,
       });
 
       if (updateError) {
         toast.error(updateError.message || 'Failed to update password');
         return;
       }
 
       toast.success('Password updated successfully');
       setCurrentPassword('');
       setNewPassword('');
       setConfirmPassword('');
     } catch (error) {
       console.error('Password change error:', error);
       toast.error('An unexpected error occurred');
     } finally {
       setLoading(false);
     }
   };
 
   return (
     <Card className="border-border/50">
       <CardHeader>
         <CardTitle className="text-foreground flex items-center gap-2">
           <Lock size={20} />
           Change Password
         </CardTitle>
         <CardDescription>
           Update your password to keep your account secure
         </CardDescription>
       </CardHeader>
       <CardContent>
         <form onSubmit={handlePasswordChange} className="space-y-4">
           {/* Current Password */}
           <div className="space-y-2">
             <Label htmlFor="current-password">Current Password</Label>
             <div className="relative">
               <Input
                 id="current-password"
                 type={showCurrentPassword ? 'text' : 'password'}
                 value={currentPassword}
                 onChange={(e) => setCurrentPassword(e.target.value)}
                 placeholder="Enter current password"
                 className="pr-10"
               />
               <button
                 type="button"
                 onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                 className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
               >
                 {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
               </button>
             </div>
           </div>
 
           {/* New Password */}
           <div className="space-y-2">
             <Label htmlFor="new-password">New Password</Label>
             <div className="relative">
               <Input
                 id="new-password"
                 type={showNewPassword ? 'text' : 'password'}
                 value={newPassword}
                 onChange={(e) => setNewPassword(e.target.value)}
                 placeholder="Enter new password"
                 className="pr-10"
               />
               <button
                 type="button"
                 onClick={() => setShowNewPassword(!showNewPassword)}
                 className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
               >
                 {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
               </button>
             </div>
           </div>
 
           {/* Password Requirements */}
           {newPassword.length > 0 && (
             <div className="space-y-2 p-3 rounded-lg bg-muted/50">
               <p className="text-sm font-medium text-foreground">Password Requirements:</p>
               <div className="grid grid-cols-1 gap-1">
                 {passwordRequirements.map((req, index) => {
                   const met = req.test(newPassword);
                   return (
                     <div key={index} className="flex items-center gap-2 text-sm">
                       {met ? (
                        <Check size={14} className="text-primary" />
                       ) : (
                         <X size={14} className="text-destructive" />
                       )}
                      <span className={met ? 'text-primary' : 'text-muted-foreground'}>
                         {req.label}
                       </span>
                     </div>
                   );
                 })}
               </div>
             </div>
           )}
 
           {/* Confirm Password */}
           <div className="space-y-2">
             <Label htmlFor="confirm-password">Confirm New Password</Label>
             <div className="relative">
               <Input
                 id="confirm-password"
                 type={showConfirmPassword ? 'text' : 'password'}
                 value={confirmPassword}
                 onChange={(e) => setConfirmPassword(e.target.value)}
                 placeholder="Confirm new password"
                 className="pr-10"
               />
               <button
                 type="button"
                 onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                 className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
               >
                 {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
               </button>
             </div>
             {confirmPassword.length > 0 && !passwordsMatch && (
               <p className="text-sm text-destructive">Passwords do not match</p>
             )}
             {passwordsMatch && (
              <p className="text-sm text-primary flex items-center gap-1">
                 <Check size={14} /> Passwords match
               </p>
             )}
           </div>
 
           <Button type="submit" disabled={!canSubmit || loading} className="w-full">
             {loading ? (
               <>
                 <Loader2 size={16} className="mr-2 animate-spin" />
                 Updating Password...
               </>
             ) : (
               'Update Password'
             )}
           </Button>
         </form>
       </CardContent>
     </Card>
   );
 };