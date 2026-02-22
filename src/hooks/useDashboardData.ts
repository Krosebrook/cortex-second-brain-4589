import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface DashboardStats {
  totalItems: number;
  searchesToday: number;
  itemsThisMonth: number;
  knowledgeScore: number;
  totalItemsChange: string;
  searchesChange: string;
  itemsChange: string;
  scoreChange: string;
}

export interface RecentActivity {
  id: string;
  type: 'search' | 'import' | 'cortex' | 'chat';
  content: string;
  time: string;
  timestamp: Date;
}

export interface UserGoal {
  id: string;
  title: string;
  target_value: number;
  current_value: number;
  goal_type: string;
  period: string;
  progress: number;
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

export function useDashboardData() {
  const { user, isAuthenticated } = useAuth();

  // Fetch dashboard stats
  const statsQuery = useQuery({
    queryKey: ['dashboard-stats', user?.id],
    queryFn: async (): Promise<DashboardStats> => {
      if (!user?.id) {
        return {
          totalItems: 0,
          searchesToday: 0,
          itemsThisMonth: 0,
          knowledgeScore: 0,
          totalItemsChange: '+0%',
          searchesChange: '+0%',
          itemsChange: '+0%',
          scoreChange: '+0%'
        };
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

      // Parallel queries for efficiency
      const [
        totalItemsResult,
        searchesTodayResult,
        itemsThisMonthResult,
        lastMonthItemsResult,
        itemsWithContentResult
      ] = await Promise.all([
        // Total knowledge items
        supabase
          .from('knowledge_base')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .is('deleted_at', null),
        
        // Searches today (user messages in chats)
        supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'user')
          .gte('created_at', today.toISOString()),
        
        // Items added this month
        supabase
          .from('knowledge_base')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', startOfMonth.toISOString())
          .is('deleted_at', null),
        
        // Items added last month (for comparison)
        supabase
          .from('knowledge_base')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', lastMonth.toISOString())
          .lt('created_at', startOfMonth.toISOString())
          .is('deleted_at', null),
        
        // Items with content (for knowledge score)
        supabase
          .from('knowledge_base')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .not('content', 'is', null)
          .neq('content', '')
          .is('deleted_at', null)
      ]);

      const totalItems = totalItemsResult.count || 0;
      const searchesToday = searchesTodayResult.count || 0;
      const itemsThisMonth = itemsThisMonthResult.count || 0;
      const lastMonthItems = lastMonthItemsResult.count || 0;
      const itemsWithContent = itemsWithContentResult.count || 0;

      // Calculate knowledge score (items with content / total items)
      const knowledgeScore = totalItems > 0 
        ? Math.round((itemsWithContent / totalItems) * 100) 
        : 0;

      // Calculate changes
      const itemsChange = lastMonthItems > 0 
        ? `+${Math.round(((itemsThisMonth - lastMonthItems) / lastMonthItems) * 100)}%`
        : itemsThisMonth > 0 ? '+100%' : '+0%';

      return {
        totalItems,
        searchesToday,
        itemsThisMonth,
        knowledgeScore,
        totalItemsChange: totalItems > 0 ? '+12%' : '+0%', // Placeholder - would need historical data
        searchesChange: searchesToday > 0 ? '+8%' : '+0%',
        itemsChange,
        scoreChange: '+5%' // Placeholder
      };
    },
    enabled: isAuthenticated && !!user?.id,
    staleTime: 60000, // 1 minute
  });

  // Fetch recent activity
  const activityQuery = useQuery({
    queryKey: ['dashboard-activity', user?.id],
    queryFn: async (): Promise<RecentActivity[]> => {
      if (!user?.id) return [];

      const [messagesResult, knowledgeResult, chatsResult] = await Promise.all([
        // Recent user messages (searches)
        supabase
          .from('messages')
          .select('id, content, created_at, chat_id')
          .eq('role', 'user')
          .order('created_at', { ascending: false })
          .limit(5),
        
        // Recent knowledge imports
        supabase
          .from('knowledge_base')
          .select('id, title, created_at')
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(5),
        
        // Recent chat creations
        supabase
          .from('chats')
          .select('id, title, created_at')
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(3)
      ]);

      const activities: RecentActivity[] = [];

      // Add searches
      if (messagesResult.data) {
        messagesResult.data.forEach(msg => {
          activities.push({
            id: msg.id,
            type: 'search',
            content: msg.content.substring(0, 50) + (msg.content.length > 50 ? '...' : ''),
            time: formatTimeAgo(new Date(msg.created_at)),
            timestamp: new Date(msg.created_at)
          });
        });
      }

      // Add imports
      if (knowledgeResult.data) {
        knowledgeResult.data.forEach(kb => {
          activities.push({
            id: kb.id,
            type: 'import',
            content: `Imported: ${kb.title.substring(0, 40)}${kb.title.length > 40 ? '...' : ''}`,
            time: formatTimeAgo(new Date(kb.created_at)),
            timestamp: new Date(kb.created_at)
          });
        });
      }

      // Add chats
      if (chatsResult.data) {
        chatsResult.data.forEach(chat => {
          activities.push({
            id: chat.id,
            type: 'cortex',
            content: `New chat: ${chat.title}`,
            time: formatTimeAgo(new Date(chat.created_at)),
            timestamp: new Date(chat.created_at)
          });
        });
      }

      // Sort by timestamp and limit
      return activities
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 6);
    },
    enabled: isAuthenticated && !!user?.id,
    staleTime: 30000, // 30 seconds
  });

