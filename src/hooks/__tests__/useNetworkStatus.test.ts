import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNetworkStatus } from '../useNetworkStatus';

describe('useNetworkStatus', () => {
  let onlineEventListeners: ((event: Event) => void)[] = [];
  let offlineEventListeners: ((event: Event) => void)[] = [];

  beforeEach(() => {
    onlineEventListeners = [];
    offlineEventListeners = [];

    // Mock window.addEventListener
    vi.spyOn(window, 'addEventListener').mockImplementation((event: string, handler: any) => {
      if (event === 'online') {
        onlineEventListeners.push(handler);
      } else if (event === 'offline') {
        offlineEventListeners.push(handler);
      }
    });

    // Mock window.removeEventListener
    vi.spyOn(window, 'removeEventListener').mockImplementation((event: string, handler: any) => {
      if (event === 'online') {
        onlineEventListeners = onlineEventListeners.filter(h => h !== handler);
      } else if (event === 'offline') {
        offlineEventListeners = offlineEventListeners.filter(h => h !== handler);
      }
    });

    // Mock console.log to reduce noise
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with online state when navigator is online', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });

      const { result } = renderHook(() => useNetworkStatus());

      expect(result.current.isOnline).toBe(true);
      expect(result.current.wasOffline).toBe(false);
      expect(result.current.lastOnlineTime).toBeInstanceOf(Date);
    });

    it('should initialize with offline state when navigator is offline', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      const { result } = renderHook(() => useNetworkStatus());

      expect(result.current.isOnline).toBe(false);
      expect(result.current.wasOffline).toBe(false);
      expect(result.current.lastOnlineTime).toBeNull();
    });
  });

  describe('Online Event', () => {
    it('should update state when going online', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      const { result } = renderHook(() => useNetworkStatus());

      expect(result.current.isOnline).toBe(false);

      // Simulate going online
      act(() => {
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          value: true,
        });
        onlineEventListeners.forEach(listener => listener(new Event('online')));
      });

      await waitFor(() => {
        expect(result.current.isOnline).toBe(true);
      });

      expect(result.current.wasOffline).toBe(true);
      expect(result.current.lastOnlineTime).toBeInstanceOf(Date);
      expect(console.log).toHaveBeenCalledWith('Network: Back online');
    });

    it('should update lastOnlineTime when going online', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      const { result } = renderHook(() => useNetworkStatus());

      const beforeTime = new Date();

      act(() => {
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          value: true,
        });
        onlineEventListeners.forEach(listener => listener(new Event('online')));
      });

      await waitFor(() => {
        expect(result.current.isOnline).toBe(true);
      });

      expect(result.current.lastOnlineTime).toBeInstanceOf(Date);
      expect(result.current.lastOnlineTime!.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
    });
  });

  describe('Offline Event', () => {
    it('should update state when going offline', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });

      const { result } = renderHook(() => useNetworkStatus());

      expect(result.current.isOnline).toBe(true);

      // Simulate going offline
      act(() => {
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          value: false,
        });
        offlineEventListeners.forEach(listener => listener(new Event('offline')));
      });

      await waitFor(() => {
        expect(result.current.isOnline).toBe(false);
      });

      expect(console.log).toHaveBeenCalledWith('Network: Gone offline');
    });

    it('should not update lastOnlineTime when going offline', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });

      const { result } = renderHook(() => useNetworkStatus());

      const initialLastOnlineTime = result.current.lastOnlineTime;

      act(() => {
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          value: false,
        });
        offlineEventListeners.forEach(listener => listener(new Event('offline')));
      });

      await waitFor(() => {
        expect(result.current.isOnline).toBe(false);
      });

      // lastOnlineTime should remain the same
      expect(result.current.lastOnlineTime).toEqual(initialLastOnlineTime);
    });
  });

  describe('Periodic Connection Check', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should periodically check connection status', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });

      const { result } = renderHook(() => useNetworkStatus());

      expect(result.current.isOnline).toBe(true);

      // Change navigator.onLine without triggering event
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      // Fast-forward time to trigger interval check
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      await waitFor(() => {
        expect(result.current.isOnline).toBe(false);
      });
    });

    it('should detect reconnection through periodic check', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      const { result } = renderHook(() => useNetworkStatus());

      expect(result.current.isOnline).toBe(false);

      // Change navigator.onLine without triggering event
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });

      // Fast-forward time to trigger interval check
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      await waitFor(() => {
        expect(result.current.isOnline).toBe(true);
      });

      expect(result.current.wasOffline).toBe(true);
    });
  });

  describe('Cleanup', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should remove event listeners on unmount', () => {
      const { unmount } = renderHook(() => useNetworkStatus());

      expect(onlineEventListeners.length).toBeGreaterThan(0);
      expect(offlineEventListeners.length).toBeGreaterThan(0);

      unmount();

      expect(window.removeEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(window.removeEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
    });

    it('should clear interval on unmount', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

      const { unmount } = renderHook(() => useNetworkStatus());

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });

  describe('State Transitions', () => {
    it('should handle multiple offline/online transitions', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });

      const { result } = renderHook(() => useNetworkStatus());

      // Start online
      expect(result.current.isOnline).toBe(true);
      expect(result.current.wasOffline).toBe(false);

      // Go offline
      act(() => {
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          value: false,
        });
        offlineEventListeners.forEach(listener => listener(new Event('offline')));
      });

      await waitFor(() => {
        expect(result.current.isOnline).toBe(false);
      });

      // Go back online
      act(() => {
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          value: true,
        });
        onlineEventListeners.forEach(listener => listener(new Event('online')));
      });

      await waitFor(() => {
        expect(result.current.isOnline).toBe(true);
      });

      expect(result.current.wasOffline).toBe(true);

      // Go offline again
      act(() => {
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          value: false,
        });
        offlineEventListeners.forEach(listener => listener(new Event('offline')));
      });

      await waitFor(() => {
        expect(result.current.isOnline).toBe(false);
      });
    });
  });
});
