/**
 * Usage Monitoring Dashboard
 * Tracks rate limit hits, API latency, and usage patterns
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { 
  Activity, 
  Clock, 
  AlertTriangle, 
  TrendingUp,
  RefreshCw,
  Gauge
} from 'lucide-react';

interface UsageData {
  feature: string;
  usage_count: number;
  date: string;
  metadata: {
    latency_ms?: number;
    rate_limited?: boolean;
    endpoint?: string;
  } | null;
}

interface UsageStats {
  totalRequests: number;
  rateLimitHits: number;
  avgLatency: number;
  topFeatures: { name: string; count: number }[];
  hourlyUsage: { hour: string; count: number }[];
  rateLimitByFeature: { feature: string; hits: number }[];
}

type TimeRange = '24h' | '7d' | '30d';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--muted-foreground))', '#22c55e', '#eab308', '#f97316'];

export function UsageMonitoringDashboard() {
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');

  const getDateRange = (range: TimeRange) => {
    const now = new Date();
    switch (range) {
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  };

  const { data: usageData, isLoading, refetch } = useQuery({
    queryKey: ['usage-monitoring', timeRange],
    queryFn: async () => {
      const startDate = getDateRange(timeRange);
      
      const { data, error } = await supabase
        .from('usage_tracking')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;
      return data as UsageData[];
    },
    staleTime: 60000, // 1 minute
  });

  const stats = useMemo<UsageStats>(() => {
    if (!usageData || usageData.length === 0) {
      return {
        totalRequests: 0,
        rateLimitHits: 0,
        avgLatency: 0,
        topFeatures: [],
        hourlyUsage: [],
        rateLimitByFeature: [],
      };
    }

    // Total requests
    const totalRequests = usageData.reduce((sum, d) => sum + (d.usage_count || 1), 0);

    // Rate limit hits
    const rateLimitHits = usageData.filter(d => d.metadata?.rate_limited).length;

    // Average latency
    const latencyData = usageData.filter(d => d.metadata?.latency_ms);
    const avgLatency = latencyData.length > 0
      ? latencyData.reduce((sum, d) => sum + (d.metadata?.latency_ms || 0), 0) / latencyData.length
      : 0;

    // Top features
    const featureCounts = new Map<string, number>();
    usageData.forEach(d => {
      const current = featureCounts.get(d.feature) || 0;
      featureCounts.set(d.feature, current + (d.usage_count || 1));
    });
    const topFeatures = Array.from(featureCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // Hourly usage (for 24h view) or daily usage (for other views)
    const usageByPeriod = new Map<string, number>();
    usageData.forEach(d => {
      const date = new Date(d.date);
      const key = timeRange === '24h'
        ? date.toLocaleTimeString('en-US', { hour: '2-digit' })
        : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const current = usageByPeriod.get(key) || 0;
      usageByPeriod.set(key, current + (d.usage_count || 1));
    });
    const hourlyUsage = Array.from(usageByPeriod.entries())
      .map(([hour, count]) => ({ hour, count }))
      .reverse()
      .slice(-12);

    // Rate limits by feature
    const rateLimitsByFeature = new Map<string, number>();
    usageData
      .filter(d => d.metadata?.rate_limited)
      .forEach(d => {
        const current = rateLimitsByFeature.get(d.feature) || 0;
        rateLimitsByFeature.set(d.feature, current + 1);
      });
    const rateLimitByFeature = Array.from(rateLimitsByFeature.entries())
      .map(([feature, hits]) => ({ feature, hits }))
      .sort((a, b) => b.hits - a.hits);

    return {
      totalRequests,
      rateLimitHits,
      avgLatency: Math.round(avgLatency),
      topFeatures,
      hourlyUsage,
      rateLimitByFeature,
    };
  }, [usageData, timeRange]);

  const statCards = [
    { 
      label: 'Total Requests', 
      value: stats.totalRequests.toLocaleString(), 
      icon: Activity, 
      color: 'text-primary' 
    },
    { 
      label: 'Rate Limit Hits', 
      value: stats.rateLimitHits, 
      icon: AlertTriangle, 
      color: stats.rateLimitHits > 10 ? 'text-destructive' : 'text-yellow-500'
    },
    { 
      label: 'Avg Latency', 
      value: `${stats.avgLatency}ms`, 
      icon: Clock, 
      color: stats.avgLatency > 1000 ? 'text-destructive' : 'text-green-500'
    },
    { 
      label: 'Active Features', 
      value: stats.topFeatures.length, 
      icon: Gauge, 
      color: 'text-blue-500' 
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

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
          <Button variant="outline" size="icon" onClick={() => refetch()}>
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

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Over Time */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Usage Over Time</CardTitle>
            <CardDescription>Request volume by {timeRange === '24h' ? 'hour' : 'day'}</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.hourlyUsage.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No usage data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={stats.hourlyUsage}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="hour" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top Features */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Top Features</CardTitle>
            <CardDescription>Most used API endpoints</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.topFeatures.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No feature data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.topFeatures} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                    width={100}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="hsl(var(--primary))" 
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Rate Limit Distribution */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Rate Limit Hits</CardTitle>
            <CardDescription>Distribution by feature</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.rateLimitByFeature.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Badge variant="secondary" className="mb-2">No Rate Limits</Badge>
                  <p className="text-sm">No rate limit violations detected</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={stats.rateLimitByFeature}
                    dataKey="hits"
                    nameKey="feature"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ feature }) => feature}
                  >
                    {stats.rateLimitByFeature.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Recent Rate Limit Events */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Recent Rate Limit Events
            </CardTitle>
            <CardDescription>Latest blocked requests</CardDescription>
          </CardHeader>
          <CardContent>
            {!usageData || usageData.filter(d => d.metadata?.rate_limited).length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                No rate limit events
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {usageData
                  .filter(d => d.metadata?.rate_limited)
                  .slice(0, 10)
                  .map((event, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{event.feature}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(event.date).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="destructive">Blocked</Badge>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default UsageMonitoringDashboard;
