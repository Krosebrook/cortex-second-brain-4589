import { useState, useEffect, useCallback, useRef } from 'react';

// Google's official reCAPTCHA v2 test key - always passes verification
// For production, replace with your own site key from https://www.google.com/recaptcha/admin
const RECAPTCHA_SITE_KEY = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';

interface UseRecaptchaReturn {
  isLoaded: boolean;
  isVerified: boolean;
  error: string | null;
  token: string | null;
  resetRecaptcha: () => void;
  recaptchaContainerId: string;
}

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      render: (container: string | HTMLElement, parameters: {
        sitekey: string;
        callback: (token: string) => void;
        'expired-callback'?: () => void;
        'error-callback'?: () => void;
        theme?: 'light' | 'dark';
        size?: 'normal' | 'compact';
      }) => number;
      reset: (widgetId?: number) => void;
      getResponse: (widgetId?: number) => string;
    };
    onRecaptchaLoad?: () => void;
    recaptchaScriptLoaded?: boolean;
    recaptchaLoadCallbacks?: Array<() => void>;
  }
}

// Global script loading state
let scriptLoadPromise: Promise<void> | null = null;

const loadRecaptchaScript = (): Promise<void> => {
  if (scriptLoadPromise) {
    return scriptLoadPromise;
  }

  if (window.grecaptcha && window.recaptchaScriptLoaded) {
    return Promise.resolve();
  }

  scriptLoadPromise = new Promise((resolve) => {
    // Initialize callback array if not exists
    if (!window.recaptchaLoadCallbacks) {
      window.recaptchaLoadCallbacks = [];
    }

    // Add our callback
    window.recaptchaLoadCallbacks.push(resolve);

    // Define the global callback only once
    if (!window.onRecaptchaLoad) {
      window.onRecaptchaLoad = () => {
        window.recaptchaScriptLoaded = true;
        // Call all waiting callbacks
        window.recaptchaLoadCallbacks?.forEach(cb => cb());
        window.recaptchaLoadCallbacks = [];
      };

      // Load script
      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  });

  return scriptLoadPromise;
};

export const useRecaptcha = (containerId: string = 'recaptcha-container'): UseRecaptchaReturn => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const widgetIdRef = useRef<number | null>(null);
  const containerIdRef = useRef(containerId);
  const isRenderingRef = useRef(false);

  // Load reCAPTCHA script
  useEffect(() => {
    loadRecaptchaScript().then(() => {
      setIsLoaded(true);
    });
  }, []);

  // Render the widget once loaded
  useEffect(() => {
    if (!isLoaded || widgetIdRef.current !== null || isRenderingRef.current) return;

    const renderWidget = () => {
      const container = document.getElementById(containerIdRef.current);
      if (!container) {
        // Container not ready yet, retry after a short delay
        const timeoutId = setTimeout(renderWidget, 100);
        return () => clearTimeout(timeoutId);
      }

      // Check if already has a widget rendered (by checking for iframe)
      if (container.querySelector('iframe')) {
        return;
      }

      isRenderingRef.current = true;

      window.grecaptcha.ready(() => {
        try {
          // Double-check container is still empty and we haven't rendered
          if (widgetIdRef.current !== null) {
            isRenderingRef.current = false;
            return;
          }

          const id = window.grecaptcha.render(containerIdRef.current, {
            sitekey: RECAPTCHA_SITE_KEY,
            callback: (responseToken: string) => {
              setToken(responseToken);
              setIsVerified(true);
              setError(null);
            },
            'expired-callback': () => {
              setToken(null);
              setIsVerified(false);
              setError('reCAPTCHA expired. Please try again.');
            },
            'error-callback': () => {
              setToken(null);
              setError('reCAPTCHA error. Please try again.');
              setIsVerified(false);
            },
            theme: 'light',
            size: 'normal',
          });
          widgetIdRef.current = id;
        } catch (err) {
          console.error('Failed to render reCAPTCHA:', err);
          setError('Failed to load reCAPTCHA');
        } finally {
          isRenderingRef.current = false;
        }
      });
    };

    renderWidget();
  }, [isLoaded]);

  const resetRecaptcha = useCallback(() => {
    if (widgetIdRef.current !== null && window.grecaptcha) {
      try {
        window.grecaptcha.reset(widgetIdRef.current);
      } catch (err) {
        console.warn('Failed to reset reCAPTCHA:', err);
      }
      setToken(null);
      setIsVerified(false);
      setError(null);
    }
  }, []);

  return {
    isLoaded,
    isVerified,
    error,
    token,
    resetRecaptcha,
    recaptchaContainerId: containerIdRef.current,
  };
};

export { RECAPTCHA_SITE_KEY };
