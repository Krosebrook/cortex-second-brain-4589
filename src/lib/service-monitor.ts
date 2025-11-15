import { connectionManager, ServiceHealth } from './connection-manager';

interface HealthHistory {
  timestamp: Date;
  services: ServiceHealth[];
  overall: 'healthy' | 'degraded' | 'down';
}

class ServiceMonitor {
  private history: HealthHistory[] = [];
  private maxHistorySize = 288; // 24 hours at 5-minute intervals
  private monitorInterval: NodeJS.Timeout | null = null;
  private listeners: ((history: HealthHistory[]) => void)[] = [];

  // Start monitoring services
  startMonitoring(intervalMs: number = 30000): void {
    if (this.monitorInterval) {
      return; // Already monitoring
    }

    // Initial check
    this.checkAndStore();

    // Set up periodic checks
    this.monitorInterval = setInterval(() => {
      this.checkAndStore();
    }, intervalMs);

    console.log(`Service monitoring started (interval: ${intervalMs}ms)`);
  }

  // Stop monitoring
  stopMonitoring(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
      console.log('Service monitoring stopped');
    }
  }

  // Check services and store in history
  private async checkAndStore(): Promise<void> {
    try {
      const status = await connectionManager.checkAllServices();
      
      const historyEntry: HealthHistory = {
        timestamp: status.timestamp,
        services: status.services,
        overall: status.overall,
      };

      this.history.push(historyEntry);

      // Keep only the most recent entries
      if (this.history.length > this.maxHistorySize) {
        this.history = this.history.slice(-this.maxHistorySize);
      }

      // Notify listeners
      this.notifyListeners();
    } catch (error) {
      console.error('Error checking services:', error);
    }
  }

  // Get health history
  getHistory(hours: number = 24): HealthHistory[] {
    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    return this.history.filter(entry => entry.timestamp.getTime() > cutoff);
  }

  // Get current status
  getCurrentStatus(): HealthHistory | null {
    return this.history.length > 0 ? this.history[this.history.length - 1] : null;
  }

  // Calculate uptime percentage
  getUptimePercentage(serviceName: string, hours: number = 24): number {
    const history = this.getHistory(hours);
    if (history.length === 0) return 100;

    const healthyCount = history.filter(entry => {
      const service = entry.services.find(s => s.service === serviceName);
      return service?.status === 'healthy';
    }).length;

    return (healthyCount / history.length) * 100;
  }

  // Get average response time
  getAverageResponseTime(serviceName: string, hours: number = 24): number {
    const history = this.getHistory(hours);
    const responseTimes: number[] = [];

    history.forEach(entry => {
      const service = entry.services.find(s => s.service === serviceName);
      if (service?.responseTime) {
        responseTimes.push(service.responseTime);
      }
    });

    if (responseTimes.length === 0) return 0;
    return responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  }

  // Get recent incidents
  getRecentIncidents(hours: number = 24): Array<{
    service: string;
    status: string;
    timestamp: Date;
    duration?: number;
  }> {
    const history = this.getHistory(hours);
    const incidents: Array<{
      service: string;
      status: string;
      timestamp: Date;
      duration?: number;
    }> = [];

    let currentIncident: { service: string; status: string; start: Date } | null = null;

    history.forEach((entry, index) => {
      entry.services.forEach(service => {
        if (service.status !== 'healthy') {
          if (!currentIncident || currentIncident.service !== service.service) {
            // New incident
            currentIncident = {
              service: service.service,
              status: service.status,
              start: entry.timestamp,
            };
          }
        } else if (currentIncident && currentIncident.service === service.service) {
          // Incident resolved
          incidents.push({
            service: currentIncident.service,
            status: currentIncident.status,
            timestamp: currentIncident.start,
            duration: entry.timestamp.getTime() - currentIncident.start.getTime(),
          });
          currentIncident = null;
        }
      });
    });

    // Add ongoing incidents
    if (currentIncident) {
      incidents.push({
        service: currentIncident.service,
        status: currentIncident.status,
        timestamp: currentIncident.start,
      });
    }

    return incidents;
  }

  // Subscribe to history updates
  onHistoryUpdate(callback: (history: HealthHistory[]) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback(this.history));
  }

  // Clear history
  clearHistory(): void {
    this.history = [];
    this.notifyListeners();
  }
}

export const serviceMonitor = new ServiceMonitor();
