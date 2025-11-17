import React from 'react';
import { Conflict, ConflictResolution } from '@/types/conflict';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, SkipForward, Check, GitMerge } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ConflictDialogProps {
  conflict: Conflict | null;
  open: boolean;
  onResolve: (resolution: ConflictResolution) => void;
}

export const ConflictDialog: React.FC<ConflictDialogProps> = ({
  conflict,
  open,
  onResolve,
}) => {
  if (!conflict) return null;

  const getMessage = () => {
    switch (conflict.type) {
      case 'delete':
        return 'This item no longer exists and cannot be restored.';
      case 'update':
        return 'This item was modified since your last action.';
      case 'tag':
        return 'The tags for this item have changed.';
      case 'reorder':
        return 'The order of items has changed.';
      default:
        return 'A conflict was detected.';
    }
  };

  const canMerge = conflict.type === 'update' && conflict.actual;

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <AlertDialogTitle>Conflict Detected</AlertDialogTitle>
          </div>
          <AlertDialogDescription>{getMessage()}</AlertDialogDescription>
        </AlertDialogHeader>

        {conflict.type === 'update' && conflict.actual && (
          <div className="py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Your Version</h4>
                <ScrollArea className="h-32 rounded-md border p-3 bg-muted/50">
                  <pre className="text-xs">
                    {JSON.stringify(conflict.expected, null, 2)}
                  </pre>
                </ScrollArea>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Current Version</h4>
                <ScrollArea className="h-32 rounded-md border p-3 bg-muted/50">
                  <pre className="text-xs">
                    {JSON.stringify(conflict.actual, null, 2)}
                  </pre>
                </ScrollArea>
              </div>
            </div>
          </div>
        )}

        {conflict.itemTitle && (
          <p className="text-sm text-muted-foreground">
            Item: <span className="font-medium">{conflict.itemTitle}</span>
          </p>
        )}

        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onResolve('skip')}
            className="w-full sm:w-auto"
          >
            <SkipForward className="h-4 w-4 mr-2" />
            Skip This Action
          </Button>
          
          {conflict.type !== 'delete' && (
            <Button
              variant="secondary"
              onClick={() => onResolve('apply')}
              className="w-full sm:w-auto"
            >
              <Check className="h-4 w-4 mr-2" />
              Apply Anyway
            </Button>
          )}
          
          {canMerge && (
            <Button
              onClick={() => onResolve('merge')}
              className="w-full sm:w-auto"
            >
              <GitMerge className="h-4 w-4 mr-2" />
              Resolve Manually
            </Button>
          )}
          
          <Button
            variant="ghost"
            onClick={() => onResolve('cancel')}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
