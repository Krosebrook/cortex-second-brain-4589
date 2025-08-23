import { useEffect } from 'react';

export const SecurityHeaders = () => {
  useEffect(() => {
    // Set Content Security Policy for enhanced security
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self' https://nxosqzkzfayjwqdhijrp.supabase.co https://api.openai.com; frame-ancestors 'none';";
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