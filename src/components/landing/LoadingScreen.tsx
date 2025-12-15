/**
 * Loading Screen Component
 * Displayed while the landing page is loading
 */

import { Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

export const LoadingScreen = () => {
  return (
    <div 
      className={cn(
        'min-h-screen flex flex-col items-center justify-center',
        'bg-gradient-to-b from-background to-muted/30'
      )}
      role="status"
      aria-label="Loading application"
    >
      {/* Animated Icon */}
      <div className="animate-spin-slow w-16 h-16 text-primary">
        <Brain size={64} className="drop-shadow-lg" />
      </div>

      {/* Loading Text */}
      <p className="mt-4 text-muted-foreground animate-pulse">
        Loading your second brain...
      </p>
    </div>
  );
};
