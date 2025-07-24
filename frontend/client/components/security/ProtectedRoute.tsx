import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import useSecureAuth from "@/hooks/useSecureAuth";
import { SecureErrorHandler } from "@/lib/security";
import { Loader, Shield, AlertTriangle } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: "client" | "admin" | "collaborator";
  requiredPermissions?: string[];
  fallbackPath?: string;
  allowPending?: boolean;
}

export default function ProtectedRoute({
  children,
  requiredRole,
  requiredPermissions = [],
  fallbackPath = "/select-interface",
  allowPending = false,
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading, hasRole, hasPermission } =
    useSecureAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-garden-green-light/10 via-white to-garden-light-blue/10">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-garden-green mx-auto mb-4" />
          <p className="text-gray-600">A verificar autenticação...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated || !user) {
    SecureErrorHandler.logSecurityEvent(
      "unauthorized_access_attempt",
      {
        path: location.pathname,
        requiredRole,
        requiredPermissions,
      },
      "medium",
    );

    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Check if user account is pending approval
  if (user.status === "pending" && !allowPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-garden-brown/5">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white p-8 rounded-lg shadow-lg border border-orange-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-orange-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Conta Pendente de Aprovação
              </h2>
              <p className="text-gray-600 mb-6">
                A sua conta está a aguardar aprovação da administração. Será
                notificado por email quando a conta for ativada.
              </p>
              <div className="space-y-3">
                <div className="text-sm text-gray-500">
                  <strong>Nome:</strong> {user.name}
                </div>
                <div className="text-sm text-gray-500">
                  <strong>Email:</strong> {user.email}
                </div>
                <div className="text-sm text-gray-500">
                  <strong>Tipo:</strong> {user.role}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check if user account is inactive
  if (user.status === "inactive") {
    SecureErrorHandler.logSecurityEvent(
      "inactive_user_access_attempt",
      {
        userId: user.id,
        path: location.pathname,
      },
      "high",
    );

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-100">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white p-8 rounded-lg shadow-lg border border-red-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Conta Desativada
              </h2>
              <p className="text-gray-600 mb-6">
                A sua conta foi desativada. Contacte a administração para mais
                informações.
              </p>
              <button
                onClick={() => (window.location.href = "/select-interface")}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
              >
                Voltar ao Início
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check role requirements
  if (requiredRole && !hasRole(requiredRole)) {
    SecureErrorHandler.logSecurityEvent(
      "insufficient_role_access_attempt",
      {
        userId: user.id,
        userRole: user.role,
        requiredRole,
        path: location.pathname,
      },
      "high",
    );

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-100">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white p-8 rounded-lg shadow-lg border border-red-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Acesso Negado
              </h2>
              <p className="text-gray-600 mb-6">
                Não tem permissões para aceder a esta área. É necessário o role
                de <strong>{requiredRole}</strong>.
              </p>
              <button
                onClick={() =>
                  (window.location.href = `/${user.role}/dashboard`)
                }
                className="w-full bg-garden-green text-white py-2 px-4 rounded-lg hover:bg-garden-green-dark transition-colors"
              >
                Ir para o Meu Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check permission requirements
  if (
    requiredPermissions.length > 0 &&
    !requiredPermissions.every((permission) => hasPermission(permission))
  ) {
    SecureErrorHandler.logSecurityEvent(
      "insufficient_permissions_access_attempt",
      {
        userId: user.id,
        userRole: user.role,
        requiredPermissions,
        userPermissions: user.permissions || [],
        path: location.pathname,
      },
      "high",
    );

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-100">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white p-8 rounded-lg shadow-lg border border-orange-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-orange-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Permissões Insuficientes
              </h2>
              <p className="text-gray-600 mb-6">
                Não tem as permissões necessárias para aceder a esta
                funcionalidade.
              </p>
              <button
                onClick={() =>
                  (window.location.href = `/${user.role}/dashboard`)
                }
                className="w-full bg-garden-green text-white py-2 px-4 rounded-lg hover:bg-garden-green-dark transition-colors"
              >
                Voltar ao Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // All checks passed - render protected content
  return <>{children}</>;
}

// HOC for protecting components
export function withRoleProtection<P extends object>(
  Component: React.ComponentType<P>,
  requiredRole: "client" | "admin" | "collaborator",
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute requiredRole={requiredRole}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

// HOC for protecting components with permissions
export function withPermissionProtection<P extends object>(
  Component: React.ComponentType<P>,
  requiredPermissions: string[],
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute requiredPermissions={requiredPermissions}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}
