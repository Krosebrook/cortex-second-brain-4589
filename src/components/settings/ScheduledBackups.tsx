import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Calendar, 
  Clock, 
  HardDrive,
  AlertCircle,
  Trash2,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface BackupSettings {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  includeChats: boolean;
  includeKnowledge: boolean;
  maxBackups: number;
}

interface StoredBackup {
  id: string;
  date: string;
  size: number;
  items: {
    chats: number;
    messages: number;
    knowledge: number;
  };
}

const DEFAULT_SETTINGS: BackupSettings = {
  enabled: false,
  frequency: 'weekly',
  includeChats: true,
  includeKnowledge: true,
  maxBackups: 3
};

const BACKUP_STORAGE_KEY = 'cortex-auto-backups';
const SETTINGS_KEY = 'cortex-backup-settings';
const LAST_BACKUP_KEY = 'cortex-last-backup';

export const ScheduledBackups: React.FC = () => {
  const [settings, setSettings] = useLocalStorage<BackupSettings>(SETTINGS_KEY, DEFAULT_SETTINGS);
  const [backups, setBackups] = useState<StoredBackup[]>([]);
  const [lastBackup, setLastBackup] = useLocalStorage<string | null>(LAST_BACKUP_KEY, null);
  const [storageUsage, setStorageUsage] = useState<number>(0);

  // Load existing backups from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(BACKUP_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as StoredBackup[];
        setBackups(parsed);
        
        // Calculate total storage
        const totalSize = parsed.reduce((acc, b) => acc + b.size, 0);
        setStorageUsage(totalSize);
      }
    } catch (error) {
      console.error('Failed to load backups:', error);
    }
  }, []);

  // Check if backup is due
  useEffect(() => {
    if (!settings.enabled) return;

    const checkBackupDue = () => {
      if (!lastBackup) return true;

      const last = new Date(lastBackup);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

      switch (settings.frequency) {
        case 'daily': return diffDays >= 1;
        case 'weekly': return diffDays >= 7;
        case 'monthly': return diffDays >= 30;
        default: return false;
      }
    };

    if (checkBackupDue()) {
      // Schedule backup for when user is idle
      const timeoutId = setTimeout(() => {
        runAutoBackup();
      }, 5000); // 5 second delay

      return () => clearTimeout(timeoutId);
    }
  }, [settings.enabled, settings.frequency, lastBackup]);

  const runAutoBackup = async () => {
    try {
      // Get data from localStorage/cache (simplified - in production would fetch from DB)
      const backupData = {
        exportDate: new Date().toISOString(),
        chats: settings.includeChats ? [] : undefined,
        knowledge: settings.includeKnowledge ? [] : undefined
      };

      const backupString = JSON.stringify(backupData);
      const backupSize = new Blob([backupString]).size;

      const newBackup: StoredBackup = {
        id: `backup-${Date.now()}`,
        date: new Date().toISOString(),
        size: backupSize,
        items: {
          chats: 0,
          messages: 0,
          knowledge: 0
        }
      };

      // Add to backups list, maintaining max limit
      const updatedBackups = [newBackup, ...backups].slice(0, settings.maxBackups);
      setBackups(updatedBackups);

      // Store in localStorage
      localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(updatedBackups));
      localStorage.setItem(`${BACKUP_STORAGE_KEY}-${newBackup.id}`, backupString);
      
      setLastBackup(new Date().toISOString());
      
      // Update storage usage
      const totalSize = updatedBackups.reduce((acc, b) => acc + b.size, 0);
      setStorageUsage(totalSize);

      toast.success('Auto-backup completed');
    } catch (error) {
      console.error('Auto-backup failed:', error);
      toast.error('Auto-backup failed');
    }
  };

  const handleSettingChange = (key: keyof BackupSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    toast.success('Backup settings updated');
  };

  const handleDeleteBackup = (backupId: string) => {
    const updatedBackups = backups.filter(b => b.id !== backupId);
    setBackups(updatedBackups);
    localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(updatedBackups));
    localStorage.removeItem(`${BACKUP_STORAGE_KEY}-${backupId}`);
    
    const totalSize = updatedBackups.reduce((acc, b) => acc + b.size, 0);
    setStorageUsage(totalSize);
    
    toast.success('Backup deleted');
  };

  const handleDownloadBackup = (backupId: string) => {
    const backupData = localStorage.getItem(`${BACKUP_STORAGE_KEY}-${backupId}`);
    if (!backupData) {
      toast.error('Backup not found');
      return;
    }

    const blob = new Blob([backupData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cortex-backup-${backupId}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Backup downloaded');
  };

  const handleClearAllBackups = () => {
    backups.forEach(b => {
      localStorage.removeItem(`${BACKUP_STORAGE_KEY}-${b.id}`);
    });
    localStorage.removeItem(BACKUP_STORAGE_KEY);
    setBackups([]);
    setStorageUsage(0);
    toast.success('All backups cleared');
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getNextBackupDate = (): string => {
    if (!settings.enabled || !lastBackup) return 'Not scheduled';
    
    const last = new Date(lastBackup);
    let next: Date;
    
    switch (settings.frequency) {
      case 'daily':
        next = new Date(last.getTime() + 24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        next = new Date(last.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        next = new Date(last.getTime() + 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        return 'Not scheduled';
    }
    
    return next.toLocaleDateString();
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <Calendar size={20} />
          Scheduled Backups
        </CardTitle>
        <CardDescription>
          Automatically backup your data to browser storage
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable Toggle */}
        <div className="flex items-center justify-between p-3 rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <Clock size={18} className="text-primary" />
            <div>
              <Label className="text-sm font-medium">Enable Auto-Backup</Label>
              <p className="text-xs text-muted-foreground">Automatically backup your data</p>
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
            {/* Frequency */}
            <div className="flex items-center justify-between">
              <Label className="text-sm">Backup Frequency</Label>
              <Select
                value={settings.frequency}
                onValueChange={(value) => handleSettingChange('frequency', value)}
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

            {/* Max backups */}
            <div className="flex items-center justify-between">
              <Label className="text-sm">Keep last backups</Label>
              <Select
                value={String(settings.maxBackups)}
                onValueChange={(value) => handleSettingChange('maxBackups', parseInt(value))}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="p-3 rounded-lg border border-border bg-card/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Next backup:</span>
            <Badge variant="outline">{getNextBackupDate()}</Badge>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Last backup:</span>
            <span className="text-sm">{lastBackup ? new Date(lastBackup).toLocaleString() : 'Never'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Storage used:</span>
            <span className="text-sm">{formatBytes(storageUsage)}</span>
          </div>
        </div>

        {/* Backup List */}
        {backups.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Stored Backups</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAllBackups}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 size={14} className="mr-1" />
                Clear All
              </Button>
            </div>
            
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {backups.map((backup) => (
                <div 
                  key={backup.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/50"
                >
                  <div className="flex items-center gap-2">
                    <HardDrive size={16} className="text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {new Date(backup.date).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatBytes(backup.size)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownloadBackup(backup.id)}
                    >
                      <Download size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteBackup(backup.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Run Now Button */}
        <Button
          variant="outline"
          className="w-full"
          onClick={runAutoBackup}
          disabled={!settings.enabled}
        >
          <Calendar size={16} className="mr-2" />
          Backup Now
        </Button>

        {/* Info Note */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
          <AlertCircle size={16} className="text-muted-foreground mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Backups are stored in your browser's local storage. 
            Clear your browser data will remove all backups. 
            For permanent backups, use the Export feature.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScheduledBackups;
