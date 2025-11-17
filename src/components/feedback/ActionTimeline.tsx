import React from 'react';
import { ActionWithMetadata } from '@/hooks/useUndoHistory';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Trash2, 
  Tag, 
  ArrowUpDown, 
  Edit, 
  Plus,
  Eye,
  Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ActionTimelineProps {
  actions: ActionWithMetadata[];
  currentIndex: number;
  onJumpToAction: (actionId: string) => void;
  onViewDetails: (action: ActionWithMetadata) => void;
}

const getActionIcon = (type: string) => {
  switch (type) {
    case 'bulk-delete':
      return Trash2;
    case 'delete':
      return Trash2;
    case 'add-tags':
      return Tag;
    case 'remove-tags':
      return Tag;
    case 'reorder':
      return ArrowUpDown;
    case 'edit':
      return Edit;
    case 'create':
      return Plus;
    default:
      return Edit;
  }
};

export const ActionTimeline: React.FC<ActionTimelineProps> = ({
  actions,
  currentIndex,
  onJumpToAction,
  onViewDetails,
}) => {
  return (
    <div className="space-y-2">
      {/* Current state indicator */}
      <div className="flex items-center gap-2 py-2 px-3 bg-primary/10 rounded-md">
        <Clock className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Current State</span>
        <Badge variant="outline" className="ml-auto">
          {actions.length} actions in history
        </Badge>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[13px] top-0 bottom-0 w-0.5 bg-border" />

        {/* Actions */}
        <div className="space-y-3">
          {actions.map((action, index) => {
            const Icon = getActionIcon(action.type);
            const isCurrent = index === currentIndex - 1;
            const canJumpHere = index < currentIndex - 1;
            const timestamp = action.metadata?.timestamp || Date.now();

            return (
              <div
                key={action.id}
                className={cn(
                  'relative pl-10 group',
                  isCurrent && 'bg-accent/50 -ml-3 pl-13 pr-3 py-2 rounded-md'
                )}
              >
                {/* Timeline dot */}
                <div
                  className={cn(
                    'absolute left-0 w-7 h-7 rounded-full border-2 flex items-center justify-center z-10',
                    isCurrent
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'bg-background border-border text-muted-foreground'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>

                {/* Action card */}
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {action.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(timestamp, { addSuffix: true })}
                      </p>
                    </div>
                    
                    {action.metadata?.affectedItemIds && (
                      <Badge variant="secondary" className="shrink-0">
                        {action.metadata.affectedItemIds.length} items
                      </Badge>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {canJumpHere && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onJumpToAction(action.id)}
                        className="h-7 text-xs"
                      >
                        Jump Here
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onViewDetails(action)}
                      className="h-7 text-xs"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Details
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {actions.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">No actions in history</p>
        </div>
      )}
    </div>
  );
};
