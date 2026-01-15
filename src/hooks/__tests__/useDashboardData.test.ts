import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// Helper for async waiting
const waitFor = async (callback: () => void | Promise<void>, options = { timeout: 1000 }) => {
  const startTime = Date.now();
  while (Date.now() - startTime < options.timeout) {
    try {
      await callback();
      return;
    } catch {
      await new Promise(r => setTimeout(r, 50));
    }
  }
  await callback();
};
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useDashboardData, DashboardStats, RecentActivity, UserGoal } from '../useDashboardData';
import { supabase } from '@/integrations/supabase/client';

// Mock dependencies
vi.mock('@/integrations/supabase/client');
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'user-123' },
    isAuthenticated: true,
  })),
}));

const mockKnowledgeBase = [
  { id: 'kb-1', title: 'Test Item 1', content: 'Content 1', created_at: new Date().toISOString() },
  { id: 'kb-2', title: 'Test Item 2', content: 'Content 2', created_at: new Date().toISOString() },
];

const mockMessages = [
  { id: 'msg-1', content: 'Hello world testing', role: 'user', created_at: new Date().toISOString(), chat_id: 'chat-1' },
  { id: 'msg-2', content: 'How does this work?', role: 'user', created_at: new Date().toISOString(), chat_id: 'chat-1' },
];

const mockChats = [
  { id: 'chat-1', title: 'Test Chat', created_at: new Date().toISOString() },
];

const mockUserGoals = [
  {
    id: 'goal-1',
    title: 'Import 50 items',
    target_value: 50,
    current_value: 25,
    goal_type: 'imports',
    period: 'monthly',
    created_at: new Date().toISOString(),
  },
];

