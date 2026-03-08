import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PageTransition } from '../PageTransition';

// Mock framer-motion to render children synchronously
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => (
      <div className={className} data-testid="motion-div" {...props}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const renderWithRouter = (ui: React.ReactNode, route = '/') =>
  render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>);

describe('PageTransition', () => {
  it('renders children inside a motion div', () => {
    const { getByText, getByTestId } = renderWithRouter(
      <PageTransition>
        <p>Hello</p>
      </PageTransition>
    );
    expect(getByText('Hello')).toBeTruthy();
    expect(getByTestId('motion-div')).toBeTruthy();
  });

  it('accepts variant prop without crashing', () => {
    const variants = ['fade', 'slide-up', 'slide-left', 'scale'] as const;
    variants.forEach((variant) => {
      const { getByTestId } = renderWithRouter(
        <PageTransition variant={variant}>
          <span>Content</span>
        </PageTransition>
      );
      expect(getByTestId('motion-div')).toBeTruthy();
    });
  });

  it('passes className to the motion wrapper', () => {
    const { getByTestId } = renderWithRouter(
      <PageTransition className="custom-class">
        <span>Content</span>
      </PageTransition>
    );
    expect(getByTestId('motion-div').className).toContain('custom-class');
  });
});
