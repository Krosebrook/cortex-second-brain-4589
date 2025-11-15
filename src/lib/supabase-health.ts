import { supabase } from '@/integrations/supabase/client';

export interface HealthCheckResult {
  isHealthy: boolean;
  error?: string;
  timestamp: Date;
}

/**
 * Check if Supabase connection is healthy
 */
export async function checkSupabaseHealth(): Promise<HealthCheckResult> {
  try {
    // Try to get session as a health check
    const { error } = await supabase.auth.getSession();
    
    if (error) {
      return {
        isHealthy: false,
        error: error.message,
        timestamp: new Date()
      };
    }

    return {
      isHealthy: true,
      timestamp: new Date()
    };
  } catch (error) {
    // Network or fetch errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return {
      isHealthy: false,
      error: errorMessage.includes('Failed to fetch') 
        ? 'Cannot connect to authentication service. Please check your internet connection or try again later.'
        : errorMessage,
      timestamp: new Date()
    };
  }
}

/**
 * Get user-friendly error message from Supabase error
 */
export function getAuthErrorMessage(error: Error | null): string {
  if (!error) return 'An unexpected error occurred';
  
  const message = error.message.toLowerCase();
  
  if (message.includes('failed to fetch') || message.includes('network')) {
    return 'Cannot connect to authentication service. Please check your internet connection.';
  }
  
  if (message.includes('invalid login credentials')) {
    return 'Invalid email or password. Please try again.';
  }
  
  if (message.includes('user already registered')) {
    return 'This email is already registered. Please sign in instead.';
  }
  
  if (message.includes('email not confirmed')) {
    return 'Please confirm your email address before signing in.';
  }
  
  if (message.includes('password')) {
    return 'Password must be at least 8 characters long.';
  }
  
  return error.message;
}