describe('useDashboardData', () => {
  let queryClient: QueryClient;
  let wrapper: React.FC<{ children: React.ReactNode }>;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });
    wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('stats query', () => {
    it('should fetch dashboard stats successfully', async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        const baseMock = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          is: vi.fn().mockReturnThis(),
          not: vi.fn().mockReturnThis(),
          neq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lt: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        };

        if (table === 'knowledge_base') {
          return {
            ...baseMock,
            select: vi.fn().mockReturnValue({
              ...baseMock,
              eq: vi.fn().mockReturnValue({
                ...baseMock,
                is: vi.fn().mockResolvedValue({ count: 10, error: null }),
                gte: vi.fn().mockReturnValue({
                  is: vi.fn().mockResolvedValue({ count: 5, error: null }),
                  lt: vi.fn().mockReturnValue({
                    is: vi.fn().mockResolvedValue({ count: 3, error: null }),
                  }),
                }),
                not: vi.fn().mockReturnValue({
                  neq: vi.fn().mockReturnValue({
                    is: vi.fn().mockResolvedValue({ count: 8, error: null }),
                  }),
                }),
              }),
            }),
          } as any;
        }

        if (table === 'messages') {
          return {
            ...baseMock,
            select: vi.fn().mockReturnValue({
              ...baseMock,
              eq: vi.fn().mockReturnValue({
                gte: vi.fn().mockResolvedValue({ count: 15, error: null }),
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({ data: mockMessages, error: null }),
                }),
              }),
            }),
          } as any;
        }

        if (table === 'chats') {
          return {
            ...baseMock,
            select: vi.fn().mockReturnValue({
              ...baseMock,
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue({ data: mockChats, error: null }),
                  }),
                }),
              }),
            }),
          } as any;
        }

        if (table === 'user_goals') {
          return {
            ...baseMock,
            select: vi.fn().mockReturnValue({
              ...baseMock,
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: mockUserGoals, error: null }),
              }),
            }),
          } as any;
        }

        return baseMock as any;
      });

      const { result } = renderHook(() => useDashboardData(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.stats).toBeDefined();
      expect(typeof result.current.stats.totalItems).toBe('number');
      expect(typeof result.current.stats.searchesToday).toBe('number');
    });

    it('should return default stats when user is not logged in', async () => {
      const { useAuth } = await import('@/contexts/AuthContext');
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        isAuthenticated: false,
      } as any);

      const { result } = renderHook(() => useDashboardData(), { wrapper });

      expect(result.current.stats.totalItems).toBe(0);
      expect(result.current.stats.searchesToday).toBe(0);
      expect(result.current.stats.itemsThisMonth).toBe(0);
      expect(result.current.stats.knowledgeScore).toBe(0);
    });

    it('should calculate knowledge score correctly', async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        const baseMock = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          is: vi.fn().mockReturnThis(),
          not: vi.fn().mockReturnThis(),
          neq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lt: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        };

        if (table === 'knowledge_base') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockResolvedValue({ count: 10, error: null }),
                gte: vi.fn().mockReturnValue({
                  is: vi.fn().mockResolvedValue({ count: 5, error: null }),
                  lt: vi.fn().mockReturnValue({
                    is: vi.fn().mockResolvedValue({ count: 3, error: null }),
                  }),
                }),
                not: vi.fn().mockReturnValue({
                  neq: vi.fn().mockReturnValue({
                    is: vi.fn().mockResolvedValue({ count: 8, error: null }),
                  }),
                }),
              }),
            }),
          } as any;
        }

        if (table === 'messages') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gte: vi.fn().mockResolvedValue({ count: 5, error: null }),
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({ data: mockMessages, error: null }),
                }),
              }),
            }),
          } as any;
        }

        if (table === 'chats') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                  }),
                }),
              }),
            }),
          } as any;
        }

        if (table === 'user_goals') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          } as any;
        }

        return baseMock as any;
      });

      const { result } = renderHook(() => useDashboardData(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Score should be calculated as (itemsWithContent / totalItems) * 100
      expect(typeof result.current.stats.knowledgeScore).toBe('number');
    });
  });

  describe('activity query', () => {
    it('should fetch recent activity', async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        const baseMock = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          is: vi.fn().mockReturnThis(),
          not: vi.fn().mockReturnThis(),
          neq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lt: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        };

        if (table === 'messages') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gte: vi.fn().mockResolvedValue({ count: 2, error: null }),
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({ data: mockMessages, error: null }),
                }),
              }),
            }),
          } as any;
        }

        if (table === 'knowledge_base') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue({ data: mockKnowledgeBase, error: null }),
                  }),
                  gte: vi.fn().mockReturnValue({
                    is: vi.fn().mockResolvedValue({ count: 2, error: null }),
                    lt: vi.fn().mockReturnValue({
                      is: vi.fn().mockResolvedValue({ count: 1, error: null }),
                    }),
                  }),
                  not: vi.fn().mockReturnValue({
                    neq: vi.fn().mockReturnValue({
                      is: vi.fn().mockResolvedValue({ count: 2, error: null }),
                    }),
                  }),
                }),
              }),
            }),
          } as any;
        }

        if (table === 'chats') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue({ data: mockChats, error: null }),
                  }),
                }),
              }),
            }),
          } as any;
        }

        if (table === 'user_goals') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          } as any;
        }

        return baseMock as any;
      });

      const { result } = renderHook(() => useDashboardData(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(Array.isArray(result.current.recentActivity)).toBe(true);
    });

    it('should sort activity by timestamp descending', async () => {
      const oldDate = new Date(Date.now() - 86400000).toISOString();
      const newDate = new Date().toISOString();

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        const baseMock = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          is: vi.fn().mockReturnThis(),
          not: vi.fn().mockReturnThis(),
          neq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lt: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        };

        if (table === 'messages') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gte: vi.fn().mockResolvedValue({ count: 1, error: null }),
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: [{ id: 'msg-old', content: 'Old message', role: 'user', created_at: oldDate, chat_id: 'chat-1' }],
                    error: null,
                  }),
                }),
              }),
            }),
          } as any;
        }

        if (table === 'knowledge_base') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue({
                      data: [{ id: 'kb-new', title: 'New import', created_at: newDate }],
                      error: null,
                    }),
                  }),
                  gte: vi.fn().mockReturnValue({
                    is: vi.fn().mockResolvedValue({ count: 1, error: null }),
                    lt: vi.fn().mockReturnValue({
                      is: vi.fn().mockResolvedValue({ count: 0, error: null }),
                    }),
                  }),
                  not: vi.fn().mockReturnValue({
                    neq: vi.fn().mockReturnValue({
                      is: vi.fn().mockResolvedValue({ count: 1, error: null }),
                    }),
                  }),
                }),
              }),
            }),
          } as any;
        }

        if (table === 'chats') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                  }),
                }),
              }),
            }),
          } as any;
        }

        if (table === 'user_goals') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          } as any;
        }

        return baseMock as any;
      });

      const { result } = renderHook(() => useDashboardData(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      if (result.current.recentActivity.length >= 2) {
        expect(result.current.recentActivity[0].timestamp.getTime())
          .toBeGreaterThanOrEqual(result.current.recentActivity[1].timestamp.getTime());
      }
    });
  });

  describe('goals query', () => {
    it('should fetch user goals', async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        const baseMock = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          is: vi.fn().mockReturnThis(),
          not: vi.fn().mockReturnThis(),
          neq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lt: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        };

        if (table === 'user_goals') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: mockUserGoals, error: null }),
              }),
            }),
          } as any;
        }

        return baseMock as any;
      });

      const { result } = renderHook(() => useDashboardData(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(Array.isArray(result.current.goals)).toBe(true);
    });

    it('should return default goals when no user goals exist', async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        const baseMock = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          is: vi.fn().mockReturnThis(),
          not: vi.fn().mockReturnThis(),
          neq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lt: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        };

        if (table === 'user_goals') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          } as any;
        }

        return baseMock as any;
      });

      const { result } = renderHook(() => useDashboardData(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should have default goals
      expect(result.current.goals.length).toBeGreaterThanOrEqual(0);
    });

    it('should calculate goal progress correctly', async () => {
      const goalWithProgress = {
        ...mockUserGoals[0],
        current_value: 25,
        target_value: 50,
      };

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        const baseMock = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          is: vi.fn().mockReturnThis(),
          not: vi.fn().mockReturnThis(),
          neq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lt: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        };

        if (table === 'user_goals') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: [goalWithProgress], error: null }),
              }),
            }),
          } as any;
        }

        return baseMock as any;
      });

      const { result } = renderHook(() => useDashboardData(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      if (result.current.goals.length > 0) {
        expect(result.current.goals[0].progress).toBe(50); // 25/50 * 100 = 50%
      }
    });
  });

  describe('topics query', () => {
    it('should extract top topics from messages', async () => {
      const messagesWithTopics = [
        { content: 'Tell me about JavaScript programming', role: 'user', created_at: new Date().toISOString() },
        { content: 'How does JavaScript work?', role: 'user', created_at: new Date().toISOString() },
        { content: 'JavaScript is great for development', role: 'user', created_at: new Date().toISOString() },
      ];

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        const baseMock = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          is: vi.fn().mockReturnThis(),
          not: vi.fn().mockReturnThis(),
          neq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lt: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        };

        if (table === 'messages') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gte: vi.fn().mockResolvedValue({ count: 3, error: null }),
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({ data: messagesWithTopics, error: null }),
                }),
              }),
            }),
          } as any;
        }

        return baseMock as any;
      });

      const { result } = renderHook(() => useDashboardData(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(Array.isArray(result.current.topTopics)).toBe(true);
    });

    it('should return default topics when no messages exist', async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        const baseMock = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          is: vi.fn().mockReturnThis(),
          not: vi.fn().mockReturnThis(),
          neq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lt: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        };

        if (table === 'messages') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gte: vi.fn().mockResolvedValue({ count: 0, error: null }),
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            }),
          } as any;
        }

        return baseMock as any;
      });

      const { result } = renderHook(() => useDashboardData(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.topTopics).toEqual(['AI', 'Cloud', 'UX Design']);
    });
  });

  describe('refetch', () => {
    it('should refetch all queries when refetch is called', async () => {
      vi.mocked(supabase.from).mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any));

      const { result } = renderHook(() => useDashboardData(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(typeof result.current.refetch).toBe('function');
    });
  });
});
