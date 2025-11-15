import { useOffline } from '@/contexts/OfflineContext';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Button } from '@/components/ui/button';
import { WifiOff, RefreshCw, Cloud } from 'lucide-react';
import { cn } from '@/lib/utils';

export const OfflineBanner = () => {
  const { isOffline, hasPendingSync, syncPendingOperations, isSyncing, pendingCount } = useOffline();
  const { isOnline } = useNetworkStatus();

  if (!isOffline && !hasPendingSync) return null;

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-50 px-4 py-3 text-sm transition-all duration-300',
        isOffline ? 'bg-muted/95 text-muted-foreground border-b border-border' : 'bg-primary/90 text-primary-foreground'
      )}
    >
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {isOffline ? (
            <>
              <WifiOff className="h-4 w-4" />
              <span>You're offline. Changes will sync when connection is restored.</span>
            </>
          ) : (
            <>
              <Cloud className="h-4 w-4" />
              <span>
                {isSyncing
                  ? 'Syncing your changes...'
                  : `${pendingCount} ${pendingCount === 1 ? 'change' : 'changes'} pending sync`}
              </span>
            </>
          )}
        </div>

        {isOnline && hasPendingSync && !isSyncing && (
          <Button
            size="sm"
            variant="outline"
            onClick={syncPendingOperations}
            className="shrink-0"
          >
            <RefreshCw className="h-3 w-3 mr-2" />
            Sync Now
          </Button>
        )}
      </div>
    </div>
  );
};
