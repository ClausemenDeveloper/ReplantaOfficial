import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sprout,
  Bell,
  Settings,
  LogOut,
  Plus,
  Calendar,
  MessageCircle,
  FileText,
  MapPin,
  Camera,
  Star,
  TrendingUp,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import GoogleMapsOptimized, {
  type GardenLocation,
} from "../../components/GoogleMapsOptimized";
import { NotificationCenter } from "../../components/notifications/NotificationCenter";
import { ToastContainer } from "../../components/notifications/NotificationToast";
import NotificationPermissions from "../../components/notifications/NotificationPermissions";
import { notificationService } from "../../services/notificationService";
import RecentActivity from "../../components/notifications/RecentActivity";

export default function ClientDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ name: string; email: string; avatar?: string } | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, []);

  const [showNotificationSetup, setShowNotificationSetup] = useState(false);

  // Inicializa permissões de notificação
  useEffect(() => {
    const permission = Notification.permission;
    if (permission === "default") {
      setShowNotificationSetup(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    navigate("/select-interface");
  };

  // Carrega projetos do cliente do backend
  const [projects, setProjects] = useState<any[]>([]);
  useEffect(() => {
    if (!user) return;
    fetch(`/api/client/projects?email=${encodeURIComponent(user.email)}`)
      .then((res) => res.ok ? res.json() : [])
      .then((data) => setProjects(Array.isArray(data) ? data : []));
  }, [user]);

  // Convert projects to map locations
  const mapLocations: GardenLocation[] = useMemo(
    () =>
      projects.map((project) => ({
        id: project.id?.toString() ?? "",
        name: project.title,
        type: "project" as const,
        coordinates: project.coordinates,
        description: `Orçamento: ${project.budget} | Responsável: ${project.collaborator}`,
        status:
          project.status === "Em Progresso"
            ? ("active" as const)
            : ("pending" as const),
        assignedTo:
          project.collaborator && project.collaborator !== "Pendente"
            ? project.collaborator
            : undefined,
        estimatedDuration: project.estimatedDuration || "4-6 semanas",
      })),
    [projects],
  );

  const handleLocationSelect = (location: GardenLocation) => {
    navigate(`/client/dashboard?project=${location.id}`);
  };

  // Função para solicitar novo projeto
  const handleRequestNewProject = async () => {
    if (!user) return alert("Usuário não identificado. Faça login novamente.");
    try {
      const res = await fetch("/api/client/projects/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.email }),
      });
      if (!res.ok) throw new Error("Erro ao solicitar novo projeto");
      // Atualiza lista de projetos após solicitação
      const updated = await res.json();
      setProjects(Array.isArray(updated) ? updated : projects);
      alert("Solicitação enviada com sucesso!");
    } catch (err) {
      alert(`Erro: ${(err as Error).message}`);
    }
  };

  // Função para agendar reunião
  const handleScheduleMeeting = async () => {
    if (!user) return alert("Usuário não identificado. Faça login novamente.");
    try {
      const res = await fetch("/api/client/meetings/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.email }),
      });
      if (!res.ok) throw new Error("Erro ao agendar reunião");
      alert("Reunião agendada com sucesso!");
      // Opcional: atualizar projetos ou agenda do cliente
    } catch (err) {
      alert(`Erro: ${(err as Error).message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-garden-green-light/10 via-white to-garden-light-blue/10">
      {/* Header */}
      <header className="bg-white border-b border-garden-green-light/20 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-garden-green-light/10 rounded-full">
                <Sprout className="w-8 h-8 text-garden-green" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-garden-green-dark">
                  ReplantaSystem
                </h1>
                <p className="text-sm text-gray-600">Portal do Cliente</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <NotificationCenter
                userRole="client"
                onNotificationClick={(notification) => {
                  console.log("Notification clicked:", notification);
                }}
              />
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
              <div className="flex items-center space-x-2">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user ? user.name : "Usuário não identificado"}
                  </p>
                  <p className="text-xs text-gray-600">{user ? user.email : ""}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="border-garden-green-light/20 text-garden-green hover:bg-garden-green hover:text-white"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          {user ? (
            <>
              <h2 className="text-2xl font-bold text-garden-green-dark mb-2">
                Bem-vindo, {user.name.split(" ")[0]}! 🌱
              </h2>
              <p className="text-gray-600">
                Acompanhe o progresso dos seus projetos de jardinagem
              </p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-red-600 mb-2">Usuário não identificado</h2>
              <p className="text-gray-600">Faça login para acessar sua dashboard.</p>
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="garden-card cursor-pointer hover:shadow-md transition-shadow" onClick={handleRequestNewProject}>
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-garden-green-light/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Plus className="w-6 h-6 text-garden-green" />
              </div>
              <h3 className="font-semibold text-garden-green-dark mb-1">
                Novo Projeto
              </h3>
              <p className="text-xs text-gray-600">Solicitar orçamento</p>
            </CardContent>
          </Card>

          <Card className="garden-card cursor-pointer hover:shadow-md transition-shadow" onClick={handleScheduleMeeting}>
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-garden-green-dark mb-1">
                Agendar
              </h3>
              <p className="text-xs text-gray-600">Reuniões</p>
            </CardContent>
          </Card>

          <Card className="garden-card cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <MessageCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-garden-green-dark mb-1">
                Mensagens
              </h3>
              <p className="text-xs text-gray-600">Chat direto</p>
            </CardContent>
          </Card>

          <Card className="garden-card cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Camera className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-garden-green-dark mb-1">
                Galeria
              </h3>
              <p className="text-xs text-gray-600">Inspirações</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Projects Section */}
          <div>
            <Card className="garden-card">
              <CardHeader>
                <CardTitle className="text-garden-green-dark flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Os Meus Projetos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {projects.length === 0 ? (
                    <p className="text-sm text-gray-500">Nenhum projeto encontrado.</p>
                  ) : (
                    projects.map((project) => (
                      <div
                        key={project.id}
                        className="p-4 border border-garden-green-light/20 rounded-lg hover:bg-garden-green-light/5 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-garden-green-dark">
                              {project.title || "Projeto sem título"}
                            </h4>
                            <p className="text-sm text-gray-600">
                              Colaborador: {project.collaborator || "Não atribuído"}
                            </p>
                          </div>
                          <Badge
                            variant={
                              project.status === "Em Progresso"
                                ? "default"
                                : "secondary"
                            }
                            className={
                              project.status === "Em Progresso"
                                ? "bg-garden-green text-white"
                                : ""
                            }
                          >
                            {project.status || "Sem status"}
                          </Badge>
                        </div>

                        {project.status === "Em Progresso" && typeof project.progress === "number" && (
                          <div className="mb-3">
                            <div className="flex justify-between text-sm text-gray-600 mb-1">
                              <span>Progresso</span>
                              <span>{project.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-garden-green h-2 rounded-full transition-all duration-300"
                                style={{ width: `${project.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        )}

                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">
                            Próxima reunião: {project.nextMeeting || "Não agendada"}
                          </span>
                          <span className="font-semibold text-garden-green">
                            {project.budget || "Sem orçamento"}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <Button
                  className="w-full mt-4 bg-garden-green text-white hover:bg-garden-green-dark"
                  variant="default"
                  onClick={handleRequestNewProject}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Solicitar Novo Projeto
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Map Section */}
          <div>
            <GoogleMapsOptimized
              locations={mapLocations}
              height="400px"
              showControls={true}
              onLocationSelect={handleLocationSelect}
              userRole="client"
              center={{ lat: 38.7223, lng: -9.1393 }}
              zoom={12}
            />
          </div>
        </div>

        {/* Notifications Setup */}
        {showNotificationSetup && (
          <div className="mt-8">
            <NotificationPermissions
              userRole="client"
              userId="client_123" // In production, use actual user ID
              onPermissionChange={(hasPermission) => {
                if (hasPermission) {
                  setShowNotificationSetup(false);
                }
              }}
            />
          </div>
        )}

        {/* Recent Activity */}
        <div className="mt-8">
          <Card className="garden-card">
            <CardHeader>
              <CardTitle className="text-garden-green-dark flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Atividade Recente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Carrega atividades recentes do backend */}
                {user ? (
                  <RecentActivity userEmail={user.email} />
                ) : (
                  <p className="text-sm text-gray-500">Faça login para ver sua atividade recente.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Toast Notifications Container */}
      <ToastContainer position="top-right" maxToasts={5} />

      {/* Componente de atividade recente dinâmico */}
      {/* Deve ser implementado em ../../components/notifications/RecentActivity.tsx */}
      {/* Exemplo de uso: <RecentActivity userEmail={user.email} /> */}
    </div>
  );
}
