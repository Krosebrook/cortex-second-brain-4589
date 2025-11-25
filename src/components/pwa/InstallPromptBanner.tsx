import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export const InstallPromptBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already dismissed
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      setIsVisible(false);
      return;
    }

    // Check if already installed
    const checkInstalled = () => {
      // Check if running as PWA
      if (window.matchMedia('(display-mode: standalone)').matches || 
          (window.navigator as any).standalone === true) {
        setIsInstalled(true);
        setIsVisible(false);
        return;
      }
      
      // Show banner after a delay if not installed
      setTimeout(() => {
        setIsVisible(true);
      }, 3000);
    };

    checkInstalled();

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsVisible(false);
      localStorage.setItem('pwa-install-dismissed', 'true');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  const handleInstall = () => {
    navigate('/install');
  };

  if (!isVisible || isInstalled) return null;

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-50',
        'glass-panel rounded-xl shadow-lg',
        'max-w-sm p-4',
        'animate-in slide-in-from-bottom-5 duration-500'
      )}
    >
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 rounded-lg hover:bg-muted transition-colors"
        aria-label="Dismiss install prompt"
      >
        <X className="h-4 w-4 text-muted-foreground" />
      </button>

      <div className="flex items-start gap-4 pr-6">
        <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10">
          <Download className="h-6 w-6 text-primary" />
        </div>
        
        <div className="flex-1 space-y-3">
          <div>
            <h3 className="font-semibold text-foreground mb-1">
              Install Cortex
            </h3>
            <p className="text-sm text-muted-foreground">
              Get the full app experience with offline access and faster performance.
            </p>
          </div>
          
          <Button
            onClick={handleInstall}
            className="w-full"
            size="sm"
          >
            Install App
          </Button>
        </div>
      </div>
    </div>
  );
};
