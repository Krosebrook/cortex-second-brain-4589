export type ConflictType = 'delete' | 'update' | 'tag' | 'reorder';

export type ConflictResolution = 'skip' | 'apply' | 'merge' | 'cancel';

export interface Conflict {
  type: ConflictType;
  actionId: string;
  itemId: string;
  itemTitle?: string;
  expected: any;
  actual: any;
  timestamp: number;
}

export class ConflictError extends Error {
  conflict: Conflict;

  constructor(conflict: Conflict) {
    super(`Conflict detected: ${conflict.type} on item ${conflict.itemId}`);
    this.name = 'ConflictError';
    this.conflict = conflict;
  }
}
