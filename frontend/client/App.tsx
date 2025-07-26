import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import {
  registerServiceWorker,
  monitorNetworkStatus,
  preloadCriticalResources,
} from "./sw-register";
import ErrorBoundary from "./components/ErrorBoundary";

// Loading component for lazy routes
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-garden-green/5 to-garden-light-blue/5">
    <div className="text-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-garden-green border-t-transparent mx-auto"></div>
      <p className="text-garden-green-dark font-medium">Carregando...</p>
    </div>
  </div>
);

// Lazy load all route components
const Index = lazy(() => import("./pages/Index"));
const SelectInterface = lazy(() => import("./pages/SelectInterface"));

// Auth routes - group by category for better caching
const ClientLogin = lazy(() => import("./pages/auth/ClientLogin"));
const AdminLogin = lazy(() => import("./pages/auth/AdminLogin"));
const CollaboratorLogin = lazy(() => import("./pages/auth/CollaboratorLogin"));

const ClientRegister = lazy(() => import("./pages/auth/ClientRegister"));
const AdminRegister = lazy(() => import("./pages/auth/AdminRegister"));
const CollaboratorRegister = lazy(
  () => import("./pages/auth/CollaboratorRegister"),
);

// Simplified unified auth routes
const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const PendingApproval = lazy(() => import("./pages/auth/PendingApproval"));

const AdminResetPassword = lazy(
  () => import("./pages/auth/AdminResetPassword"),
);
const ClientResetPassword = lazy(
  () => import("./pages/auth/ClientResetPassword"),
);
const CollaboratorResetPassword = lazy(
  () => import("./pages/auth/CollaboratorResetPassword"),
);

const OAuthCallback = lazy(() => import("./pages/auth/OAuthCallback"));

// Dashboard routes
const ClientDashboard = lazy(
  () => import("./pages/dashboards/ClientDashboard"),
);
const AdminDashboard = lazy(() => import("./pages/dashboards/AdminDashboard"));
const CollaboratorDashboard = lazy(
  () => import("./pages/dashboards/CollaboratorDashboard"),
);

// Admin panel routes
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));

// Error/404 page
const NotFound = lazy(() => import("./pages/NotFound"));

// Optimized QueryClient configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors except 408, 429
        if (
          error?.status >= 400 &&
          error?.status < 500 &&
          ![408, 429].includes(error.status)
        ) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/select-interface" element={<SelectInterface />} />

              {/* Simplified Authentication Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/pending-approval" element={<PendingApproval />} />

              {/* Legacy Authentication Routes */}
              <Route path="/client/login" element={<ClientLogin />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route
                path="/collaborator/login"
                element={<CollaboratorLogin />}
              />

              {/* Registration Routes */}
              <Route path="/client/register" element={<ClientRegister />} />
              <Route path="/admin/register" element={<AdminRegister />} />
              <Route
                path="/collaborator/register"
                element={<CollaboratorRegister />}
              />

              {/* Password Reset Routes */}
              <Route
                path="/client/reset-password"
                element={<ClientResetPassword />}
              />
              <Route
                path="/admin/reset-password"
                element={<AdminResetPassword />}
              />
              <Route
                path="/collaborator/reset-password"
                element={<CollaboratorResetPassword />}
              />

              {/* OAuth Callback */}
              <Route path="/auth/callback" element={<OAuthCallback />} />

              {/* Dashboard Routes */}
              <Route path="/dashboard/client" element={<ClientDashboard />} />
              <Route path="/dashboard/admin" element={<AdminDashboard />} />
              <Route
                path="/dashboard/collaborator"
                element={<CollaboratorDashboard />}
              />

              {/* Legacy Dashboard Routes */}
              <Route path="/client/dashboard" element={<ClientDashboard />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route
                path="/collaborator/dashboard"
                element={<CollaboratorDashboard />}
              />

              {/* Admin Panel Routes */}
              <Route path="/admin/users" element={<AdminUsers />} />

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

// Initialize performance optimizations
preloadCriticalResources();
registerServiceWorker();
monitorNetworkStatus();

createRoot(document.getElementById("root")!).render(<App />);
