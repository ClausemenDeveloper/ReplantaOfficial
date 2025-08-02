// Middleware global para tratamento de erros
router.use((err, req, res, next) => {
  console.error("Erro na rota de usuários:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Erro interno do servidor",
    error: err instanceof Error ? err.message : String(err),
  });
});
import express from "express";
import { body, param, validationResult } from "express-validator";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import databaseService from "../config/database.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// Middleware para verificar conexão com DB
const checkDatabaseConnection = async (req, res, next) => {
  if (!databaseService.isConnectedToDatabase()) {
    return res.status(503).json({
      success: false,
      message: "Serviço temporariamente indisponível",
      error: "Database not connected",
    });
  }
  next();
};

// Middleware para autenticação robusta
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.replace("Bearer ", "") : null;
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token não fornecido",
      });
    }
    if (!process.env.JWT_SECRET) {
      // Falha crítica: não permitir fallback
      return res.status(500).json({
        success: false,
        message: "JWT_SECRET não está definido no ambiente. Contate o administrador.",
      });
    }
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Token inválido ou expirado",
      });
    }
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Token inválido ou usuário inativo",
      });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Middleware para verificar se é admin
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Acesso restrito a administradores",
    });
  }
  next();
};

// GET /api/users/pending - Listar usuários pendentes de aprovação
router.get(
  "/pending",
  checkDatabaseConnection,
  authenticate,
  requireAdmin,
  async (req, res) => {
    try {
      const pendingUsers = await User.findPendingApproval();

      res.json({
        success: true,
        data: {
          users: pendingUsers.map((user) => user.getPublicProfile()),
          count: pendingUsers.length,
        },
      });
    } catch (error) {
      console.error("Erro ao buscar usuários pendentes:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  },
);

// GET /api/users - Listar todos os usuários (admin only)
router.get(
  "/",
  checkDatabaseConnection,
  authenticate,
  requireAdmin,
  async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const { status, role } = req.query;
      const skip = (page - 1) * limit;

      let filter = { isActive: true };
      if (status) filter.approvalStatus = status;
      if (role) filter.role = role;

      const users = await User.find(filter)
        .populate("approvedBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await User.countDocuments(filter);

      res.json({
        success: true,
        data: {
          users: users.map((user) => user.getPublicProfile()),
          pagination: {
            current: page,
            total: Math.ceil(total / limit),
            count: users.length,
            totalItems: total,
          },
        },
      });
    } catch (error) {
      console.error("Erro ao listar usuários:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  },
);

// POST /api/users/:id/approve - Aprovar usuário
router.post(
  "/:id/approve",
  checkDatabaseConnection,
  authenticate,
  requireAdmin,
  [param("id").isMongoId().withMessage("ID inválido")],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "ID inválido",
          errors: errors.array(),
        });
      }

      const user = await User.findById(req.params.id);
      if (!user || !user.isActive) {
        return res.status(404).json({
          success: false,
          message: "Usuário não encontrado",
        });
      }

      if (user.approvalStatus === "approved") {
        return res.status(400).json({
          success: false,
          message: "Usuário já está aprovado",
        });
      }

      // Aprovar usuário
      await user.approve(req.user._id);

      // Criar notificação para o usuário aprovado
      await Notification.create({
        recipient: user._id,
        type: "system_alert",
        title: "Conta Aprovada",
        message:
          "A sua conta foi aprovada pelo administrador. Já pode aceder à plataforma.",
        priority: "high",
      });

      // Enviar email de aprovação
      try {
        const emailService = await import("../services/emailService.js");

        const emailData = {
          to: user.email,
          subject: "Conta ReplantaSystem Aprovada ✅",
          template: "userApproved",
          templateData: {
            userName: user.name,
            userEmail: user.email,
            userRole: user.role === "client" ? "Cliente" : "Colaborador",
            loginUrl: `${process.env.WEBSITE_URL || "http://localhost:8080"}/login`,
            dashboardUrl: `${process.env.WEBSITE_URL || "http://localhost:8080"}/dashboard/${user.role}`,
            supportEmail:
              process.env.SUPPORT_EMAIL || "clausemenandredossantos@gmail.com",
            approvedBy: req.user.name,
            approvedAt: new Date().toLocaleDateString("pt-PT", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        };

        await emailService.default.sendEmail(emailData);
        console.log(`✅ Email de aprovação enviado para ${user.email}`);
      } catch (emailError) {
        console.error("❌ Erro ao enviar email de aprovação:", emailError);
        // Não falhar a aprovação se o email falhar
      }

      res.json({
        success: true,
        message: "Usuário aprovado com sucesso",
        data: {
          user: user.getPublicProfile(),
        },
      });
    } catch (error) {
      console.error("Erro ao aprovar usuário:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  },
);

// POST /api/users/:id/reject - Rejeitar usuário
router.post(
  "/:id/reject",
  checkDatabaseConnection,
  authenticate,
  requireAdmin,
  [
    param("id").isMongoId().withMessage("ID inválido"),
    body("reason")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Motivo não pode ter mais de 500 caracteres"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Dados inválidos",
          errors: errors.array(),
        });
      }

      const user = await User.findById(req.params.id);
      if (!user || !user.isActive) {
        return res.status(404).json({
          success: false,
          message: "Usuário não encontrado",
        });
      }

      if (user.approvalStatus === "rejected") {
        return res.status(400).json({
          success: false,
          message: "Usuário já foi rejeitado",
        });
      }

      const reason = req.body.reason || "Não especificado";

      // Rejeitar usuário
      await user.reject(req.user._id, reason);

      // Criar notificação para o usuário rejeitado
      await Notification.create({
        recipient: user._id,
        type: "system_alert",
        title: "Conta Rejeitada",
        message: `A sua conta foi rejeitada pelo administrador. Motivo: ${reason}`,
        priority: "high",
      });

      // Enviar email de rejeição
      try {
        const emailService = await import("../services/emailService.js");

        const emailData = {
          to: user.email,
          subject: "Conta ReplantaSystem - Informação Importante ❌",
          template: "userRejected",
          templateData: {
            userName: user.name,
            userEmail: user.email,
            userRole: user.role === "client" ? "Cliente" : "Colaborador",
            rejectionReason: reason,
            supportEmail:
              process.env.SUPPORT_EMAIL || "clausemenandredossantos@gmail.com",
            contactUrl: `mailto:${process.env.SUPPORT_EMAIL || "clausemenandredossantos@gmail.com"}?subject=Revisão de Conta ReplantaSystem`,
            rejectedBy: req.user.name,
            rejectedAt: new Date().toLocaleDateString("pt-PT", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        };

        await emailService.default.sendEmail(emailData);
        console.log(`✅ Email de rejeição enviado para ${user.email}`);
      } catch (emailError) {
        console.error("❌ Erro ao enviar email de rejeição:", emailError);
        // Não falhar a rejeição se o email falhar
      }

      res.json({
        success: true,
        message: "Usuário rejeitado",
        data: {
          user: user.getPublicProfile(),
        },
      });
    } catch (error) {
      console.error("Erro ao rejeitar usuário:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  },
);

// GET /api/users/stats - Estatísticas de usuários
router.get(
  "/stats",
  checkDatabaseConnection,
  authenticate,
  requireAdmin,
  async (req, res) => {
    try {
      const stats = await User.aggregate([
        {
          $group: {
            _id: {
              role: "$role",
              approvalStatus: "$approvalStatus",
            },
            count: { $sum: 1 },
          },
        },
      ]);

      const totalUsers = await User.countDocuments({ isActive: true });
      const pendingApproval = await User.countDocuments({
        approvalStatus: "pending",
        isActive: true,
      });
      const approvedUsers = await User.countDocuments({
        approvalStatus: "approved",
        isActive: true,
      });
      const rejectedUsers = await User.countDocuments({
        approvalStatus: "rejected",
        isActive: true,
      });

      res.json({
        success: true,
        data: {
          totalUsers,
          pendingApproval,
          approvedUsers,
          rejectedUsers,
          detailedStats: stats,
        },
      });
    } catch (error) {
      console.error("Erro nas estatísticas:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  },
);

// PUT /api/users/:id/toggle-active - Ativar/Desativar usuário
router.put(
  "/:id/toggle-active",
  checkDatabaseConnection,
  authenticate,
  requireAdmin,
  [param("id").isMongoId().withMessage("ID inválido")],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "ID inválido",
          errors: errors.array(),
        });
      }

      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Usuário não encontrado",
        });
      }

      // Não permitir desativar outros admins
      if (
        user.role === "admin" &&
        user._id.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "Não é possível desativar outros administradores",
        });
      }

      user.isActive = !user.isActive;
      await user.save();

      // Criar notificação se conta foi desativada
      if (!user.isActive) {
        await Notification.create({
          recipient: user._id,
          type: "system_alert",
          title: "Conta Desativada",
          message: "A sua conta foi desativada pelo administrador.",
          priority: "high",
        });
      }

      res.json({
        success: true,
        message: `Usuário ${user.isActive ? "ativado" : "desativado"} com sucesso`,
        data: {
          user: user.getPublicProfile(),
        },
      });
    } catch (error) {
      console.error("Erro ao alterar status do usuário:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  },
);

// POST /api/users/:id/promote - Promover colaborador a admin
router.post(
  "/:id/promote",
  checkDatabaseConnection,
  authenticate,
  requireAdmin, // Apenas admins podem promover
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user || user.role !== "collaborator") {
        return res.status(400).json({
          success: false,
          message: "Usuário inválido ou não é colaborador",
        });
      }

      user.role = "admin";
      await user.save();

      res.json({
        success: true,
        message: "Usuário promovido a administrador com sucesso",
        data: user.getPublicProfile(),
      });
    } catch (error) {
      console.error("Erro ao promover usuário:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  },
);

export default router;
