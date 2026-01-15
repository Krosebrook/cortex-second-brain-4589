import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  HardDrive, 
  Trash2, 
  RefreshCw, 
  Database, 
  Image, 
  FileText, 
  Globe,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { getCacheUsage, clearCache, clearAllCaches, updateServiceWorkerCache } from '@/config/cache-policies';
import { offlineStorage } from '@/lib/offline-storage';

interface CacheInfo {
  name: string;
  displayName: string;
  icon: React.ReactNode;
  description: string;
  size?: number;
}

const CACHE_TYPES: CacheInfo[] = [
  {
    name: 'static-resources',
    displayName: 'App Resources',
    icon: <FileText size={18} className="text-primary" />,
    description: 'JavaScript, CSS, and HTML files'
  },
  {
    name: 'static-images',
    displayName: 'Images',
    icon: <Image size={18} className="text-accent" />,
    description: 'Cached images and media'
  },
  {
    name: 'pages',
    displayName: 'Pages',
    icon: <Globe size={18} className="text-blue-500" />,
    description: 'Cached page content for offline access'
  },
  {
    name: 'supabase-api',
    displayName: 'API Data',
    icon: <Database size={18} className="text-green-500" />,
    description: 'Cached API responses'
  },
  {
    name: 'google-fonts-stylesheets',
    displayName: 'Fonts',
    icon: <FileText size={18} className="text-purple-500" />,
    description: 'Google Fonts stylesheets'
  },
  {
    name: 'google-fonts-webfonts',
    displayName: 'Font Files',
    icon: <FileText size={18} className="text-purple-400" />,
    description: 'Font file data'
  }
];

