import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, X, Download, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BulkActionBarProps {
  selectedCount: number;
  onDelete: () => void;
  onExport?: () => void;
  onManageTags?: () => void;
  onCancel: () => void;
  className?: string;
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedCount,
  onDelete,
  onExport,
  onManageTags,
  onCancel,
  className
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className={cn(
      "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
      "bg-background border rounded-lg shadow-lg p-4",
      "flex flex-col gap-3 min-w-[350px]",
      "animate-in slide-in-from-bottom-4",
      className
    )}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">
            {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
          </p>
          <p className="text-xs text-muted-foreground">
            Press <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Esc</kbd> to cancel
          </p>
        </div>
        
        <div className="flex gap-2">
          {onManageTags && (
            <Button
              variant="outline"
              size="sm"
              onClick={onManageTags}
            >
              <Tag size={16} className="mr-1" />
              Tags
            </Button>
          )}
          {onExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
            >
              <Download size={16} className="mr-1" />
              Export
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
          >
            <X size={16} className="mr-1" />
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
          >
            <Trash2 size={16} className="mr-1" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};
