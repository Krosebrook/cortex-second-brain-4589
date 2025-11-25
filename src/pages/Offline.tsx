import { WifiOff, RefreshCw, Home, Search, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function Offline() {
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    if (navigator.onLine) {
      window.location.reload();
    }
  };

  const cachedPages = [
    { name: 'Dashboard', path: '/dashboard', icon: Home },
    { name: 'Chat with Tessa', path: '/search', icon: Search },
    { name: 'Import', path: '/import', icon: Upload },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-2xl w-full p-8 space-y-6">
        {/* Icon and status */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
            <div className="relative p-6 rounded-full bg-muted">
              <WifiOff className="h-16 w-16 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">
              You're Offline
            </h1>
            <p className="text-muted-foreground text-lg">
              {isOnline 
                ? "Connection restored! You can reload the page now."
                : "This page isn't available offline yet."}
            </p>
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-muted/50">
          <div className={`h-2 w-2 rounded-full animate-pulse ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm font-medium">
            {isOnline ? 'Back Online' : 'No Internet Connection'}
          </span>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={handleRetry}
            className="w-full"
            size="lg"
            disabled={!isOnline}
          >
            <RefreshCw className="mr-2 h-5 w-5" />
            {isOnline ? 'Reload Page' : 'Waiting for Connection...'}
          </Button>

          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="w-full"
            size="lg"
          >
            <Home className="mr-2 h-5 w-5" />
            Go to Home
          </Button>
        </div>

        {/* Cached pages suggestion */}
        <div className="space-y-3 pt-4 border-t border-border">
          <h2 className="font-semibold text-foreground">
            Try These Cached Pages
          </h2>
          <p className="text-sm text-muted-foreground">
            These pages may be available offline if you've visited them recently:
          </p>
          
          <div className="grid gap-2">
            {cachedPages.map((page) => (
              <Button
                key={page.path}
                onClick={() => navigate(page.path)}
                variant="ghost"
                className="justify-start"
              >
                <page.icon className="mr-3 h-4 w-4" />
                {page.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="space-y-2 p-4 rounded-lg bg-muted/30 border border-border">
          <h3 className="font-semibold text-sm text-foreground">
            Offline Tips
          </h3>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Check your internet connection or WiFi</li>
            <li>Try switching between WiFi and mobile data</li>
            <li>Pages you've visited will work offline after the first visit</li>
            <li>Your data will sync automatically when back online</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