export const CacheManagement: React.FC = () => {
  const [cacheUsage, setCacheUsage] = useState<{ used: number; quota: number } | null>(null);
  const [cacheDetails, setCacheDetails] = useState<Map<string, number>>(new Map());
  const [pendingSyncOps, setPendingSyncOps] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [clearingCache, setClearingCache] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadCacheInfo = async () => {
    setIsLoading(true);
    try {
      // Get overall cache usage
      const usage = await getCacheUsage();
      setCacheUsage(usage);

      // Get individual cache sizes
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        const details = new Map<string, number>();
        
        for (const name of cacheNames) {
          const cache = await caches.open(name);
          const keys = await cache.keys();
          // Estimate size based on number of entries
          details.set(name, keys.length);
        }
        setCacheDetails(details);
      }

      // Get pending sync operations
      const syncQueue = await offlineStorage.getSyncQueue();
      setPendingSyncOps(syncQueue.length);
    } catch (error) {
      console.error('Failed to load cache info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCacheInfo();
  }, []);

  const handleClearCache = async (cacheName: string, displayName: string) => {
    setClearingCache(cacheName);
    try {
      const success = await clearCache(cacheName);
      if (success) {
        toast.success(`${displayName} cache cleared`);
        await loadCacheInfo();
      } else {
        toast.error(`Failed to clear ${displayName} cache`);
      }
    } catch (error) {
      toast.error(`Error clearing cache: ${error}`);
    } finally {
      setClearingCache(null);
    }
  };

  const handleClearAllCaches = async () => {
    setClearingCache('all');
    try {
      await clearAllCaches();
      await offlineStorage.clearCache();
      toast.success('All caches cleared successfully');
      await loadCacheInfo();
    } catch (error) {
      toast.error(`Error clearing caches: ${error}`);
    } finally {
      setClearingCache(null);
    }
  };

  const handleRefreshServiceWorker = async () => {
    setIsRefreshing(true);
    try {
      await updateServiceWorkerCache();
      toast.success('Service worker updated');
      await loadCacheInfo();
    } catch (error) {
      toast.error(`Error updating service worker: ${error}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const usagePercentage = cacheUsage 
    ? Math.round((cacheUsage.used / cacheUsage.quota) * 100) 
    : 0;

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <HardDrive size={20} />
          Cache & Storage Management
        </CardTitle>
        <CardDescription>
          Manage cached data for offline access and faster loading
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Storage Usage Overview */}
        <div className="p-4 rounded-lg border border-border bg-card/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-foreground">Storage Usage</span>
            {cacheUsage && (
              <span className="text-sm text-muted-foreground">
                {formatBytes(cacheUsage.used)} / {formatBytes(cacheUsage.quota)}
              </span>
            )}
          </div>
          <Progress value={usagePercentage} className="h-2" />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">
              {usagePercentage}% used
            </span>
            {usagePercentage > 80 && (
              <Badge variant="destructive" className="text-xs">
                <AlertCircle size={12} className="mr-1" />
                Low storage
              </Badge>
            )}
          </div>
        </div>

        {/* Pending Sync Operations */}
        {pendingSyncOps > 0 && (
          <div className="flex items-center justify-between p-3 rounded-lg border border-amber-500/50 bg-amber-500/10">
            <div className="flex items-center gap-2">
              <RefreshCw size={18} className="text-amber-500" />
              <div>
                <p className="text-sm font-medium text-foreground">Pending Sync Operations</p>
                <p className="text-xs text-muted-foreground">
                  {pendingSyncOps} operation(s) waiting to sync
                </p>
              </div>
            </div>
            <Badge variant="outline" className="border-amber-500 text-amber-500">
              {pendingSyncOps}
            </Badge>
          </div>
        )}

        {/* Individual Cache Controls */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-foreground">Cache Categories</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadCacheInfo}
              disabled={isLoading}
            >
              <RefreshCw size={14} className={`mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-2">
              {CACHE_TYPES.map((cache) => {
                const entryCount = cacheDetails.get(cache.name) || 0;
                return (
                  <div
                    key={cache.name}
                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/50"
                  >
                    <div className="flex items-center gap-3">
                      {cache.icon}
                      <div>
                        <p className="text-sm font-medium text-foreground">{cache.displayName}</p>
                        <p className="text-xs text-muted-foreground">{cache.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {entryCount} items
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleClearCache(cache.name, cache.displayName)}
                        disabled={clearingCache !== null || entryCount === 0}
                      >
                        {clearingCache === cache.name ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* IndexedDB Storage */}
        <div className="p-4 rounded-lg border border-border bg-card/50">
          <div className="flex items-center gap-3 mb-3">
            <Database size={18} className="text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">Offline Database</p>
              <p className="text-xs text-muted-foreground">
                Local storage for offline access to chats and knowledge
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              setClearingCache('indexeddb');
              try {
                await offlineStorage.clearCache();
                toast.success('Offline database cleared');
                await loadCacheInfo();
              } catch (error) {
                toast.error('Failed to clear offline database');
              } finally {
                setClearingCache(null);
              }
            }}
            disabled={clearingCache !== null}
          >
            {clearingCache === 'indexeddb' ? (
              <Loader2 size={14} className="mr-2 animate-spin" />
            ) : (
              <Trash2 size={14} className="mr-2" />
            )}
            Clear Offline Data
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
          <Button
            variant="outline"
            onClick={handleRefreshServiceWorker}
            disabled={isRefreshing}
            className="flex-1"
          >
            {isRefreshing ? (
              <Loader2 size={16} className="mr-2 animate-spin" />
            ) : (
              <RefreshCw size={16} className="mr-2" />
            )}
            Update Service Worker
          </Button>
          <Button
            variant="destructive"
            onClick={handleClearAllCaches}
            disabled={clearingCache !== null}
            className="flex-1"
          >
            {clearingCache === 'all' ? (
              <Loader2 size={16} className="mr-2 animate-spin" />
            ) : (
              <Trash2 size={16} className="mr-2" />
            )}
            Clear All Caches
          </Button>
        </div>

        {/* Info Note */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
          <CheckCircle size={16} className="text-green-500 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Clearing caches will remove stored data for faster loading. Your account data and saved content will not be affected.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CacheManagement;
