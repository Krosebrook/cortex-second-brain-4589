import { Navigate } from 'react-router-dom';
import { AnimatedTransition } from '@/components/AnimatedTransition';
import { useAnimateIn } from '@/lib/animations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import { RateLimitSettings } from '@/components/admin/RateLimitSettings';
import { FailedLoginAttempts } from '@/components/admin/FailedLoginAttempts';
import { UsageMonitoringDashboard } from '@/components/admin/UsageMonitoringDashboard';
import { cn } from '@/lib/utils';
import { 
  Shield, 
  AlertTriangle, 
  Ban, 
  Activity,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';

const AdminDashboard = () => {
  const showContent = useAnimateIn(false, 300);
  const {
    isAdmin,
    isCheckingAdmin,
    stats,
    alerts,
    blockedIPs,
    threatResponses,
    userActivity,
    isLoading,
    unblockIP,
    formatTimeAgo,
    refetch
  } = useAdminDashboard();

  // Redirect non-admins
  if (!isCheckingAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (isCheckingAdmin) {
    return (
      <PageWrapper>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
        </div>
      </PageWrapper>
    );
  }

  const statCards = [
    { label: 'Total Alerts', value: stats.totalAlerts, icon: AlertTriangle, color: 'text-yellow-500' },
    { label: 'Critical Alerts', value: stats.criticalAlerts, icon: Shield, color: 'text-red-500' },
    { label: 'Blocked IPs', value: stats.blockedIPs, icon: Ban, color: 'text-orange-500' },
    { label: 'Today\'s Activity', value: stats.recentActivities, icon: Activity, color: 'text-blue-500' },
  ];

  return (
    <PageWrapper>
      <AnimatedTransition show={showContent} animation="slide-up">
        <div className="flex items-center justify-between mb-6">
          <PageHeader
            title="Admin Dashboard"
            description="Monitor security events, manage blocked IPs, and track user activity."
          />
          <Button variant="outline" onClick={refetch} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <Card key={index} className="border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  </div>
                  <div className={cn("p-3 rounded-lg bg-muted", stat.color)}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Rate Limit Settings */}
        <div className="mb-8">
          <RateLimitSettings />
        </div>

        {/* Usage Monitoring Dashboard */}
        <div className="mb-8">
          <UsageMonitoringDashboard />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Failed Login Attempts */}
          <FailedLoginAttempts />
          {/* Security Alerts */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Recent Security Alerts
              </CardTitle>
              <CardDescription>Latest security events detected</CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No security alerts</p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {alerts.slice(0, 10).map((alert) => (
                    <div key={alert.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                        {alert.severity}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{alert.alert_type}</p>
                        <p className="text-xs text-muted-foreground">IP: {alert.ip_address}</p>
                        <p className="text-xs text-muted-foreground">{formatTimeAgo(alert.triggered_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Blocked IPs */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ban className="h-5 w-5 text-red-500" />
                Blocked IPs
              </CardTitle>
              <CardDescription>Currently blocked IP addresses</CardDescription>
            </CardHeader>
            <CardContent>
              {blockedIPs.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No blocked IPs</p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {blockedIPs.map((ip) => (
                    <div key={ip.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-mono text-sm">{ip.ip_address}</p>
                        <p className="text-xs text-muted-foreground">{ip.reason}</p>
                        {ip.permanent && <Badge variant="destructive" className="mt-1">Permanent</Badge>}
                      </div>
                      <Button variant="outline" size="sm" onClick={() => unblockIP(ip.id)}>
                        Unblock
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Threat Responses */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Threat Responses
              </CardTitle>
              <CardDescription>Automated security actions taken</CardDescription>
            </CardHeader>
            <CardContent>
              {threatResponses.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No threat responses</p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {threatResponses.slice(0, 10).map((response) => (
                    <div key={response.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      {response.success ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{response.action_taken}</p>
                        <p className="text-xs text-muted-foreground">{formatTimeAgo(response.executed_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* User Activity */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                Recent User Activity
              </CardTitle>
              <CardDescription>Latest user actions</CardDescription>
            </CardHeader>
            <CardContent>
              {userActivity.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No recent activity</p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {userActivity.slice(0, 10).map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.activity_type}</p>
                        <p className="text-xs text-muted-foreground">IP: {activity.ip_address}</p>
                        <p className="text-xs text-muted-foreground">{formatTimeAgo(activity.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AnimatedTransition>
    </PageWrapper>
  );
};

export default AdminDashboard;