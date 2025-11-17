import { useState, useCallback, useRef } from 'react';
import { Action } from '@/types/action-history';
import { toast } from '@/hooks/use-toast';

const MAX_HISTORY = 50;
const BATCH_WINDOW_MS = 2000; // Group actions within 2 seconds

export function useUndoRedo() {
  const [undoStack, setUndoStack] = useState<Action[]>([]);
  const [redoStack, setRedoStack] = useState<Action[]>([]);
  const lastActionTimeRef = useRef<number>(0);

  const addAction = useCallback((action: Action) => {
    const now = Date.now();
    const timeSinceLastAction = now - lastActionTimeRef.current;

    setUndoStack(prev => {
      // If action is within batch window and same type, potentially merge
      const lastAction = prev[prev.length - 1];
      const shouldBatch = timeSinceLastAction < BATCH_WINDOW_MS && 
                         lastAction?.type === action.type &&
                         action.type === 'reorder';

      if (shouldBatch && lastAction) {
        // Replace last action with new one (for drag-and-drop batching)
        return [...prev.slice(0, -1), action].slice(-MAX_HISTORY);
      }

      return [...prev, action].slice(-MAX_HISTORY);
    });
    
    setRedoStack([]); // Clear redo stack on new action
    lastActionTimeRef.current = now;
  }, []);

  const undo = useCallback(async () => {
    const action = undoStack[undoStack.length - 1];
    if (!action) return;

    try {
      await action.undo();
      setUndoStack(prev => prev.slice(0, -1));
      setRedoStack(prev => [...prev, action]);
      
      toast({
        title: 'Undone',
        description: action.description,
      });
    } catch (error) {
      toast({
        title: 'Undo failed',
        description: 'Could not undo the action',
        variant: 'destructive',
      });
    }
  }, [undoStack]);

  const redo = useCallback(async () => {
    const action = redoStack[redoStack.length - 1];
    if (!action) return;

    try {
      await action.redo();
      setRedoStack(prev => prev.slice(0, -1));
      setUndoStack(prev => [...prev, action]);
      
      toast({
        title: 'Redone',
        description: action.description,
      });
    } catch (error) {
      toast({
        title: 'Redo failed',
        description: 'Could not redo the action',
        variant: 'destructive',
      });
    }
  }, [redoStack]);

  const clear = useCallback(() => {
    setUndoStack([]);
    setRedoStack([]);
  }, []);

  return {
    addAction,
    undo,
    redo,
    clear,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    undoDescription: undoStack[undoStack.length - 1]?.description,
    redoDescription: redoStack[redoStack.length - 1]?.description,
    undoStack,
    redoStack,
  };
}
