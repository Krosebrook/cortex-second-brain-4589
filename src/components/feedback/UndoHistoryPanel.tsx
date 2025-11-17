import React, { useState } from 'react';
import { useUndoHistory, ActionWithMetadata } from '@/hooks/useUndoHistory';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ActionTimeline } from './ActionTimeline';
import { ActionDetailView } from './ActionDetailView';
import { Separator } from '@/components/ui/separator';
import { History } from 'lucide-react';

interface UndoHistoryPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UndoHistoryPanel: React.FC<UndoHistoryPanelProps> = ({
  open,
  onOpenChange,
}) => {
  const { getHistory, jumpToAction, isJumping } = useUndoHistory();
  const [selectedAction, setSelectedAction] = useState<ActionWithMetadata | null>(null);
  
  const history = getHistory();
  const allActions = [...history.past].reverse(); // Most recent first

  const handleJumpToAction = async (actionId: string) => {
    await jumpToAction(actionId);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0">
        <div className="flex flex-col h-full">
          <SheetHeader className="p-6 pb-4">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5" />
              <SheetTitle>Action History</SheetTitle>
            </div>
            <SheetDescription>
              View and jump to any point in your action history
            </SheetDescription>
          </SheetHeader>

          <Separator />

          <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2">
            {/* Timeline */}
            <div className="border-r">
              <ScrollArea className="h-full">
                <div className="p-6">
                  <ActionTimeline
                    actions={allActions}
                    currentIndex={history.currentIndex}
                    onJumpToAction={handleJumpToAction}
                    onViewDetails={setSelectedAction}
                  />
                </div>
              </ScrollArea>
            </div>

            {/* Details */}
            <div className="hidden md:block">
              <ActionDetailView action={selectedAction} />
            </div>
          </div>

          {isJumping && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Jumping through history...</p>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
