import { useState, useCallback } from 'react';
import { useUndoRedo } from './useUndoRedo';
import { toast } from './use-toast';
import { Action } from '@/types/action-history';

export interface ActionWithMetadata extends Action {
  metadata?: {
    userId?: string;
    userName?: string;
    affectedItemIds: string[];
    affectedItemTitles: string[];
    beforeCount?: number;
    afterCount?: number;
    hasConflicts?: boolean;
    groupId?: string;
    timestamp?: number;
  };
}

export const useUndoHistory = () => {
  const undoRedo = useUndoRedo();
  const [currentIndex, setCurrentIndex] = useState(undoRedo.undoStack.length);
  const [isJumping, setIsJumping] = useState(false);

  const jumpToAction = useCallback(async (actionId: string) => {
    const targetIndex = undoRedo.undoStack.findIndex(a => a.id === actionId);
    
    if (targetIndex === -1) {
      toast({
        title: 'Action not found',
        description: 'This action is no longer in history',
        variant: 'destructive',
      });
      return;
    }

    const actionsToUndo = currentIndex - targetIndex - 1;
    
    if (actionsToUndo === 0) {
      toast({
        title: 'Already at this point',
        description: 'You are already at this state',
      });
      return;
    }

    setIsJumping(true);

    try {
      if (actionsToUndo > 0) {
        // Need to undo
        for (let i = 0; i < actionsToUndo; i++) {
          await undoRedo.undo();
        }
        toast({
          title: `Undid ${actionsToUndo} action${actionsToUndo > 1 ? 's' : ''}`,
          description: 'Jumped to selected point in history',
        });
      } else {
        // Need to redo
        const actionsToRedo = Math.abs(actionsToUndo);
        for (let i = 0; i < actionsToRedo; i++) {
          await undoRedo.redo();
        }
        toast({
          title: `Redid ${actionsToRedo} action${actionsToRedo > 1 ? 's' : ''}`,
          description: 'Jumped to selected point in history',
        });
      }
      
      setCurrentIndex(targetIndex + 1);
    } catch (error) {
      console.error('Error jumping to action:', error);
      toast({
        title: 'Jump failed',
        description: 'Could not jump to this point in history',
        variant: 'destructive',
      });
    } finally {
      setIsJumping(false);
    }
  }, [undoRedo, currentIndex]);

  const getHistory = useCallback(() => {
    return {
      past: undoRedo.undoStack as ActionWithMetadata[],
      future: undoRedo.redoStack as ActionWithMetadata[],
      currentIndex,
      total: undoRedo.undoStack.length + undoRedo.redoStack.length,
    };
  }, [undoRedo.undoStack, undoRedo.redoStack, currentIndex]);

  return {
    ...undoRedo,
    jumpToAction,
    getHistory,
    currentIndex,
    isJumping,
  };
};
