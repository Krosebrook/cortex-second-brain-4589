import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface HealthHistory {
  timestamp: Date;
  services: Array<{
    service: string;
    responseTime?: number;
  }>;
}

interface ResponseTimeChartProps {
  history: HealthHistory[];
}

export const ResponseTimeChart = ({ history }: ResponseTimeChartProps) => {
  const chartData = useMemo(() => {
    return history.map(entry => {
      const dataPoint: any = {
        time: entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      entry.services.forEach(service => {
        if (service.responseTime !== undefined) {
          dataPoint[service.service] = service.responseTime;
        }
      });

      return dataPoint;
    });
  }, [history]);

  const services = useMemo(() => {
    if (history.length === 0) return [];
    const serviceSet = new Set<string>();
    history.forEach(entry => {
      entry.services.forEach(service => {
        if (service.responseTime !== undefined) {
          serviceSet.add(service.service);
        }
      });
    });
    return Array.from(serviceSet);
  }, [history]);

  const colors = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))'];

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Response Time Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No data available yet. Service monitoring will collect data over time.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Response Time Trends (Last 24 Hours)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="time" 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              label={{ value: 'Response Time (ms)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Legend />
            {services.map((service, index) => (
              <Line
                key={service}
                type="monotone"
                dataKey={service}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
