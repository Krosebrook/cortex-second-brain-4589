import { useWebVitals } from '@/hooks/useWebVitals';
import { WEB_VITALS_THRESHOLDS } from '@/lib/web-vitals';
import { cn } from '@/lib/utils';
import { Activity, Gauge, Clock, Eye, MousePointer, Zap } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface PerformanceMonitorProps {
  className?: string;
  compact?: boolean;
}

const METRIC_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  LCP: Eye,
  FID: MousePointer,
  CLS: Activity,
  INP: MousePointer,
  FCP: Zap,
  TTFB: Clock,
};

const METRIC_DESCRIPTIONS: Record<string, string> = {
  LCP: 'Largest Contentful Paint - Loading performance',
  FID: 'First Input Delay - Interactivity',
  CLS: 'Cumulative Layout Shift - Visual stability',
  INP: 'Interaction to Next Paint - Responsiveness',
  FCP: 'First Contentful Paint - Initial render',
  TTFB: 'Time to First Byte - Server response',
};

function formatValue(name: string, value: number): string {
  if (name === 'CLS') {
    return value.toFixed(3);
  }
  return `${Math.round(value)}ms`;
}

export function PerformanceMonitor({ className, compact = false }: PerformanceMonitorProps) {
  const { metricsArray, score, isLoading } = useWebVitals();

  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
              score >= 90 && 'bg-green-500/10 text-green-500',
              score >= 50 && score < 90 && 'bg-yellow-500/10 text-yellow-500',
              score < 50 && 'bg-red-500/10 text-red-500',
              className
            )}
          >
            <Gauge className="h-4 w-4" />
            <span>{isLoading ? '...' : `${score}`}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p className="font-medium">Performance Score: {score}/100</p>
          <p className="text-xs text-muted-foreground mt-1">
            Based on Core Web Vitals metrics
          </p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Gauge className="h-5 w-5" />
          Performance Metrics
        </h3>
        <div
          className={cn(
            'px-3 py-1 rounded-full text-sm font-medium',
            score >= 90 && 'bg-green-500/10 text-green-500',
            score >= 50 && score < 90 && 'bg-yellow-500/10 text-yellow-500',
            score < 50 && 'bg-red-500/10 text-red-500'
          )}
        >
          Score: {score}/100
        </div>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">
          Collecting performance metrics...
        </div>
      ) : metricsArray.length === 0 ? (
        <div className="text-sm text-muted-foreground">
          No metrics available yet. Interact with the page to generate metrics.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {metricsArray.map((metric) => {
            const Icon = METRIC_ICONS[metric.name] || Activity;
            const thresholds = WEB_VITALS_THRESHOLDS[metric.name as keyof typeof WEB_VITALS_THRESHOLDS];
            
            return (
              <div
                key={metric.name}
                className={cn(
                  'p-4 rounded-lg border transition-colors',
                  metric.rating === 'good' && 'border-green-500/30 bg-green-500/5',
                  metric.rating === 'needs-improvement' && 'border-yellow-500/30 bg-yellow-500/5',
                  metric.rating === 'poor' && 'border-red-500/30 bg-red-500/5'
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">{metric.name}</span>
                </div>
                <div
                  className={cn(
                    'text-2xl font-bold',
                    metric.rating === 'good' && 'text-green-500',
                    metric.rating === 'needs-improvement' && 'text-yellow-500',
                    metric.rating === 'poor' && 'text-red-500'
                  )}
                >
                  {formatValue(metric.name, metric.value)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {METRIC_DESCRIPTIONS[metric.name]}
                </div>
                {thresholds && (
                  <div className="text-xs text-muted-foreground mt-2">
                    Good: ≤{thresholds.good}{metric.name === 'CLS' ? '' : 'ms'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
