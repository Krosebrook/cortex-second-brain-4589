/**
 * Search Service
 * Centralizes all search-related operations across the application
 */

import { supabase } from '@/integrations/supabase/client';
import { BaseService } from './base.service';

export interface SearchFilters {
  query?: string;
  categories?: string[];
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'relevance' | 'date' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResult<T = unknown> {
  type: 'chat' | 'knowledge' | 'message' | 'user';
  id: string;
  title: string;
  content?: string;
  excerpt?: string;
  score?: number;
  createdAt: string;
  metadata?: T;
}

export interface SearchResponse<T = unknown> {
  results: SearchResult<T>[];
  total: number;
  page: number;
  perPage: number;
  hasMore: boolean;
}

class SearchServiceImpl extends BaseService {
  constructor() {
    super('SearchService');
  }

  /**
   * Full-text search across all content types
   */
  async searchAll(
    query: string,
    filters?: SearchFilters,
    page: number = 1,
    perPage: number = 20
  ): Promise<SearchResponse> {
    return this.executeWithRetry('searchAll', async () => {
      const offset = (page - 1) * perPage;
      const results: SearchResult[] = [];

      // Search in parallel across different content types
      const [chatResults, knowledgeResults, messageResults] = await Promise.all([
        this.searchChats(query, filters, 1, Math.floor(perPage / 3)),
        this.searchKnowledge(query, filters, 1, Math.floor(perPage / 3)),
        this.searchMessages(query, filters, 1, Math.floor(perPage / 3)),
      ]);

      results.push(...chatResults.results);
      results.push(...knowledgeResults.results);
      results.push(...messageResults.results);

      // Sort by relevance or date
      const sortedResults = this.sortResults(results, filters?.sortBy, filters?.sortOrder);

      // Paginate
      const paginatedResults = sortedResults.slice(offset, offset + perPage);

      return {
        results: paginatedResults,
        total: sortedResults.length,
        page,
        perPage,
        hasMore: sortedResults.length > offset + perPage,
      };
    });
  }

