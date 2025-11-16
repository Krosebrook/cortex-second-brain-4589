import React from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X, Undo } from 'lucide-react';
import { toast as sonnerToast, ExternalToast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface EnhancedToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  progress?: number;
  action?: ToastAction;
  onUndo?: () => void;
  dismissible?: boolean;
}

const variantConfig = {
  success: {
    icon: CheckCircle2,
    className: 'text-green-600 dark:text-green-400',
    bgClassName: 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800',
  },
  error: {
    icon: AlertCircle,
    className: 'text-red-600 dark:text-red-400',
    bgClassName: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800',
  },
  warning: {
    icon: AlertTriangle,
    className: 'text-yellow-600 dark:text-yellow-400',
    bgClassName: 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800',
  },
  info: {
    icon: Info,
    className: 'text-blue-600 dark:text-blue-400',
    bgClassName: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800',
  },
};

export const enhancedToast = {
  show: (options: EnhancedToastOptions) => {
    const {
      title,
      description,
      variant = 'info',
      duration = 5000,
      progress,
      action,
      onUndo,
      dismissible = true,
    } = options;

    const config = variantConfig[variant];
    const Icon = config.icon;

    const toastContent = (
      <div className={cn('w-full rounded-lg border p-4', config.bgClassName)}>
        <div className="flex items-start gap-3">
          <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', config.className)} />
          
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <p className="font-semibold text-sm text-foreground">{title}</p>
                {description && (
                  <p className="text-sm text-muted-foreground">{description}</p>
                )}
              </div>
            </div>

            {progress !== undefined && (
              <div className="space-y-1">
                <Progress value={progress} className="h-1.5" />
                <p className="text-xs text-muted-foreground">{Math.round(progress)}%</p>
              </div>
            )}

            {(action || onUndo) && (
              <div className="flex items-center gap-2 pt-2">
                {onUndo && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onUndo();
                      sonnerToast.dismiss();
                    }}
                    className="h-7 text-xs"
                  >
                    <Undo className="h-3 w-3 mr-1" />
                    Undo
                  </Button>
                )}
                {action && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      action.onClick();
                      sonnerToast.dismiss();
                    }}
                    className="h-7 text-xs"
                  >
                    {action.label}
                  </Button>
                )}
              </div>
            )}
          </div>

          {dismissible && (
            <button
              onClick={() => sonnerToast.dismiss()}
              className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );

    const toastOptions: ExternalToast = {
      duration,
      unstyled: true,
      className: 'w-full',
    };

    return sonnerToast.custom(() => toastContent, toastOptions);
  },

  success: (title: string, description?: string, options?: Partial<EnhancedToastOptions>) => {
    return enhancedToast.show({
      title,
      description,
      variant: 'success',
      ...options,
    });
  },

  error: (title: string, description?: string, options?: Partial<EnhancedToastOptions>) => {
    return enhancedToast.show({
      title,
      description,
      variant: 'error',
      ...options,
    });
  },

  warning: (title: string, description?: string, options?: Partial<EnhancedToastOptions>) => {
    return enhancedToast.show({
      title,
      description,
      variant: 'warning',
      ...options,
    });
  },

  info: (title: string, description?: string, options?: Partial<EnhancedToastOptions>) => {
    return enhancedToast.show({
      title,
      description,
      variant: 'info',
      ...options,
    });
  },

  promise: <T,>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
    }
  ) => {
    return sonnerToast.promise(promise, {
      loading,
      success,
      error,
    });
  },

  // Specialized toast for destructive actions with undo
  destructive: (
    title: string,
    description: string,
    onUndo: () => void,
    options?: Partial<EnhancedToastOptions>
  ) => {
    return enhancedToast.show({
      title,
      description,
      variant: 'warning',
      onUndo,
      duration: 8000, // Longer duration for undo actions
      ...options,
    });
  },

  // Progress toast that can be updated
  progress: (title: string, initialProgress = 0) => {
    let toastId: string | number;
    let currentProgress = initialProgress;

    const show = () => {
      toastId = enhancedToast.show({
        title,
        progress: currentProgress,
        variant: 'info',
        duration: Infinity,
        dismissible: false,
      });
    };

    show();

    return {
      update: (progress: number, newTitle?: string) => {
        currentProgress = progress;
        sonnerToast.dismiss(toastId);
        toastId = enhancedToast.show({
          title: newTitle || title,
          progress: currentProgress,
          variant: 'info',
          duration: Infinity,
          dismissible: false,
        });
      },
      success: (successTitle?: string) => {
        sonnerToast.dismiss(toastId);
        enhancedToast.success(successTitle || title, 'Completed successfully');
      },
      error: (errorTitle?: string, errorDesc?: string) => {
        sonnerToast.dismiss(toastId);
        enhancedToast.error(errorTitle || title, errorDesc || 'Operation failed');
      },
      dismiss: () => {
        sonnerToast.dismiss(toastId);
      },
    };
  },
};
