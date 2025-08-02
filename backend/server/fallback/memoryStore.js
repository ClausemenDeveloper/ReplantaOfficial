// Sistema de armazenamento temporário em memória para quando MongoDB não estiver disponível
import bcryptjs from "bcryptjs";


class MemoryStore {
  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.notifications = new Map();
    this.isInitialized = false;
    // Não chamar init no construtor, pois é assíncrono
  }

  async init() {
    if (this.isInitialized) return;

    // Criar admin padrão
    const adminId = "admin-default-id";
    const saltRounds = 12;
    const hashedPassword = await bcryptjs.hash("@Venus0777", saltRounds);

    this.users.set(adminId, {
      _id: adminId,
      name: "Clausemen André dos Santos",
      email: "clausemenandredossantos@gmail.com",
      password: hashedPassword,
      role: "admin",
      approvalStatus: "approved",
      isActive: true,
      emailVerified: true,
      createdAt: new Date(),
      lastLogin: null,
    });

    console.log("✅ MemoryStore inicializado com admin padrão");
    this.isInitialized = true;
  }

  // User methods

  async createUser(userData) {
    await this.init();

    const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const saltRounds = 12;
    const hashedPassword = await bcryptjs.hash(userData.password, saltRounds);

    // Garantir que role seja válido
    const validRoles = ["admin", "client", "collaborator"];
    let role = userData.role;
    if (!validRoles.includes(role)) role = "client";

    const user = {
      _id: userId,
      name: userData.name,
      email: userData.email.toLowerCase(),
      password: hashedPassword,
      role,
      approvalStatus: role === "admin" ? "approved" : "pending",
      isActive: true,
      emailVerified: false,
      phone: userData.phone,
      address: userData.address,
      createdAt: new Date(),
      lastLogin: null,
      registrationToken: Math.random().toString(36).substring(2, 15),
    };

    this.users.set(userId, user);
    console.log(`✅ Usuário criado: ${user.email} (${user.role}) - Status: ${user.approvalStatus}`);
    return this.getUserPublicProfile(user);
  }
  async promoteUserToAdmin(userId, adminId) {
    await this.init();
    const user = await this.findUserById(userId);
    const admin = await this.findUserById(adminId);
    if (!user || !admin || admin.role !== "admin") return null;
    if (user.role === "admin") return user;
    user.role = "admin";
    user.approvalStatus = "approved";
    user.approvedBy = adminId;
    user.approvedAt = new Date();
    this.users.set(userId, user);
    console.log(`✅ Usuário promovido a admin: ${user.email} por ${admin.name}`);
    return user;
  }

  async findUserByEmail(email) {
    await this.init();
    for (const user of this.users.values()) {
      if (user.email === email.toLowerCase()) {
        return user;
      }
    }
    return null;
  }

  async findUserById(id) {
    await this.init();
    return this.users.get(id) || null;
  }

  async canUserLogin(email) {
    const user = await this.findUserByEmail(email);
    if (!user || !user.isActive) return null;

    // Admin sempre pode entrar
    if (user.role === "admin") return user;

    // Clientes e colaboradores precisam estar aprovados
    if (
      ["client", "collaborator"].includes(user.role) &&
      user.approvalStatus === "approved"
    ) {
      return user;
    }

    return null;
  }

  async comparePassword(plainPassword, hashedPassword) {
    return await bcryptjs.compare(plainPassword, hashedPassword);
  }

  async updateUser(id, updates) {
    await this.init();
    const user = this.users.get(id);
    if (!user) return null;

    Object.assign(user, updates);
    this.users.set(id, user);
    return user;
  }

  async approveUser(userId, adminId) {
    const user = await this.findUserById(userId);
    const admin = await this.findUserById(adminId);

    if (!user || !admin) return null;

    user.approvalStatus = "approved";
    user.approvedBy = adminId;
    user.approvedAt = new Date();

    this.users.set(userId, user);
    console.log(`✅ Usuário aprovado: ${user.email} por ${admin.name}`);
    return user;
  }

  async rejectUser(userId, adminId, reason) {
    const user = await this.findUserById(userId);
    const admin = await this.findUserById(adminId);

    if (!user || !admin) return null;

    user.approvalStatus = "rejected";
    user.approvedBy = adminId;
    user.rejectedAt = new Date();
    user.rejectionReason = reason;

    this.users.set(userId, user);
    console.log(
      `❌ Usuário rejeitado: ${user.email} por ${admin.name} - Motivo: ${reason}`,
    );
    return user;
  }

  async getPendingUsers() {
    await this.init();
    const pending = [];
    for (const user of this.users.values()) {
      if (
        user.approvalStatus === "pending" &&
        user.isActive &&
        ["client", "collaborator"].includes(user.role)
      ) {
        pending.push(this.getUserPublicProfile(user));
      }
    }
    return pending.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );
  }

  async getAllUsers(filter = {}) {
    await this.init();
    let users = Array.from(this.users.values());

    if (filter.role) {
      users = users.filter((u) => u.role === filter.role);
    }
    if (filter.approvalStatus) {
      users = users.filter((u) => u.approvalStatus === filter.approvalStatus);
    }
    if (filter.isActive !== undefined) {
      users = users.filter((u) => u.isActive === filter.isActive);
    }

    return users
      .map((u) => this.getUserPublicProfile(u))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  getUserPublicProfile(user) {
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      phone: user.phone,
      preferences: user.preferences,
      emailVerified: user.emailVerified,
      lastLogin: user.lastLogin,
      approvalStatus: user.approvalStatus,
      approvedAt: user.approvedAt,
      rejectedAt: user.rejectedAt,
      rejectionReason: user.rejectionReason,
      createdAt: user.createdAt,
      isActive: user.isActive,
    };
  }

  // Stats methods
  async getUserStats() {
    await this.init();
    const users = Array.from(this.users.values());

    return {
      totalUsers: users.filter((u) => u.isActive).length,
      pendingApproval: users.filter(
        (u) => u.approvalStatus === "pending" && u.isActive,
      ).length,
      approvedUsers: users.filter(
        (u) => u.approvalStatus === "approved" && u.isActive,
      ).length,
      rejectedUsers: users.filter(
        (u) => u.approvalStatus === "rejected" && u.isActive,
      ).length,
      byRole: {
        admin: users.filter((u) => u.role === "admin" && u.isActive).length,
        client: users.filter((u) => u.role === "client" && u.isActive).length,
        collaborator: users.filter(
          (u) => u.role === "collaborator" && u.isActive,
        ).length,
      },
    };
  }


  // Health check compatível com interface DatabaseService
  async healthCheck() {
    await this.init();
    return {
      status: "connected",
      message: "MemoryStore funcionando (dados temporários)",
      totalUsers: this.users.size,
      type: "memory",
    };
  }

  getStatus() {
    return {
      status: "connected",
      message: "MemoryStore funcionando (dados temporários)",
      totalUsers: this.users.size,
      type: "memory",
    };
  }
}

// Singleton instance
const memoryStore = new MemoryStore();

export default memoryStore;
