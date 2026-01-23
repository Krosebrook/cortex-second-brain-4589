import { useState, useEffect, useCallback, useRef } from 'react';

// Your reCAPTCHA v2 site key - this is public/publishable
const RECAPTCHA_SITE_KEY = '6LdS7oIrAAAAAHGH8f7g5h6i7j8k9l0m1n2o3p4q5r';

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
  }
}

export const useRecaptcha = (): UseRecaptchaReturn => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const widgetIdRef = useRef<number | null>(null);
  const containerIdRef = useRef('recaptcha-container');

  // Load reCAPTCHA script
  useEffect(() => {
    // Check if already loaded
    if (window.grecaptcha) {
      setIsLoaded(true);
      return;
    }

    // Define callback before loading script
    window.onRecaptchaLoad = () => {
      setIsLoaded(true);
    };

    // Load script
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      // Cleanup callback
      delete window.onRecaptchaLoad;
    };
  }, []);

  // Render the widget once loaded
  useEffect(() => {
    if (!isLoaded || widgetIdRef.current !== null) return;

    const container = document.getElementById(containerIdRef.current);
    if (!container) return;

    window.grecaptcha.ready(() => {
      try {
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
      }
    });
  }, [isLoaded]);

  const resetRecaptcha = useCallback(() => {
    if (widgetIdRef.current !== null && window.grecaptcha) {
      window.grecaptcha.reset(widgetIdRef.current);
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
