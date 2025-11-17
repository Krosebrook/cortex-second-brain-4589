import React from 'react';
import { ActionWithMetadata } from '@/hooks/useUndoHistory';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatDistanceToNow, format } from 'date-fns';

interface ActionDetailViewProps {
  action: ActionWithMetadata | null;
}

export const ActionDetailView: React.FC<ActionDetailViewProps> = ({ action }) => {
  if (!action) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p className="text-sm">Select an action to view details</p>
      </div>
    );
  }

  const timestamp = action.metadata?.timestamp || Date.now();

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 p-4">
        <div>
          <h3 className="font-semibold text-lg mb-2">{action.description}</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{format(timestamp, 'PPpp')}</span>
            <span>•</span>
            <span>{formatDistanceToNow(timestamp, { addSuffix: true })}</span>
          </div>
        </div>

        <Separator />

        {/* Action Type */}
        <div>
          <h4 className="text-sm font-medium mb-2">Action Type</h4>
          <Badge variant="outline">{action.type}</Badge>
        </div>

        {/* Affected Items */}
        {action.metadata?.affectedItemIds && action.metadata.affectedItemIds.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="text-sm font-medium mb-2">
                Affected Items ({action.metadata.affectedItemIds.length})
              </h4>
              <div className="space-y-1">
                {action.metadata.affectedItemTitles?.slice(0, 10).map((title, i) => (
                  <div
                    key={i}
                    className="text-sm py-1.5 px-2 rounded bg-muted/50 truncate"
                  >
                    {title}
                  </div>
                ))}
                {action.metadata.affectedItemTitles && 
                 action.metadata.affectedItemTitles.length > 10 && (
                  <p className="text-xs text-muted-foreground pt-1">
                    And {action.metadata.affectedItemTitles.length - 10} more...
                  </p>
                )}
              </div>
            </div>
          </>
        )}

        {/* Before/After Counts */}
        {(action.metadata?.beforeCount !== undefined || 
          action.metadata?.afterCount !== undefined) && (
          <>
            <Separator />
            <div>
              <h4 className="text-sm font-medium mb-2">Changes</h4>
              <div className="grid grid-cols-2 gap-3">
                {action.metadata.beforeCount !== undefined && (
                  <div className="p-3 rounded-md bg-muted/50">
                    <p className="text-xs text-muted-foreground">Before</p>
                    <p className="text-lg font-semibold">
                      {action.metadata.beforeCount}
                    </p>
                  </div>
                )}
                {action.metadata.afterCount !== undefined && (
                  <div className="p-3 rounded-md bg-muted/50">
                    <p className="text-xs text-muted-foreground">After</p>
                    <p className="text-lg font-semibold">
                      {action.metadata.afterCount}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* User Info */}
        {action.metadata?.userName && (
          <>
            <Separator />
            <div>
              <h4 className="text-sm font-medium mb-2">Performed By</h4>
              <p className="text-sm">{action.metadata.userName}</p>
            </div>
          </>
        )}

        {/* Conflicts */}
        {action.metadata?.hasConflicts && (
          <>
            <Separator />
            <div>
              <Badge variant="destructive">Has Conflicts</Badge>
              <p className="text-sm text-muted-foreground mt-2">
                This action encountered conflicts during execution
              </p>
            </div>
          </>
        )}

        {/* Group Info */}
        {action.metadata?.groupId && (
          <>
            <Separator />
            <div>
              <h4 className="text-sm font-medium mb-2">Grouped Action</h4>
              <p className="text-sm text-muted-foreground">
                This action is part of a batch operation
              </p>
              <code className="text-xs bg-muted px-2 py-1 rounded mt-2 inline-block">
                {action.metadata.groupId}
              </code>
            </div>
          </>
        )}
      </div>
    </ScrollArea>
  );
};
