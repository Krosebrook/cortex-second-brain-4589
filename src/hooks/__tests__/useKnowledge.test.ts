import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKnowledge, KnowledgeItem } from '../useKnowledge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('@/contexts/AuthContext');
vi.mock('@/integrations/supabase/client');
vi.mock('sonner');

describe('useKnowledge', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' };

  const mockKnowledgeItems: KnowledgeItem[] = [
    {
      id: 'kb-1',
      title: 'Test Note',
      content: 'Test content',
      type: 'note',
      tags: ['test'],
      source_url: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'kb-2',
      title: 'Test Document',
      content: 'Document content',
      type: 'document',
      tags: ['doc', 'test'],
      source_url: 'https://example.com',
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.mocked(useAuth).mockReturnValue({ user: mockUser } as any);
    
    // Mock Supabase client
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
    } as any);
  });

  describe('Initial Load', () => {
    it('should initialize with empty items and loading state', () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockImplementation(() => new Promise(() => {})),
      } as any);

      const { result } = renderHook(() => useKnowledge());

      expect(result.current.items).toEqual([]);
      expect(result.current.loading).toBe(true);
    });

    it('should load knowledge items when user is authenticated', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockKnowledgeItems, error: null }),
      } as any);

      const { result } = renderHook(() => useKnowledge());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.items).toHaveLength(2);
      expect(result.current.items[0].title).toBe('Test Note');
    });

    it('should not load items when user is not authenticated', async () => {
      vi.mocked(useAuth).mockReturnValue({ user: null } as any);

      const { result } = renderHook(() => useKnowledge());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.items).toEqual([]);
    });

    it('should handle errors when loading knowledge', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: new Error('Load failed') }),
      } as any);

      const { result } = renderHook(() => useKnowledge());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(toast.error).toHaveBeenCalledWith('Failed to load knowledge base');
    });
  });

  describe('Add Knowledge Item', () => {
    it('should add a new knowledge item', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn()
          .mockResolvedValueOnce({ data: mockKnowledgeItems, error: null })
          .mockResolvedValueOnce({
            data: [...mockKnowledgeItems, { id: 'kb-3', title: 'New Item' }],
            error: null,
          }),
        insert: vi.fn().mockResolvedValue({ error: null }),
      } as any);

      const { result } = renderHook(() => useKnowledge());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const newItem = {
        title: 'New Item',
        content: 'New content',
        type: 'note' as const,
        tags: ['new'],
      };

      await act(async () => {
        await result.current.addKnowledgeItem(newItem);
      });

      expect(toast.success).toHaveBeenCalledWith('Knowledge item added successfully');
    });

    it('should handle errors when adding item', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockKnowledgeItems, error: null }),
        insert: vi.fn().mockResolvedValue({ error: new Error('Insert failed') }),
      } as any);

      const { result } = renderHook(() => useKnowledge());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const newItem = {
        title: 'New Item',
        content: 'New content',
        type: 'note' as const,
        tags: ['new'],
      };

      await act(async () => {
        await result.current.addKnowledgeItem(newItem);
      });

      expect(toast.error).toHaveBeenCalledWith('Failed to add knowledge item');
    });

    it('should not add item when user is not authenticated', async () => {
      vi.mocked(useAuth).mockReturnValue({ user: null } as any);

      const { result } = renderHook(() => useKnowledge());

      const newItem = {
        title: 'New Item',
        content: 'New content',
        type: 'note' as const,
      };

      await act(async () => {
        await result.current.addKnowledgeItem(newItem);
      });

      expect(supabase.from).not.toHaveBeenCalled();
    });
  });

  describe('Update Knowledge Item', () => {
    it('should update a knowledge item', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockKnowledgeItems, error: null }),
        update: vi.fn().mockReturnThis(),
      } as any);

      const mockUpdate = vi.fn().mockResolvedValue({ error: null });
      vi.mocked(supabase.from('knowledge_base').update({}).eq).mockImplementation(mockUpdate as any);

      const { result } = renderHook(() => useKnowledge());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateKnowledgeItem('kb-1', { title: 'Updated Title' });
      });

      expect(toast.success).toHaveBeenCalledWith('Knowledge item updated successfully');
    });

    it('should handle errors when updating item', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockKnowledgeItems, error: null }),
        update: vi.fn().mockReturnThis(),
      } as any);

      const mockUpdate = vi.fn().mockResolvedValue({ error: new Error('Update failed') });
      vi.mocked(supabase.from('knowledge_base').update({}).eq).mockImplementation(mockUpdate as any);

      const { result } = renderHook(() => useKnowledge());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateKnowledgeItem('kb-1', { title: 'Updated Title' });
      });

      expect(toast.error).toHaveBeenCalledWith('Failed to update knowledge item');
    });
  });

  describe('Delete Knowledge Item', () => {
    it('should delete a knowledge item', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockKnowledgeItems, error: null }),
        delete: vi.fn().mockReturnThis(),
      } as any);

      const mockDelete = vi.fn().mockResolvedValue({ error: null });
      vi.mocked(supabase.from('knowledge_base').delete().eq).mockImplementation(mockDelete as any);

      const { result } = renderHook(() => useKnowledge());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.deleteKnowledgeItem('kb-1');
      });

      expect(toast.success).toHaveBeenCalledWith('Knowledge item deleted successfully');
    });

    it('should handle errors when deleting item', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockKnowledgeItems, error: null }),
        delete: vi.fn().mockReturnThis(),
      } as any);

      const mockDelete = vi.fn().mockResolvedValue({ error: new Error('Delete failed') });
      vi.mocked(supabase.from('knowledge_base').delete().eq).mockImplementation(mockDelete as any);

      const { result } = renderHook(() => useKnowledge());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.deleteKnowledgeItem('kb-1');
      });

      expect(toast.error).toHaveBeenCalledWith('Failed to delete knowledge item');
    });
  });

  describe('Refresh Knowledge', () => {
    it('should refresh knowledge items', async () => {
      let callCount = 0;
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockImplementation(() => {
          callCount++;
          return Promise.resolve({ data: mockKnowledgeItems, error: null });
        }),
      } as any);

      const { result } = renderHook(() => useKnowledge());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(callCount).toBe(1);

      await act(async () => {
        await result.current.refreshKnowledge();
      });

      expect(callCount).toBe(2);
    });
  });
});
