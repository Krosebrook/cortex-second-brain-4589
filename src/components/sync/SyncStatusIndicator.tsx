import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  RefreshCw, 
  Cloud, 
  CloudOff, 
  CheckCircle, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBackgroundSync } from '@/hooks/useBackgroundSync';
import { toast } from 'sonner';

export const SyncStatusIndicator: React.FC = () => {
  const { 
    isSyncing, 
    isOnline, 
    stats, 
    lastSyncMessage,
    forceSync,
    hasPendingOperations 
  } = useBackgroundSync();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isForcingSyncLocal, setIsForcingSyncLocal] = useState(false);

  const handleForceSync = async () => {
    if (!isOnline) {
      toast.error('Cannot sync while offline');
      return;
    }

    setIsForcingSyncLocal(true);
    try {
      await forceSync();
      toast.success('Sync completed successfully');
    } catch (error) {
      toast.error('Sync failed: ' + String(error));
    } finally {
      setIsForcingSyncLocal(false);
    }
  };

  const getStatusIcon = () => {
    if (!isOnline) {
      return <CloudOff size={18} className="text-muted-foreground" />;
    }
    if (isSyncing || isForcingSyncLocal) {
      return <Loader2 size={18} className="text-primary animate-spin" />;
    }
    if (hasPendingOperations) {
      return <Cloud size={18} className="text-amber-500" />;
    }
    return <CheckCircle size={18} className="text-green-500" />;
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (isSyncing || isForcingSyncLocal) return 'Syncing...';
    if (hasPendingOperations) return `${stats.pending} pending`;
    return 'Synced';
  };

  const getStatusColor = () => {
    if (!isOnline) return 'bg-muted';
    if (isSyncing) return 'bg-primary/10';
    if (hasPendingOperations) return 'bg-amber-500/10';
    return 'bg-green-500/10';
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "relative flex items-center gap-1.5 px-2 py-1.5 h-auto rounded-lg",
            "hover:bg-primary/10 transition-colors",
            hasPendingOperations && !isSyncing && "animate-pulse"
          )}
          aria-label={`Sync status: ${getStatusText()}`}
        >
          {getStatusIcon()}
          {hasPendingOperations && !isSyncing && (
            <Badge 
              variant="secondary" 
              className="h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-amber-500 text-white absolute -top-1 -right-1"
            >
              {stats.pending}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="end">
        <div className="p-4 space-y-4">
          {/* Status Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className="font-medium text-sm">{getStatusText()}</span>
            </div>
            <Badge 
              variant="outline" 
              className={cn("text-xs", getStatusColor())}
            >
              {isOnline ? 'Online' : 'Offline'}
            </Badge>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-lg bg-muted/50">
              <p className="text-lg font-semibold text-foreground">{stats.pending}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/50">
              <p className="text-lg font-semibold text-green-500">{stats.completed}</p>
              <p className="text-xs text-muted-foreground">Synced</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/50">
              <p className="text-lg font-semibold text-destructive">{stats.failed}</p>
              <p className="text-xs text-muted-foreground">Failed</p>
            </div>
          </div>

          {/* Last Sync Message */}
          {lastSyncMessage && (
            <p className="text-xs text-muted-foreground text-center">
              {lastSyncMessage}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleForceSync}
              disabled={!isOnline || isSyncing || isForcingSyncLocal || !hasPendingOperations}
            >
              {(isSyncing || isForcingSyncLocal) ? (
                <Loader2 size={14} className="mr-2 animate-spin" />
              ) : (
                <RefreshCw size={14} className="mr-2" />
              )}
              Sync Now
            </Button>
          </div>

          {/* Offline Warning */}
          {!isOnline && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 text-amber-600">
              <AlertCircle size={14} />
              <p className="text-xs">Changes will sync when you're back online</p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SyncStatusIndicator;
