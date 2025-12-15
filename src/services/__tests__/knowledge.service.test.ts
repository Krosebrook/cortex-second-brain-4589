import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KnowledgeService } from '../knowledge.service';
import { supabase } from '@/integrations/supabase/client';
import { offlineStorage } from '@/lib/offline-storage';
import { KnowledgeItem } from '@/hooks/useKnowledge';

// Mock dependencies
vi.mock('@/integrations/supabase/client');
vi.mock('@/lib/offline-storage');

describe('KnowledgeService', () => {
  const mockUserId = 'user-123';
  const mockKnowledgeItem: KnowledgeItem = {
    id: 'kb-1',
    title: 'Test Knowledge',
    content: 'Test content',
    tags: ['test', 'sample'],
    type: 'note',
    source_url: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadKnowledge', () => {
    it('should load knowledge items from Supabase and cache them', async () => {
      const mockData = [mockKnowledgeItem];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      } as any);

      vi.mocked(offlineStorage.storeKnowledge).mockResolvedValue(undefined);

      const result = await KnowledgeService.loadKnowledge(mockUserId);

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Test Knowledge');
      expect(offlineStorage.storeKnowledge).toHaveBeenCalledWith(mockData);
    });

    it('should fallback to offline storage on error', async () => {
      const mockOfflineData = [mockKnowledgeItem];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: new Error('Network error') }),
      } as any);

      vi.mocked(offlineStorage.getKnowledge).mockResolvedValue(mockOfflineData);

      const result = await KnowledgeService.loadKnowledge(mockUserId);

      expect(result).toEqual(mockOfflineData);
      expect(offlineStorage.getKnowledge).toHaveBeenCalled();
    });

    it('should return empty array if offline storage is also empty', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: new Error('Network error') }),
      } as any);

      vi.mocked(offlineStorage.getKnowledge).mockResolvedValue([]);

      const result = await KnowledgeService.loadKnowledge(mockUserId);

      expect(result).toEqual([]);
    });
  });

  describe('addKnowledgeItem', () => {
    it('should add a new knowledge item', async () => {
      const newItem = {
        title: 'New Knowledge',
        content: 'New content',
        tags: ['new'],
        type: 'document' as const,
        source_url: 'https://example.com',
      };

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { ...newItem, id: 'kb-new', user_id: mockUserId, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          error: null,
        }),
      } as any);

      const result = await KnowledgeService.addKnowledgeItem(mockUserId, newItem);

      expect(result.title).toBe('New Knowledge');
      expect(result.id).toBe('kb-new');
    });

    it('should throw error on insert failure', async () => {
      const newItem = {
        title: 'New Knowledge',
        content: 'New content',
        tags: ['new'],
        type: 'note' as const,
        source_url: null,
      };

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: new Error('Insert failed') }),
      } as any);

      await expect(KnowledgeService.addKnowledgeItem(mockUserId, newItem)).rejects.toThrow();
    });
  });

  describe('updateKnowledgeItem', () => {
    it('should update a knowledge item', async () => {
      const updates = {
        title: 'Updated Title',
        content: 'Updated content',
      };

      const updatedItem = { ...mockKnowledgeItem, ...updates };

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: updatedItem, error: null }),
      } as any);

      const result = await KnowledgeService.updateKnowledgeItem('kb-1', mockUserId, updates);

      expect(result.title).toBe('Updated Title');
      expect(result.content).toBe('Updated content');
    });

    it('should handle partial updates', async () => {
      const updates = { title: 'New Title Only' };

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { ...mockKnowledgeItem, ...updates },
          error: null,
        }),
      } as any);

      const result = await KnowledgeService.updateKnowledgeItem('kb-1', mockUserId, updates);

      expect(result.title).toBe('New Title Only');
      expect(result.content).toBe(mockKnowledgeItem.content);
    });
  });

  describe('deleteKnowledgeItem', () => {
    it('should delete a knowledge item', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      } as any);

      // Mock the chained eq calls
      const mockEq = vi.fn().mockReturnThis();
      mockEq.mockResolvedValueOnce({ error: null });
      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnValue({ eq: mockEq }),
      } as any);

      await KnowledgeService.deleteKnowledgeItem('kb-1', mockUserId);

      expect(supabase.from).toHaveBeenCalledWith('knowledge_base');
    });

    it('should throw error on delete failure', async () => {
      const mockEq = vi.fn().mockReturnThis();
      mockEq.mockResolvedValueOnce({ error: new Error('Delete failed') });
      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnValue({ eq: mockEq }),
      } as any);

      await expect(KnowledgeService.deleteKnowledgeItem('kb-1', mockUserId)).rejects.toThrow();
    });
  });
});
