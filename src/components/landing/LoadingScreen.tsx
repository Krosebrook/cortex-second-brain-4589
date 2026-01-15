/**
 * Loading Screen Component
 * Optimized for fast FCP with minimal CSS and instant visibility
 */

import { Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

export const LoadingScreen = () => {
  return (
    <div 
      className={cn(
        'loading-screen min-h-screen flex flex-col items-center justify-center',
        'bg-background'
      )}
      role="status"
      aria-label="Loading application"
      aria-busy="true"
    >
      {/* Lightweight animated icon */}
      <div 
        className="w-16 h-16 text-primary animate-pulse"
        style={{ willChange: 'opacity' }}
      >
        <Brain size={64} aria-hidden="true" />
      </div>

      {/* Loading Text with semantic markup */}
      <p className="mt-4 text-muted-foreground text-sm">
        Loading...
      </p>
      
      {/* Hidden accessible loading indicator */}
      <span className="sr-only">Please wait while the application loads</span>
    </div>
  );
};
