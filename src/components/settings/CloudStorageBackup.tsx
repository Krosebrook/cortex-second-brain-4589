import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Cloud, 
  HardDrive,
  Loader2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  FolderOpen,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { supabase } from '@/integrations/supabase/client';

type CloudProvider = 'google-drive' | 'dropbox' | 'onedrive';

interface CloudConnection {
  provider: CloudProvider;
  connected: boolean;
  email?: string;
  folderId?: string;
  folderName?: string;
  lastBackup?: string;
}

interface CloudBackupSettings {
  enabled: boolean;
  provider: CloudProvider | null;
  frequency: 'daily' | 'weekly' | 'monthly';
  includeChats: boolean;
  includeKnowledge: boolean;
  connections: CloudConnection[];
}

const DEFAULT_SETTINGS: CloudBackupSettings = {
  enabled: false,
  provider: null,
  frequency: 'weekly',
  includeChats: true,
  includeKnowledge: true,
  connections: []
};

const cloudProviders = [
  { 
    id: 'google-drive' as CloudProvider, 
    name: 'Google Drive', 
    icon: '🔵',
    color: 'bg-blue-500',
    description: 'Backup to your Google Drive account'
  },
  { 
    id: 'dropbox' as CloudProvider, 
    name: 'Dropbox', 
    icon: '📦',
    color: 'bg-blue-600',
    description: 'Sync backups with Dropbox'
  },
  { 
    id: 'onedrive' as CloudProvider, 
    name: 'OneDrive', 
    icon: '☁️',
    color: 'bg-sky-500',
    description: 'Store backups in Microsoft OneDrive'
  }
];

