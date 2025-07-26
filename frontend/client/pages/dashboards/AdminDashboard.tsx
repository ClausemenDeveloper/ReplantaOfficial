import { useState, useCallback, useMemo, memo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sprout,
  Users,
  Settings,
  LogOut,
  Shield,
  BarChart3,
  UserCheck,
  Clock,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  DollarSign,
  Briefcase,
  X,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import GoogleMapsOptimized, {
  type GardenLocation,
} from "@/components/GoogleMapsOptimized";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { ToastContainer } from "@/components/notifications/NotificationToast";
import NotificationPermissions from "@/components/notifications/NotificationPermissions";
import { notificationService } from "@/services/notificationService";

const AdminDashboard = memo(() => {
  const navigate = useNavigate();
  const [user] = useState({
    name: "Administrator",
    email: "admin@replantasystem.com",
  });

  const [showNotificationSetup, setShowNotificationSetup] = useState(false);

  useEffect(() => {
    // Initialize notification service and add admin-specific notifications
    const initializeAdminNotifications = async () => {
      // Check if we should show notification setup
      const permission = Notification.permission;
      if (permission === "default") {
        setShowNotificationSetup(true);
      }

      // Add admin-specific demo notifications
      setTimeout(() => {
        notificationService.addNotification({
          title: "Novo Utilizador Pendente",
          message:
            "Pedro Santos candidatou-se a colaborador e aguarda aprovação",
          type: "info",
          priority: "medium",
          userRole: "admin",
          actionUrl: "/admin/users",
          actionLabel: "Gerir Utilizadores",
          module: "user",
        });
      }, 1000);

      setTimeout(() => {
        notificationService.addNotification({
          title: "Sistema de Backup",
          message: "Backup automático executado com sucesso",
          type: "success",
          priority: "low",
          userRole: "admin",
          actionUrl: "/admin/dashboard",
          actionLabel: "Ver Detalhes",
          module: "system",
        });
      }, 3000);

      setTimeout(() => {
        notificationService.addNotification({
          title: "Alta Atividade Detectada",
          message: "23 utilizadores online simultaneamente - novo recorde!",
          type: "info",
          priority: "medium",
          userRole: "admin",
          actionUrl: "/admin/dashboard",
          actionLabel: "Ver Estatísticas",
          module: "system",
        });
      }, 5000);

      setTimeout(() => {
        notificationService.addNotification({
          title: "Alerta de Segurança",
          message: "3 tentativas de login falhadas detectadas no sistema",
          type: "warning",
          priority: "high",
          userRole: "admin",
          actionUrl: "/admin/security",
          actionLabel: "Verificar Logs",
          module: "auth",
        });
      }, 7000);
    };

    initializeAdminNotifications();
  }, []);

  const handleLogout = useCallback(() => {
    navigate("/select-interface");
  }, [navigate]);

  const stats = useMemo(
    () => [
      {
        title: "Utilizadores Totais",
        value: "247",
        change: "+12%",
        icon: <Users className="w-6 h-6" />,
        color: "text-garden-green",
        bgColor: "bg-garden-green-light/10",
      },
      {
        title: "Projetos Ativos",
        value: "89",
        change: "+8%",
        icon: <BarChart3 className="w-6 h-6" />,
        color: "text-garden-light-blue",
        bgColor: "bg-garden-light-blue/10",
      },
      {
        title: "Pendentes Aprovação",
        value: "15",
        change: "+3",
        icon: <Clock className="w-6 h-6" />,
        color: "text-garden-brown",
        bgColor: "bg-garden-brown/10",
      },
      {
        title: "Receita Mensal",
        value: "€45,320",
        change: "+15%",
        icon: <DollarSign className="w-6 h-6" />,
        color: "text-green-600",
        bgColor: "bg-green-100",
      },
    ],
    [],
  );

  const pendingUsers = useMemo(
    () => [
      {
        id: 1,
        name: "Ana Costa",
        email: "ana.costa@email.com",
        role: "Cliente",
        date: "2025-01-10",
        type: "Novo Cliente",
      },
      {
        id: 2,
        name: "Pedro Santos",
        email: "pedro.santos@email.com",
        role: "Colaborador",
        date: "2025-01-09",
        type: "Candidatura",
        specialization: "Jardinagem Geral",
      },
      {
        id: 3,
        name: "Maria Silva",
        email: "maria.silva@email.com",
        role: "Cliente",
        date: "2025-01-08",
        type: "Novo Cliente",
      },
    ],
    [],
  );

  const handleQuickApprove = useCallback((userId: number, userName: string) => {
    console.log(`Approving user ${userId}: ${userName}`);
    // TODO: Implement backend call
    alert(`${userName} foi aprovado com sucesso!`);
  }, []);

  const handleQuickReject = useCallback((userId: number, userName: string) => {
    console.log(`Rejecting user ${userId}: ${userName}`);
    // TODO: Implement backend call
    alert(`${userName} foi rejeitado.`);
  }, []);

  const recentActivity = useMemo(
    () => [
      {
        type: "user_approved",
        message: "Utilizador João Ferreira aprovado",
        time: "Há 1 hora",
        icon: <CheckCircle className="w-4 h-4 text-green-500" />,
      },
      {
        type: "project_created",
        message: "Novo projeto 'Jardim Vertical' criado",
        time: "Há 2 horas",
        icon: <TrendingUp className="w-4 h-4 text-garden-green" />,
      },
      {
        type: "system_alert",
        message: "Sistema de backup executado com sucesso",
        time: "Há 4 horas",
        icon: <Shield className="w-4 h-4 text-blue-500" />,
      },
    ],
    [],
  );

  // Sample admin map data - showing all types of locations
  const adminMapLocations: GardenLocation[] = useMemo(
    () => [
      {
        id: "1",
        name: "Jardim Gulbenkian",
        type: "project",
        coordinates: { lat: 38.7371, lng: -9.1395 },
        description: "Projeto de requalificação paisagística",
        status: "active",
        assignedTo: "Maria Santos",
        estimatedDuration: "8 semanas",
      },
      {
        id: "2",
        name: "Viveiro Central",
        type: "nursery",
        coordinates: { lat: 38.7223, lng: -9.1393 },
        description: "Fornecedor principal de plantas",
        status: "active",
      },
      {
        id: "3",
        name: "Cliente Premium - Quinta do Lago",
        type: "client",
        coordinates: { lat: 38.7105, lng: -9.13 },
        description: "Cliente VIP - Projeto de luxo",
        status: "active",
        priority: "high",
      },
      {
        id: "4",
        name: "Manutenção Parque Eduardo VII",
        type: "maintenance",
        coordinates: { lat: 38.7292, lng: -9.1531 },
        description: "Manutenção mensal programada",
        status: "pending",
        assignedTo: "João Silva",
      },
      {
        id: "5",
        name: "Fornecedor de Ferramentas",
        type: "supplier",
        coordinates: { lat: 38.75, lng: -9.12 },
        description: "Equipamentos e ferramentas de jardinagem",
        status: "active",
      },
      {
        id: "6",
        name: "Parque das Nações - Horta Urbana",
        type: "project",
        coordinates: { lat: 38.7681, lng: -9.0947 },
        description: "Projeto comunitário de agricultura urbana",
        status: "pending",
        assignedTo: "Ana Costa",
        priority: "medium",
      },
    ],
    [],
  );

  const handleLocationSelect = useCallback((location: GardenLocation) => {
    console.log("Admin selected location:", location);
    // Could open detailed management view, assign collaborators, etc.
  }, []);

  const handleLocationCreate = useCallback(
    (coordinates: google.maps.LatLngLiteral) => {
      console.log("Admin creating new location at:", coordinates);
      // Could open a form to create new project, maintenance task, etc.
    },
    [],
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-garden-brown/5">
      {/* Header */}
      <header className="bg-white border-b border-garden-brown/20 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-garden-brown/10 rounded-full">
                <Sprout className="w-8 h-8 text-garden-brown" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-garden-brown">
                  ReplantaSystem
                </h1>
                <p className="text-sm text-gray-600">Painel Administrativo</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <NotificationCenter
                userRole="admin"
                onNotificationClick={(notification) => {
                  console.log("Admin notification clicked:", notification);
                  // Handle admin-specific notification actions
                  if (notification.actionUrl) {
                    navigate(notification.actionUrl);
                  }
                }}
              />
              <Badge className="bg-garden-brown/10 text-garden-brown border-garden-brown/20">
                <Shield className="w-3 h-3 mr-1" />
                Admin
              </Badge>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-600">{user.email}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="border-garden-brown/20 text-garden-brown hover:bg-garden-brown hover:text-white"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Stats and Quick Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {stats.map((stat, index) => (
                <Card key={index} className="garden-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">{stat.title}</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {stat.value}
                        </p>
                        <p className={`text-sm ${stat.color} font-medium`}>
                          {stat.change}
                        </p>
                      </div>
                      <div className={`p-3 rounded-full ${stat.bgColor}`}>
                        <div className={stat.color}>{stat.icon}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Admin Operations Map */}
            <GoogleMapsOptimized
              locations={adminMapLocations}
              height="400px"
              showControls={true}
              showFilters={true}
              onLocationSelect={handleLocationSelect}
              onLocationCreate={handleLocationCreate}
              userRole="admin"
              center={{ lat: 38.7223, lng: -9.1393 }}
              zoom={11}
              className="mb-6"
            />

            {/* Pending Approvals */}
            <Card className="garden-card">
              <CardHeader>
                <CardTitle className="flex items-center text-garden-brown">
                  <Clock className="w-5 h-5 mr-2" />
                  Utilizadores Pendentes ({pendingUsers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div>
                            <p className="font-medium text-gray-900">
                              {user.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {user.email}
                            </p>
                          </div>
                          <Badge
                            variant={
                              user.role === "Cliente" ? "default" : "secondary"
                            }
                            className="ml-2"
                          >
                            {user.role}
                          </Badge>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          {user.type} • {user.date}
                          {user.specialization && (
                            <span> • {user.specialization}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleQuickApprove(user.id, user.name)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuickReject(user.id, user.name)}
                          className="border-red-200 text-red-600 hover:bg-red-50"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Rejeitar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    className="w-full border-garden-brown/20 text-garden-brown hover:bg-garden-brown hover:text-white"
                    onClick={() => navigate("/admin/users")}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Ver Todos os Utilizadores
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="garden-card">
              <CardHeader>
                <CardTitle className="flex items-center text-garden-brown">
                  <Settings className="w-5 h-5 mr-2" />
                  Ações Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    variant="outline"
                    className="h-20 flex-col border-garden-brown/20 text-garden-brown hover:bg-garden-brown hover:text-white"
                    onClick={() => navigate("/admin/users")}
                  >
                    <UserCheck className="w-6 h-6 mb-2" />
                    Gerir Utilizadores
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex-col border-garden-light-blue/20 text-garden-light-blue hover:bg-garden-light-blue hover:text-white"
                  >
                    <BarChart3 className="w-6 h-6 mb-2" />
                    Relatórios
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex-col border-garden-green/20 text-garden-green hover:bg-garden-green hover:text-white"
                  >
                    <Briefcase className="w-6 h-6 mb-2" />
                    Projetos
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Recent Activity */}
          <div className="space-y-6">
            <Card className="garden-card">
              <CardHeader>
                <CardTitle className="flex items-center text-garden-brown">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  Atividade Recente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="mt-1">{activity.icon}</div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">
                          {activity.message}
                        </p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card className="garden-card">
              <CardHeader>
                <CardTitle className="flex items-center text-garden-brown">
                  <Shield className="w-5 h-5 mr-2" />
                  Estado do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Estado do Servidor
                    </span>
                    <Badge className="bg-green-100 text-green-800">
                      Online
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Base de Dados</span>
                    <Badge className="bg-green-100 text-green-800">
                      Conectada
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Último Backup</span>
                    <span className="text-sm text-gray-900">Há 4 horas</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Utilizadores Online
                    </span>
                    <span className="text-sm text-gray-900">23</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Map Overview Stats */}
            <Card className="garden-card">
              <CardHeader>
                <CardTitle className="flex items-center text-garden-brown">
                  <MapPin className="w-5 h-5 mr-2" />
                  Localizações Ativas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Projetos</span>
                    <span className="text-sm font-medium text-gray-900">
                      {
                        adminMapLocations.filter(
                          (loc) => loc.type === "project",
                        ).length
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Clientes</span>
                    <span className="text-sm font-medium text-gray-900">
                      {
                        adminMapLocations.filter((loc) => loc.type === "client")
                          .length
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Manutenção</span>
                    <span className="text-sm font-medium text-gray-900">
                      {
                        adminMapLocations.filter(
                          (loc) => loc.type === "maintenance",
                        ).length
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Fornecedores</span>
                    <span className="text-sm font-medium text-gray-900">
                      {
                        adminMapLocations.filter(
                          (loc) => loc.type === "supplier",
                        ).length
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Admin Notification Setup */}
        {showNotificationSetup && (
          <div className="mt-8">
            <NotificationPermissions
              userRole="admin"
              userId="admin_123" // In production, use actual user ID
              onPermissionChange={(hasPermission) => {
                if (hasPermission) {
                  setShowNotificationSetup(false);
                }
              }}
            />
          </div>
        )}
      </main>

      {/* Toast Notifications Container */}
      <ToastContainer position="top-right" maxToasts={8} />
    </div>
  );
});

AdminDashboard.displayName = "AdminDashboard";

export default AdminDashboard;
