/**
 * ApiKeyRotationDialog Component
 * Dialog for rotating store API keys with confirmation
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertTriangle, Key, Loader2, Shield } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { StoreWithoutApiKey } from '@/services/stores.service';

const rotationFormSchema = z.object({
  new_api_key: z
    .string()
    .min(1, 'New API key is required')
    .max(1000, 'API key must be less than 1000 characters'),
  confirm_api_key: z
    .string()
    .min(1, 'Please confirm the API key'),
}).refine((data) => data.new_api_key === data.confirm_api_key, {
  message: "API keys don't match",
  path: ['confirm_api_key'],
});

type RotationFormData = z.infer<typeof rotationFormSchema>;

interface ApiKeyRotationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  store: StoreWithoutApiKey | null;
  onRotate: (storeId: string, newApiKey: string) => Promise<void>;
  loading?: boolean;
}

export function ApiKeyRotationDialog({
  open,
  onOpenChange,
  store,
  onRotate,
  loading = false,
}: ApiKeyRotationDialogProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);

  const form = useForm<RotationFormData>({
    resolver: zodResolver(rotationFormSchema),
    defaultValues: {
      new_api_key: '',
      confirm_api_key: '',
    },
  });

  const handleClose = () => {
    form.reset();
    setShowConfirmation(false);
    onOpenChange(false);
  };

  const handleSubmit = async (data: RotationFormData) => {
    if (!store) return;

    if (!showConfirmation) {
      setShowConfirmation(true);
      return;
    }

    await onRotate(store.id, data.new_api_key);
    handleClose();
  };

  if (!store) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            Rotate API Key
          </DialogTitle>
          <DialogDescription>
            Replace the API key for <strong>{store.store_name}</strong>
          </DialogDescription>
        </DialogHeader>

        {showConfirmation && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> Rotating the API key will immediately invalidate
              the old key. Make sure you have generated a new key from your{' '}
              {store.platform} dashboard before proceeding.
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="new_api_key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New API Key</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Enter your new API key"
                      {...field}
                      disabled={loading || showConfirmation}
                      autoComplete="new-password"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirm_api_key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm API Key</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Confirm your new API key"
                      {...field}
                      disabled={loading || showConfirmation}
                      autoComplete="new-password"
                    />
                  </FormControl>
                  <FormDescription>
                    Re-enter the API key to confirm.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-sm">
              <Shield className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-muted-foreground">
                Your API key will be encrypted using AES-256-GCM before storage.
                Access to this key is logged for security monitoring.
              </p>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>
              {showConfirmation ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowConfirmation(false)}
                    disabled={loading}
                  >
                    Go Back
                  </Button>
                  <Button type="submit" variant="destructive" disabled={loading}>
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Confirm Rotation
                  </Button>
                </>
              ) : (
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Continue
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
