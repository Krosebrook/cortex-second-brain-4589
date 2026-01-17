import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings, Save, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface RateLimitConfig {
  id: string;
  config_key: string;
  max_attempts: number;
  time_window_minutes: number;
  block_duration_minutes: number;
  enabled: boolean;
}

export function RateLimitSettings() {
  const queryClient = useQueryClient();
  const [localConfig, setLocalConfig] = useState<Partial<RateLimitConfig>>({});
  
  const { data: config, isLoading } = useQuery({
    queryKey: ['rate-limit-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rate_limit_config')
        .select('*')
        .eq('config_key', 'failed_login')
        .single();
      
      if (error) throw error;
      return data as RateLimitConfig;
    },
  });
  
  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<RateLimitConfig>) => {
      if (!config?.id) throw new Error('No config found');
      
      const { error } = await supabase
        .from('rate_limit_config')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', config.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rate-limit-config'] });
      setLocalConfig({});
      toast.success('Rate limit settings updated');
    },
    onError: (error) => {
      console.error('Failed to update rate limit config:', error);
      toast.error('Failed to update settings');
    },
  });
  
  const handleSave = () => {
    if (Object.keys(localConfig).length > 0) {
      updateMutation.mutate(localConfig);
    }
  };
  
  const handleReset = () => {
    setLocalConfig({});
  };
  
  const getValue = <K extends keyof RateLimitConfig>(key: K): RateLimitConfig[K] => {
    return (localConfig[key] ?? config?.[key]) as RateLimitConfig[K];
  };
  
  const hasChanges = Object.keys(localConfig).length > 0;
  
  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-10 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Rate Limiting Settings
        </CardTitle>
        <CardDescription>
          Configure automatic IP blocking thresholds for failed login attempts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="enabled">Enable Rate Limiting</Label>
            <p className="text-sm text-muted-foreground">
              Automatically block IPs after too many failed attempts
            </p>
          </div>
          <Switch
            id="enabled"
            checked={getValue('enabled') ?? true}
            onCheckedChange={(checked) => setLocalConfig(prev => ({ ...prev, enabled: checked }))}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="max_attempts">Max Failed Attempts</Label>
            <Input
              id="max_attempts"
              type="number"
              min={1}
              max={100}
              value={getValue('max_attempts') ?? 5}
              onChange={(e) => setLocalConfig(prev => ({ 
                ...prev, 
                max_attempts: parseInt(e.target.value) || 5 
              }))}
            />
            <p className="text-xs text-muted-foreground">
              Block after this many failures
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="time_window">Time Window (minutes)</Label>
            <Input
              id="time_window"
              type="number"
              min={1}
              max={1440}
              value={getValue('time_window_minutes') ?? 15}
              onChange={(e) => setLocalConfig(prev => ({ 
                ...prev, 
                time_window_minutes: parseInt(e.target.value) || 15 
              }))}
            />
            <p className="text-xs text-muted-foreground">
              Count attempts within this window
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="block_duration">Block Duration (minutes)</Label>
            <Input
              id="block_duration"
              type="number"
              min={1}
              max={10080}
              value={getValue('block_duration_minutes') ?? 60}
              onChange={(e) => setLocalConfig(prev => ({ 
                ...prev, 
                block_duration_minutes: parseInt(e.target.value) || 60 
              }))}
            />
            <p className="text-xs text-muted-foreground">
              How long to block the IP
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 pt-4 border-t">
          <Button 
            onClick={handleSave} 
            disabled={!hasChanges || updateMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
          {hasChanges && (
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
