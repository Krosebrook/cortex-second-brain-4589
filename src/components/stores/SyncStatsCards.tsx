/**
 * SyncStatsCards Component
 * Displays summary statistics cards for synced data
 */

import { Package, ShoppingCart, Users, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface SyncStats {
  totalProducts: number;
  totalOrders: number;
  totalCustomers: number;
  totalRevenue: number;
  activeProducts: number;
  pendingOrders: number;
  revenueChange?: number;
  ordersChange?: number;
}

interface SyncStatsCardsProps {
  stats: SyncStats;
  loading?: boolean;
  className?: string;
}

export function SyncStatsCards({ stats, loading, className }: SyncStatsCardsProps) {
  const cards = [
    {
      title: 'Total Products',
      value: stats.totalProducts,
      subValue: `${stats.activeProducts} active`,
      icon: Package,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      subValue: `${stats.pendingOrders} pending`,
      icon: ShoppingCart,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      change: stats.ordersChange,
    },
    {
      title: 'Customers',
      value: stats.totalCustomers,
      subValue: 'All time',
      icon: Users,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Total Revenue',
      value: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(stats.totalRevenue),
      subValue: 'All stores',
      icon: DollarSign,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      change: stats.revenueChange,
    },
  ];

  if (loading) {
    return (
      <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-4', className)}>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-8 w-8 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-20 bg-muted animate-pulse rounded mb-1" />
              <div className="h-3 w-16 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-4', className)}>
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center', card.bgColor)}>
              <card.icon className={cn('h-4 w-4', card.color)} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-muted-foreground">{card.subValue}</p>
              {card.change !== undefined && (
                <span className={cn(
                  'flex items-center text-xs font-medium',
                  card.change >= 0 ? 'text-green-500' : 'text-red-500'
                )}>
                  {card.change >= 0 ? (
                    <TrendingUp className="h-3 w-3 mr-0.5" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-0.5" />
                  )}
                  {Math.abs(card.change)}%
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
