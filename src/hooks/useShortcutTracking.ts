import { useState, useEffect, useCallback } from 'react';

interface ShortcutStats {
  [shortcutId: string]: {
    count: number;
    lastUsed: number;
  };
}

export const useShortcutTracking = () => {
  const [usageStats, setUsageStats] = useState<ShortcutStats>(() => {
    const stored = localStorage.getItem('shortcut-usage');
    return stored ? JSON.parse(stored) : {};
  });

  useEffect(() => {
    localStorage.setItem('shortcut-usage', JSON.stringify(usageStats));
  }, [usageStats]);

  const trackShortcut = useCallback((shortcutId: string) => {
    setUsageStats(prev => ({
      ...prev,
      [shortcutId]: {
        count: (prev[shortcutId]?.count || 0) + 1,
        lastUsed: Date.now(),
      },
    }));
  }, []);

  const resetStats = useCallback(() => {
    setUsageStats({});
    localStorage.removeItem('shortcut-usage');
  }, []);

  const getMostUsed = useCallback((limit = 10) => {
    return Object.entries(usageStats)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, limit)
      .map(([id, stats]) => ({ id, ...stats }));
  }, [usageStats]);

  return {
    usageStats,
    trackShortcut,
    resetStats,
    getMostUsed,
  };
};
