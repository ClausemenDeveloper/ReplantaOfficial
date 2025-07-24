import express from "express";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import User from "../models/User.js";
import databaseService from "../config/database.js";

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

// Validações
const registerValidation = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Nome deve ter entre 2 e 100 caracteres"),
  body("email").isEmail().normalizeEmail().withMessage("Email inválido"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Senha deve ter pelo menos 6 caracteres"),
  body("role")
    .optional()
    .isIn(["client", "admin", "collaborator"])
    .withMessage("Papel inválido"),
];

const loginValidation = [
  body("email").isEmail().normalizeEmail().withMessage("Email inválido"),
  body("password").notEmpty().withMessage("Senha é obrigatória"),
];

// Helper para gerar JWT
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || "secret_key", {
    expiresIn: "7d",
  });
};

// POST /api/auth/register
router.post(
  "/register",
  checkDatabaseConnection,
  registerValidation,
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

      const { name, email, password, role = "client" } = req.body;

      // Verificar se usuário já existe
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "Email já está em uso",
        });
      }

      // Criar novo usuário
      const user = new User({
        name,
        email,
        password,
        role,
        // approvalStatus será definido automaticamente baseado no role
      });

      await user.save();

      // Verificar se usuário precisa de aprovação
      if (user.approvalStatus === "pending") {
        res.status(201).json({
          success: true,
          message:
            "Registo efetuado com sucesso. Aguarde aprovação do administrador para aceder à plataforma.",
          data: {
            user: user.getPublicProfile(),
            needsApproval: true,
          },
        });
      } else {
        // Admin é aprovado automaticamente
        const token = generateToken(user._id);
        user.lastLogin = new Date();
        await user.save();

        res.status(201).json({
          success: true,
          message: "Usuário registrado com sucesso",
          data: {
            user: user.getPublicProfile(),
            token,
            needsApproval: false,
          },
        });
      }
    } catch (error) {
      console.error("Erro no registro:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        error: error.message,
      });
    }
  },
);

// POST /api/auth/login
router.post(
  "/login",
  checkDatabaseConnection,
  loginValidation,
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

      const { email, password } = req.body;

      // Verificar se usuário pode fazer login (existe e está aprovado)
      const user = await User.canLogin(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message:
            "Acesso negado. Verifique suas credenciais ou contacte o administrador.",
        });
      }

      // Buscar usuário completo com senha para verificação
      const userWithPassword = await User.findById(user._id).select(
        "+password",
      );

      // Verificar se usuário está ativo
      if (!userWithPassword.isActive) {
        return res.status(401).json({
          success: false,
          message: "Conta desativada",
        });
      }

      // Verificar aprovação para clientes e colaboradores
      if (["client", "collaborator"].includes(userWithPassword.role)) {
        if (userWithPassword.approvalStatus !== "approved") {
          let message = "Conta aguardando aprovação do administrador.";
          if (userWithPassword.approvalStatus === "rejected") {
            message = `Conta rejeitada. Motivo: ${userWithPassword.rejectionReason || "Não especificado"}`;
          }
          return res.status(403).json({
            success: false,
            message,
            approvalStatus: userWithPassword.approvalStatus,
          });
        }
      }

      // Verificar senha
      const isPasswordValid = await userWithPassword.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Credenciais inválidas",
        });
      }

      // Gerar token
      const token = generateToken(userWithPassword._id);

      // Atualizar último login
      userWithPassword.lastLogin = new Date();
      await userWithPassword.save();

      res.json({
        success: true,
        message: "Login realizado com sucesso",
        data: {
          user: userWithPassword.getPublicProfile(),
          token,
        },
      });
    } catch (error) {
      console.error("Erro no login:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        error: error.message,
      });
    }
  },
);

// GET /api/auth/me
router.get("/me", checkDatabaseConnection, async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token não fornecido",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret_key");
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Token inválido",
      });
    }

    res.json({
      success: true,
      data: {
        user: user.getPublicProfile(),
      },
    });
  } catch (error) {
    console.error("Erro na verificação do token:", error);
    res.status(401).json({
      success: false,
      message: "Token inválido",
    });
  }
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  // No caso de JWT, o logout é feito no frontend removendo o token
  // Aqui podemos apenas confirmar o logout
  res.json({
    success: true,
    message: "Logout realizado com sucesso",
  });
});

// POST /api/auth/forgot-password
router.post(
  "/forgot-password",
  checkDatabaseConnection,
  [body("email").isEmail().normalizeEmail().withMessage("Email inválido")],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Email inválido",
          errors: errors.array(),
        });
      }

      const { email } = req.body;
      const user = await User.findByEmail(email);

      // Por segurança, sempre retornar sucesso mesmo se o email não existir
      if (user && user.isActive) {
        // Gerar token de reset (implementar lógica de email)
        const resetToken = jwt.sign(
          { userId: user._id, type: "password_reset" },
          process.env.JWT_SECRET || "secret_key",
          { expiresIn: "1h" },
        );

        user.passwordResetToken = resetToken;
        user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
        await user.save();

        // TODO: Enviar email com o token
        console.log(`Reset token for ${email}: ${resetToken}`);
      }

      res.json({
        success: true,
        message:
          "Se o email existir, você receberá instruções para redefinir sua senha",
      });
    } catch (error) {
      console.error("Erro no forgot password:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  },
);

// GET /api/auth/stats (admin only)
router.get("/stats", checkDatabaseConnection, async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token não fornecido",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret_key");
    const user = await User.findById(decoded.userId);

    if (!user || user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Acesso negado",
      });
    }

    const stats = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
    ]);

    const totalUsers = await User.countDocuments({ isActive: true });
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      isActive: true,
    });

    res.json({
      success: true,
      data: {
        totalUsers,
        recentUsers,
        usersByRole: stats,
      },
    });
  } catch (error) {
    console.error("Erro nas estatísticas:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  }
});

export default router;
