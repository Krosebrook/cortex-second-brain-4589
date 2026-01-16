import { checkSupabaseHealth } from './supabase-health';
import { supabase } from '@/integrations/supabase/client';

export interface ServiceHealth {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime?: number;
  lastCheck: Date;
  error?: string;
}

export interface ConnectionStatus {
  overall: 'healthy' | 'degraded' | 'down';
  services: ServiceHealth[];
  timestamp: Date;
}

class ConnectionManager {
  private reconnectAttempts = 0;
  private maxAttempts = 10;
  private reconnectTimeouts: number[] = [1000, 2000, 4000, 8000, 16000, 30000];
  private reconnectTimer: NodeJS.Timeout | null = null;
  private listeners: ((status: ConnectionStatus) => void)[] = [];

  // Calculate next retry delay with exponential backoff
  private getRetryDelay(): number {
    const index = Math.min(this.reconnectAttempts, this.reconnectTimeouts.length - 1);
    return this.reconnectTimeouts[index];
  }

  // Add listener for connection status changes
  onStatusChange(callback: (status: ConnectionStatus) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private notifyListeners(status: ConnectionStatus) {
    this.listeners.forEach(callback => callback(status));
  }

  // Check health of all services
  async checkAllServices(): Promise<ConnectionStatus> {
const services: ServiceHealth[] = [];

    // Check Supabase Auth
    try {
      const authStart = Date.now();
      const authHealth = await checkSupabaseHealth();
      services.push({
        service: 'Supabase Auth',
        status: authHealth.isHealthy ? 'healthy' : 'down',
        responseTime: Date.now() - authStart,
        lastCheck: new Date(),
        error: authHealth.error,
      });
    } catch (error) {
      services.push({
        service: 'Supabase Auth',
        status: 'down',
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Check Supabase Database
    try {
      const dbStart = Date.now();
      const { error } = await supabase.from('chats').select('id').limit(1);
      services.push({
        service: 'Supabase Database',
        status: error ? 'down' : 'healthy',
        responseTime: Date.now() - dbStart,
        lastCheck: new Date(),
        error: error?.message,
      });
    } catch (error) {
      services.push({
        service: 'Supabase Database',
        status: 'down',
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Check Edge Functions
    try {
      const edgeStart = Date.now();
      const { error } = await supabase.functions.invoke('system-status', {
        body: { ping: true }
      });
      services.push({
        service: 'Edge Functions',
        status: error ? 'degraded' : 'healthy',
        responseTime: Date.now() - edgeStart,
        lastCheck: new Date(),
        error: error?.message,
      });
    } catch (error) {
      services.push({
        service: 'Edge Functions',
        status: 'degraded',
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Determine overall status
    const hasDown = services.some(s => s.status === 'down');
    const hasDegraded = services.some(s => s.status === 'degraded');
    const overall = hasDown ? 'down' : hasDegraded ? 'degraded' : 'healthy';

    const status: ConnectionStatus = {
      overall,
      services,
      timestamp: new Date(),
    };

    this.notifyListeners(status);
    return status;
  }

  // Start auto-reconnect with exponential backoff
  async startReconnect(onSuccess?: () => void, onFailure?: (error: string) => void): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.reconnectAttempts >= this.maxAttempts) {
      onFailure?.('Maximum reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Reconnection attempt ${this.reconnectAttempts}/${this.maxAttempts}`);

    const status = await this.checkAllServices();

    if (status.overall === 'healthy') {
      console.log('Reconnection successful');
      this.reconnectAttempts = 0;
      onSuccess?.();
      return;
    }

    // Schedule next retry
    const delay = this.getRetryDelay();
    console.log(`Next reconnection attempt in ${delay}ms`);

    this.reconnectTimer = setTimeout(() => {
      this.startReconnect(onSuccess, onFailure);
    }, delay);
  }

  // Stop auto-reconnect
  stopReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectAttempts = 0;
  }

  // Get current reconnection state
  getReconnectState() {
    return {
      attempts: this.reconnectAttempts,
      maxAttempts: this.maxAttempts,
      nextRetryIn: this.reconnectTimer ? this.getRetryDelay() : 0,
      isReconnecting: !!this.reconnectTimer,
    };
  }

  // Reset reconnection attempts
  resetAttempts(): void {
    this.reconnectAttempts = 0;
  }
}

export const connectionManager = new ConnectionManager();
