/**
 * StoresManager Component
 * Main component for managing e-commerce store connections
 */

import { useState, useCallback } from 'react';
import { Plus, Store, RefreshCw, Shield, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStores } from '@/hooks/useStores';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { StoreCard } from './StoreCard';
import { StoreFormDialog } from './StoreFormDialog';
import { ApiKeyRotationDialog } from './ApiKeyRotationDialog';
import { SyncProgressIndicator } from './SyncProgressIndicator';
import type { StoreWithoutApiKey, StoreInsert, StoreUpdate } from '@/services/stores.service';

interface StoresManagerProps {
  className?: string;
}

export function StoresManager({ className }: StoresManagerProps) {
  const {
    stores,
    loading,
    error,
    createStore,
    updateStore,
    updateStoreApiKey,
    deleteStore,
    syncStore,
    refreshStores,
    checkUnusualAccess,
  } = useStores();

  const [formOpen, setFormOpen] = useState(false);
  const [rotationOpen, setRotationOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<StoreWithoutApiKey | null>(null);
  const [rotatingStore, setRotatingStore] = useState<StoreWithoutApiKey | null>(null);
  const [syncingStoreId, setSyncingStoreId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [unusualAccess, setUnusualAccess] = useState<{
    is_unusual: boolean;
    access_count: number;
  } | null>(null);

  // Check for unusual access on mount
  const handleCheckSecurity = useCallback(async () => {
    const result = await checkUnusualAccess();
    if (result) {
      setUnusualAccess(result);
    }
  }, [checkUnusualAccess]);

  // Handle create/edit form submission
  const handleFormSubmit = async (data: Omit<StoreInsert, 'user_id'> | StoreUpdate) => {
    setFormLoading(true);
    try {
      if (editingStore) {
        await updateStore(editingStore.id, data);
      } else {
        await createStore(data as Omit<StoreInsert, 'user_id'>);
      }
      setEditingStore(null);
    } finally {
      setFormLoading(false);
    }
  };

  // Handle API key rotation
  const handleRotateKey = async (storeId: string, newApiKey: string) => {
    setFormLoading(true);
    try {
      await updateStoreApiKey(storeId, newApiKey);
      setRotatingStore(null);
    } finally {
      setFormLoading(false);
    }
  };

  // Handle sync
  const handleSync = async (storeId: string) => {
    setSyncingStoreId(storeId);
    try {
      await syncStore(storeId);
    } finally {
      setSyncingStoreId(null);
    }
  };

  // Open edit dialog
  const handleEdit = (store: StoreWithoutApiKey) => {
    setEditingStore(store);
    setFormOpen(true);
  };

  // Open rotation dialog
  const handleRotation = (store: StoreWithoutApiKey) => {
    setRotatingStore(store);
    setRotationOpen(true);
  };

  // Open create dialog
  const handleCreate = () => {
    setEditingStore(null);
    setFormOpen(true);
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Connected Stores</h2>
          <p className="text-muted-foreground">
            Manage your e-commerce platform connections
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCheckSecurity}
            className="gap-2"
          >
            <Shield className="h-4 w-4" />
            Check Security
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshStores()}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            Refresh
          </Button>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Store
          </Button>
        </div>
      </div>

      {/* Security Alert */}
      {unusualAccess?.is_unusual && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Unusual Activity Detected</AlertTitle>
          <AlertDescription>
            We detected {unusualAccess.access_count} API key access attempts in the last hour.
            If this wasn't you, please rotate your API keys immediately.
          </AlertDescription>
        </Alert>
      )}

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {loading && stores.length === 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && stores.length === 0 && (
        <Card className="border-dashed">
          <CardHeader className="text-center py-12">
            <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Store className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>No stores connected</CardTitle>
            <CardDescription>
              Connect your first e-commerce store to start syncing products.
            </CardDescription>
            <Button onClick={handleCreate} className="mt-4 gap-2">
              <Plus className="h-4 w-4" />
              Add Your First Store
            </Button>
          </CardHeader>
        </Card>
      )}

      {/* Sync Progress Indicators */}
      {stores.length > 0 && (
        <div className="space-y-2">
          {stores.map((store) => (
            <SyncProgressIndicator
              key={`progress-${store.id}`}
              storeId={store.id}
              onComplete={() => refreshStores()}
            />
          ))}
        </div>
      )}

      {/* Stores List */}
      {stores.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stores.map((store) => (
            <StoreCard
              key={store.id}
              store={store}
              onEdit={handleEdit}
              onRotateKey={handleRotation}
              onSync={handleSync}
              onDelete={deleteStore}
              syncing={syncingStoreId === store.id}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <StoreFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        store={editingStore}
        onSubmit={handleFormSubmit}
        loading={formLoading}
      />

      {/* API Key Rotation Dialog */}
      <ApiKeyRotationDialog
        open={rotationOpen}
        onOpenChange={setRotationOpen}
        store={rotatingStore}
        onRotate={handleRotateKey}
        loading={formLoading}
      />
    </div>
  );
}

export default StoresManager;
