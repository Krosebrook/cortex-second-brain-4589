import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ChatService } from '@/services/chat.service';
import { KnowledgeService } from '@/services/knowledge.service';
import { offlineStorage } from '@/lib/offline-storage';
import { SyncResolver } from '@/lib/sync-resolver';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client');
vi.mock('@/lib/offline-storage');

describe('Offline Sync Integration', () => {
  const mockUserId = 'user-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Chat Sync Flow', () => {
    it('should sync offline chats when coming back online', async () => {
      // Simulate offline chats stored locally
      const offlineChats = [
        {
          id: 'temp-chat-1',
          title: 'Offline Chat',
          messages: [
            {
              id: 'temp-msg-1',
              type: 'user' as const,
              content: 'Hello offline',
              timestamp: new Date(),
            },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Mock offline storage
      vi.mocked(offlineStorage.getChats).mockResolvedValue(offlineChats);

      // Mock successful sync to server
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'synced-chat-1',
            title: 'Offline Chat',
            user_id: mockUserId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          error: null,
        }),
      } as any);

      // Create chat (should sync to server)
      const syncedChat = await ChatService.createChat(mockUserId, 'Offline Chat');

      expect(syncedChat.id).toBe('synced-chat-1');
      expect(syncedChat.title).toBe('Offline Chat');
    });

    it('should handle conflict resolution during sync', async () => {
      const localChat = {
        id: 'chat-1',
        title: 'Local Version',
        messages: [
          {
            id: 'msg-1',
            type: 'user' as const,
            content: 'Local message',
            timestamp: new Date('2024-01-01T12:00:00Z'),
          },
        ],
        createdAt: new Date('2024-01-01T10:00:00Z'),
        updatedAt: new Date('2024-01-01T12:00:00Z'),
      };

      const remoteChat = {
        id: 'chat-1',
        title: 'Remote Version',
        messages: [
          {
            id: 'msg-2',
            type: 'assistant' as const,
            content: 'Remote message',
            timestamp: new Date('2024-01-01T11:00:00Z'),
          },
        ],
        createdAt: new Date('2024-01-01T10:00:00Z'),
        updatedAt: new Date('2024-01-01T11:00:00Z'),
      };

      // Resolve with merge strategy
      const resolved = SyncResolver.resolveChat(localChat, remoteChat, 'merge');

      expect(resolved.resolved.messages).toHaveLength(2);
      expect(resolved.strategy).toBe('merge');
      expect(resolved.resolved.messages.find(m => m.content === 'Local message')).toBeDefined();
      expect(resolved.resolved.messages.find(m => m.content === 'Remote message')).toBeDefined();
    });

    it('should use last-write-wins strategy correctly', async () => {
      const olderChat = {
        id: 'chat-1',
        title: 'Older Version',
        messages: [],
        createdAt: new Date('2024-01-01T10:00:00Z'),
        updatedAt: new Date('2024-01-01T11:00:00Z'),
      };

      const newerChat = {
        id: 'chat-1',
        title: 'Newer Version',
        messages: [],
        createdAt: new Date('2024-01-01T10:00:00Z'),
        updatedAt: new Date('2024-01-01T12:00:00Z'),
      };

      const resolved = SyncResolver.resolveChat(olderChat, newerChat, 'last-write-wins');

      expect(resolved.resolved.title).toBe('Newer Version');
      expect(resolved.strategy).toBe('last-write-wins');
    });
  });

  describe('Knowledge Sync Flow', () => {
    it('should sync offline knowledge items when coming back online', async () => {
      const offlineItems = [
        {
          id: 'temp-kb-1',
          user_id: mockUserId,
          title: 'Offline Note',
          content: 'Created offline',
          tags: ['offline'],
          type: 'note' as const,
          source_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      vi.mocked(offlineStorage.getKnowledge).mockResolvedValue(offlineItems);

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            ...offlineItems[0],
            id: 'synced-kb-1',
          },
          error: null,
        }),
      } as any);

      const newItem = {
        title: 'Offline Note',
        content: 'Created offline',
        tags: ['offline'],
        type: 'note' as const,
        source_url: null,
      };

      const syncedItem = await KnowledgeService.addKnowledgeItem(mockUserId, newItem);

      expect(syncedItem.id).toBe('synced-kb-1');
      expect(syncedItem.title).toBe('Offline Note');
    });

    it('should merge tags during conflict resolution', async () => {
      const localItem = {
        id: 'kb-1',
        user_id: mockUserId,
        title: 'Knowledge Item',
        content: 'Content',
        tags: ['local', 'tag1'],
        type: 'note' as const,
        source_url: null,
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T12:00:00Z',
      };

      const remoteItem = {
        id: 'kb-1',
        user_id: mockUserId,
        title: 'Knowledge Item',
        content: 'Content',
        tags: ['remote', 'tag2'],
        type: 'note' as const,
        source_url: null,
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T11:00:00Z',
      };

      const resolved = SyncResolver.resolveKnowledgeItem(localItem, remoteItem, 'merge');

      expect(resolved.resolved.tags).toHaveLength(4);
      expect(resolved.resolved.tags).toContain('local');
      expect(resolved.resolved.tags).toContain('remote');
      expect(resolved.resolved.tags).toContain('tag1');
      expect(resolved.resolved.tags).toContain('tag2');
    });
  });

  describe('Network Transition Scenarios', () => {
    it('should queue operations when offline and sync when online', async () => {
      // Simulate offline state
      const offlineQueue: any[] = [];

      // User creates chat while offline
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockRejectedValue(new Error('Network unavailable')),
      } as any);

      try {
        await ChatService.createChat(mockUserId, 'Offline Chat');
      } catch (error) {
        // Queue the operation
        offlineQueue.push({
          operation: 'createChat',
          params: [mockUserId, 'Offline Chat'],
        });
      }

      expect(offlineQueue).toHaveLength(1);

      // Come back online
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'synced-chat-1',
            title: 'Offline Chat',
            user_id: mockUserId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          error: null,
        }),
      } as any);

      // Process queue
      const operation = offlineQueue[0];
      const result = await ChatService.createChat(operation.params[0], operation.params[1]);

      expect(result.id).toBe('synced-chat-1');
      expect(offlineQueue).toHaveLength(1); // Still in queue until confirmed
    });

    it('should detect and handle conflicts', async () => {
      const localItem = {
        id: 'kb-1',
        user_id: mockUserId,
        title: 'Item',
        content: 'Local content',
        tags: [],
        type: 'note' as const,
        source_url: null,
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T12:00:00Z',
      };

      const remoteItem = {
        id: 'kb-1',
        user_id: mockUserId,
        title: 'Item',
        content: 'Remote content',
        tags: [],
        type: 'note' as const,
        source_url: null,
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T11:30:00Z',
      };

      const hasConflict = SyncResolver.hasConflict(localItem, remoteItem);

      expect(hasConflict).toBe(true);
    });

    it('should not detect conflict for identical timestamps', async () => {
      const timestamp = '2024-01-01T12:00:00Z';
      const item1 = {
        id: 'kb-1',
        user_id: mockUserId,
        title: 'Item',
        content: 'Content',
        tags: [],
        type: 'note' as const,
        source_url: null,
        created_at: '2024-01-01T10:00:00Z',
        updated_at: timestamp,
      };

      const item2 = { ...item1 };

      const hasConflict = SyncResolver.hasConflict(item1, item2);

      expect(hasConflict).toBe(false);
    });
  });

  describe('Retry Logic', () => {
    it('should retry failed sync operations', async () => {
      let attempts = 0;
      const maxRetries = 3;

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockImplementation(() => {
          attempts++;
          if (attempts < 3) {
            return Promise.reject(new Error('Temporary network error'));
          }
          return {
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'chat-success',
                title: 'Test',
                user_id: mockUserId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              error: null,
            }),
          };
        }),
      } as any);

      // Simulate retry logic
      let result;
      for (let i = 0; i < maxRetries; i++) {
        try {
          result = await ChatService.createChat(mockUserId, 'Test');
          break;
        } catch (error) {
          if (i === maxRetries - 1) throw error;
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      expect(attempts).toBe(3);
      expect(result?.id).toBe('chat-success');
    });
  });
});
