import { useState, useEffect, useRef, useCallback } from 'react';

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
  
  // Use ref to track current online state for interval callback
  const isOnlineRef = useRef(isOnline);
  isOnlineRef.current = isOnline;

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    setWasOffline(true);
    setLastOnlineTime(new Date());
    console.log('Network: Back online');
  }, []);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    console.log('Network: Gone offline');
  }, []);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check connection periodically
    const checkConnection = setInterval(() => {
      const currentOnline = navigator.onLine;
      if (currentOnline !== isOnlineRef.current) {
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
  }, [handleOnline, handleOffline]);

  return {
    isOnline,
    wasOffline,
    lastOnlineTime,
  };
};
