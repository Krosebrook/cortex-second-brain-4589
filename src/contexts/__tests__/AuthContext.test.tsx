/**
 * Unit tests for AuthContext
 * Tests authentication state management, session handling, and error recovery
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

const mockUser: User = {
  id: 'test-user-id',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
};

const mockSession: Session = {
  access_token: 'test-access-token',
  refresh_token: 'test-refresh-token',
  expires_in: 3600,
  token_type: 'bearer',
  user: mockUser,
};

// Test component to consume auth context
const TestConsumer = () => {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="loading">{auth.loading ? 'true' : 'false'}</span>
      <span data-testid="authenticated">{auth.isAuthenticated ? 'true' : 'false'}</span>
      <span data-testid="user-id">{auth.user?.id || 'none'}</span>
      <span data-testid="connection-error">{auth.connectionError ? 'true' : 'false'}</span>
      <span data-testid="reconnect-attempts">{auth.reconnectAttempts}</span>
      <button data-testid="logout-btn" onClick={() => auth.logout()}>Logout</button>
      <button data-testid="retry-btn" onClick={() => auth.retryConnection()}>Retry</button>
    </div>
  );
};

describe('AuthContext', () => {
  let authStateCallback: ((event: AuthChangeEvent, session: Session | null) => void) | null = null;
  let unsubscribeMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    authStateCallback = null;
    unsubscribeMock = vi.fn();

    // Setup default mock for onAuthStateChange
    vi.mocked(supabase.auth.onAuthStateChange).mockImplementation((callback) => {
      authStateCallback = callback;
      return {
        data: {
          subscription: {
            id: 'test-subscription-id',
            callback,
            unsubscribe: unsubscribeMock,
          },
        },
      } as ReturnType<typeof supabase.auth.onAuthStateChange>;
    });

    // Setup default mock for getSession
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Initial State', () => {
    it('should start with loading true', () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      expect(screen.getByTestId('loading').textContent).toBe('true');
    });

    it('should not be authenticated initially', async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated').textContent).toBe('false');
      });
    });
  });

  describe('Session Handling', () => {
    it('should load existing session on mount', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
        expect(screen.getByTestId('authenticated').textContent).toBe('true');
        expect(screen.getByTestId('user-id').textContent).toBe('test-user-id');
      });
    });

    it('should handle auth state changes', async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      // Simulate sign in
      act(() => {
        authStateCallback?.('SIGNED_IN', mockSession);
      });

      await waitFor(() => {
        expect(screen.getByTestId('authenticated').textContent).toBe('true');
        expect(screen.getByTestId('user-id').textContent).toBe('test-user-id');
      });

      // Simulate sign out
      act(() => {
        authStateCallback?.('SIGNED_OUT', null);
      });

      await waitFor(() => {
        expect(screen.getByTestId('authenticated').textContent).toBe('false');
        expect(screen.getByTestId('user-id').textContent).toBe('none');
      });
    });

    it('should unsubscribe from auth changes on unmount', async () => {
      const { unmount } = render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      unmount();

      expect(unsubscribeMock).toHaveBeenCalled();
    });
  });

  describe('Logout', () => {
    it('should clear user state on logout', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });
      vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null });

      const user = userEvent.setup();

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated').textContent).toBe('true');
      });

      await user.click(screen.getByTestId('logout-btn'));

      await waitFor(() => {
        expect(supabase.auth.signOut).toHaveBeenCalled();
        expect(screen.getByTestId('authenticated').textContent).toBe('false');
      });
    });

    it('should handle logout errors gracefully', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });
      vi.mocked(supabase.auth.signOut).mockRejectedValue(new Error('Network error'));

      const user = userEvent.setup();

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated').textContent).toBe('true');
      });

      await user.click(screen.getByTestId('logout-btn'));

      // Should still be authenticated since logout failed
      await waitFor(() => {
        expect(supabase.auth.signOut).toHaveBeenCalled();
      });
    });
  });

  describe('Connection Error Handling', () => {
    it('should set connection error on session fetch failure', async () => {
      vi.mocked(supabase.auth.getSession).mockRejectedValue(new Error('Network error'));

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('connection-error').textContent).toBe('true');
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });
    });

    it('should handle connection timeout', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      
      // Never resolve to simulate timeout
      vi.mocked(supabase.auth.getSession).mockImplementation(
        () => new Promise(() => {})
      );

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      // Advance past timeout
      await act(async () => {
        await vi.advanceTimersByTimeAsync(11000);
      });

      await waitFor(() => {
        expect(screen.getByTestId('connection-error').textContent).toBe('true');
      }, { timeout: 2000 });

      vi.useRealTimers();
    });

    it('should allow retry after connection error', async () => {
      vi.mocked(supabase.auth.getSession)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          data: { session: mockSession },
          error: null,
        });

      const user = userEvent.setup();

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('connection-error').textContent).toBe('true');
      });

      await user.click(screen.getByTestId('retry-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('connection-error').textContent).toBe('false');
        expect(screen.getByTestId('authenticated').textContent).toBe('true');
        expect(screen.getByTestId('reconnect-attempts').textContent).toBe('1');
      });
    });
  });

  describe('useAuth Hook', () => {
    it('should throw when used outside AuthProvider', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(<TestConsumer />);
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleError.mockRestore();
    });
  });

  describe('Token Refresh', () => {
    it('should handle TOKEN_REFRESHED event', async () => {
      const updatedSession: Session = {
        ...mockSession,
        access_token: 'new-access-token',
      };

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      act(() => {
        authStateCallback?.('TOKEN_REFRESHED', updatedSession);
      });

      await waitFor(() => {
        expect(screen.getByTestId('authenticated').textContent).toBe('true');
      });
    });
  });
});
