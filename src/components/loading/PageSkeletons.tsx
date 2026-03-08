/**
 * Skeleton Loading Screens
 * Contextual skeletons that match anticipated page layouts for Suspense boundaries.
 */

import { Skeleton } from '@/components/ui/skeleton';


/** Generic full-page skeleton with sidebar + content area (dashboard-like) */
export const DashboardSkeleton = () => (
  <div className="min-h-screen bg-background pt-24 pb-12" role="status" aria-label="Loading dashboard">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-8 space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border border-border/50 p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-7 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
              <Skeleton className="h-12 w-12 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* Content area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Quick actions card */}
          <div className="rounded-lg border border-border/50 p-6">
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-3 w-56 mb-6" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-lg border border-border/30 p-4 flex items-start gap-3">
                  <Skeleton className="h-8 w-8 rounded-lg flex-shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Goals card */}
          <div className="rounded-lg border border-border/50 p-6 space-y-4">
            <Skeleton className="h-5 w-28 mb-4" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-12" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="rounded-lg border border-border/50 p-6 space-y-4">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-3 w-40 mb-2" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start gap-3 pb-3">
                <Skeleton className="h-6 w-6 rounded-full flex-shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-2 w-16" />
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-border/50 p-6 space-y-3">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-3 w-48 mx-auto" />
          </div>
        </div>
      </div>
    </div>
    <span className="sr-only">Loading page content…</span>
  </div>
);

/** Simple centered card skeleton (auth, settings, profile) */
export const FormSkeleton = () => (
  <div className="min-h-screen bg-background flex items-center justify-center p-4" role="status" aria-label="Loading">
    <div className="w-full max-w-md space-y-6">
      <div className="text-center space-y-3">
        <Skeleton className="h-8 w-8 rounded-full mx-auto" />
        <Skeleton className="h-6 w-32 mx-auto" />
        <Skeleton className="h-3 w-56 mx-auto" />
      </div>
      <div className="rounded-lg border border-border/50 p-6 space-y-4">
        <Skeleton className="h-10 w-full rounded-md" />
        <Skeleton className="h-px w-full" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
    </div>
    <span className="sr-only">Loading page content…</span>
  </div>
);

/** Wide content skeleton (manage, search, tessa) */
export const ContentSkeleton = () => (
  <div className="min-h-screen bg-background pt-24 pb-12" role="status" aria-label="Loading content">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8 space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="flex gap-6">
        {/* Optional sidebar */}
        <div className="hidden lg:block w-64 flex-shrink-0 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-8 w-full rounded-md" />
          ))}
        </div>
        {/* Main content */}
        <div className="flex-1 space-y-4">
          <Skeleton className="h-10 w-full rounded-md" />
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
    <span className="sr-only">Loading page content…</span>
  </div>
);

/** Landing-style skeleton */
export const LandingSkeleton = () => (
  <div className="min-h-screen bg-background" role="status" aria-label="Loading page">
    <div className="max-w-7xl mx-auto px-4 pt-32 pb-12 space-y-16">
      <div className="text-center space-y-4">
        <Skeleton className="h-12 w-96 mx-auto max-w-full" />
        <Skeleton className="h-5 w-80 mx-auto max-w-full" />
        <Skeleton className="h-10 w-40 mx-auto rounded-md" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border border-border/50 p-8 space-y-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ))}
      </div>
    </div>
    <span className="sr-only">Loading page content…</span>
  </div>
);
