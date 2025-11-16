
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
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
import StatusPage from "./pages/StatusPage";
import Index from "./pages/Index";
import WhyPage from "./pages/WhyPage";
import HowPage from "./pages/HowPage";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import Import from "./pages/Import";
import SearchPage from "./pages/SearchPage";
import Settings from "./pages/Settings";
import ManagePage from "./pages/ManagePage";
import Dashboard from "./pages/Dashboard";
import TessaPage from "./pages/TessaPage";
import Navbar from "./components/Navbar";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";

const queryClient = new QueryClient();

// Initialize cache policies on app start
initializeCachePolicies();

// Page transition wrapper
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

  // Global Ctrl+K / Cmd+K shortcut
  useKeyboardShortcuts([
    {
      key: 'k',
      ctrlKey: true,
      callback: (e) => {
        e.preventDefault();
        toggle();
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
      <Routes>
      <Route 
        path="/" 
        element={
          <PageTransition>
            <Index />
          </PageTransition>
        } 
      />
      <Route 
        path="/why" 
        element={
          <PageTransition>
            <WhyPage />
          </PageTransition>
        } 
      />
      <Route 
        path="/how" 
        element={
          <PageTransition>
            <HowPage />
          </PageTransition>
        } 
      />
      <Route 
        path="/auth" 
        element={
          <PageTransition>
            <AuthPage />
          </PageTransition>
        } 
      />
      <Route 
        path="/dashboard" 
        element={
          <PageTransition>
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          </PageTransition>
        } 
      />
      <Route 
        path="/manage" 
        element={
          <PageTransition>
            <ProtectedRoute>
              <ManagePage />
            </ProtectedRoute>
          </PageTransition>
        } 
      />
      <Route 
        path="/profile" 
        element={
          <PageTransition>
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          </PageTransition>
        } 
      />
      <Route 
        path="/import" 
        element={
          <PageTransition>
            <ProtectedRoute>
              <Import />
            </ProtectedRoute>
          </PageTransition>
        } 
      />
      <Route 
        path="/search" 
        element={
          <PageTransition>
            <ProtectedRoute>
              <SearchPage />
            </ProtectedRoute>
          </PageTransition>
        } 
      />
      <Route 
        path="/tessa" 
        element={
          <PageTransition>
            <ProtectedRoute>
              <TessaPage />
            </ProtectedRoute>
          </PageTransition>
        } 
      />
      <Route 
        path="/status" 
        element={
          <PageTransition>
            <StatusPage />
          </PageTransition>
        } 
      />
      <Route 
        path="/settings" 
        element={
          <PageTransition>
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          </PageTransition>
        } 
      />
      <Route 
        path="*" 
        element={
          <PageTransition>
            <NotFound />
          </PageTransition>
        } 
      />
    </Routes>
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
                <SecurityHeaders />
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <OfflineBanner />
                  <ReconnectionBanner />
                  <SyncStatus />
                  <div className="min-h-screen">
                    <Navbar />
                  <AppRoutes />
                </div>
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

