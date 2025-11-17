export type ActionType = 'delete' | 'tag_add' | 'tag_remove' | 'reorder' | 'update';

export interface ActionData {
  itemIds: string[];
  beforeState: any;
  afterState: any;
}

export interface Action {
  id: string;
  type: ActionType;
  timestamp: number;
  description: string;
  data: ActionData;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
}

export interface UndoRedoState {
  undoStack: Action[];
  redoStack: Action[];
}
