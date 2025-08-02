import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "client" | "collaborator";
  approvalStatus: "pending" | "approved" | "rejected";
  isActive: boolean;
}

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requireApproval?: boolean;
}

export default function ProtectedRoute({
  children,
  allowedRoles = [],
  requireApproval = true,
}: ProtectedRouteProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        const savedUser = localStorage.getItem("user");

        if (!token || !savedUser) {
          setIsLoading(false);
          return;
        }

        // Validar usuário salvo
        const parsedUser = JSON.parse(savedUser);

        // Verificar com o servidor se o token ainda é válido
        const response = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const result = await response.json();
          if (result.data?.user) {
            setUser(result.data.user);
            localStorage.setItem("user", JSON.stringify(result.data.user));
          }
        } else {
          // Token inválido, limpar dados
          localStorage.removeItem("auth_token");
          localStorage.removeItem("user");
          setError("Sessão expirada");
        }
      } catch (error) {
        console.error("Erro na verificação de autenticação:", error);
        setError("Erro de autenticação");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Mostrar loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-garden-green/10 to-garden-green-light/20">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-garden-green border-t-transparent mx-auto"></div>
          <p className="text-garden-green-dark font-medium">
            Verificando acesso...
          </p>
        </div>
      </div>
    );
  }

  // Não autenticado
  if (!user || error) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar se conta está ativa
  if (!user.isActive) {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar aprovação (exceto para admin)
  if (requireApproval && user.role !== "admin") {
    if (user.approvalStatus !== "approved") {
      return <Navigate to="/pending-approval" replace />;
    }
  }

  // Verificar papéis permitidos
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirecionar para dashboard apropriado baseado no papel
    return <Navigate to={`/dashboard/${user.role}`} replace />;
  }

  // Tudo OK, renderizar conteúdo protegido
  return <>{children}</>;
}

// Componente específico para proteger rotas de admin
export function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={["admin"]} requireApproval={false}>
      {children}
    </ProtectedRoute>
  );
}

// Componente específico para proteger rotas de cliente
export function ClientRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={["client"]} requireApproval={true}>
      {children}
    </ProtectedRoute>
  );
}

// Componente específico para proteger rotas de colaborador
export function CollaboratorRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={["collaborator"]} requireApproval={true}>
      {children}
    </ProtectedRoute>
  );
}
