import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Your reCAPTCHA v2 site key - this is public/publishable
const RECAPTCHA_SITE_KEY = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'; // Test key - replace with your actual site key

interface UseRecaptchaReturn {
  isLoaded: boolean;
  isVerifying: boolean;
  isVerified: boolean;
  error: string | null;
  executeRecaptcha: () => void;
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
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [widgetId, setWidgetId] = useState<number | null>(null);
  
  const containerId = 'recaptcha-container';

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
      // Cleanup
      const existingScript = document.querySelector('script[src*="recaptcha"]');
      if (existingScript) {
        existingScript.remove();
      }
      delete window.onRecaptchaLoad;
    };
  }, []);

  // Render the widget once loaded
  useEffect(() => {
    if (!isLoaded || widgetId !== null) return;

    const container = document.getElementById(containerId);
    if (!container) return;

    window.grecaptcha.ready(() => {
      try {
        const id = window.grecaptcha.render(containerId, {
          sitekey: RECAPTCHA_SITE_KEY,
          callback: async (token: string) => {
            setIsVerifying(true);
            setError(null);
            
            try {
              // Verify token server-side
              const { data, error: verifyError } = await supabase.functions.invoke('verify-recaptcha', {
                body: { token },
              });

              if (verifyError || !data?.success) {
                setError(data?.error || 'Verification failed');
                setIsVerified(false);
              } else {
                setIsVerified(true);
                setError(null);
              }
            } catch (err) {
              setError('Failed to verify reCAPTCHA');
              setIsVerified(false);
            } finally {
              setIsVerifying(false);
            }
          },
          'expired-callback': () => {
            setIsVerified(false);
            setError('reCAPTCHA expired. Please try again.');
          },
          'error-callback': () => {
            setError('reCAPTCHA error. Please try again.');
            setIsVerified(false);
          },
          theme: 'light',
          size: 'normal',
        });
        setWidgetId(id);
      } catch (err) {
        console.error('Failed to render reCAPTCHA:', err);
        setError('Failed to load reCAPTCHA');
      }
    });
  }, [isLoaded, widgetId]);

  const executeRecaptcha = useCallback(() => {
    // For v2 checkbox, user clicks the widget directly
    // This is here for API consistency
  }, []);

  const resetRecaptcha = useCallback(() => {
    if (widgetId !== null && window.grecaptcha) {
      window.grecaptcha.reset(widgetId);
      setIsVerified(false);
      setError(null);
    }
  }, [widgetId]);

  return {
    isLoaded,
    isVerifying,
    isVerified,
    error,
    executeRecaptcha,
    resetRecaptcha,
    recaptchaContainerId: containerId,
  };
};

export { RECAPTCHA_SITE_KEY };
