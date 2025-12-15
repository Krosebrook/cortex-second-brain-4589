/**
 * StoreFormDialog Component
 * Create/Edit store form dialog
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { StoreWithoutApiKey, StoreInsert, StoreUpdate } from '@/services/stores.service';

const PLATFORMS = [
  { value: 'shopify', label: 'Shopify' },
  { value: 'woocommerce', label: 'WooCommerce' },
  { value: 'etsy', label: 'Etsy' },
  { value: 'amazon', label: 'Amazon' },
  { value: 'ebay', label: 'eBay' },
  { value: 'bigcommerce', label: 'BigCommerce' },
  { value: 'magento', label: 'Magento' },
  { value: 'other', label: 'Other' },
] as const;

const storeFormSchema = z.object({
  store_name: z
    .string()
    .min(1, 'Store name is required')
    .max(100, 'Store name must be less than 100 characters')
    .trim(),
  platform: z.string().min(1, 'Platform is required'),
  store_url: z
    .string()
    .url('Please enter a valid URL')
    .max(500, 'URL must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  api_key_encrypted: z
    .string()
    .max(1000, 'API key must be less than 1000 characters')
    .optional()
    .or(z.literal('')),
});

type StoreFormData = z.infer<typeof storeFormSchema>;

interface StoreFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  store?: StoreWithoutApiKey | null;
  onSubmit: (data: Omit<StoreInsert, 'user_id'> | StoreUpdate) => Promise<void>;
  loading?: boolean;
}

export function StoreFormDialog({
  open,
  onOpenChange,
  store,
  onSubmit,
  loading = false,
}: StoreFormDialogProps) {
  const isEditing = !!store;

  const form = useForm<StoreFormData>({
    resolver: zodResolver(storeFormSchema),
    defaultValues: {
      store_name: '',
      platform: '',
      store_url: '',
      api_key_encrypted: '',
    },
  });

  // Reset form when dialog opens/closes or store changes
  useEffect(() => {
    if (open) {
      if (store) {
        form.reset({
          store_name: store.store_name,
          platform: store.platform,
          store_url: store.store_url || '',
          api_key_encrypted: '',
        });
      } else {
        form.reset({
          store_name: '',
          platform: '',
          store_url: '',
          api_key_encrypted: '',
        });
      }
    }
  }, [open, store, form]);

  const handleSubmit = async (data: StoreFormData) => {
    const submitData: Omit<StoreInsert, 'user_id'> | StoreUpdate = {
      store_name: data.store_name,
      platform: data.platform,
      store_url: data.store_url || null,
    };

    // Only include API key if provided (for new stores or key update)
    if (data.api_key_encrypted) {
      submitData.api_key_encrypted = data.api_key_encrypted;
    }

    await onSubmit(submitData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Store' : 'Add New Store'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update your store configuration. Leave API key blank to keep the existing one.'
              : 'Connect a new e-commerce store to sync your products.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="store_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Store Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="My Awesome Store"
                      {...field}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="platform"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Platform</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={loading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a platform" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PLATFORMS.map((platform) => (
                        <SelectItem key={platform.value} value={platform.value}>
                          {platform.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="store_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Store URL (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://mystore.com"
                      {...field}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="api_key_encrypted"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    API Key {isEditing && '(Leave blank to keep existing)'}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder={isEditing ? '••••••••' : 'Enter your API key'}
                      {...field}
                      disabled={loading}
                      autoComplete="new-password"
                    />
                  </FormControl>
                  <FormDescription>
                    Your API key will be encrypted before storage.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isEditing ? 'Save Changes' : 'Add Store'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
