import { useState, useCallback } from 'react';
import { enhancedToast } from '@/components/feedback/EnhancedToast';
import { ConfirmationVariant } from '@/components/feedback/ConfirmationDialog';

export interface ConfirmationOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmationVariant;
  onConfirm: () => void | Promise<void>;
  successMessage?: {
    title: string;
    description?: string;
  };
  errorMessage?: {
    title: string;
    description?: string;
  };
}

export interface ConfirmationState {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText: string;
  cancelText: string;
  variant: ConfirmationVariant;
  onConfirm: () => void | Promise<void>;
  loading: boolean;
}

export const useConfirmation = () => {
  const [state, setState] = useState<ConfirmationState>({
    isOpen: false,
    title: '',
    description: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'default',
    onConfirm: () => {},
    loading: false
  });

  const confirm = useCallback((options: ConfirmationOptions) => {
    setState({
      isOpen: true,
      title: options.title,
      description: options.description,
      confirmText: options.confirmText || 'Confirm',
      cancelText: options.cancelText || 'Cancel',
      variant: options.variant || 'default',
      onConfirm: async () => {
        setState(prev => ({ ...prev, loading: true }));
        try {
          await options.onConfirm();
          
          if (options.successMessage) {
            enhancedToast.success(
              options.successMessage.title,
              options.successMessage.description
            );
          }
        } catch (error) {
          console.error('Confirmation action failed:', error);
          
          if (options.errorMessage) {
            enhancedToast.error(
              options.errorMessage.title,
              options.errorMessage.description
            );
          } else {
            enhancedToast.error('Error', 'Failed to complete action');
          }
        } finally {
          setState(prev => ({ ...prev, loading: false, isOpen: false }));
        }
      },
      loading: false
    });
  }, []);

  const close = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }));
  }, []);

  return {
    state,
    confirm,
    close
  };
};
