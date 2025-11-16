import { useState, useMemo, useCallback } from 'react';

export interface FilterOptions {
  searchQuery: string;
  types?: string[];
  tags?: string[];
  dateFrom?: Date;
  dateTo?: Date;
}

export const useSearchFilter = <T extends { 
  title: string; 
  content?: string | null; 
  type?: string | null; 
  tags?: string[] | null;
  created_at: string;
}>(items: T[]) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  // Extract unique types and tags from items
  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    items.forEach(item => {
      if (item.type) types.add(item.type);
    });
    return Array.from(types);
  }, [items]);

  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    items.forEach(item => {
      item.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  }, [items]);

  // Filter items based on criteria
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const titleMatch = item.title.toLowerCase().includes(query);
        const contentMatch = item.content?.toLowerCase().includes(query);
        if (!titleMatch && !contentMatch) return false;
      }

      // Type filter
      if (selectedTypes.length > 0 && item.type) {
        if (!selectedTypes.includes(item.type)) return false;
      }

      // Tags filter
      if (selectedTags.length > 0) {
        if (!item.tags || !selectedTags.some(tag => item.tags?.includes(tag))) {
          return false;
        }
      }

      // Date range filter
      const itemDate = new Date(item.created_at);
      if (dateFrom && itemDate < dateFrom) return false;
      if (dateTo && itemDate > dateTo) return false;

      return true;
    });
  }, [items, searchQuery, selectedTypes, selectedTags, dateFrom, dateTo]);

  const toggleType = useCallback((type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  }, []);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedTypes([]);
    setSelectedTags([]);
    setDateFrom(undefined);
    setDateTo(undefined);
  }, []);

  const hasActiveFilters = searchQuery || selectedTypes.length > 0 || 
    selectedTags.length > 0 || dateFrom || dateTo;

  return {
    searchQuery,
    setSearchQuery,
    selectedTypes,
    toggleType,
    selectedTags,
    toggleTag,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    clearFilters,
    filteredItems,
    availableTypes,
    availableTags,
    hasActiveFilters,
  };
};
