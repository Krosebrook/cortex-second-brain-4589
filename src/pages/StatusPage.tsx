import { useEffect, useState } from 'react';
import { serviceMonitor } from '@/lib/service-monitor';
import { ServiceStatusCard } from '@/components/status/ServiceStatusCard';
import { ResponseTimeChart } from '@/components/status/ResponseTimeChart';
import { PerformanceMonitor } from '@/components/performance/PerformanceMonitor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, AlertTriangle, Clock } from 'lucide-react';
import Navbar from '@/components/Navbar';

export default function StatusPage() {
  const [currentStatus, setCurrentStatus] = useState(serviceMonitor.getCurrentStatus());
  const [history, setHistory] = useState(serviceMonitor.getHistory(24));
  const [incidents, setIncidents] = useState(serviceMonitor.getRecentIncidents(24));
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Start monitoring
    serviceMonitor.startMonitoring(30000); // 30 seconds

    // Subscribe to updates
    const unsubscribe = serviceMonitor.onHistoryUpdate((newHistory) => {
      setHistory(newHistory);
      setCurrentStatus(serviceMonitor.getCurrentStatus());
      setIncidents(serviceMonitor.getRecentIncidents(24));
    });

    return () => {
      unsubscribe();
      serviceMonitor.stopMonitoring();
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Force an immediate check
    await new Promise(resolve => setTimeout(resolve, 1000));
    setCurrentStatus(serviceMonitor.getCurrentStatus());
    setHistory(serviceMonitor.getHistory(24));
    setIncidents(serviceMonitor.getRecentIncidents(24));
    setIsRefreshing(false);
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 mt-16">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold">System Status</h1>
              <p className="text-muted-foreground mt-2">
                Real-time monitoring of all services
              </p>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Overall Status */}
          {currentStatus && (
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Overall System Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className={`text-4xl font-bold ${
                    currentStatus.overall === 'healthy' ? 'text-green-500' :
                    currentStatus.overall === 'degraded' ? 'text-yellow-500' :
                    'text-red-500'
                  }`}>
                    {currentStatus.overall === 'healthy' ? 'All Systems Operational' :
                     currentStatus.overall === 'degraded' ? 'Some Services Degraded' :
                     'Service Outage'}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Last updated: {currentStatus.timestamp.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Service Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentStatus?.services.map((service) => (
              <ServiceStatusCard
                key={service.service}
                service={service}
                uptime={serviceMonitor.getUptimePercentage(service.service, 24)}
                avgResponseTime={serviceMonitor.getAverageResponseTime(service.service, 24)}
              />
            ))}
          </div>

          {/* Response Time Chart */}
          <ResponseTimeChart history={history} />

          {/* Performance Metrics */}
          <Card>
            <CardContent className="pt-6">
              <PerformanceMonitor />
            </CardContent>
          </Card>

          {/* Recent Incidents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Recent Incidents (Last 24 Hours)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {incidents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No incidents reported in the last 24 hours
                </div>
              ) : (
                <div className="space-y-4">
                  {incidents.map((incident, index) => (
                    <div key={index}>
                      {index > 0 && <Separator className="my-4" />}
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{incident.service}</span>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              incident.status === 'down' ? 'bg-red-500/10 text-red-500' :
                              'bg-yellow-500/10 text-yellow-500'
                            }`}>
                              {incident.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{incident.timestamp.toLocaleString()}</span>
                          </div>
                        </div>
                        {incident.duration && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Duration:</span>{' '}
                            <span className="font-medium">{formatDuration(incident.duration)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
