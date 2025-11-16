import React from 'react';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { useOffline } from '@/contexts/OfflineContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const SyncStatus: React.FC = () => {
  const { isOnline, hasPendingSync, isSyncing, pendingCount, syncPendingOperations } = useOffline();

  if (!hasPendingSync && isOnline) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <div className="bg-card border rounded-lg shadow-lg p-4 space-y-3 min-w-[280px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Cloud className="h-4 w-4 text-primary" />
            ) : (
              <CloudOff className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm font-medium">
              {isSyncing ? 'Syncing...' : isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          {hasPendingSync && (
            <Badge variant="secondary">{pendingCount} pending</Badge>
          )}
        </div>

        {hasPendingSync && isOnline && !isSyncing && (
          <Button
            onClick={syncPendingOperations}
            size="sm"
            className="w-full gap-2"
            variant="outline"
          >
            <RefreshCw className="h-4 w-4" />
            Sync Now
          </Button>
        )}

        {isSyncing && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Syncing changes...</span>
          </div>
        )}
      </div>
    </div>
  );
};
