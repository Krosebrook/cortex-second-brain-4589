import React from 'react';
import { Button } from '@/components/ui/button';
import { Undo2 } from 'lucide-react';

interface UndoToastProps {
  description: string;
  onUndo: () => void;
}

export const UndoToast: React.FC<UndoToastProps> = ({ description, onUndo }) => {
  return (
    <div className="flex items-center justify-between gap-4">
      <span>{description}</span>
      <Button
        size="sm"
        variant="outline"
        onClick={onUndo}
        className="shrink-0"
      >
        <Undo2 className="w-3 h-3 mr-1" />
        Undo
      </Button>
    </div>
  );
};
