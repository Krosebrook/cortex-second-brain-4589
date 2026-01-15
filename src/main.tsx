import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initWebVitals } from './lib/web-vitals'
import { setupImageLazyLoading, deferExecution } from './lib/performance-optimizations'
import { backgroundSync } from './lib/background-sync'

// Initialize Web Vitals monitoring
initWebVitals((metric) => {
  // Send metrics to analytics (can be configured with external service)
  if (import.meta.env.PROD) {
    // Production: could send to analytics endpoint
    console.log('[Performance]', metric.name, metric.value, metric.rating);
  }
});

// Initialize background sync for offline operations
backgroundSync.init().catch(error => {
  console.warn('[BackgroundSync] Failed to initialize:', error);
});

// Setup performance optimizations after initial render
deferExecution(() => {
  setupImageLazyLoading();
}, 'low');

createRoot(document.getElementById("root")!).render(<App />);
