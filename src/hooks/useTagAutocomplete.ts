import { useState, useMemo, useCallback } from 'react';

interface UseTagAutocompleteOptions {
  existingTags: string[];
  selectedItemTags: string[][];
}

export const useTagAutocomplete = ({
  existingTags,
  selectedItemTags,
}: UseTagAutocompleteOptions) => {
  const [inputValue, setInputValue] = useState('');

  // Get all unique tags from existing items
  const allTags = useMemo(() => {
    return Array.from(new Set(existingTags)).sort();
  }, [existingTags]);

  // Get common tags across selected items
  const commonTags = useMemo(() => {
    if (selectedItemTags.length === 0) return [];

    const tagCounts = new Map<string, number>();
    selectedItemTags.forEach((tags) => {
      tags?.forEach((tag) => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    return Array.from(tagCounts.entries())
      .filter(([_, count]) => count === selectedItemTags.length)
      .map(([tag]) => tag);
  }, [selectedItemTags]);

  // Get tag suggestions based on input
  const suggestions = useMemo(() => {
    if (!inputValue.trim()) return allTags.slice(0, 10);

    const query = inputValue.toLowerCase();
    return allTags
      .filter((tag) => tag.toLowerCase().includes(query))
      .slice(0, 10);
  }, [inputValue, allTags]);

  // Get tag frequency
  const getTagFrequency = useCallback(
    (tag: string): number => {
      return existingTags.filter((t) => t === tag).length;
    },
    [existingTags]
  );

  const clearInput = useCallback(() => {
    setInputValue('');
  }, []);

  return {
    inputValue,
    setInputValue,
    suggestions,
    commonTags,
    allTags,
    getTagFrequency,
    clearInput,
  };
};
