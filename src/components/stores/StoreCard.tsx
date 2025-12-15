/**
 * StoreCard Component
 * Displays a single store with actions
 */

import { useState } from 'react';
import { Store, RefreshCw, Settings, Key, Trash2, ExternalLink, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { StoreWithoutApiKey } from '@/services/stores.service';

interface StoreCardProps {
  store: StoreWithoutApiKey;
  onEdit: (store: StoreWithoutApiKey) => void;
  onRotateKey: (store: StoreWithoutApiKey) => void;
  onSync: (storeId: string) => void;
  onDelete: (storeId: string) => void;
  syncing?: boolean;
}

const platformColors: Record<string, string> = {
  shopify: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  woocommerce: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  etsy: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
  amazon: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
  ebay: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  default: 'bg-muted text-muted-foreground border-border',
};

export function StoreCard({
  store,
  onEdit,
  onRotateKey,
  onSync,
  onDelete,
  syncing = false,
}: StoreCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    await onDelete(store.id);
    setIsDeleting(false);
  };

  const platformColor = platformColors[store.platform.toLowerCase()] || platformColors.default;

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Store className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-medium text-foreground truncate">
                  {store.store_name}
                </h3>
                <Badge variant="outline" className={cn('text-xs', platformColor)}>
                  {store.platform}
                </Badge>
              </div>
              
              {store.store_url && (
                <a
                  href={store.store_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mt-0.5"
                >
                  <span className="truncate max-w-[200px]">{store.store_url}</span>
                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                </a>
              )}

              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div
                    className={cn(
                      'h-2 w-2 rounded-full',
                      store.is_connected ? 'bg-green-500' : 'bg-red-500'
                    )}
                  />
                  <span>{store.is_connected ? 'Connected' : 'Disconnected'}</span>
                </div>
                {store.last_sync_at && (
                  <span>
                    Last sync: {format(new Date(store.last_sync_at), 'MMM d, h:mm a')}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onSync(store.id)}
              disabled={syncing}
              className="h-8 w-8"
            >
              <RefreshCw className={cn('h-4 w-4', syncing && 'animate-spin')} />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onEdit(store)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Store
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onRotateKey(store)}>
                  <Key className="h-4 w-4 mr-2" />
                  Rotate API Key
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isDeleting ? 'Deleting...' : 'Delete Store'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
