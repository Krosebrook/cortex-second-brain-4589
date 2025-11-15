import { ServiceHealth } from '@/lib/connection-manager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertCircle, XCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ServiceStatusCardProps {
  service: ServiceHealth;
  uptime: number;
  avgResponseTime: number;
}

export const ServiceStatusCard = ({
  service,
  uptime,
  avgResponseTime,
}: ServiceStatusCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'degraded':
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'down':
        return 'text-red-500 bg-red-500/10 border-red-500/20';
      default:
        return 'text-muted-foreground bg-muted/10 border-border';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5" />;
      case 'degraded':
        return <AlertCircle className="h-5 w-5" />;
      case 'down':
        return <XCircle className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  return (
    <Card className={cn('border-2 transition-colors', getStatusColor(service.status))}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <span>{service.service}</span>
          <div className={cn('flex items-center gap-2', getStatusColor(service.status))}>
            {getStatusIcon(service.status)}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Status</span>
          <span className={cn('font-medium capitalize', getStatusColor(service.status))}>
            {service.status}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Uptime (24h)</span>
          <span className="font-medium">{uptime.toFixed(2)}%</span>
        </div>

        {service.responseTime !== undefined && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Response Time</span>
            <span className="font-medium">{service.responseTime}ms</span>
          </div>
        )}

        {avgResponseTime > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Avg Response (24h)</span>
            <span className="font-medium">{Math.round(avgResponseTime)}ms</span>
          </div>
        )}

        {service.error && (
          <div className="pt-2 border-t">
            <p className="text-xs text-destructive">{service.error}</p>
          </div>
        )}

        <div className="text-xs text-muted-foreground pt-2 border-t">
          Last checked: {service.lastCheck.toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  );
};
