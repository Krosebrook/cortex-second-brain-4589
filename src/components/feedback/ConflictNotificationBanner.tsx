import React from 'react';
import { AlertTriangle, X, ChevronRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Conflict } from '@/types/conflict';
import { cn } from '@/lib/utils';

interface ConflictNotificationBannerProps {
  conflicts: Conflict[];
  onReviewClick: () => void;
  onDismiss: () => void;
  className?: string;
}

export const ConflictNotificationBanner: React.FC<ConflictNotificationBannerProps> = ({
  conflicts,
  onReviewClick,
  onDismiss,
  className
}) => {
  if (conflicts.length === 0) return null;

  const latestConflict = conflicts[conflicts.length - 1];
  const conflictCount = conflicts.length;

  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-50 max-w-sm animate-in fade-in slide-in-from-top-2 duration-300",
        className
      )}
    >
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg shadow-lg backdrop-blur-sm">
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <AlertTriangle size={16} className="text-yellow-500" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-sm text-foreground">
                  Sync Conflict{conflictCount > 1 ? 's' : ''} Detected
                </h4>
                {conflictCount > 1 && (
                  <Badge variant="secondary" className="text-xs">
                    {conflictCount}
                  </Badge>
                )}
              </div>
              
              <p className="text-xs text-muted-foreground mt-1">
                {conflictCount === 1 ? (
                  <>"{latestConflict.itemTitle || 'An item'}" was modified externally</>
                ) : (
                  <>{conflictCount} items were modified externally</>
                )}
              </p>

              <div className="flex items-center gap-2 mt-3">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={onReviewClick}
                  className="h-7 text-xs"
                >
                  <RefreshCw size={12} className="mr-1" />
                  Review
                  <ChevronRight size={12} className="ml-1" />
                </Button>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 flex-shrink-0"
              onClick={onDismiss}
            >
              <X size={14} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConflictNotificationBanner;
