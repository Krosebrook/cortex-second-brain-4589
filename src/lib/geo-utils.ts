/**
 * Geolocation utilities for IP address handling and display
 */

/**
 * Convert a 2-letter country code to flag emoji
 */
export function getCountryFlag(countryCode: string | null): string {
  if (!countryCode || countryCode === 'XX') return '🌐';
  
  // Convert country code to flag emoji using regional indicator symbols
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  
  return String.fromCodePoint(...codePoints);
}

/**
 * Format location parts into a readable string
 */
export function formatLocation(parts: {
  city?: string | null;
  region?: string | null;
  country?: string | null;
}): string {
  return [parts.city, parts.region, parts.country]
    .filter(Boolean)
    .join(', ');
}

/**
 * Check if an IP address is a private/local address
 */
export function isPrivateIP(ip: string): boolean {
  const privatePatterns = [
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[01])\./,
    /^192\.168\./,
    /^127\./,
    /^0\./,
    /^localhost$/i,
  ];
  
  return privatePatterns.some(pattern => pattern.test(ip));
}

/**
 * Mask an IP address for display (e.g., "192.168.1.xxx")
 */
export function maskIP(ip: string, showOctets: number = 3): string {
  const parts = ip.split('.');
  if (parts.length !== 4) return ip;
  
  return parts
    .map((part, index) => (index < showOctets ? part : 'xxx'))
    .join('.');
}
