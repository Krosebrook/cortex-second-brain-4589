# ADR 005 — Offline Support: PWA with Workbox Service Worker

**Status**: Accepted  
**Date**: 2025-01-01  
**Deciders**: Core team

---

## Context

A core requirement is that users can read their knowledge base and interact with the app while offline (on a plane, in a tunnel, on a slow connection). Writes made offline must be synced when connectivity is restored.

## Decision

We implement offline support as a **Progressive Web App (PWA)** using **`vite-plugin-pwa` 0.19.8**, which generates a **Workbox**-powered service worker.

Caching strategies:
- **Fonts** → `CacheFirst` (long-lived, rarely change)
- **Images** → `CacheFirst` (long-lived)
- **JS/CSS bundles** → `StaleWhileRevalidate` (fast load, updates in background)
- **Supabase API calls** → `NetworkFirst` with 10s timeout (freshness priority with offline fallback)

Offline writes are queued in **IndexedDB** via a custom background sync system with exponential backoff (`SyncConfig`).

The offline fallback page is `/offline` route.

## Rationale

| Option | Considered | Reason for/against |
|---|---|---|
| vite-plugin-pwa + Workbox | ✅ **Selected** | Native Vite integration; battle-tested Workbox strategies; PWA manifest generation |
| Manual service worker | Considered | High complexity; Workbox handles edge cases better |
| No offline support | Rejected | Core requirement for the product |
| Capacitor (native wrapper) | Considered | Overkill for v0.1; PWA sufficient for most use cases |

## Consequences

- PWA manifest at `dist/manifest.webmanifest` enables "Add to Home Screen"
- `vite-plugin-pwa` generates `dist/sw.js` automatically from Vite build
- Service worker caches must be versioned — handled automatically by Workbox
- `VITE_SW_CACHE_ENABLED` flag can disable SW caching in development if needed
- Background sync retry is controlled by `SyncConfig` (`VITE_SYNC_MAX_RETRIES`, `VITE_SYNC_RETRY_DELAY`, `VITE_SYNC_MAX_DELAY`)
- The `workbox-build` package currently has a high severity advisory (transitive via `@rollup/plugin-terser`) — tracked in [SECURITY.md](../SECURITY.md)
