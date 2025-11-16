import { useState, useCallback } from 'react';

interface UseDragAndDropOptions<T> {
  items: T[];
  onReorder: (items: T[]) => void;
  getId: (item: T) => string;
  disabled?: boolean;
}

export const useDragAndDrop = <T>({
  items,
  onReorder,
  getId,
  disabled = false,
}: UseDragAndDropOptions<T>) => {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const handleDragStart = useCallback(
    (e: React.DragEvent, item: T) => {
      if (disabled) return;

      const id = getId(item);
      setDraggedId(id);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', id);
    },
    [disabled, getId]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, item: T) => {
      if (disabled) return;

      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      
      const id = getId(item);
      if (id !== draggedId) {
        setDragOverId(id);
      }
    },
    [disabled, draggedId, getId]
  );

  const handleDragLeave = useCallback(() => {
    if (disabled) return;
    setDragOverId(null);
  }, [disabled]);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetItem: T) => {
      if (disabled) return;

      e.preventDefault();
      e.stopPropagation();

      const targetId = getId(targetItem);
      
      if (!draggedId || draggedId === targetId) {
        setDraggedId(null);
        setDragOverId(null);
        return;
      }

      const draggedIndex = items.findIndex((item) => getId(item) === draggedId);
      const targetIndex = items.findIndex((item) => getId(item) === targetId);

      if (draggedIndex === -1 || targetIndex === -1) {
        setDraggedId(null);
        setDragOverId(null);
        return;
      }

      // Reorder items
      const newItems = [...items];
      const [draggedItem] = newItems.splice(draggedIndex, 1);
      newItems.splice(targetIndex, 0, draggedItem);

      onReorder(newItems);
      setDraggedId(null);
      setDragOverId(null);
    },
    [disabled, draggedId, items, getId, onReorder]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
    setDragOverId(null);
  }, []);

  return {
    draggedId,
    dragOverId,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
  };
};
