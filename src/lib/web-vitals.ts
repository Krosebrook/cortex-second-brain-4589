import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';

export interface WebVitalsMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
  timestamp: number;
}

export interface WebVitalsThresholds {
  CLS: { good: number; poor: number };
  FCP: { good: number; poor: number };
  INP: { good: number; poor: number };
  LCP: { good: number; poor: number };
  TTFB: { good: number; poor: number };
}

// Google's recommended thresholds
export const WEB_VITALS_THRESHOLDS: WebVitalsThresholds = {
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  INP: { good: 200, poor: 500 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 },
};

const metricsStore: Map<string, WebVitalsMetric> = new Map();

function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = WEB_VITALS_THRESHOLDS[name as keyof WebVitalsThresholds];
  if (!thresholds) return 'good';
  
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.poor) return 'needs-improvement';
  return 'poor';
}

function handleMetric(metric: Metric): void {
  const webVitalsMetric: WebVitalsMetric = {
    name: metric.name,
    value: metric.value,
    rating: getRating(metric.name, metric.value),
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType || 'navigate',
    timestamp: Date.now(),
  };

  metricsStore.set(metric.name, webVitalsMetric);
  
  // Log to console in development
  if (import.meta.env.DEV) {
    const color = webVitalsMetric.rating === 'good' ? '#0cce6b' : 
                  webVitalsMetric.rating === 'needs-improvement' ? '#ffa400' : '#ff4e42';
    console.log(
      `%c[Web Vitals] ${metric.name}: ${metric.value.toFixed(metric.name === 'CLS' ? 3 : 0)}${metric.name === 'CLS' ? '' : 'ms'} (${webVitalsMetric.rating})`,
      `color: ${color}; font-weight: bold;`
    );
  }

  // Send to analytics endpoint (if configured)
  if (typeof window !== 'undefined' && window.__WEB_VITALS_CALLBACK__) {
    window.__WEB_VITALS_CALLBACK__(webVitalsMetric);
  }
}

export function initWebVitals(callback?: (metric: WebVitalsMetric) => void): void {
  if (typeof window !== 'undefined' && callback) {
    window.__WEB_VITALS_CALLBACK__ = callback;
  }

  // Register all web vitals observers (FID deprecated in favor of INP)
  onCLS(handleMetric);
  onFCP(handleMetric);
  onINP(handleMetric);
  onLCP(handleMetric);
  onTTFB(handleMetric);
}

export function getMetrics(): Map<string, WebVitalsMetric> {
  return new Map(metricsStore);
}

export function getMetric(name: string): WebVitalsMetric | undefined {
  return metricsStore.get(name);
}

export function getPerformanceScore(): number {
  const metrics = Array.from(metricsStore.values());
  if (metrics.length === 0) return 100;

  const weights: Record<string, number> = {
    LCP: 25,
    FID: 25,
    CLS: 25,
    INP: 15,
    FCP: 5,
    TTFB: 5,
  };

  const ratingScores = {
    good: 100,
    'needs-improvement': 50,
    poor: 0,
  };

  let totalWeight = 0;
  let weightedScore = 0;

  metrics.forEach((metric) => {
    const weight = weights[metric.name] || 10;
    totalWeight += weight;
    weightedScore += ratingScores[metric.rating] * weight;
  });

  return totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 100;
}

// Extend window interface for callback
declare global {
  interface Window {
    __WEB_VITALS_CALLBACK__?: (metric: WebVitalsMetric) => void;
  }
}
