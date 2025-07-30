import express from "express";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import memoryStore from "../fallback/memoryStore.js";
import { Router } from "express";

const router = express.Router();

// Helper para gerar JWT
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || "secret_key", {
    expiresIn: "7d",
  });
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

// POST /api/auth/register
router.post("/register", registerValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Dados inválidos",
        errors: errors.array(),
      });
    }

    const { name, email, password, role = "client", phone, address } = req.body;

    // Verificar se usuário já existe
    const existingUser = await memoryStore.findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email já está em uso",
      });
    }

    // Criar novo usuário
    const userData = {
      name,
      email,
      password,
      role,
      phone,
      address,
    };

    const user = await memoryStore.createUser(userData);

    // Verificar se usuário precisa de aprovação
    if (user.approvalStatus === "pending") {
      res.status(201).json({
        success: true,
        message:
          "Registo efetuado com sucesso. Aguarde aprovação do administrador para aceder à plataforma.",
        data: {
          user,
          needsApproval: true,
        },
      });
    } else {
      // Admin é aprovado automaticamente
      const token = generateToken(user.id);

      res.status(201).json({
        success: true,
        message: "Usuário registrado com sucesso",
        data: {
          user,
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
});

// POST /api/auth/login
router.post("/login", loginValidation, async (req, res) => {
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
    const user = await memoryStore.canUserLogin(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "Acesso negado. Verifique suas credenciais ou contacte o administrador.",
      });
    }

    // Verificar aprovação para clientes e colaboradores
    if (["client", "collaborator"].includes(user.role)) {
      if (user.approvalStatus !== "approved") {
        let message = "Conta aguardando aprovação do administrador.";
        if (user.approvalStatus === "rejected") {
          message = `Conta rejeitada. Motivo: ${user.rejectionReason || "Não especificado"}`;
        }
        return res.status(403).json({
          success: false,
          message,
          approvalStatus: user.approvalStatus,
        });
      }
    }

    // Verificar senha
    const isPasswordValid = await memoryStore.comparePassword(
      password,
      user.password,
    );
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Credenciais inválidas",
      });
    }

    // Gerar token
    const token = generateToken(user._id);

    // Atualizar último login
    await memoryStore.updateUser(user._id, { lastLogin: new Date() });

    res.json({
      success: true,
      message: "Login realizado com sucesso",
      data: {
        user: memoryStore.getUserPublicProfile(user),
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
});

// GET /api/auth/me
router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.replace("Bearer ", "") : null;
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token não fornecido",
      });
    }
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "secret_key");
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
    res.json({
      success: true,
      data: {
        user: memoryStore.getUserPublicProfile(user),
      },
    });
  } catch (error) {
    console.error("Erro na verificação do token:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  }
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  res.json({
    success: true,
    message: "Logout realizado com sucesso",
  });
});

// GET /api/auth/stats (admin only)
router.get("/stats", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token não fornecido",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret_key");
    const user = await memoryStore.findUserById(decoded.userId);

    if (!user || user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Acesso negado",
      });
    }

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

export default router;
