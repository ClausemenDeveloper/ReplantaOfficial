import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sprout,
  ArrowLeft,
  Users,
  Search,
  UserCheck,
  UserX,
  Calendar,
  MoreHorizontal,
  Edit,
  Trash2,
  Check,
  X,
  Shield,
  AlertTriangle,
  Phone,
  MapPin,
  Briefcase,
  Star,
  Clock,
  Ban,
  Eye,
  Mail,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../components/ui/alert-dialog";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";

export default function AdminUsers() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [editingUser, setEditingUser] = useState<any>(null);

  const handleBack = () => {
    navigate("/admin/dashboard");
  };

  const users = [
    {
  // const [editingUser, setEditingUser] = useState<any>(null);
      name: "João Silva",
      email: "joao.silva@email.com",
      phone: "+351 912 345 678",
      role: "Cliente",
      status: "Ativo",
      registeredAt: "2025-01-05",
      lastLogin: "2025-01-12",
      projects: 2,
      location: "Lisboa",
      notes: "Cliente regular, sempre pontual nos pagamentos.",
    },
    {
      id: 2,
      name: "Maria Santos",
      email: "maria.santos@replantasystem.com",
      phone: "+351 913 456 789",
      role: "Colaborador",
      status: "Ativo",
      registeredAt: "2024-12-20",
      lastLogin: "2025-01-13",
      projects: 5,
      location: "Porto",
      specialization: "Paisagismo",
      experience: "6-10 anos",
      notes:
        "Excelente especialista em paisagismo, muito recomendada pelos clientes.",
    },
    {
      id: 3,
      name: "Ana Costa",
      email: "ana.costa@email.com",
      phone: "+351 914 567 890",
      role: "Cliente",
      status: "Pendente",
      registeredAt: "2025-01-10",
      lastLogin: "Nunca",
      projects: 0,
      location: "Braga",
      notes: "Nova cliente, aguarda aprovação.",
    },
    {
      id: 4,
      name: "Pedro Santos",
      email: "pedro.santos@email.com",
      phone: "+351 915 678 901",
      role: "Colaborador",
      status: "Pendente",
      registeredAt: "2025-01-09",
      lastLogin: "Nunca",
      projects: 0,
      location: "Coimbra",
      specialization: "Jardinagem Geral",
      experience: "2-5 anos",
      notes: "Candidato promissor, experiência em jardinagem residencial.",
    },
    {
      id: 5,
      name: "Carlos Mendes",
      email: "carlos.mendes@email.com",
      phone: "+351 916 789 012",
      role: "Cliente",
      status: "Inativo",
      registeredAt: "2024-11-15",
      lastLogin: "2024-12-20",
      projects: 1,
      location: "Faro",
      notes: "Cliente desativado por falta de pagamento.",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Ativo":
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200">
            <UserCheck className="w-3 h-3 mr-1" />
            Ativo
          </Badge>
        );
      case "Pendente":
        return (
          <Badge className="bg-orange-100 text-orange-700 border-orange-200">
            <Clock className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        );
      case "Inativo":
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200">
            <Ban className="w-3 h-3 mr-1" />
            Inativo
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "Cliente":
        return (
          <Badge className="bg-garden-green-light/10 text-garden-green border-garden-green-light/20">
            <Users className="w-3 h-3 mr-1" />
            Cliente
          </Badge>
        );
      case "Colaborador":
        return (
          <Badge className="bg-garden-green-dark/10 text-garden-green-dark border-garden-green-dark/20">
            <Briefcase className="w-3 h-3 mr-1" />
            Colaborador
          </Badge>
        );
      case "Administrador":
        return (
          <Badge className="bg-garden-brown/10 text-garden-brown border-garden-brown/20">
            <Shield className="w-3 h-3 mr-1" />
            Admin
          </Badge>
        );
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  const handleApproveUser = (userId: number) => {
    console.log("Approving user:", userId);
    // TODO: Implement backend call
    alert("Utilizador aprovado com sucesso!");
  };

  const handleRejectUser = (userId: number) => {
    console.log("Rejecting user:", userId);
    // TODO: Implement backend call
    alert("Utilizador rejeitado!");
  };

  const handleActivateUser = (userId: number) => {
    console.log("Activating user:", userId);
    // TODO: Implement backend call
    alert("Utilizador ativado!");
  };

  const handleDeactivateUser = (userId: number) => {
    console.log("Deactivating user:", userId);
    // TODO: Implement backend call
    alert("Utilizador desativado!");
  };

  const handleDeleteUser = (userId: number) => {
    console.log("Deleting user:", userId);
    // TODO: Implement backend call
    alert("Utilizador eliminado permanentemente!");
  };

  const promoteToAdmin = async (userId: number) => {
    try {
      const response = await fetch(`/api/users/${userId}/promote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`, // Certifique-se de que o token de autenticação está armazenado
        },
      });

      const data = await response.json();

      if (response.ok) {
        alert("Utilizador promovido a administrador com sucesso!");
        // Atualize a lista de usuários, se necessário
      } else {
        alert(data.message || "Erro ao promover o utilizador.");
      }
    } catch (error) {
      console.error("Erro ao promover o utilizador:", error);
      alert("Ocorreu um erro ao tentar promover o utilizador.");
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole =
      filterRole === "all" || user.role === filterRole;

    const matchesStatus =
      filterStatus === "all" || user.status === filterStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const stats = [
    {
      label: "Total de Utilizadores",
      value: users.length,
      color: "text-garden-brown",
      icon: <Users className="w-5 h-5" />,
    },
    {
      label: "Ativos",
      value: users.filter((u) => u.status === "Ativo").length,
      color: "text-green-600",
      icon: <UserCheck className="w-5 h-5" />,
    },
    {
      label: "Pendentes",
      value: users.filter((u) => u.status === "Pendente").length,
      color: "text-orange-600",
      icon: <Clock className="w-5 h-5" />,
    },
    {
      label: "Clientes",
      value: users.filter((u) => u.role === "Cliente").length,
      color: "text-garden-green",
      icon: <Users className="w-5 h-5" />,
    },
  ];

  const [selectedUser, setSelectedUser] = useState<
    | {
        id?: number;
        name: string;
        email: string;
        phone: string;
        role: string;
        status: string;
        registeredAt: string;
        lastLogin: string;
        projects: number;
        location: string;
        notes: string;
        specialization?: string;
        experience?: string;
      }
    | null
  >(null);
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-garden-brown/5">
      {/* Header */}
      <header className="bg-white border-b border-garden-brown/20 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={handleBack}
                className="hover:bg-garden-brown/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Dashboard
              </Button>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-garden-brown/10 rounded-full">
                  <Sprout className="w-6 h-6 text-garden-brown" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-garden-brown">
                    Gestão de Utilizadores
                  </h1>
                  <p className="text-sm text-gray-600">
                    Controlo total sobre clientes e colaboradores
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="garden-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`text-2xl font-bold ${stat.color} mb-1`}>
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                  <div className={`p-3 rounded-full bg-gray-50 ${stat.color}`}>
                    {stat.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters and Search */}
        <Card className="garden-card mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium text-garden-brown mb-2 block">
                  Pesquisar utilizadores
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Nome ou email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-garden-brown/20 focus:border-garden-brown"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-garden-brown mb-2 block">
                  Filtrar por role
                </label>
                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger className="w-40 border-garden-brown/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="Cliente">Cliente</SelectItem>
                    <SelectItem value="Colaborador">Colaborador</SelectItem>
                    <SelectItem value="Administrador">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-garden-brown mb-2 block">
                  Filtrar por status
                </label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40 border-garden-brown/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="garden-card">
          <CardHeader>
            <CardTitle className="text-garden-brown flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Utilizadores ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-garden-brown/10">
                    <th className="text-left py-3 px-4 font-semibold text-garden-brown">
                      Utilizador
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-garden-brown">
                      Contacto
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-garden-brown">
                      Role/Status
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-garden-brown">
                      Projetos
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-garden-brown">
                      Último Login
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-garden-brown">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-gray-100 hover:bg-garden-brown/5 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-garden-brown/10 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-garden-brown" />
                          </div>
                          <div>
                            <div className="font-medium text-garden-brown">
                              {user.name}
                            </div>
                            <div className="text-sm text-gray-600 flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              {user.location}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <div className="text-sm flex items-center">
                            <Mail className="w-3 h-3 mr-1 text-gray-400" />
                            {user.email}
                          </div>
                          <div className="text-sm flex items-center">
                            <Phone className="w-3 h-3 mr-1 text-gray-400" />
                            {user.phone}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-2">
                          {getRoleBadge(user.role)}
                          {getStatusBadge(user.status)}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-medium">{user.projects}</span>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {user.lastLogin}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem 
                              onClick={() => setSelectedUser(user)}
                              aria-label={`Ver detalhes de ${user.name}`}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Ver Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setEditingUser(user)}
                              aria-label={`Editar ${user.name}`}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.status === "Pendente" && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => user.id !== undefined && handleApproveUser(user.id)}
                                  className="text-green-600"
                                  aria-label={`Aprovar ${user.name}`}
                                >
                                  <Check className="w-4 h-4 mr-2" />
                                  Aprovar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => user.id !== undefined && handleRejectUser(user.id)}
                                  className="text-red-600"
                                  aria-label={`Rejeitar ${user.name}`}
                                >
                                  <X className="w-4 h-4 mr-2" />
                                  Rejeitar
                                </DropdownMenuItem>
                              </>
                            )}
                            {user.status === "Ativo" && (
                              <DropdownMenuItem
                                onClick={() => user.id !== undefined && handleDeactivateUser(user.id)}
                                className="text-orange-600"
                                aria-label={`Desativar ${user.name}`}
                              >
                                <Ban className="w-4 h-4 mr-2" />
                                Desativar
                              </DropdownMenuItem>
                            )}
                            {user.status === "Inativo" && (
                              <DropdownMenuItem
                                onClick={() => user.id !== undefined && handleActivateUser(user.id)}
                                className="text-green-600"
                                aria-label={`Ativar ${user.name}`}
                              >
                                <UserCheck className="w-4 h-4 mr-2" />
                                Ativar
                              </DropdownMenuItem>
                            )}
                            {user.role === "Colaborador" && (
                              <DropdownMenuItem
                                onClick={() => user.id !== undefined && promoteToAdmin(user.id)}
                                className="text-blue-600"
                                aria-label={`Promover ${user.name} a Admin`}
                              >
                                <Shield className="w-4 h-4 mr-2" />
                                Promover a Admin
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  onSelect={(e) => e.preventDefault()}
                                  className="text-red-600"
                                  aria-label={`Eliminar ${user.name}`}
                                  tabIndex={0}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Eliminar
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <DialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="flex items-center">
                                    <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
                                    Confirmar Eliminação
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem a certeza que pretende eliminar
                                    permanentemente o utilizador{" "}
                                    <strong>{user.name}</strong>? Esta ação não
                                    pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>
                                    Cancelar
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => user.id !== undefined && handleDeleteUser(user.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </DialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* User Details Dialog */}
        <Dialog
          open={!!selectedUser}
          onOpenChange={() => setSelectedUser(null)}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Detalhes do Utilizador
              </DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Nome</Label>
                    <p className="text-sm text-gray-600">{selectedUser.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Email</Label>
                    <p className="text-sm text-gray-600">
                      {selectedUser.email}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Telefone</Label>
                    <p className="text-sm text-gray-600">
                      {selectedUser.phone}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Localização</Label>
                    <p className="text-sm text-gray-600">
                      {selectedUser.location}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Role</Label>
                    <div className="mt-1">
                      {getRoleBadge(selectedUser.role)}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <div className="mt-1">
                      {getStatusBadge(selectedUser.status)}
                    </div>
                  </div>
                </div>

                {selectedUser.role === "Colaborador" && (
                  <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <Label className="text-sm font-medium">
                        Especialização
                      </Label>
                      <p className="text-sm text-gray-600">
                        {selectedUser.specialization}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Experiência</Label>
                      <p className="text-sm text-gray-600">
                        {selectedUser.experience}
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-sm font-medium">Notas</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedUser.notes}
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-4 pt-4 border-t">
                  <div>
                    <Label className="text-sm font-medium">Registado em</Label>
                    <p className="text-sm text-gray-600">
                      {selectedUser.registeredAt}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Último Login</Label>
                    <p className="text-sm text-gray-600">
                      {selectedUser.lastLogin}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Projetos</Label>
                    <p className="text-sm text-gray-600">
                      {selectedUser.projects}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
