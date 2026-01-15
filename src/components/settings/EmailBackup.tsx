import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Mail, 
  Calendar, 
  Send,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { supabase } from '@/integrations/supabase/client';

interface EmailBackupSettings {
  enabled: boolean;
  email: string;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  includeAttachment: boolean;
  lastSent: string | null;
}

const DEFAULT_SETTINGS: EmailBackupSettings = {
  enabled: false,
  email: '',
  frequency: 'weekly',
  includeAttachment: true,
  lastSent: null
};

export const EmailBackup: React.FC = () => {
  const [settings, setSettings] = useLocalStorage<EmailBackupSettings>('cortex-email-backup-settings', DEFAULT_SETTINGS);
  const [isSending, setIsSending] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const handleSettingChange = <K extends keyof EmailBackupSettings>(key: K, value: EmailBackupSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    if (key !== 'lastSent') {
      toast.success('Email backup settings updated');
    }
  };

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const sendTestEmail = async () => {
    if (!settings.email || !validateEmail(settings.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSending(true);

    try {
      // Get user's data for backup
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to send backup emails');
        setIsSending(false);
        return;
      }

      // Fetch user's data
      const [chatsResult, knowledgeResult] = await Promise.all([
        supabase.from('chats').select('*').eq('user_id', user.id),
        supabase.from('knowledge_base').select('*').eq('user_id', user.id)
      ]);

      const { data: session } = await supabase.auth.getSession();

      const backupData = {
        chats: chatsResult.data || [],
        messages: [],
        knowledge: knowledgeResult.data || []
      };

      const response = await supabase.functions.invoke('send-backup-email', {
        body: {
          email: settings.email,
          backupData,
          format: settings.includeAttachment ? 'json' : 'summary'
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      setIsVerified(true);
      handleSettingChange('lastSent', new Date().toISOString());
      toast.success('Backup email sent successfully!');
    } catch (error: any) {
      console.error('Failed to send backup email:', error);
      toast.error(`Failed to send email: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const getNextBackupDate = (): string => {
    if (!settings.enabled || !settings.lastSent) return 'Not scheduled';
    
    const last = new Date(settings.lastSent);
    let days: number;
    
    switch (settings.frequency) {
      case 'weekly': days = 7; break;
      case 'biweekly': days = 14; break;
      case 'monthly': days = 30; break;
      default: days = 7;
    }
    
    const next = new Date(last.getTime() + days * 24 * 60 * 60 * 1000);
    return next.toLocaleDateString();
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <Mail size={20} />
          Email Backups
        </CardTitle>
        <CardDescription>
          Receive periodic backup files directly to your email
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable Toggle */}
        <div className="flex items-center justify-between p-3 rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <Calendar size={18} className="text-primary" />
            <div>
              <Label className="text-sm font-medium">Enable Email Backups</Label>
              <p className="text-xs text-muted-foreground">Send backups to your email</p>
            </div>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(checked) => handleSettingChange('enabled', checked)}
          />
        </div>

        {/* Email Input */}
        <div className="space-y-2">
          <Label className="text-sm">Email Address</Label>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="your@email.com"
              value={settings.email}
              onChange={(e) => handleSettingChange('email', e.target.value)}
              className="flex-1"
            />
            {isVerified && settings.email && (
              <Badge variant="outline" className="flex items-center gap-1 text-green-600">
                <CheckCircle size={12} />
                Verified
              </Badge>
            )}
          </div>
        </div>

        {/* Settings */}
        <div className={settings.enabled ? '' : 'opacity-50 pointer-events-none'}>
          <div className="space-y-4">
            {/* Frequency */}
            <div className="flex items-center justify-between">
              <Label className="text-sm">Backup Frequency</Label>
              <Select
                value={settings.frequency}
                onValueChange={(value: 'weekly' | 'biweekly' | 'monthly') => 
                  handleSettingChange('frequency', value)
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Bi-weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Include Attachment */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Include Full Backup File</Label>
                <p className="text-xs text-muted-foreground">
                  Attach JSON file to email
                </p>
              </div>
              <Switch
                checked={settings.includeAttachment}
                onCheckedChange={(checked) => handleSettingChange('includeAttachment', checked)}
              />
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="p-3 rounded-lg border border-border bg-card/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Next backup:</span>
            <Badge variant="outline">{getNextBackupDate()}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Last sent:</span>
            <span className="text-sm">
              {settings.lastSent ? new Date(settings.lastSent).toLocaleString() : 'Never'}
            </span>
          </div>
        </div>

        {/* Send Test Button */}
        <Button
          variant="outline"
          className="w-full"
          onClick={sendTestEmail}
          disabled={isSending || !settings.email}
        >
          {isSending ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send size={16} className="mr-2" />
              Send Test Backup Now
            </>
          )}
        </Button>

        {/* Info Note */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
          <AlertCircle size={16} className="text-muted-foreground mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Email backups require you to be logged in. Make sure your email provider 
            allows attachments if you want to receive the full backup file.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailBackup;
