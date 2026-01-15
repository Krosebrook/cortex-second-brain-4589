import { useEffect, useState, useCallback } from 'react';
import { initWebVitals, getMetrics, getPerformanceScore, type WebVitalsMetric } from '@/lib/web-vitals';

interface WebVitalsState {
  metrics: Map<string, WebVitalsMetric>;
  score: number;
  isLoading: boolean;
}

export function useWebVitals() {
  const [state, setState] = useState<WebVitalsState>({
    metrics: new Map(),
    score: 100,
    isLoading: true,
  });

  const handleMetricUpdate = useCallback((metric: WebVitalsMetric) => {
    setState((prev) => {
      const newMetrics = new Map(prev.metrics);
      newMetrics.set(metric.name, metric);
      return {
        metrics: newMetrics,
        score: getPerformanceScore(),
        isLoading: false,
      };
    });
  }, []);

  useEffect(() => {
    initWebVitals(handleMetricUpdate);

    // Initial metrics load after a short delay
    const timeout = setTimeout(() => {
      const currentMetrics = getMetrics();
      if (currentMetrics.size > 0) {
        setState({
          metrics: currentMetrics,
          score: getPerformanceScore(),
          isLoading: false,
        });
      } else {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    }, 3000);

    return () => clearTimeout(timeout);
  }, [handleMetricUpdate]);

  return {
    metrics: state.metrics,
    score: state.score,
    isLoading: state.isLoading,
    metricsArray: Array.from(state.metrics.values()),
  };
}
