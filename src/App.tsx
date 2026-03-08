import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/transitions/PageTransition";
import { DashboardSkeleton, FormSkeleton, ContentSkeleton, LandingSkeleton } from "@/components/loading/PageSkeletons";
import { useShortcutHelp } from "@/hooks/useShortcutHelp";
import { ShortcutsHelpDialog } from "@/components/feedback/ShortcutsHelpDialog";
import { AuthProvider } from "@/contexts/AuthContext";
import { OfflineProvider } from "@/contexts/OfflineContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ConfirmationProvider } from "@/components/feedback/ConfirmationProvider";
import { SecurityHeaders } from "@/components/layout/SecurityHeaders";
import { OfflineBanner } from "@/components/connection/OfflineBanner";
import { ReconnectionBanner } from "@/components/connection/ReconnectionBanner";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";
import { SyncStatus } from "@/components/feedback/SyncStatus";
import { InstallPromptBanner } from "@/components/pwa/InstallPromptBanner";
import { initializeCachePolicies } from "@/config/cache-policies";
import { CommandPalette } from "@/components/ui/command-palette";
import { useCommandPalette } from "@/hooks/useCommandPalette";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

import Navbar from "./components/navigation/Navbar";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";

// Lazy load pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const WhyPage = lazy(() => import("./pages/WhyPage"));
const HowPage = lazy(() => import("./pages/HowPage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ManagePage = lazy(() => import("./pages/ManagePage"));
const Import = lazy(() => import("./pages/Import"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const TessaPage = lazy(() => import("./pages/TessaPage"));
const StatusPage = lazy(() => import("./pages/StatusPage"));
const Settings = lazy(() => import("./pages/Settings"));
const Profile = lazy(() => import("./pages/Profile"));
const Install = lazy(() => import("./pages/Install"));
const Offline = lazy(() => import("./pages/Offline"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

const queryClient = new QueryClient();

initializeCachePolicies();

const AppRoutes = () => {
  const { open, setOpen, search, setSearch, filteredCommands, executeCommand, toggle } = useCommandPalette();
  const { isOpen: helpOpen, open: openHelp, close: closeHelp } = useShortcutHelp();

  useKeyboardShortcuts([
    {
      key: 'k',
      ctrlKey: true,
      callback: (e) => {
        e.preventDefault();
        toggle();
      },
    },
    {
      key: '?',
      callback: (e) => {
        e.preventDefault();
        openHelp();
      },
    },
    {
      key: '/',
      ctrlKey: true,
      callback: (e) => {
        e.preventDefault();
        openHelp();
      },
    },
  ]);

  const location = useLocation();

  return (
    <>
      <CommandPalette
        open={open}
        onOpenChange={setOpen}
        search={search}
        onSearchChange={setSearch}
        commands={filteredCommands}
        onExecute={executeCommand}
      />
      <ShortcutsHelpDialog
        open={helpOpen}
        onOpenChange={closeHelp}
      />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Suspense fallback={<LandingSkeleton />}><PageTransition><Index /></PageTransition></Suspense>} />
          <Route path="/why" element={<Suspense fallback={<LandingSkeleton />}><PageTransition variant="slide-up"><WhyPage /></PageTransition></Suspense>} />
          <Route path="/how" element={<Suspense fallback={<LandingSkeleton />}><PageTransition variant="slide-up"><HowPage /></PageTransition></Suspense>} />
          <Route path="/auth" element={<Suspense fallback={<FormSkeleton />}><PageTransition variant="scale"><AuthPage /></PageTransition></Suspense>} />
          <Route path="/reset-password" element={<Suspense fallback={<FormSkeleton />}><PageTransition variant="scale"><ResetPassword /></PageTransition></Suspense>} />
          <Route path="/dashboard" element={<Suspense fallback={<DashboardSkeleton />}><PageTransition variant="slide-up"><ProtectedRoute><Dashboard /></ProtectedRoute></PageTransition></Suspense>} />
          <Route path="/manage" element={<Suspense fallback={<ContentSkeleton />}><PageTransition variant="slide-up"><ProtectedRoute><ManagePage /></ProtectedRoute></PageTransition></Suspense>} />
          <Route path="/profile" element={<Suspense fallback={<FormSkeleton />}><PageTransition variant="scale"><ProtectedRoute><Profile /></ProtectedRoute></PageTransition></Suspense>} />
          <Route path="/import" element={<Suspense fallback={<ContentSkeleton />}><PageTransition variant="slide-left"><ProtectedRoute><Import /></ProtectedRoute></PageTransition></Suspense>} />
          <Route path="/search" element={<Suspense fallback={<ContentSkeleton />}><PageTransition variant="slide-up"><ProtectedRoute><SearchPage /></ProtectedRoute></PageTransition></Suspense>} />
          <Route path="/tessa" element={<Suspense fallback={<ContentSkeleton />}><PageTransition variant="slide-up"><ProtectedRoute><TessaPage /></ProtectedRoute></PageTransition></Suspense>} />
          <Route path="/status" element={<Suspense fallback={<ContentSkeleton />}><PageTransition><StatusPage /></PageTransition></Suspense>} />
          <Route path="/settings" element={<Suspense fallback={<FormSkeleton />}><PageTransition variant="scale"><ProtectedRoute><Settings /></ProtectedRoute></PageTransition></Suspense>} />
          <Route path="/admin" element={<Suspense fallback={<DashboardSkeleton />}><PageTransition variant="slide-up"><ProtectedRoute><AdminDashboard /></ProtectedRoute></PageTransition></Suspense>} />
          <Route path="/install" element={<Suspense fallback={<LandingSkeleton />}><PageTransition><Install /></PageTransition></Suspense>} />
          <Route path="/offline" element={<Suspense fallback={<LandingSkeleton />}><PageTransition><Offline /></PageTransition></Suspense>} />
          <Route path="*" element={<Suspense fallback={<LandingSkeleton />}><PageTransition><NotFound /></PageTransition></Suspense>} />
        </Routes>
      </AnimatePresence>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <ErrorBoundary>
        <AuthProvider>
          <OfflineProvider>
            <TooltipProvider>
              <ConfirmationProvider>
                <BrowserRouter>
                  <SecurityHeaders />
                  <OfflineBanner />
                  <ReconnectionBanner />
                  <SyncStatus />
                  <InstallPromptBanner />
                  <div className="min-h-screen bg-background">
                    <Navbar />
                    <AppRoutes />
                  </div>
                  <Toaster />
                  <Sonner />
                </BrowserRouter>
              </ConfirmationProvider>
            </TooltipProvider>
          </OfflineProvider>
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
