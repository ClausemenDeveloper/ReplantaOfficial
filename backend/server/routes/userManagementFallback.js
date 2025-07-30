import express from "express";
import jwt from "jsonwebtoken";
import { body, param, validationResult } from "express-validator";
import memoryStore from "../fallback/memoryStore.js";

const router = express.Router();

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
    const user = await memoryStore.findUserById(decoded.userId);
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
// Middleware global para tratamento de erros
router.use((err, req, res, next) => {
  console.error("Erro na rota de usuários (fallback):", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Erro interno do servidor",
    error: err instanceof Error ? err.message : String(err),
  });
});

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
router.get("/pending", authenticate, requireAdmin, async (req, res) => {
  try {
    const pendingUsers = await memoryStore.getPendingUsers();

    res.json({
      success: true,
      data: {
        users: pendingUsers,
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
});

// GET /api/users - Listar todos os usuários (admin only)
router.get("/", authenticate, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, role } = req.query;
    const skip = (page - 1) * limit;

    let filter = {};
    if (status) filter.approvalStatus = status;
    if (role) filter.role = role;

    const allUsers = await memoryStore.getAllUsers(filter);
    const users = allUsers.slice(skip, skip + parseInt(limit));
    const total = allUsers.length;

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current: parseInt(page),
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
});

// POST /api/users/:id/approve - Aprovar usuário
router.post(
  "/:id/approve",
  authenticate,
  requireAdmin,
  [param("id").notEmpty().withMessage("ID inválido")],
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

      const user = await memoryStore.findUserById(req.params.id);
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
      const approvedUser = await memoryStore.approveUser(
        user._id,
        req.user._id,
      );

      // Simular envio de email (sem enviar realmente em fallback)
      console.log(`📧 Email de aprovação seria enviado para: ${user.email}`);

      res.json({
        success: true,
        message: "Usuário aprovado com sucesso",
        data: {
          user: memoryStore.getUserPublicProfile(approvedUser),
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
  authenticate,
  requireAdmin,
  [
    param("id").notEmpty().withMessage("ID inválido"),
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

      const user = await memoryStore.findUserById(req.params.id);
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
      const rejectedUser = await memoryStore.rejectUser(
        user._id,
        req.user._id,
        reason,
      );

      // Simular envio de email (sem enviar realmente em fallback)
      console.log(
        `📧 Email de rejeição seria enviado para: ${user.email} - Motivo: ${reason}`,
      );

      res.json({
        success: true,
        message: "Usuário rejeitado",
        data: {
          user: memoryStore.getUserPublicProfile(rejectedUser),
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
router.get("/stats", authenticate, requireAdmin, async (req, res) => {
  try {
    const stats = await memoryStore.getUserStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Erro nas estatísticas:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  }
});

// PUT /api/users/:id/toggle-active - Ativar/Desativar usuário
router.put(
  "/:id/toggle-active",
  authenticate,
  requireAdmin,
  [param("id").notEmpty().withMessage("ID inválido")],
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

      const user = await memoryStore.findUserById(req.params.id);
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

      const updatedUser = await memoryStore.updateUser(user._id, {
        isActive: !user.isActive,
      });

      res.json({
        success: true,
        message: `Usuário ${updatedUser.isActive ? "ativado" : "desativado"} com sucesso`,
        data: {
          user: memoryStore.getUserPublicProfile(updatedUser),
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

export default router;
