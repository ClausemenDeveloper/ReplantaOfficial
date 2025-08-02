import { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sprout,
  Bell,
  Settings,
  LogOut,
  Briefcase,
  Clock,
  CheckCircle,
  MapPin,
  Camera,
  MessageCircle,
  Calendar,
  Users,
  Route,
  AlertTriangle,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import GoogleMapsOptimized, {
  type GardenLocation,
} from "../../components/GoogleMapsOptimized";

export default function CollaboratorDashboard() {
  const navigate = useNavigate();
  // Recupera dados do colaborador autenticado do localStorage/sessionStorage
  const [user, setUser] = useState<{ name: string; email: string; role?: string } | null>(null);

  // Carrega dados do colaborador logado
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

  const handleLogout = () => {
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    navigate("/select-interface");
  };

  // Carrega projetos atribuídos do backend
  const [assignedProjects, setAssignedProjects] = useState<any[]>([]);
  useEffect(() => {
    if (!user) return;
    fetch(`/api/collaborator/projects?email=${encodeURIComponent(user.email)}`)
      .then((res) => res.ok ? res.json() : [])
      .then((data) => setAssignedProjects(Array.isArray(data) ? data : []));
  }, [user]);

  // Carrega tarefas de manutenção do backend
  const [maintenanceTasks, setMaintenanceTasks] = useState<any[]>([]);
  useEffect(() => {
    if (!user) return;
    fetch(`/api/collaborator/maintenance?email=${encodeURIComponent(user.email)}`)
      .then((res) => res.ok ? res.json() : [])
      .then((data) => setMaintenanceTasks(Array.isArray(data) ? data : []));
  }, [user]);

  // Convert projects and maintenance tasks to map locations
  const mapLocations: GardenLocation[] = useMemo(() => {
    const projectLocations: GardenLocation[] = assignedProjects.map(
      (project) => ({
        id: `project-${project.id}`,
        name: project.title,
        type: "project" as const,
        coordinates: project.coordinates,
        description: `Cliente: ${project.client} | Prazo: ${project.deadline}`,
        status:
          project.status === "Em Progresso"
            ? ("active" as const)
            : project.status === "Agendado"
              ? ("pending" as const)
              : ("active" as const),
        assignedTo: user ? user.name : "",
        priority: project.priority,
        estimatedDuration: "4-6 semanas",
      }),
    );

    const maintenanceLocations: GardenLocation[] = maintenanceTasks.map(
      (task) => ({
        id: `maintenance-${task.id}`,
        name: task.location,
        type: "maintenance" as const,
        coordinates: task.coordinates,
        description: `Tipo: ${task.type} | Agendado: ${task.scheduled}`,
        status: "pending" as const,
        assignedTo: user ? user.name : "",
        priority: task.priority,
      }),
    );

    return [...projectLocations, ...maintenanceLocations];
  }, [assignedProjects, maintenanceTasks, user]);

  const handleLocationSelect = useCallback((location: GardenLocation) => {
    console.log("Collaborator selected location:", location);
    // Could open task details, navigation, check-in, etc.
  }, []);

  // Carrega tarefas do dia do backend
  const [todayTasks, setTodayTasks] = useState<any[]>([]);
  useEffect(() => {
    if (!user) return;
    fetch(`/api/collaborator/today-tasks?email=${encodeURIComponent(user.email)}`)
      .then((res) => res.ok ? res.json() : [])
      .then((data) => setTodayTasks(Array.isArray(data) ? data : []));
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-garden-green/5">
      {/* Header */}
      <header className="bg-white border-b border-garden-green/20 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-garden-green/10 rounded-full">
                <Sprout className="w-8 h-8 text-garden-green-dark" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-garden-green-dark">
                  ReplantaSystem
                </h1>
                <p className="text-sm text-gray-600">Portal do Colaborador</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Bell className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
          <div className="flex items-center space-x-2">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {user ? user.name : "Usuário não identificado"}
              </p>
              <p className="text-xs text-gray-600">{user ? user.role : ""}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="border-garden-green/20 text-garden-green-dark hover:bg-garden-green-dark hover:text-white"
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
                Olá, {user.name.split(" ")[0]}! 🌿
              </h2>
              <p className="text-gray-600">
                Hoje você tem{" "}
                <span className="font-semibold text-garden-green-dark">
                  {todayTasks.filter((task) => task.status === "pending").length}{" "}
                  tarefas pendentes
                </span>
              </p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-red-600 mb-2">Usuário não identificado</h2>
              <p className="text-gray-600">Faça login para acessar sua dashboard.</p>
            </>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="garden-card">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-garden-green/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Briefcase className="w-6 h-6 text-garden-green-dark" />
              </div>
              <h3 className="text-2xl font-bold text-garden-green-dark">
                {assignedProjects.length}
              </h3>
              <p className="text-sm text-gray-600">Projetos Ativos</p>
            </CardContent>
          </Card>

          <Card className="garden-card">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-garden-green-dark">
                {todayTasks.filter((task) => task.status === "pending").length}
              </h3>
              <p className="text-sm text-gray-600">Tarefas Hoje</p>
            </CardContent>
          </Card>

          <Card className="garden-card">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <MapPin className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-2xl font-bold text-garden-green-dark">
                {maintenanceTasks.length}
              </h3>
              <p className="text-sm text-gray-600">Manutenções</p>
            </CardContent>
          </Card>

          <Card className="garden-card">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-garden-green-dark">
                {
                  todayTasks.filter((task) => task.status === "completed")
                    .length
                }
              </h3>
              <p className="text-sm text-gray-600">Concluídas</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Projects and Tasks */}
          <div className="lg:col-span-2 space-y-6">
            {/* Collaborator Map with Route Planning */}
            <GoogleMapsOptimized
              locations={mapLocations}
              height="400px"
              showControls={true}
              onLocationSelect={handleLocationSelect}
              userRole="collaborator"
              center={{ lat: 38.7223, lng: -9.1393 }}
              zoom={11}
              className="mb-6"
            />

            {/* Assigned Projects */}
            <Card className="garden-card">
              <CardHeader>
                <CardTitle className="text-garden-green-dark flex items-center">
                  <Briefcase className="w-5 h-5 mr-2" />
                  Projetos Atribuídos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assignedProjects.map((project) => (
                    <div
                      key={project.id}
                      className="p-4 border border-garden-green/20 rounded-lg hover:bg-garden-green/5 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-garden-green-dark">
                            {project.title}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Cliente: {project.client} • {project.location}
                          </p>
                        </div>
                        <div className="flex space-x-2">
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
                            {project.status}
                          </Badge>
                          {project.priority === "high" && (
                            <Badge variant="destructive">Urgente</Badge>
                          )}
                        </div>
                      </div>

                      {project.progress > 0 && (
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
                          Prazo: {project.deadline}
                        </span>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            <Route className="w-4 h-4 mr-1" />
                            Navegar
                          </Button>
                          <Button size="sm" variant="outline">
                            <Camera className="w-4 h-4 mr-1" />
                            Fotos
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Maintenance Tasks */}
            <Card className="garden-card">
              <CardHeader>
                <CardTitle className="text-garden-green-dark flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Tarefas de Manutenção
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {maintenanceTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h5 className="font-medium text-gray-900">
                            {task.location}
                          </h5>
                          <p className="text-sm text-gray-600">
                            {task.type} • {task.scheduled}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {task.priority === "high" && (
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                          )}
                          <Button size="sm" variant="outline">
                            Iniciar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Today's Schedule */}
            <Card className="garden-card">
              <CardHeader>
                <CardTitle className="text-garden-green-dark flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Agenda de Hoje
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {todayTasks.map((task, index) => (
                    <div
                      key={index}
                      className={`flex items-start space-x-3 p-2 rounded ${
                        task.status === "completed" ? "bg-green-50" : ""
                      }`}
                    >
                      <div className="text-sm font-medium text-gray-900 min-w-[50px]">
                        {task.time}
                      </div>
                      <div className="flex-1">
                        <p
                          className={`text-sm ${
                            task.status === "completed"
                              ? "text-green-700 line-through"
                              : "text-gray-900"
                          }`}
                        >
                          {task.task}
                        </p>
                      </div>
                      {task.status === "completed" && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="garden-card">
              <CardHeader>
                <CardTitle className="text-garden-green-dark flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Ações Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="h-16 flex-col border-garden-green/20 text-garden-green-dark hover:bg-garden-green hover:text-white"
                  >
                    <MessageCircle className="w-5 h-5 mb-1" />
                    <span className="text-xs">Chat</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-16 flex-col border-garden-green/20 text-garden-green-dark hover:bg-garden-green hover:text-white"
                  >
                    <Camera className="w-5 h-5 mb-1" />
                    <span className="text-xs">Fotos</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-16 flex-col border-garden-green/20 text-garden-green-dark hover:bg-garden-green hover:text-white"
                  >
                    <Clock className="w-5 h-5 mb-1" />
                    <span className="text-xs">Tempo</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-16 flex-col border-garden-green/20 text-garden-green-dark hover:bg-garden-green hover:text-white"
                  >
                    <CheckCircle className="w-5 h-5 mb-1" />
                    <span className="text-xs">Relatório</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Weather Widget */}
            <Card className="garden-card">
              <CardHeader>
                <CardTitle className="text-garden-green-dark text-base">
                  Condições Meteorológicas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-2xl mb-2">☀️</div>
                  <p className="text-lg font-semibold text-gray-900">22°C</p>
                  <p className="text-sm text-gray-600">Ensolarado</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Ideal para trabalhos ao ar livre
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
