/**
 * SyncDashboard Component
 * Main dashboard for visualizing synced store data
 */

import { useState, useEffect, useMemo } from 'react';
import { RefreshCw, Store, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useStores } from '@/hooks/useStores';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SyncStatsCards, type SyncStats } from './SyncStatsCards';
import { SyncCharts } from './SyncCharts';

interface SyncDashboardProps {
  className?: string;
}

export function SyncDashboard({ className }: SyncDashboardProps) {
  const { stores, loading: storesLoading, getSyncedProducts, getSyncedOrders, getSyncedCustomers, getSyncLogs } = useStores();
  
  const [selectedStoreId, setSelectedStoreId] = useState<string>('all');
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [syncLogs, setSyncLogs] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Load synced data when store selection changes
  useEffect(() => {
    const loadData = async () => {
      setDataLoading(true);
      try {
        if (selectedStoreId === 'all') {
          // Load data from all stores
          const allProducts: any[] = [];
          const allOrders: any[] = [];
          const allCustomers: any[] = [];
          const allLogs: any[] = [];

          await Promise.all(
            stores.map(async (store) => {
              const [storeProducts, storeOrders, storeCustomers, storeLogs] = await Promise.all([
                getSyncedProducts(store.id),
                getSyncedOrders(store.id),
                getSyncedCustomers(store.id),
                getSyncLogs(store.id),
              ]);
              allProducts.push(...(storeProducts || []));
              allOrders.push(...(storeOrders || []));
              allCustomers.push(...(storeCustomers || []));
              allLogs.push(...(storeLogs || []).slice(0, 5));
            })
          );

          setProducts(allProducts);
          setOrders(allOrders);
          setCustomers(allCustomers);
          setSyncLogs(allLogs.sort((a, b) => 
            new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
          ).slice(0, 10));
        } else {
          // Load data from selected store
          const [storeProducts, storeOrders, storeCustomers, storeLogs] = await Promise.all([
            getSyncedProducts(selectedStoreId),
            getSyncedOrders(selectedStoreId),
            getSyncedCustomers(selectedStoreId),
            getSyncLogs(selectedStoreId),
          ]);
          setProducts(storeProducts || []);
          setOrders(storeOrders || []);
          setCustomers(storeCustomers || []);
          setSyncLogs((storeLogs || []).slice(0, 10));
        }
      } catch (error) {
        console.error('Error loading sync data:', error);
      } finally {
        setDataLoading(false);
      }
    };

    if (stores.length > 0) {
      loadData();
    }
  }, [selectedStoreId, stores, getSyncedProducts, getSyncedOrders, getSyncedCustomers, getSyncLogs]);

  // Calculate statistics
  const stats: SyncStats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total_price || 0), 0);
    const activeProducts = products.filter((p) => p.status === 'active').length;
    const pendingOrders = orders.filter((o) => 
      o.fulfillment_status === 'pending' || o.fulfillment_status === null
    ).length;

    return {
      totalProducts: products.length,
      totalOrders: orders.length,
      totalCustomers: customers.length,
      totalRevenue,
      activeProducts,
      pendingOrders,
    };
  }, [products, orders, customers]);

  const loading = storesLoading || dataLoading;

  const getSyncStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'in_progress':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
    }
  };

  const getStoreName = (storeId: string) => {
    const store = stores.find((s) => s.id === storeId);
    return store?.store_name || 'Unknown Store';
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Sync Dashboard</h2>
          <p className="text-muted-foreground">
            Overview of your synced e-commerce data
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Select store" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stores</SelectItem>
              {stores.map((store) => (
                <SelectItem key={store.id} value={store.id}>
                  {store.store_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Empty State */}
      {!loading && stores.length === 0 && (
        <Card className="border-dashed">
          <CardHeader className="text-center py-12">
            <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Store className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>No stores connected</CardTitle>
            <CardDescription>
              Connect your first e-commerce store to see sync statistics.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Stats Cards */}
      {stores.length > 0 && (
        <SyncStatsCards stats={stats} loading={loading} />
      )}

      {/* Charts */}
      {stores.length > 0 && (
        <SyncCharts
          orders={orders}
          products={products}
          loading={loading}
        />
      )}

      {/* Recent Sync Activity */}
      {stores.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Sync Activity
            </CardTitle>
            <CardDescription>Latest synchronization logs across your stores</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="h-8 w-8 bg-muted animate-pulse rounded" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                      <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : syncLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No sync activity yet. Start by syncing one of your stores.
              </div>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {syncLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      {getSyncStatusIcon(log.status)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium truncate">
                            {getStoreName(log.store_id)}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {log.sync_type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span>
                            {log.items_synced || 0} synced
                            {log.items_failed > 0 && (
                              <span className="text-red-500 ml-1">
                                ({log.items_failed} failed)
                              </span>
                            )}
                          </span>
                          <span>
                            {formatDistanceToNow(new Date(log.started_at), { addSuffix: true })}
                          </span>
                        </div>
                        {log.error_message && (
                          <p className="text-sm text-red-500 mt-1 truncate">
                            {log.error_message}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant={log.status === 'completed' ? 'default' : log.status === 'failed' ? 'destructive' : 'secondary'}
                      >
                        {log.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default SyncDashboard;
