import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import {
  DashboardSkeleton,
  FormSkeleton,
  ContentSkeleton,
  LandingSkeleton,
} from '../PageSkeletons';

describe('PageSkeletons', () => {
  it('DashboardSkeleton renders with accessible status role', () => {
    const { container } = render(<DashboardSkeleton />);
    const status = container.querySelector('[role="status"]');
    expect(status).toBeTruthy();
    expect(status?.getAttribute('aria-label')).toBe('Loading dashboard');
  });

  it('DashboardSkeleton renders stats grid placeholders', () => {
    const { container } = render(<DashboardSkeleton />);
    // 4 stat cards + 4 quick action cards + other skeletons
    const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(8);
  });

  it('FormSkeleton renders centered card layout', () => {
    const { container } = render(<FormSkeleton />);
    const status = container.querySelector('[role="status"]');
    expect(status).toBeTruthy();
    expect(status?.getAttribute('aria-label')).toBe('Loading');
  });

  it('ContentSkeleton renders sidebar and content rows', () => {
    const { container } = render(<ContentSkeleton />);
    const status = container.querySelector('[role="status"]');
    expect(status).toBeTruthy();
    expect(status?.getAttribute('aria-label')).toBe('Loading content');
  });

  it('LandingSkeleton renders hero and feature grid', () => {
    const { container } = render(<LandingSkeleton />);
    const status = container.querySelector('[role="status"]');
    expect(status).toBeTruthy();
    expect(status?.getAttribute('aria-label')).toBe('Loading page');
  });

  it('all skeletons include sr-only loading text', () => {
    const skeletons = [DashboardSkeleton, FormSkeleton, ContentSkeleton, LandingSkeleton];
    skeletons.forEach((Skeleton) => {
      const { container } = render(<Skeleton />);
      const srOnly = container.querySelector('.sr-only');
      expect(srOnly).toBeTruthy();
      expect(srOnly?.textContent).toContain('Loading');
    });
  });
});