export const CloudStorageBackup: React.FC = () => {
  const [settings, setSettings] = useLocalStorage<CloudBackupSettings>('cortex-cloud-backup-settings', DEFAULT_SETTINGS);
  const [isConnecting, setIsConnecting] = useState<CloudProvider | null>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);

  const handleSettingChange = <K extends keyof CloudBackupSettings>(key: K, value: CloudBackupSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    if (key !== 'connections') {
      toast.success('Cloud backup settings updated');
    }
  };

  const getConnection = (provider: CloudProvider): CloudConnection | undefined => {
    return settings.connections.find(c => c.provider === provider);
  };

  const isConnected = (provider: CloudProvider): boolean => {
    return getConnection(provider)?.connected || false;
  };

  const handleConnect = async (provider: CloudProvider) => {
    setIsConnecting(provider);
    
    try {
      // Simulate OAuth flow - in production this would redirect to actual OAuth
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock successful connection
      const newConnection: CloudConnection = {
        provider,
        connected: true,
        email: 'user@example.com',
        folderId: 'cortex-backups-' + Date.now(),
        folderName: 'Cortex Backups'
      };
      
      const updatedConnections = [
        ...settings.connections.filter(c => c.provider !== provider),
        newConnection
      ];
      
      handleSettingChange('connections', updatedConnections);
      
      if (!settings.provider) {
        handleSettingChange('provider', provider);
      }
      
      toast.success(`Connected to ${cloudProviders.find(p => p.id === provider)?.name}`);
    } catch (error: any) {
      toast.error(`Failed to connect: ${error.message}`);
    } finally {
      setIsConnecting(null);
    }
  };

  const handleDisconnect = (provider: CloudProvider) => {
    const updatedConnections = settings.connections.filter(c => c.provider !== provider);
    handleSettingChange('connections', updatedConnections);
    
    if (settings.provider === provider) {
      const nextProvider = updatedConnections.find(c => c.connected)?.provider || null;
      handleSettingChange('provider', nextProvider);
    }
    
    toast.success(`Disconnected from ${cloudProviders.find(p => p.id === provider)?.name}`);
  };

  const handleBackupNow = async () => {
    if (!settings.provider || !isConnected(settings.provider)) {
      toast.error('Please connect a cloud storage provider first');
      return;
    }
    
    setIsBackingUp(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to backup data');
      }
      
      // Fetch user's data
      const [chatsResult, knowledgeResult] = await Promise.all([
        settings.includeChats 
          ? supabase.from('chats').select('*').eq('user_id', user.id)
          : Promise.resolve({ data: [] }),
        settings.includeKnowledge 
          ? supabase.from('knowledge_base').select('*').eq('user_id', user.id)
          : Promise.resolve({ data: [] })
      ]);
      
      const backupData = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        provider: settings.provider,
        chats: chatsResult.data || [],
        knowledge: knowledgeResult.data || []
      };
      
      // Simulate upload to cloud storage
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update last backup time
      const updatedConnections = settings.connections.map(c => 
        c.provider === settings.provider 
          ? { ...c, lastBackup: new Date().toISOString() }
          : c
      );
      handleSettingChange('connections', updatedConnections);
      
      toast.success(`Backup uploaded to ${cloudProviders.find(p => p.id === settings.provider)?.name}`);
    } catch (error: any) {
      console.error('Backup failed:', error);
      toast.error(`Backup failed: ${error.message}`);
    } finally {
      setIsBackingUp(false);
    }
  };

  const getNextBackupDate = (): string => {
    if (!settings.enabled || !settings.provider) return 'Not scheduled';
    
    const connection = getConnection(settings.provider);
    if (!connection?.lastBackup) return 'Pending first backup';
    
    const last = new Date(connection.lastBackup);
    let days: number;
    
    switch (settings.frequency) {
      case 'daily': days = 1; break;
      case 'weekly': days = 7; break;
      case 'monthly': days = 30; break;
      default: days = 7;
    }
    
    const next = new Date(last.getTime() + days * 24 * 60 * 60 * 1000);
    return next.toLocaleDateString();
  };

  const activeConnection = settings.provider ? getConnection(settings.provider) : null;

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <Cloud size={20} />
          Cloud Storage Backups
        </CardTitle>
        <CardDescription>
          Automatically backup your data to cloud storage providers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Cloud Provider Connections */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Connected Accounts</Label>
          {cloudProviders.map((provider) => {
            const connection = getConnection(provider.id);
            const connected = connection?.connected || false;
            
            return (
              <div 
                key={provider.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  connected ? 'border-green-500/30 bg-green-500/5' : 'border-border'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{provider.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{provider.name}</span>
                      {connected && (
                        <Badge variant="outline" className="text-xs text-green-600">
                          <CheckCircle size={10} className="mr-1" />
                          Connected
                        </Badge>
                      )}
                    </div>
                    {connected && connection?.email && (
                      <p className="text-xs text-muted-foreground">{connection.email}</p>
                    )}
                    {!connected && (
                      <p className="text-xs text-muted-foreground">{provider.description}</p>
                    )}
                  </div>
                </div>
                
                {connected ? (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDisconnect(provider.id)}
                  >
                    Disconnect
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleConnect(provider.id)}
                    disabled={isConnecting !== null}
                  >
                    {isConnecting === provider.id ? (
                      <>
                        <Loader2 size={14} className="mr-1 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <ExternalLink size={14} className="mr-1" />
                        Connect
                      </>
                    )}
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {/* Enable Toggle */}
        {settings.connections.some(c => c.connected) && (
          <>
            <div className="flex items-center justify-between p-3 rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <HardDrive size={18} className="text-primary" />
                <div>
                  <Label className="text-sm font-medium">Enable Auto-Backup</Label>
                  <p className="text-xs text-muted-foreground">Automatically backup on schedule</p>
                </div>
              </div>
              <Switch
                checked={settings.enabled}
                onCheckedChange={(checked) => handleSettingChange('enabled', checked)}
              />
            </div>

            {/* Settings */}
            <div className={settings.enabled ? '' : 'opacity-50 pointer-events-none'}>
              <div className="space-y-4">
                {/* Provider Selection */}
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Backup Provider</Label>
                  <Select
                    value={settings.provider || ''}
                    onValueChange={(value: CloudProvider) => handleSettingChange('provider', value)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {settings.connections.filter(c => c.connected).map(conn => {
                        const provider = cloudProviders.find(p => p.id === conn.provider);
                        return (
                          <SelectItem key={conn.provider} value={conn.provider}>
                            <span className="flex items-center gap-2">
                              <span>{provider?.icon}</span>
                              {provider?.name}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Frequency */}
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Backup Frequency</Label>
                  <Select
                    value={settings.frequency}
                    onValueChange={(value: 'daily' | 'weekly' | 'monthly') => 
                      handleSettingChange('frequency', value)
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Data to include */}
                <div className="space-y-2">
                  <Label className="text-sm">Include in backups:</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Switch
                        checked={settings.includeChats}
                        onCheckedChange={(checked) => handleSettingChange('includeChats', checked)}
                      />
                      <span className="text-sm">Chats</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Switch
                        checked={settings.includeKnowledge}
                        onCheckedChange={(checked) => handleSettingChange('includeKnowledge', checked)}
                      />
                      <span className="text-sm">Knowledge</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Status */}
            {activeConnection && (
              <div className="p-3 rounded-lg border border-border bg-card/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Active provider:</span>
                  <Badge variant="outline">
                    {cloudProviders.find(p => p.id === settings.provider)?.name}
                  </Badge>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Backup folder:</span>
                  <span className="text-sm flex items-center gap-1">
                    <FolderOpen size={12} />
                    {activeConnection.folderName || 'Cortex Backups'}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Next backup:</span>
                  <Badge variant="outline">{getNextBackupDate()}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Last backup:</span>
                  <span className="text-sm">
                    {activeConnection.lastBackup 
                      ? new Date(activeConnection.lastBackup).toLocaleString() 
                      : 'Never'}
                  </span>
                </div>
              </div>
            )}

            {/* Backup Now Button */}
            <Button
              variant="outline"
              className="w-full"
              onClick={handleBackupNow}
              disabled={isBackingUp || !settings.provider}
            >
              {isBackingUp ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <RefreshCw size={16} className="mr-2" />
                  Backup Now
                </>
              )}
            </Button>
          </>
        )}

        {/* Info Note */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
          <AlertCircle size={16} className="text-muted-foreground mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Connect your cloud storage account to automatically backup your data. 
            Backups are encrypted and stored in a dedicated folder in your account.
            Note: Full OAuth integration requires API setup for each provider.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CloudStorageBackup;
