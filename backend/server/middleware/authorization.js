import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Middleware para autenticação rigorosa
export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token de acesso obrigatório",
        code: "NO_TOKEN",
      });
    }

    // Verificar e decodificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret_key");

    // Buscar usuário na base de dados
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Usuário não encontrado na base de dados",
        code: "USER_NOT_FOUND",
      });
    }

    // Verificar se conta está ativa
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Conta desativada pelo administrador",
        code: "ACCOUNT_DISABLED",
      });
    }

    // Verificar aprovação para clientes e colaboradores
    if (["client", "collaborator"].includes(user.role)) {
      if (user.approvalStatus !== "approved") {
        let message = "Conta aguardando aprovação do administrador";
        let code = "PENDING_APPROVAL";

        if (user.approvalStatus === "rejected") {
          message = `Conta rejeitada. Motivo: ${user.rejectionReason || "Não especificado"}`;
          code = "ACCOUNT_REJECTED";
        }

        return res.status(403).json({
          success: false,
          message,
          code,
          approvalStatus: user.approvalStatus,
          rejectionReason: user.rejectionReason,
        });
      }
    }

    // Adicionar usuário à requisição
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Token inválido",
        code: "INVALID_TOKEN",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expirado",
        code: "TOKEN_EXPIRED",
      });
    }

    console.error("Erro na autenticação:", error);
    return res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      code: "INTERNAL_ERROR",
    });
  }
};

// Middleware para verificar papel específico
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Autenticação obrigatória",
        code: "AUTHENTICATION_REQUIRED",
      });
    }

    const userRole = req.user.role;
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Acesso restrito. Papéis permitidos: ${roles.join(", ")}`,
        code: "INSUFFICIENT_PERMISSIONS",
        userRole,
        requiredRoles: roles,
      });
    }

    next();
  };
};

// Middleware específico para admin
export const requireAdmin = (req, res, next) => {
  return requireRole("admin")(req, res, next);
};

// Middleware específico para cliente
export const requireClient = (req, res, next) => {
  return requireRole("client")(req, res, next);
};

// Middleware específico para colaborador
export const requireCollaborator = (req, res, next) => {
  return requireRole("collaborator")(req, res, next);
};

// Middleware para verificar se é o próprio usuário ou admin
export const requireOwnerOrAdmin = (userIdParam = "id") => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Autenticação obrigatória",
        code: "AUTHENTICATION_REQUIRED",
      });
    }

    const targetUserId = req.params[userIdParam];
    const currentUserId = req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isAdmin && currentUserId !== targetUserId) {
      return res.status(403).json({
        success: false,
        message: "Só pode aceder aos próprios dados ou ser administrador",
        code: "ACCESS_DENIED",
      });
    }

    next();
  };
};

// Middleware para verificar aprovação específica
export const requireApproved = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Autenticação obrigatória",
      code: "AUTHENTICATION_REQUIRED",
    });
  }

  // Admin sempre aprovado
  if (req.user.role === "admin") {
    return next();
  }

  // Verificar se está aprovado
  if (req.user.approvalStatus !== "approved") {
    let message = "Acesso negado. Conta aguardando aprovação";
    let code = "PENDING_APPROVAL";

    if (req.user.approvalStatus === "rejected") {
      message = "Acesso negado. Conta rejeitada";
      code = "ACCOUNT_REJECTED";
    }

    return res.status(403).json({
      success: false,
      message,
      code,
      approvalStatus: req.user.approvalStatus,
    });
  }

  next();
};

// Middleware para logging de acesso
export const logAccess = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const path = req.path;
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers["user-agent"];
  const userId = req.user?._id;
  const userRole = req.user?.role;

  console.log(
    `[${timestamp}] ${method} ${path} - IP: ${ip} - User: ${userId} (${userRole}) - UA: ${userAgent}`,
  );

  next();
};

// Middleware para rate limiting básico por usuário
const userRequestCounts = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minuto
const RATE_LIMIT_MAX_REQUESTS = 100; // máximo de requests por minuto

export const rateLimitByUser = (req, res, next) => {
  if (!req.user) {
    return next(); // Deixar outros middlewares lidarem com autenticação
  }

  const userId = req.user._id.toString();
  const now = Date.now();

  if (!userRequestCounts.has(userId)) {
    userRequestCounts.set(userId, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return next();
  }

  const userLimits = userRequestCounts.get(userId);

  if (now > userLimits.resetTime) {
    // Reset contador
    userRequestCounts.set(userId, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return next();
  }

  if (userLimits.count >= RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({
      success: false,
      message: "Muitas requisições. Tente novamente em alguns momentos",
      code: "RATE_LIMIT_EXCEEDED",
      retryAfter: Math.ceil((userLimits.resetTime - now) / 1000),
    });
  }

  userLimits.count++;
  next();
};

// Middleware de validação de base de dados
export const requireDatabase = async (req, res, next) => {
  try {
    // Verificar se a conexão com a base de dados está ativa
    const mongoose = await import("mongoose");

    if (mongoose.default.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: "Base de dados temporariamente indisponível",
        code: "DATABASE_UNAVAILABLE",
      });
    }

    next();
  } catch (error) {
    console.error("Erro na verificação da base de dados:", error);
    return res.status(503).json({
      success: false,
      message: "Erro na conexão com a base de dados",
      code: "DATABASE_ERROR",
    });
  }
};

export default {
  authenticate,
  requireRole,
  requireAdmin,
  requireClient,
  requireCollaborator,
  requireOwnerOrAdmin,
  requireApproved,
  logAccess,
  rateLimitByUser,
  requireDatabase,
};