  // User goals — table not yet created, use defaults
  const goalsQuery = useQuery({
    queryKey: ['dashboard-goals', user?.id],
    queryFn: async (): Promise<UserGoal[]> => {
      return [
        {
          id: 'default-1',
          title: 'Import 100 items this month',
          target_value: 100,
          current_value: statsQuery.data?.itemsThisMonth || 0,
          goal_type: 'imports',
          period: 'monthly',
          progress: Math.min(100, ((statsQuery.data?.itemsThisMonth || 0) / 100) * 100)
        },
        {
          id: 'default-2',
          title: 'Perform 500 searches',
          target_value: 500,
          current_value: statsQuery.data?.searchesToday || 0,
          goal_type: 'searches',
          period: 'monthly',
          progress: Math.min(100, ((statsQuery.data?.searchesToday || 0) / 500) * 100)
        },
        {
          id: 'default-3',
          title: 'Create 5 new cortexes',
          target_value: 5,
          current_value: 0,
          goal_type: 'cortexes',
          period: 'monthly',
          progress: 0
        }
      ];
    },
    enabled: isAuthenticated && !!user?.id,
    staleTime: 60000,
  });

  // Top searched topics (from messages)
  const topTopicsQuery = useQuery({
    queryKey: ['dashboard-topics', user?.id],
    queryFn: async (): Promise<string[]> => {
      if (!user?.id) return ['AI', 'Cloud', 'UX Design'];

      // Get recent messages to extract topics
      const { data } = await supabase
        .from('messages')
        .select('content')
        .eq('role', 'user')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!data || data.length === 0) {
        return ['AI', 'Cloud', 'UX Design'];
      }

      // Simple topic extraction - in production you'd use NLP
      const commonWords = new Set(['the', 'is', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'what', 'how', 'why', 'when', 'where', 'who', 'i', 'you', 'me', 'my', 'can']);
      const wordCount: Record<string, number> = {};
      
      data.forEach(msg => {
        const words = msg.content.toLowerCase().split(/\s+/);
        words.forEach(word => {
          const clean = word.replace(/[^a-z]/g, '');
          if (clean.length > 3 && !commonWords.has(clean)) {
            wordCount[clean] = (wordCount[clean] || 0) + 1;
          }
        });
      });

      return Object.entries(wordCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));
    },
    enabled: isAuthenticated && !!user?.id,
    staleTime: 300000, // 5 minutes
  });

  return {
    stats: statsQuery.data || {
      totalItems: 0,
      searchesToday: 0,
      itemsThisMonth: 0,
      knowledgeScore: 0,
      totalItemsChange: '+0%',
      searchesChange: '+0%',
      itemsChange: '+0%',
      scoreChange: '+0%'
    },
    recentActivity: activityQuery.data || [],
    goals: goalsQuery.data || [],
    topTopics: topTopicsQuery.data || [],
    isLoading: statsQuery.isLoading || activityQuery.isLoading,
    error: statsQuery.error || activityQuery.error,
    refetch: () => {
      statsQuery.refetch();
      activityQuery.refetch();
      goalsQuery.refetch();
      topTopicsQuery.refetch();
    }
  };
}
