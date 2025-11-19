import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";
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
import { initializeCachePolicies } from "@/config/cache-policies";
import { CommandPalette } from "@/components/ui/command-palette";
import { useCommandPalette } from "@/hooks/useCommandPalette";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { LoadingScreen } from "@/components/landing/LoadingScreen";
import Navbar from "./components/Navbar";
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
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

initializeCachePolicies();

const PageTransition = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  
  return (
    <div className="transition-opacity duration-300 animate-fade-in">
      {children}
    </div>
  );
};

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
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<PageTransition><Index /></PageTransition>} />
          <Route path="/why" element={<PageTransition><WhyPage /></PageTransition>} />
          <Route path="/how" element={<PageTransition><HowPage /></PageTransition>} />
          <Route path="/auth" element={<PageTransition><AuthPage /></PageTransition>} />
          <Route path="/dashboard" element={<PageTransition><ProtectedRoute><Dashboard /></ProtectedRoute></PageTransition>} />
          <Route path="/manage" element={<PageTransition><ProtectedRoute><ManagePage /></ProtectedRoute></PageTransition>} />
          <Route path="/profile" element={<PageTransition><ProtectedRoute><Profile /></ProtectedRoute></PageTransition>} />
          <Route path="/import" element={<PageTransition><ProtectedRoute><Import /></ProtectedRoute></PageTransition>} />
          <Route path="/search" element={<PageTransition><ProtectedRoute><SearchPage /></ProtectedRoute></PageTransition>} />
          <Route path="/tessa" element={<PageTransition><ProtectedRoute><TessaPage /></ProtectedRoute></PageTransition>} />
          <Route path="/status" element={<PageTransition><StatusPage /></PageTransition>} />
          <Route path="/settings" element={<PageTransition><ProtectedRoute><Settings /></ProtectedRoute></PageTransition>} />
          <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
        </Routes>
      </Suspense>
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
