import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useRealtimeConflicts } from '@/hooks/useRealtimeConflicts';
import { cn } from '@/lib/utils';

export const ConflictIndicator: React.FC = () => {
  const { conflicts, hasConflicts, conflictCount, clearConflicts } = useRealtimeConflicts({
    showNotifications: false // We handle our own UI here
  });

  if (!hasConflicts) {
    return null;
  }

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "relative rounded-lg",
                "hover:bg-destructive/10 hover:text-destructive",
                "animate-pulse"
              )}
              aria-label={`${conflictCount} sync conflicts detected`}
            >
              <AlertTriangle size={20} className="text-destructive" />
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 text-xs"
              >
                {conflictCount > 9 ? '9+' : conflictCount}
              </Badge>
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>{conflictCount} sync conflict{conflictCount !== 1 ? 's' : ''} detected</p>
        </TooltipContent>
      </Tooltip>

      <PopoverContent className="w-80" align="end">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <AlertTriangle size={16} className="text-destructive" />
              Sync Conflicts
            </h4>
            <Badge variant="destructive" className="text-xs">
              {conflictCount} pending
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground">
            Some of your local changes conflict with server data. Review and resolve them to ensure your data is up to date.
          </p>

          <div className="space-y-2 max-h-40 overflow-y-auto">
            {conflicts.slice(0, 5).map((conflict) => (
              <div 
                key={conflict.itemId} 
                className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-xs"
              >
                <div className="flex items-center gap-2 truncate flex-1">
                  <span className={cn(
                    "w-2 h-2 rounded-full",
                    conflict.type === 'delete' ? 'bg-destructive' : 'bg-warning'
                  )} />
                  <span className="truncate">
                    {conflict.itemTitle || conflict.itemId.slice(0, 12) + '...'}
                  </span>
                </div>
                <Badge variant="outline" className="text-[10px] capitalize">
                  {conflict.type}
                </Badge>
              </div>
            ))}
            {conflictCount > 5 && (
              <p className="text-xs text-center text-muted-foreground">
                +{conflictCount - 5} more conflicts
              </p>
            )}
          </div>

          <div className="flex gap-2 pt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={clearConflicts}
            >
              Dismiss All
            </Button>
            <Button
              asChild
              size="sm"
              className="flex-1 text-xs"
            >
              <Link to="/settings?tab=storage">
                Resolve Conflicts
              </Link>
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ConflictIndicator;
