/**
 * SyncCharts Component
 * Charts for visualizing synced store data
 */

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Order {
  id: string;
  order_date: string | null;
  total_price: number | null;
  financial_status: string | null;
}

interface Product {
  id: string;
  product_type: string | null;
  status: string | null;
  price_min: number | null;
}

interface SyncChartsProps {
  orders: Order[];
  products: Product[];
  loading?: boolean;
  className?: string;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  'hsl(142, 76%, 36%)',
  'hsl(38, 92%, 50%)',
  'hsl(280, 65%, 60%)',
  'hsl(200, 70%, 50%)',
];

export function SyncCharts({ orders, products, loading, className }: SyncChartsProps) {
  // Process orders by date for area chart
  const ordersByDate = useMemo(() => {
    const grouped: Record<string, { date: string; orders: number; revenue: number }> = {};
    
    orders.forEach((order) => {
      if (!order.order_date) return;
      const date = new Date(order.order_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      
      if (!grouped[date]) {
        grouped[date] = { date, orders: 0, revenue: 0 };
      }
      grouped[date].orders += 1;
      grouped[date].revenue += order.total_price || 0;
    });
    
    return Object.values(grouped).slice(-14); // Last 14 days
  }, [orders]);

  // Process products by category for pie chart
  const productsByCategory = useMemo(() => {
    const grouped: Record<string, number> = {};
    
    products.forEach((product) => {
      const category = product.product_type || 'Uncategorized';
      grouped[category] = (grouped[category] || 0) + 1;
    });
    
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6); // Top 6 categories
  }, [products]);

  // Process orders by status for bar chart
  const ordersByStatus = useMemo(() => {
    const grouped: Record<string, number> = {};
    
    orders.forEach((order) => {
      const status = order.financial_status || 'unknown';
      grouped[status] = (grouped[status] || 0) + 1;
    });
    
    return Object.entries(grouped).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
  }, [orders]);

  if (loading) {
    return (
      <div className={cn('grid gap-4 lg:grid-cols-2', className)}>
        {[1, 2, 3].map((i) => (
          <Card key={i} className={i === 1 ? 'lg:col-span-2' : ''}>
            <CardHeader>
              <div className="h-5 w-32 bg-muted animate-pulse rounded" />
              <div className="h-4 w-48 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-[250px] bg-muted/50 animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('grid gap-4 lg:grid-cols-2', className)}>
      {/* Revenue Over Time */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Revenue & Orders</CardTitle>
          <CardDescription>Daily revenue and order count over the last 14 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {ordersByDate.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ordersByDate}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
                  />
                  <Legend />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue ($)"
                    stroke="hsl(var(--primary))"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="orders"
                    name="Orders"
                    stroke="hsl(var(--accent))"
                    fill="transparent"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No order data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Products by Category */}
      <Card>
        <CardHeader>
          <CardTitle>Products by Category</CardTitle>
          <CardDescription>Distribution of products across categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            {productsByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={productsByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} (${(percent * 100).toFixed(0)}%)`
                    }
                    labelLine={false}
                  >
                    {productsByCategory.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No product data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Orders by Status */}
      <Card>
        <CardHeader>
          <CardTitle>Orders by Status</CardTitle>
          <CardDescription>Breakdown of order financial status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            {ordersByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ordersByStatus} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    type="number"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar
                    dataKey="value"
                    name="Orders"
                    fill="hsl(var(--primary))"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No order data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
