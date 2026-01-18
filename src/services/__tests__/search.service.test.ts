/**
 * Tests for Search Service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SearchService } from '../search.service';
import { supabase } from '@/integrations/supabase/client';

// Mock supabase
vi.mock('@/integrations/supabase/client');

describe('SearchService', () => {
  const mockUserId = 'user-123';
  const mockUser = {
    id: mockUserId,
    email: 'test@example.com',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default auth mock
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('searchChats', () => {
    it('should search chats by query', async () => {
      const mockChats = [
        {
          id: 'chat-1',
          title: 'Test Chat',
          user_id: mockUserId,
          created_at: '2024-01-01T00:00:00.000Z',
        },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            ilike: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                range: vi.fn().mockResolvedValue({
                  data: mockChats,
                  error: null,
                  count: 1,
                }),
              }),
            }),
          }),
        }),
      } as any);

      const result = await SearchService.searchChats('test');

      expect(result.results).toHaveLength(1);
      expect(result.results[0].type).toBe('chat');
      expect(result.results[0].title).toBe('Test Chat');
      expect(result.total).toBe(1);
    });

    it('should apply date filters', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            ilike: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                lte: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    range: vi.fn().mockResolvedValue({
                      data: [],
                      error: null,
                      count: 0,
                    }),
                  }),
                }),
              }),
            }),
          }),
        }),
      } as any);

      await SearchService.searchChats('test', {
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31',
      });

      // Verify date filters were applied
      const fromMock = vi.mocked(supabase.from).mock.results[0].value;
      expect(fromMock.select).toHaveBeenCalled();
    });

    it('should handle pagination', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            ilike: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                range: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                  count: 50,
                }),
              }),
            }),
          }),
        }),
      } as any);

      const result = await SearchService.searchChats('test', {}, 2, 10);

      expect(result.page).toBe(2);
      expect(result.perPage).toBe(10);
      expect(result.hasMore).toBe(true);
    });
  });

  describe('searchKnowledge', () => {
    it('should search knowledge items', async () => {
      const mockItems = [
        {
          id: 'item-1',
          title: 'Test Item',
          content: 'Test content with search term',
          user_id: mockUserId,
          created_at: '2024-01-01T00:00:00.000Z',
          tags: ['tag1'],
          category: 'notes',
        },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            or: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                range: vi.fn().mockResolvedValue({
                  data: mockItems,
                  error: null,
                  count: 1,
                }),
              }),
            }),
          }),
        }),
      } as any);

      const result = await SearchService.searchKnowledge('test');

      expect(result.results).toHaveLength(1);
      expect(result.results[0].type).toBe('knowledge');
      expect(result.results[0].excerpt).toBeDefined();
    });

    it('should filter by categories', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            or: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  range: vi.fn().mockResolvedValue({
                    data: [],
                    error: null,
                    count: 0,
                  }),
                }),
              }),
            }),
          }),
        }),
      } as any);

      await SearchService.searchKnowledge('test', {
        categories: ['notes', 'docs'],
      });

      // Verify category filter was applied
      const fromMock = vi.mocked(supabase.from).mock.results[0].value;
      expect(fromMock.select).toHaveBeenCalled();
    });

    it('should filter by tags', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            or: vi.fn().mockReturnValue({
              contains: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  range: vi.fn().mockResolvedValue({
                    data: [],
                    error: null,
                    count: 0,
                  }),
                }),
              }),
            }),
          }),
        }),
      } as any);

      await SearchService.searchKnowledge('test', {
        tags: ['important', 'work'],
      });

      // Verify tag filter was applied
      const fromMock = vi.mocked(supabase.from).mock.results[0].value;
      expect(fromMock.select).toHaveBeenCalled();
    });
  });

  describe('searchMessages', () => {
    it('should search messages', async () => {
      const mockMessages = [
        {
          id: 'msg-1',
          content: 'Test message content',
          user_id: mockUserId,
          created_at: '2024-01-01T00:00:00.000Z',
          chats: {
            title: 'Test Chat',
            user_id: mockUserId,
          },
        },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            ilike: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                range: vi.fn().mockResolvedValue({
                  data: mockMessages,
                  error: null,
                  count: 1,
                }),
              }),
            }),
          }),
        }),
      } as any);

      const result = await SearchService.searchMessages('test');

      expect(result.results).toHaveLength(1);
      expect(result.results[0].type).toBe('message');
      expect(result.results[0].title).toBe('Test Chat');
    });

    it('should create excerpt for messages', async () => {
      const longContent = 'This is a very long message content with the search term in the middle. '.repeat(10);
      const mockMessages = [
        {
          id: 'msg-1',
          content: longContent,
          user_id: mockUserId,
          created_at: '2024-01-01T00:00:00.000Z',
          chats: { title: 'Chat', user_id: mockUserId },
        },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            ilike: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                range: vi.fn().mockResolvedValue({
                  data: mockMessages,
                  error: null,
                  count: 1,
                }),
              }),
            }),
          }),
        }),
      } as any);

      const result = await SearchService.searchMessages('term');

      expect(result.results[0].excerpt).toBeDefined();
      expect(result.results[0].excerpt!.length).toBeLessThan(longContent.length);
    });
  });

  describe('searchAll', () => {
    it('should search across all content types', async () => {
      // Mock searchChats, searchKnowledge, searchMessages
      vi.spyOn(SearchService, 'searchChats').mockResolvedValue({
        results: [
          {
            type: 'chat',
            id: 'chat-1',
            title: 'Test Chat',
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        total: 1,
        page: 1,
        perPage: 10,
        hasMore: false,
      });

      vi.spyOn(SearchService, 'searchKnowledge').mockResolvedValue({
        results: [
          {
            type: 'knowledge',
            id: 'item-1',
            title: 'Test Item',
            createdAt: '2024-01-02T00:00:00.000Z',
          },
        ],
        total: 1,
        page: 1,
        perPage: 10,
        hasMore: false,
      });

      vi.spyOn(SearchService, 'searchMessages').mockResolvedValue({
        results: [
          {
            type: 'message',
            id: 'msg-1',
            title: 'Message',
            createdAt: '2024-01-03T00:00:00.000Z',
          },
        ],
        total: 1,
        page: 1,
        perPage: 10,
        hasMore: false,
      });

      const result = await SearchService.searchAll('test');

      expect(result.results.length).toBeGreaterThan(0);
      expect(result.results).toContainEqual(
        expect.objectContaining({ type: 'chat' })
      );
    });

    it('should sort results by date', async () => {
      vi.spyOn(SearchService, 'searchChats').mockResolvedValue({
        results: [
          {
            type: 'chat',
            id: 'chat-1',
            title: 'Chat',
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        total: 1,
        page: 1,
        perPage: 10,
        hasMore: false,
      });

      vi.spyOn(SearchService, 'searchKnowledge').mockResolvedValue({
        results: [
          {
            type: 'knowledge',
            id: 'item-1',
            title: 'Item',
            createdAt: '2024-01-03T00:00:00.000Z',
          },
        ],
        total: 1,
        page: 1,
        perPage: 10,
        hasMore: false,
      });

      vi.spyOn(SearchService, 'searchMessages').mockResolvedValue({
        results: [],
        total: 0,
        page: 1,
        perPage: 10,
        hasMore: false,
      });

      const result = await SearchService.searchAll('test', { sortBy: 'date', sortOrder: 'desc' });

      expect(result.results[0].createdAt).toBe('2024-01-03T00:00:00.000Z');
    });
  });

  describe('getSearchSuggestions', () => {
    it('should return search suggestions', async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'chats') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                ilike: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue({
                      data: [{ title: 'Test Chat' }],
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          } as any;
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              ilike: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: [{ title: 'Test Item' }],
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        } as any;
      });

      const result = await SearchService.getSearchSuggestions('test');

      expect(result).toContain('Test Chat');
      expect(result).toContain('Test Item');
    });

    it('should deduplicate suggestions', async () => {
      vi.mocked(supabase.from).mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            ilike: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: [{ title: 'Duplicate' }, { title: 'Duplicate' }],
                  error: null,
                }),
              }),
            }),
          }),
        }),
      } as any));

      const result = await SearchService.getSearchSuggestions('test');

      expect(result.filter((s) => s === 'Duplicate')).toHaveLength(1);
    });
  });

  describe('getPopularTags', () => {
    it('should return popular tags', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            not: vi.fn().mockResolvedValue({
              data: [
                { tags: ['tag1', 'tag2'] },
                { tags: ['tag1', 'tag3'] },
                { tags: ['tag2'] },
              ],
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await SearchService.getPopularTags();

      expect(result).toContain('tag1');
      expect(result).toContain('tag2');
      // tag1 should be first (appears twice)
      expect(result[0]).toBe('tag1');
    });

    it('should respect limit parameter', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            not: vi.fn().mockResolvedValue({
              data: Array(30).fill({ tags: ['tag'] }),
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await SearchService.getPopularTags(10);

      expect(result.length).toBeLessThanOrEqual(10);
    });
  });

  describe('saveSearchHistory', () => {
    it('should save search to history', async () => {
      const insertMock = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: insertMock,
      } as any);

      await SearchService.saveSearchHistory('test query', { tags: ['tag1'] });

      expect(supabase.from).toHaveBeenCalledWith('search_history');
      expect(insertMock).toHaveBeenCalled();
    });

    it('should not fail if user not authenticated', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      await expect(
        SearchService.saveSearchHistory('test')
      ).resolves.not.toThrow();
    });
  });

  describe('getSearchHistory', () => {
    it('should get search history', async () => {
      const mockHistory = [
        {
          query: 'test1',
          filters: {},
          created_at: '2024-01-01T00:00:00.000Z',
        },
        {
          query: 'test2',
          filters: { tags: ['tag1'] },
          created_at: '2024-01-02T00:00:00.000Z',
        },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: mockHistory,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const result = await SearchService.getSearchHistory();

      expect(result).toHaveLength(2);
      expect(result[0].query).toBe('test1');
      expect(result[1].filters).toMatchObject({ tags: ['tag1'] });
    });

    it('should return empty array if user not authenticated', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      const result = await SearchService.getSearchHistory();

      expect(result).toEqual([]);
    });
  });
});
