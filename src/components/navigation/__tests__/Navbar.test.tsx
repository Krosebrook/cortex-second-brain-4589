import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    logout: vi.fn(),
    user: { id: 'test-user' },
  }),
}));

vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({ theme: 'dark', toggleTheme: vi.fn() }),
}));

vi.mock('@/hooks/useUserRole', () => ({
  useUserRole: () => ({ isAdmin: false, role: 'user' }),
}));

vi.mock('@/components/features/NotificationCenter', () => ({
  NotificationCenter: () => <div data-testid="notifications" />,
}));

vi.mock('@/components/connection/StatusIndicator', () => ({
  StatusIndicator: () => null,
}));

vi.mock('@/components/sync/SyncStatusIndicator', () => ({
  SyncStatusIndicator: () => null,
}));

vi.mock('@/components/navigation/ConflictIndicator', () => ({
  ConflictIndicator: () => null,
}));

describe('Navbar - User Dropdown', () => {
  const renderNavbar = () => {
    const { Navbar } = require('../Navbar');
    return render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );
  };

  it('renders navigation without crashing', () => {
    renderNavbar();
    expect(document.querySelector('nav')).toBeTruthy();
  });

  it('does not render standalone Profile or Settings links in main nav', () => {
    renderNavbar();
    const allLinks = screen.getAllByRole('link');
    const topLevelLabels = allLinks.map(l => l.textContent);
    expect(topLevelLabels).not.toContain('Profile');
    expect(topLevelLabels).not.toContain('Settings');
  });

  it('renders the user dropdown trigger button', () => {
    renderNavbar();
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
});
