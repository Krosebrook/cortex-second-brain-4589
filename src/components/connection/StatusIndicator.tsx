import { useState, useEffect } from 'react';
import { connectionManager, ConnectionStatus } from '@/lib/connection-manager';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Activity, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export const StatusIndicator = () => {
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Initial check
    connectionManager.checkAllServices().then(setStatus);

    // Subscribe to status changes
    const unsubscribe = connectionManager.onStatusChange(setStatus);

    return unsubscribe;
  }, []);

  const getStatusColor = (statusValue: 'healthy' | 'degraded' | 'down') => {
    switch (statusValue) {
      case 'healthy':
        return 'text-green-500';
      case 'degraded':
        return 'text-yellow-500';
      case 'down':
        return 'text-red-500';
    }
  };

  const getStatusIcon = (statusValue: 'healthy' | 'degraded' | 'down') => {
    switch (statusValue) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4" />;
      case 'degraded':
        return <AlertCircle className="h-4 w-4" />;
      case 'down':
        return <XCircle className="h-4 w-4" />;
    }
  };

  if (!status) return null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-9 w-9 p-0"
          title="Service Status"
        >
          <Activity className={cn('h-4 w-4', getStatusColor(status.overall))} />
          <span className="sr-only">Service Status</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">System Status</h4>
            <div className={cn('flex items-center gap-2', getStatusColor(status.overall))}>
              {getStatusIcon(status.overall)}
              <span className="text-sm capitalize">{status.overall}</span>
            </div>
          </div>

          <div className="space-y-3">
            {status.services.map((service) => (
              <div
                key={service.service}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-muted-foreground">{service.service}</span>
                <div className="flex items-center gap-2">
                  {service.responseTime && (
                    <span className="text-xs text-muted-foreground">
                      {service.responseTime}ms
                    </span>
                  )}
                  <div className={cn('flex items-center gap-1', getStatusColor(service.status))}>
                    {getStatusIcon(service.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                setIsOpen(false);
                window.location.href = '/status';
              }}
            >
              View Detailed Status
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