  /**
   * Search chats
   */
  async searchChats(
    query: string,
    filters?: SearchFilters,
    page: number = 1,
    perPage: number = 20
  ): Promise<SearchResponse> {
    return this.executeWithRetry('searchChats', async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const offset = (page - 1) * perPage;
      
      let queryBuilder = supabase
        .from('chats')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id);

      // Apply search query
      if (query) {
        queryBuilder = queryBuilder.ilike('title', `%${query}%`);
      }

      // Apply date filters
      if (filters?.dateFrom) {
        queryBuilder = queryBuilder.gte('created_at', filters.dateFrom);
      }
      if (filters?.dateTo) {
        queryBuilder = queryBuilder.lte('created_at', filters.dateTo);
      }

      // Apply sorting
      const sortColumn = filters?.sortBy === 'title' ? 'title' : 'created_at';
      const ascending = filters?.sortOrder === 'asc';
      queryBuilder = queryBuilder.order(sortColumn, { ascending });

      // Apply pagination
      queryBuilder = queryBuilder.range(offset, offset + perPage - 1);

      const { data, error, count } = await queryBuilder;
      
      if (error) throw error;

      const results: SearchResult[] = (data || []).map(chat => ({
        type: 'chat' as const,
        id: chat.id,
        title: chat.title || 'Untitled Chat',
        createdAt: chat.created_at,
        metadata: chat,
      }));

      return {
        results,
        total: count || 0,
        page,
        perPage,
        hasMore: (count || 0) > offset + perPage,
      };
    });
  }

  /**
   * Search knowledge items
   */
  async searchKnowledge(
    query: string,
    filters?: SearchFilters,
    page: number = 1,
    perPage: number = 20
  ): Promise<SearchResponse> {
    return this.executeWithRetry('searchKnowledge', async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const offset = (page - 1) * perPage;
      
      // Use chats table as a fallback since knowledge_items may not exist
      // In a real app, you'd have a dedicated knowledge_items table
      let queryBuilder = supabase
        .from('chats')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id);

      // Apply search query (search in title)
      if (query) {
        queryBuilder = queryBuilder.ilike('title', `%${query}%`);
      }

      // Apply date filters
      if (filters?.dateFrom) {
        queryBuilder = queryBuilder.gte('created_at', filters.dateFrom);
      }
      if (filters?.dateTo) {
        queryBuilder = queryBuilder.lte('created_at', filters.dateTo);
      }

      // Apply sorting
      const sortColumn = filters?.sortBy === 'title' ? 'title' : 'created_at';
      const ascending = filters?.sortOrder === 'asc';
      queryBuilder = queryBuilder.order(sortColumn, { ascending });

      // Apply pagination
      queryBuilder = queryBuilder.range(offset, offset + perPage - 1);

      const { data, error, count } = await queryBuilder;
      
      if (error) throw error;

      const results: SearchResult[] = (data || []).map(item => ({
        type: 'knowledge' as const,
        id: item.id,
        title: item.title || 'Untitled',
        content: undefined,
        excerpt: undefined,
        createdAt: item.created_at,
        metadata: item,
      }));

      return {
        results,
        total: count || 0,
        page,
        perPage,
        hasMore: (count || 0) > offset + perPage,
      };
    });
  }

  /**
   * Search messages
   */
  async searchMessages(
    query: string,
    filters?: SearchFilters,
    page: number = 1,
    perPage: number = 20
  ): Promise<SearchResponse> {
    return this.executeWithRetry('searchMessages', async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const offset = (page - 1) * perPage;
      
      let queryBuilder = supabase
        .from('messages')
        .select('*, chats!inner(title, user_id)', { count: 'exact' })
        .eq('chats.user_id', user.id);

      // Apply search query
      if (query) {
        queryBuilder = queryBuilder.ilike('content', `%${query}%`);
      }

      // Apply date filters
      if (filters?.dateFrom) {
        queryBuilder = queryBuilder.gte('created_at', filters.dateFrom);
      }
      if (filters?.dateTo) {
        queryBuilder = queryBuilder.lte('created_at', filters.dateTo);
      }

      // Apply sorting
      const ascending = filters?.sortOrder === 'asc';
      queryBuilder = queryBuilder.order('created_at', { ascending });

      // Apply pagination
      queryBuilder = queryBuilder.range(offset, offset + perPage - 1);

      const { data, error, count } = await queryBuilder;
      
      if (error) throw error;

      const results: SearchResult[] = (data || []).map(message => ({
        type: 'message' as const,
        id: message.id,
        title: (message.chats as { title?: string })?.title || 'Message',
        content: message.content,
        excerpt: this.createExcerpt(message.content, query),
        createdAt: message.created_at,
        metadata: message,
      }));

      return {
        results,
        total: count || 0,
        page,
        perPage,
        hasMore: (count || 0) > offset + perPage,
      };
    });
  }

  /**
   * Get search suggestions based on query
   */
  async getSearchSuggestions(query: string, limit: number = 5): Promise<string[]> {
    return this.executeWithRetry('getSearchSuggestions', async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get recent searches from chats
      const { data: recentChats } = await supabase
        .from('chats')
        .select('title')
        .eq('user_id', user.id)
        .ilike('title', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(limit);

      const suggestions = new Set<string>();
      
      recentChats?.forEach(chat => chat.title && suggestions.add(chat.title));

      return Array.from(suggestions).slice(0, limit);
    });
  }

  /**
   * Get popular tags for filtering
   */
  async getPopularTags(limit: number = 20): Promise<string[]> {
    return this.executeWithRetry('getPopularTags', async () => {
      // Return empty array as tags feature requires dedicated table
      return [];
    });
  }

  /**
   * Save search to history (no-op without search_history table)
   */
  async saveSearchHistory(_query: string, _filters?: SearchFilters): Promise<void> {
    // No-op: search_history table doesn't exist
    return;
  }

  /**
   * Get search history (returns empty without search_history table)
   */
  async getSearchHistory(_limit: number = 10): Promise<Array<{
    query: string;
    filters?: SearchFilters;
    createdAt: string;
  }>> {
    // Return empty: search_history table doesn't exist
    return [];
  }

  /**
   * Helper: Create excerpt from content highlighting query
   */
  private createExcerpt(content: string | null, query?: string, maxLength: number = 200): string {
    if (!content) return '';
    
    if (!query) {
      return content.slice(0, maxLength) + (content.length > maxLength ? '...' : '');
    }

    // Find query in content (case insensitive)
    const lowerContent = content.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerContent.indexOf(lowerQuery);

    if (index === -1) {
      return content.slice(0, maxLength) + (content.length > maxLength ? '...' : '');
    }

    // Create excerpt around the query
    const start = Math.max(0, index - 50);
    const end = Math.min(content.length, index + query.length + 150);
    
    let excerpt = content.slice(start, end);
    
    if (start > 0) excerpt = '...' + excerpt;
    if (end < content.length) excerpt = excerpt + '...';

    return excerpt;
  }

  /**
   * Helper: Sort search results
   */
  private sortResults(
    results: SearchResult[],
    sortBy?: 'relevance' | 'date' | 'title',
    sortOrder?: 'asc' | 'desc'
  ): SearchResult[] {
    const ascending = sortOrder === 'asc';

    switch (sortBy) {
      case 'title':
        return results.sort((a, b) => 
          ascending
            ? a.title.localeCompare(b.title)
            : b.title.localeCompare(a.title)
        );
      
      case 'date':
        return results.sort((a, b) => 
          ascending
            ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      
      case 'relevance':
      default:
        // Sort by score if available, then by date
        return results.sort((a, b) => {
          if (a.score !== undefined && b.score !== undefined) {
            return ascending ? a.score - b.score : b.score - a.score;
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    }
  }
}

// Export singleton instance
export const SearchService = new SearchServiceImpl();
export default SearchService;
