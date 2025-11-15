import { useEffect, useState } from 'react';
import { connectionManager } from '@/lib/connection-manager';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ReconnectionBanner = () => {
  const [reconnectState, setReconnectState] = useState(connectionManager.getReconnectState());
  const [status, setStatus] = useState<'reconnecting' | 'success' | 'failed' | null>(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const state = connectionManager.getReconnectState();
      setReconnectState(state);

      if (state.isReconnecting) {
        setStatus('reconnecting');
        setCountdown(Math.ceil(state.nextRetryIn / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const unsubscribe = connectionManager.onStatusChange((connectionStatus) => {
      if (connectionStatus.overall === 'healthy') {
        setStatus('success');
        setTimeout(() => setStatus(null), 3000);
      }
    });

    return unsubscribe;
  }, []);

  const handleManualRetry = () => {
    connectionManager.startReconnect(
      () => {
        setStatus('success');
        setTimeout(() => setStatus(null), 3000);
      },
      () => {
        setStatus('failed');
      }
    );
  };

  if (!status) return null;

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-50 px-4 py-3 text-sm transition-all duration-300',
        status === 'reconnecting' && 'bg-warning/90 text-warning-foreground',
        status === 'success' && 'bg-success/90 text-success-foreground',
        status === 'failed' && 'bg-destructive/90 text-destructive-foreground'
      )}
    >
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {status === 'reconnecting' && (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>
                Reconnecting... Attempt {reconnectState.attempts}/{reconnectState.maxAttempts}
                {countdown > 0 && `, next retry in ${countdown}s`}
              </span>
            </>
          )}
          {status === 'success' && (
            <>
              <CheckCircle className="h-4 w-4" />
              <span>Successfully reconnected!</span>
            </>
          )}
          {status === 'failed' && (
            <>
              <XCircle className="h-4 w-4" />
              <span>
                Reconnection failed after {reconnectState.maxAttempts} attempts
              </span>
            </>
          )}
        </div>

        {(status === 'reconnecting' || status === 'failed') && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleManualRetry}
            className="shrink-0"
          >
            <RefreshCw className="h-3 w-3 mr-2" />
            Retry Now
          </Button>
        )}
      </div>
    </div>
  );
};
