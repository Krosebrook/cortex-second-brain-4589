import { useEffect } from 'react';

export const SecurityHeaders = () => {
  useEffect(() => {
    // Set Content Security Policy for enhanced security
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = "default-src 'self'; img-src 'self' data: https: blob:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-eval' https://www.google.com https://www.gstatic.com; connect-src 'self' https://mlqebvxmavrzousuqyjr.supabase.co https://api.openai.com wss://mlqebvxmavrzousuqyjr.supabase.co https://www.google.com; frame-src https://www.google.com https://www.recaptcha.net; frame-ancestors 'none'; object-src 'none'; base-uri 'self';";
    document.head.appendChild(meta);

    // Additional security headers via meta tags where possible
    const xFrameOptions = document.createElement('meta');
    xFrameOptions.httpEquiv = 'X-Frame-Options';
    xFrameOptions.content = 'DENY';
    document.head.appendChild(xFrameOptions);

    const xContentTypeOptions = document.createElement('meta');
    xContentTypeOptions.httpEquiv = 'X-Content-Type-Options';
    xContentTypeOptions.content = 'nosniff';
    document.head.appendChild(xContentTypeOptions);

    return () => {
      document.head.removeChild(meta);
      document.head.removeChild(xFrameOptions);
      document.head.removeChild(xContentTypeOptions);
    };
  }, []);

  return null;
};