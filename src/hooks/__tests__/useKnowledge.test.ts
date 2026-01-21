/**
 * Unit tests for useKnowledge hook
 * Tests knowledge item management, tags, and ordering
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useKnowledge, type KnowledgeItem } from '../useKnowledge';
import { KnowledgeService } from '@/services/knowledge.service';

// Mock dependencies
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'test-user-id' },
  })),
}));

vi.mock('@/components/feedback/ConfirmationProvider', () => ({
  useConfirmationDialog: vi.fn(() => ({
    confirm: vi.fn(({ onConfirm }) => onConfirm()),
  })),
}));

vi.mock('@/components/feedback/EnhancedToast', () => ({
  enhancedToast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock('@/services/knowledge.service', () => ({
  KnowledgeService: {
    loadKnowledge: vi.fn(),
    addKnowledgeItem: vi.fn(),
    updateKnowledgeItem: vi.fn(),
    softDeleteKnowledgeItem: vi.fn(),
    restoreKnowledgeItem: vi.fn(),
    bulkSoftDelete: vi.fn(),
    bulkRestore: vi.fn(),
    updateOrder: vi.fn(),
    updateBulkTags: vi.fn(),
  },
}));

const mockItems: KnowledgeItem[] = [
  {
    id: 'item-1',
    title: 'Test Item 1',
    content: 'Content 1',
    type: 'note',
    source_url: null,
    tags: ['tag1', 'tag2'],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    order_index: 0,
  },
  {
    id: 'item-2',
    title: 'Test Item 2',
    content: 'Content 2',
    type: 'document',
    source_url: 'https://example.com',
    tags: ['tag3'],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    order_index: 1,
  },
];

describe('useKnowledge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(KnowledgeService.loadKnowledge).mockResolvedValue(mockItems);
  });

  describe('Initialization', () => {
    it('should load knowledge items on mount', async () => {
      const { result } = renderHook(() => useKnowledge());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(KnowledgeService.loadKnowledge).toHaveBeenCalledWith('test-user-id');
      expect(result.current.items).toHaveLength(2);
    });

    it('should sort items by order_index', async () => {
      const unorderedItems: KnowledgeItem[] = [
        { ...mockItems[1], order_index: 0 },
        { ...mockItems[0], order_index: 1 },
      ];
      vi.mocked(KnowledgeService.loadKnowledge).mockResolvedValue(unorderedItems);

      const { result } = renderHook(() => useKnowledge());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.items[0].id).toBe('item-2');
      expect(result.current.items[1].id).toBe('item-1');
    });

    it('should handle empty knowledge list', async () => {
      vi.mocked(KnowledgeService.loadKnowledge).mockResolvedValue([]);

      const { result } = renderHook(() => useKnowledge());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.items).toHaveLength(0);
    });
  });

  describe('addKnowledgeItem', () => {
    it('should add a new knowledge item', async () => {
      vi.mocked(KnowledgeService.addKnowledgeItem).mockResolvedValue(undefined);

      const { result } = renderHook(() => useKnowledge());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const newItem = {
        title: 'New Item',
        content: 'New content',
        type: 'note' as const,
        source_url: null,
        tags: ['new-tag'],
      };

      await act(async () => {
        await result.current.addKnowledgeItem(newItem);
      });

      expect(KnowledgeService.addKnowledgeItem).toHaveBeenCalledWith('test-user-id', newItem);
    });

    it('should not add item without user', async () => {
      const { useAuth } = await import('@/contexts/AuthContext');
      vi.mocked(useAuth).mockReturnValue({ user: null } as ReturnType<typeof useAuth>);

      const { result } = renderHook(() => useKnowledge());

      await act(async () => {
        await result.current.addKnowledgeItem({
          title: 'Test',
          content: null,
          type: null,
          source_url: null,
          tags: null,
        });
      });

      expect(KnowledgeService.addKnowledgeItem).not.toHaveBeenCalled();

      vi.mocked(useAuth).mockReturnValue({ user: { id: 'test-user-id' } } as ReturnType<typeof useAuth>);
    });
  });

  describe('updateKnowledgeItem', () => {
    it('should update an existing knowledge item', async () => {
      vi.mocked(KnowledgeService.updateKnowledgeItem).mockResolvedValue(undefined);

      const { result } = renderHook(() => useKnowledge());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateKnowledgeItem('item-1', { title: 'Updated Title' });
      });

      expect(KnowledgeService.updateKnowledgeItem).toHaveBeenCalledWith(
        'item-1',
        'test-user-id',
        { title: 'Updated Title' }
      );
    });

    it('should handle update errors', async () => {
      vi.mocked(KnowledgeService.updateKnowledgeItem).mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() => useKnowledge());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateKnowledgeItem('item-1', { title: 'Updated Title' });
      });

      // Should not throw, error is handled internally
      expect(KnowledgeService.updateKnowledgeItem).toHaveBeenCalled();
    });
  });

  describe('deleteKnowledgeItem', () => {
    it('should delete a knowledge item after confirmation', async () => {
      vi.mocked(KnowledgeService.softDeleteKnowledgeItem).mockResolvedValue(undefined);

      const { result } = renderHook(() => useKnowledge());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.deleteKnowledgeItem('item-1');
      });

      expect(KnowledgeService.softDeleteKnowledgeItem).toHaveBeenCalledWith('item-1', 'test-user-id');
    });
  });

  describe('Bulk Operations', () => {
    it('should soft delete multiple items', async () => {
      vi.mocked(KnowledgeService.bulkSoftDelete).mockResolvedValue(undefined);

      const { result } = renderHook(() => useKnowledge());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let deletedItems: KnowledgeItem[] = [];
      await act(async () => {
        deletedItems = await result.current.softDeleteBulkKnowledgeItems(['item-1', 'item-2']);
      });

      expect(KnowledgeService.bulkSoftDelete).toHaveBeenCalledWith(['item-1', 'item-2'], 'test-user-id');
      expect(deletedItems).toHaveLength(2);
    });

    it('should restore multiple items', async () => {
      vi.mocked(KnowledgeService.bulkRestore).mockResolvedValue(undefined);

      const { result } = renderHook(() => useKnowledge());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.restoreBulkKnowledgeItems(['item-1', 'item-2']);
      });

      expect(KnowledgeService.bulkRestore).toHaveBeenCalledWith(['item-1', 'item-2'], 'test-user-id');
    });
  });

  describe('updateKnowledgeOrder', () => {
    it('should update item order', async () => {
      vi.mocked(KnowledgeService.updateOrder).mockResolvedValue(undefined);

      const { result } = renderHook(() => useKnowledge());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateKnowledgeOrder([
          { id: 'item-2', order_index: 0 },
          { id: 'item-1', order_index: 1 },
        ]);
      });

      expect(KnowledgeService.updateOrder).toHaveBeenCalledWith(
        [
          { id: 'item-2', order_index: 0 },
          { id: 'item-1', order_index: 1 },
        ],
        'test-user-id'
      );
    });
  });

  describe('Tag Operations', () => {
    it('should update tags for multiple items', async () => {
      vi.mocked(KnowledgeService.updateBulkTags).mockResolvedValue(undefined);

      const { result } = renderHook(() => useKnowledge());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const updateResult = await act(async () => {
        return await result.current.updateBulkTags(
          ['item-1', 'item-2'],
          ['new-tag'],
          ['tag1']
        );
      });

      expect(KnowledgeService.updateBulkTags).toHaveBeenCalledWith(
        ['item-1', 'item-2'],
        'test-user-id',
        ['new-tag'],
        ['tag1']
      );
      expect(updateResult.success).toBe(true);
      expect(updateResult.previousState).toHaveLength(2);
    });

    it('should reject invalid tags', async () => {
      const { result } = renderHook(() => useKnowledge());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const updateResult = await act(async () => {
        return await result.current.updateBulkTags(
          ['item-1'],
          ['<script>alert("xss")</script>'], // Invalid tag
          []
        );
      });

      expect(updateResult.success).toBe(false);
      expect(KnowledgeService.updateBulkTags).not.toHaveBeenCalled();
    });

    it('should restore previous tag state', async () => {
      vi.mocked(KnowledgeService.updateKnowledgeItem).mockResolvedValue(undefined);

      const { result } = renderHook(() => useKnowledge());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const previousState = [
        { id: 'item-1', tags: ['original-tag'] },
        { id: 'item-2', tags: ['other-tag'] },
      ];

      const restoreResult = await act(async () => {
        return await result.current.restoreBulkTags(previousState);
      });

      expect(restoreResult).toBe(true);
      expect(KnowledgeService.updateKnowledgeItem).toHaveBeenCalledTimes(2);
    });
  });

  describe('refreshKnowledge', () => {
    it('should refresh knowledge items', async () => {
      const { result } = renderHook(() => useKnowledge());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      vi.clearAllMocks();

      await act(async () => {
        await result.current.refreshKnowledge();
      });

      expect(KnowledgeService.loadKnowledge).toHaveBeenCalledWith('test-user-id');
    });
  });

  describe('No User', () => {
    it('should clear items when user is null', async () => {
      const { useAuth } = await import('@/contexts/AuthContext');
      vi.mocked(useAuth).mockReturnValue({ user: null } as ReturnType<typeof useAuth>);

      const { result } = renderHook(() => useKnowledge());

      expect(result.current.items).toHaveLength(0);
      expect(KnowledgeService.loadKnowledge).not.toHaveBeenCalled();

      vi.mocked(useAuth).mockReturnValue({ user: { id: 'test-user-id' } } as ReturnType<typeof useAuth>);
    });
  });
});
