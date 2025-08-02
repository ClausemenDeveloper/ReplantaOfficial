import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  TreePine,
  Clock,
  Mail,
  Phone,
  User,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

export default function PendingApproval() {
  type UserType = {
    name: string;
    email: string;
    role: "client" | "collaborator" | "admin";
    approvalStatus: "pending" | "approved" | "rejected";
    createdAt?: string;
  };
  const [user, setUser] = useState<UserType | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar se há usuário armazenado
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const parsedUser: UserType = JSON.parse(savedUser);
        setUser(parsedUser);
        // Se usuário já foi aprovado, redirecionar
        if (parsedUser.approvalStatus === "approved") {
          navigate(`/dashboard/${parsedUser.role}`);
        }
      } catch (error) {
        console.error("Erro ao analisar dados do usuário:", error);
        localStorage.removeItem("user");
        navigate("/login");
      }
    } else {
      navigate("/login");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkApprovalStatus = async () => {
    if (!user || isChecking) return;
    setIsChecking(true);
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }
      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }
      const result = await response.json();
      if (result.data?.user) {
        const updatedUser: UserType = result.data.user;
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        // Se foi aprovado, redirecionar
        if (updatedUser.approvalStatus === "approved") {
          navigate(`/dashboard/${updatedUser.role}`);
        }
      }
    } catch (error) {
      console.error("Erro ao verificar status:", error);
    } finally {
      setIsChecking(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-garden-green/10 to-garden-green-light/20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-garden-green border-t-transparent"></div>
      </div>
    );
  }

  const getStatusInfo = () => {
    switch (user.approvalStatus) {
      case "pending":
        return {
          color: "yellow",
          icon: <Clock className="w-6 h-6" />,
          title: "Aguardando Aprovação",
          message:
            "A sua conta está a ser analisada pelo administrador. Será notificado quando aprovada.",
        };
      case "rejected":
        return {
          color: "red",
          icon: <AlertCircle className="w-6 h-6" />,
          title: "Conta Rejeitada",
          message:
            "A sua conta foi rejeitada pelo administrador. Contacte-nos para mais informações.",
        };
      default:
        return {
          color: "green",
          icon: <TreePine className="w-6 h-6" />,
          title: "Aprovado",
          message: "A sua conta foi aprovada! Pode agora aceder à plataforma.",
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-garden-green/10 to-garden-green-light/20 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center space-y-4">
          <div
            className={`mx-auto w-20 h-20 bg-${statusInfo.color}-100 rounded-full flex items-center justify-center`}
          >
            <div className={`text-${statusInfo.color}-600`}>
              {statusInfo.icon}
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold text-garden-green">
              {statusInfo.title}
            </CardTitle>
            <p className="text-garden-green-dark">{statusInfo.message}</p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Informações do Usuário */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-gray-800 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Informações da Conta
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Nome:</span>
                <p className="text-gray-800">{user.name}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Email:</span>
                <p className="text-gray-800">{user.email}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Tipo:</span>
                <Badge variant="outline" className="ml-2">
                  {user.role === "client"
                    ? "Cliente"
                    : user.role === "collaborator"
                      ? "Colaborador"
                      : "Admin"}
                </Badge>
              </div>
              <div>
                <span className="font-medium text-gray-600">Status:</span>
                <Badge
                  variant={
                    user.approvalStatus === "approved"
                      ? "default"
                      : user.approvalStatus === "rejected"
                        ? "destructive"
                        : "secondary"
                  }
                  className="ml-2"
                >
                  {user.approvalStatus === "pending"
                    ? "Pendente"
                    : user.approvalStatus === "approved"
                      ? "Aprovado"
                      : "Rejeitado"}
                </Badge>
              </div>
              {user.createdAt && (
                <div className="md:col-span-2">
                  <span className="font-medium text-gray-600">
                    Registado em:
                  </span>
                  <p className="text-gray-800">
                    {new Date(user.createdAt).toLocaleDateString("pt-PT", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Ações */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={checkApprovalStatus}
              disabled={isChecking}
              variant="outline"
              className="border-garden-green text-garden-green hover:bg-garden-green hover:text-white"
            >
              {isChecking ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Verificar Status
                </>
              )}
            </Button>

            <Button
              onClick={() =>
                (window.location.href =
                  "mailto:clausemenandredossantos@gmail.com?subject=Aprovação de Conta ReplantaSystem")
              }
              className="bg-garden-green hover:bg-garden-green-dark text-white"
            >
              <Mail className="w-4 h-4 mr-2" />
              Contactar Admin
            </Button>

            <Button onClick={logout} variant="outline">
              Sair
            </Button>
          </div>

          {/* Informações de Contacto */}
          <div className="text-center text-sm text-gray-600 space-y-2">
            <p>
              Questões? Contacte o administrador:{" "}
              <a
                href="mailto:clausemenandredossantos@gmail.com"
                className="text-garden-green hover:underline"
              >
                clausemenandredossantos@gmail.com
              </a>
            </p>
            <p className="text-xs">
              Tempo médio de aprovação: 24-48 horas úteis
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
