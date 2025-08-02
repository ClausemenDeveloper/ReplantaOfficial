import { useState, useCallback, useMemo, useEffect } from "react";
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
import { JSX } from "react/jsx-runtime";

// Simple implementation of React.memo for functional components
function memo<T extends (...args: any[]) => JSX.Element>(Component: T): T {
  return Component;
}

const AdminDashboard = memo(() => {
  const navigate = useNavigate();
  // Recupera dados do usuário autenticado do localStorage/sessionStorage
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

  useEffect(() => {
    // Inicializa notificações reais do backend
    const fetchAdminNotifications = async () => {
      const permission = Notification.permission;
      if (permission === "default") {
        setShowNotificationSetup(true);
      }
      try {
        const res = await fetch("/api/admin/notifications", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error("Erro ao carregar notificações");
        const notifications = await res.json();
        if (Array.isArray(notifications)) {
          notifications.forEach((n) => notificationService.addNotification(n));
        }
      } catch (err) {
        // Pode exibir erro ou fallback
      }
    };
    fetchAdminNotifications();
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    navigate("/select-interface");
  }, [navigate]);

  // Carrega estatísticas do backend
  const [stats, setStats] = useState<any[]>([]);
  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => res.ok ? res.json() : [])
      .then((data) => setStats(Array.isArray(data) ? data : []));
  }, []);

  // Carrega usuários pendentes do backend
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  useEffect(() => {
    fetch("/api/admin/pending-users")
      .then((res) => res.ok ? res.json() : [])
      .then((data) => setPendingUsers(Array.isArray(data) ? data : []));
  }, []);

const handleQuickApprove = useCallback(async (userId: number, userName: string) => {
  try {
    const res = await fetch(`/api/admin/users/${userId}/approve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: userName }),
    });
    if (!res.ok) throw new Error("Erro ao aprovar usuário");
    alert(`${userName} foi aprovado com sucesso!`);
  } catch (err) {
    alert(`Erro ao aprovar ${userName}: ${(err as Error).message}`);
  }
}, []);

const handleQuickReject = useCallback(async (userId: number, userName: string) => {
  try {
    const res = await fetch(`/api/admin/users/${userId}/reject`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: userName }),
    });
    if (!res.ok) throw new Error("Erro ao rejeitar usuário");
    alert(`${userName} foi rejeitado.`);
  } catch (err) {
    alert(`Erro ao rejeitar ${userName}: ${(err as Error).message}`);
  }
}, []);

  // Carrega atividade recente do backend
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  useEffect(() => {
    fetch("/api/admin/activity")
      .then((res) => res.ok ? res.json() : [])
      .then((data) => setRecentActivity(Array.isArray(data) ? data : []));
  }, []);

  // Carrega localizações do mapa do backend
  const [adminMapLocations, setAdminMapLocations] = useState<GardenLocation[]>([]);
  useEffect(() => {
    fetch("/api/admin/map-locations")
      .then((res) => res.ok ? res.json() : [])
      .then((data) => setAdminMapLocations(Array.isArray(data) ? data : []));
  }, []);

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
                <p className="text-sm font-medium text-gray-900">{user ? user.name : "Usuário não identificado"}</p>
                <p className="text-xs text-gray-600">{user ? user.email : ""}</p>
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

// displayName removido pois não é suportado em funções normais

export default AdminDashboard;

