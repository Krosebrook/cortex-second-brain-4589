/**
 * Usage Monitoring Dashboard
 * Tracks rate limit hits, API latency, and usage patterns
 * Note: usage_tracking table not yet created — shows empty state
 */

import { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Activity, Clock, AlertTriangle, TrendingUp, RefreshCw, Gauge } from 'lucide-react';

type TimeRange = '24h' | '7d' | '30d';

export function UsageMonitoringDashboard() {
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [isLive, setIsLive] = useState(false);

  const toggleLive = useCallback(() => {
    setIsLive(prev => !prev);
  }, []);


  const statCards = [
    { label: 'Total Requests', value: '0', icon: Activity, color: 'text-primary' },
    { label: 'Rate Limit Hits', value: 0, icon: AlertTriangle, color: 'text-muted-foreground' },
    { label: 'Avg Latency', value: '0ms', icon: Clock, color: 'text-green-500' },
    { label: 'Active Features', value: 0, icon: Gauge, color: 'text-blue-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Usage Monitoring
          </h2>
          <p className="text-sm text-muted-foreground">
            Track API usage, rate limits, and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant={isLive ? "default" : "outline"} 
            size="sm"
            onClick={toggleLive}
            className="gap-2"
          >
            <span className={cn(
              "h-2 w-2 rounded-full",
              isLive ? "bg-green-500 animate-pulse" : "bg-muted-foreground"
            )} />
            {isLive ? 'Live' : 'Paused'}
          </Button>
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" disabled>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index} className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-xl font-bold">{stat.value}</p>
                </div>
                <div className={cn("p-2 rounded-lg bg-muted", stat.color)}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty state */}
      <Card className="border-border/50">
        <CardContent className="p-12 text-center text-muted-foreground">
          <Activity className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg font-medium">No usage data yet</p>
          <p className="text-sm">Usage tracking will be available once the tracking table is created.</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default UsageMonitoringDashboard;
