/**
 * SyncProgressIndicator Component
 * Real-time sync progress display with progress bar and status updates
 */

import { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, XCircle, Package, ShoppingCart, Users, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';

interface SyncProgress {
  id: string;
  store_id: string;
  sync_type: string;
  status: string;
  items_synced: number | null;
  items_failed: number | null;
  started_at: string;
  completed_at: string | null;
  metadata: {
    current_phase?: string;
    phase_progress?: number;
    total_phases?: number;
    current_item?: number;
    total_items?: number;
    results?: Record<string, { synced: number; failed: number }>;
  } | null;
}

interface SyncProgressIndicatorProps {
  storeId: string;
  className?: string;
  onComplete?: () => void;
}

const phaseIcons: Record<string, React.ReactNode> = {
  products: <Package className="h-4 w-4" />,
  orders: <ShoppingCart className="h-4 w-4" />,
  customers: <Users className="h-4 w-4" />,
  inventory: <Archive className="h-4 w-4" />,
};

const phaseLabels: Record<string, string> = {
  products: 'Products',
  orders: 'Orders',
  customers: 'Customers',
  inventory: 'Inventory',
};

export function SyncProgressIndicator({ storeId, className, onComplete }: SyncProgressIndicatorProps) {
  const [progress, setProgress] = useState<SyncProgress | null>(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    // Fetch current in-progress sync
    const fetchCurrentSync = async () => {
      const { data } = await supabase
        .from('store_sync_logs')
        .select('*')
        .eq('store_id', storeId)
        .eq('status', 'in_progress')
        .order('started_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setProgress(data as SyncProgress);
        setIsActive(true);
      }
    };

    fetchCurrentSync();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`sync-progress-${storeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'store_sync_logs',
          filter: `store_id=eq.${storeId}`,
        },
        (payload) => {
          console.log('[SyncProgress] Received update:', payload);
          const newData = payload.new as SyncProgress;
          
          if (payload.eventType === 'INSERT' && newData.status === 'in_progress') {
            setProgress(newData);
            setIsActive(true);
          } else if (payload.eventType === 'UPDATE') {
            setProgress(newData);
            
            if (newData.status !== 'in_progress') {
              setIsActive(false);
              onComplete?.();
              // Keep showing completion status for a moment
              setTimeout(() => {
                setProgress(null);
              }, 5000);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeId, onComplete]);

  if (!progress) {
    return null;
  }

  const metadata = progress.metadata || {};
  const syncTypes = progress.sync_type.split(',');
  const currentPhase = metadata.current_phase || syncTypes[0];
  const phaseIndex = syncTypes.indexOf(currentPhase);
  const totalPhases = syncTypes.length;
  
  // Calculate overall progress
  const phaseProgress = metadata.phase_progress ?? 0;
  const overallProgress = totalPhases > 0 
    ? ((phaseIndex / totalPhases) * 100) + (phaseProgress / totalPhases)
    : 0;

  const isCompleted = progress.status !== 'in_progress';
  const hasErrors = progress.status === 'completed_with_errors' || (progress.items_failed || 0) > 0;

  return (
    <Card className={cn('border-primary/20 bg-primary/5', className)}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isCompleted ? (
                hasErrors ? (
                  <XCircle className="h-5 w-5 text-amber-500" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                )
              ) : (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              )}
              <span className="font-medium text-foreground">
                {isCompleted 
                  ? hasErrors 
                    ? 'Sync completed with errors'
                    : 'Sync completed'
                  : 'Syncing store data...'
                }
              </span>
            </div>
            <span className="text-sm text-muted-foreground">
              {Math.round(isCompleted ? 100 : overallProgress)}%
            </span>
          </div>

          {/* Progress Bar */}
          <Progress value={isCompleted ? 100 : overallProgress} className="h-2" />

          {/* Phase Indicators */}
          <div className="flex items-center gap-4">
            {syncTypes.map((type, index) => {
              const isPast = index < phaseIndex;
              const isCurrent = index === phaseIndex && !isCompleted;
              const phaseResult = metadata.results?.[type];
              
              return (
                <div
                  key={type}
                  className={cn(
                    'flex items-center gap-1.5 text-xs transition-colors',
                    isPast || isCompleted ? 'text-green-500' : isCurrent ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {isCurrent ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : isPast || isCompleted ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    phaseIcons[type]
                  )}
                  <span>{phaseLabels[type]}</span>
                  {phaseResult && (
                    <span className="text-muted-foreground">
                      ({phaseResult.synced}{phaseResult.failed > 0 && `/${phaseResult.failed} failed`})
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Current Item Progress */}
          {isActive && metadata.current_item !== undefined && metadata.total_items !== undefined && (
            <div className="text-xs text-muted-foreground">
              Processing item {metadata.current_item} of {metadata.total_items}
            </div>
          )}

          {/* Summary */}
          {isCompleted && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1 border-t border-border/50">
              <span className="text-green-500">
                {progress.items_synced || 0} synced
              </span>
              {(progress.items_failed || 0) > 0 && (
                <span className="text-amber-500">
                  {progress.items_failed} failed
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default SyncProgressIndicator;
