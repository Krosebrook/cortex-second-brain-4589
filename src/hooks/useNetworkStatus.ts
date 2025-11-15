import { useState, useEffect } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean;
  lastOnlineTime: Date | null;
  effectiveType?: string;
}

export const useNetworkStatus = (): NetworkStatus => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const [lastOnlineTime, setLastOnlineTime] = useState<Date | null>(
    navigator.onLine ? new Date() : null
  );

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      setLastOnlineTime(new Date());
      console.log('Network: Back online');
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('Network: Gone offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check connection periodically
    const checkConnection = setInterval(() => {
      const currentOnline = navigator.onLine;
      if (currentOnline !== isOnline) {
        if (currentOnline) {
          handleOnline();
        } else {
          handleOffline();
        }
      }
    }, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(checkConnection);
    };
  }, [isOnline]);

  return {
    isOnline,
    wasOffline,
    lastOnlineTime,
  };
};
