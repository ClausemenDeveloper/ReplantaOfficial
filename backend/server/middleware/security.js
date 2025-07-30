const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const validator = require("validator");
const DOMPurify = require("isomorphic-dompurify");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const compression = require("compression");

// ✅ 1. Security Headers Middleware
const securityHeaders = () => {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        scriptSrc: [
          "'self'",
          "https://accounts.google.com",
          "https://apis.google.com",
        ],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://accounts.google.com"],
        frameSrc: ["'self'", "https://accounts.google.com"],
      },
    },
    crossOriginEmbedderPolicy: false, // Para compatibilidade com Google OAuth
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    noSniff: true,
    frameguard: { action: "deny" },
    xssFilter: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  });
};

// ✅ 2. Rate Limiting
const createRateLimit = (windowMs = 15 * 60 * 1000, max = 100, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: message || "Muitas tentativas. Tente novamente mais tarde.",
      retryAfter: Math.ceil(windowMs / 1000),
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      // Log rate limit violations
      console.warn("Rate limit exceeded:", {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        url: req.url,
        timestamp: new Date().toISOString(),
      });

      res.status(429).json({
        error: "Muitas tentativas. Tente novamente mais tarde.",
        retryAfter: Math.ceil(windowMs / 1000),
      });
    },
  });
};

// Different rate limits for different endpoints
const rateLimits = {
  // General API rate limit
  general: createRateLimit(15 * 60 * 1000, 100, "Limite de API excedido"),

  // Strict rate limit for authentication
  auth: createRateLimit(15 * 60 * 1000, 5, "Muitas tentativas de login"),

  // Very strict for registration
  register: createRateLimit(60 * 60 * 1000, 3, "Muitas tentativas de registo"),

  // Strict for password reset
  passwordReset: createRateLimit(
    60 * 60 * 1000,
    3,
    "Muitas tentativas de reset",
  ),
};

// ✅ 3. Input Validation and Sanitization
class InputValidator {
  static validateEmail(email) {
    if (!email || typeof email !== "string") return false;
    return validator.isEmail(email.trim());
  }

  static validatePassword(password) {
    if (!password || typeof password !== "string") {
      return { isValid: false, errors: ["Password é obrigatório"] };
    }

    const errors = [];

    if (password.length < 8) {
      errors.push("Password deve ter pelo menos 8 caracteres");
    }

    if (!/[A-Z]/.test(password)) {
      errors.push("Password deve conter pelo menos uma letra maiúscula");
    }

    if (!/[a-z]/.test(password)) {
      errors.push("Password deve conter pelo menos uma letra minúscula");
    }

    if (!/[0-9]/.test(password)) {
      errors.push("Password deve conter pelo menos um número");
    }

    if (!/[!@#$%^&*(),.?\":{}|<>]/.test(password)) {
      errors.push("Password deve conter pelo menos um caractere especial");
    }

    return { isValid: errors.length === 0, errors };
  }

  static validateName(name) {
    if (!name || typeof name !== "string") return false;
    const nameRegex = /^[a-zA-ZÀ-ÿ\s\-']{2,50}$/;
    return nameRegex.test(name.trim());
  }

  static validatePhone(phone) {
    if (!phone || typeof phone !== "string") return false;
    const phoneRegex = /^(\+351)?[0-9]{9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ""));
  }

  static sanitizeInput(input) {
    if (!input || typeof input !== "string") return "";

    // Remove HTML and sanitize
    let sanitized = DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });

    // Escape HTML entities
    sanitized = validator.escape(sanitized);

    return sanitized.trim();
  }

  static sanitizeHTML(html) {
    if (!html || typeof html !== "string") return "";

    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ["p", "br", "strong", "em", "u", "ol", "ul", "li", "a"],
      ALLOWED_ATTR: ["href", "title"],
    });
  }

  static detectXSS(input) {
    if (!input || typeof input !== "string") return false;

    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe/gi,
      /<object/gi,
      /<embed/gi,
      /data:text\/html/gi,
      /vbscript:/gi,
    ];

    return xssPatterns.some((pattern) => pattern.test(input));
  }
}

// ✅ 4. Input Validation Middleware
const validateInput = (validationRules) => {
  return (req, res, next) => {
    const errors = [];

    for (const [field, rules] of Object.entries(validationRules)) {
      const value = req.body[field];

      // Required validation
      if (rules.required && (!value || value.toString().trim() === "")) {
        errors.push(`${field} é obrigatório`);
        continue;
      }

      // Skip other validations if field is empty and not required
      if (!value || value.toString().trim() === "") continue;

      // XSS Detection
      if (InputValidator.detectXSS(value)) {
        console.warn("XSS attempt detected:", {
          field,
          value: value.substring(0, 100),
          ip: req.ip,
          userAgent: req.get("User-Agent"),
          timestamp: new Date().toISOString(),
        });
        errors.push("Conteúdo potencialmente perigoso detectado");
        continue;
      }

      // Type-specific validation
      switch (rules.type) {
        case "email":
          if (!InputValidator.validateEmail(value)) {
            errors.push(`${field} deve ser um email válido`);
          }
          break;

        case "password":
          const passwordValidation = InputValidator.validatePassword(value);
          if (!passwordValidation.isValid) {
            errors.push(...passwordValidation.errors);
          }
          break;

        case "name":
          if (!InputValidator.validateName(value)) {
            errors.push(`${field} deve conter apenas letras, espaços e hífens`);
          }
          break;

        case "phone":
          if (!InputValidator.validatePhone(value)) {
            errors.push(`${field} deve ser um número de telefone válido`);
          }
          break;
      }

      // Length validation
      if (rules.minLength && value.length < rules.minLength) {
        errors.push(
          `${field} deve ter pelo menos ${rules.minLength} caracteres`,
        );
      }

      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push(
          `${field} deve ter no máximo ${rules.maxLength} caracteres`,
        );
      }

      // Custom validation
      if (rules.customValidator) {
        const result = rules.customValidator(value);
        if (!result.isValid) {
          errors.push(result.error || `${field} é inválido`);
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: "Dados inválidos",
        details: errors,
      });
    }

    // Sanitize inputs
    for (const [field, value] of Object.entries(req.body)) {
      if (typeof value === "string" && field !== "password") {
        req.body[field] = InputValidator.sanitizeInput(value);
      }
    }

    next();
  };
};

// ✅ 5. CSRF Protection
const csrfTokens = new Map(); // In production, use Redis

const generateCSRFToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

const csrfProtection = (req, res, next) => {
  if (req.method === "GET") {
    // Generate and send CSRF token for GET requests
    const token = generateCSRFToken();
    const sessionId = req.sessionID || req.ip;

    csrfTokens.set(sessionId, {
      token,
      expires: Date.now() + 30 * 60 * 1000, // 30 minutes
    });

    res.cookie("csrf-token", token, {
      httpOnly: true, // Mais seguro, JS pode ler via header se necessário
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 60 * 1000,
    });

    return next();
  }

  // Validate CSRF token for POST/PUT/DELETE requests
  const token = req.headers["x-csrf-token"] || req.body._token;
  const sessionId = req.sessionID || req.ip;
  const storedToken = csrfTokens.get(sessionId);

  if (!token || !storedToken || storedToken.token !== token) {
    console.warn("CSRF token validation failed:", {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      url: req.url,
      sessionId,
      tokenReceived: token,
      tokenExpected: storedToken ? storedToken.token : null,
      timestamp: new Date().toISOString(),
    });

    return res.status(403).json({
      error: "Token CSRF inválido ou ausente",
    });
  }

  // Check token expiration
  if (Date.now() > storedToken.expires) {
    csrfTokens.delete(sessionId);
    return res.status(403).json({
      error: "Token CSRF expirado",
    });
  }

  next();
};

// ✅ 6. JWT Authentication
const authenticateJWT = (req, res, next) => {
  const token =
    req.headers.authorization?.split(" ")[1] || req.cookies.authToken;

  if (!token) {
    return res.status(401).json({ error: "Token de acesso necessário" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check token expiration
    if (decoded.exp < Date.now() / 1000) {
      return res.status(401).json({ error: "Token expirado" });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.warn("JWT validation failed:", {
      error: error.message,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      timestamp: new Date().toISOString(),
    });

    return res.status(401).json({ error: "Token inválido" });
  }
};

// ✅ 7. Role-based Authorization
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Autenticação necessária" });
    }

    const userRoles = Array.isArray(req.user.roles)
      ? req.user.roles
      : [req.user.role];
    const requiredRoles = Array.isArray(roles) ? roles : [roles];

    const hasRole = requiredRoles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      console.warn("Insufficient role access attempt:", {
        userId: req.user.id,
        userRoles,
        requiredRoles,
        url: req.url,
        timestamp: new Date().toISOString(),
      });

      return res.status(403).json({
        error: "Permissões insuficientes",
        required: requiredRoles,
        current: userRoles,
      });
    }

    next();
  };
};

// ✅ 8. Permission-based Authorization
const requirePermission = (permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Autenticação necessária" });
    }

    const userPermissions = req.user.permissions || [];
    const requiredPermissions = Array.isArray(permissions)
      ? permissions
      : [permissions];

    // Admin has all permissions
    if (req.user.role === "admin") {
      return next();
    }

    const hasPermission = requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasPermission) {
      console.warn("Insufficient permission access attempt:", {
        userId: req.user.id,
        userPermissions,
        requiredPermissions,
        url: req.url,
        timestamp: new Date().toISOString(),
      });

      return res.status(403).json({
        error: "Permissões insuficientes",
        required: requiredPermissions,
        current: userPermissions,
      });
    }

    next();
  };
};

// ✅ 9. Secure Error Handler
const secureErrorHandler = (err, req, res, next) => {
  // Log error details internally
  console.error("Application error:", {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    user: req.user?.id || "anonymous",
    timestamp: new Date().toISOString(),
  });

  // Don't expose internal error details to client
  let message = "Erro interno do servidor";
  let statusCode = 500;

  // Handle specific error types
  if (err.name === "ValidationError") {
    message = "Dados inválidos";
    statusCode = 400;
  } else if (err.name === "UnauthorizedError") {
    message = "Acesso não autorizado";
    statusCode = 401;
  } else if (err.name === "CastError") {
    message = "Recurso não encontrado";
    statusCode = 404;
  }

  res.status(statusCode).json({
    error: message,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === "development" && { details: err.message }),
  });
};

// ✅ 10. Security Monitoring
const securityMonitoring = (req, res, next) => {
  // Log security-relevant requests
  const securityEvents = ["/api/auth", "/api/admin", "/api/users"];

  if (securityEvents.some((event) => req.url.includes(event))) {
    console.info("Security-relevant request:", {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      user: req.user?.id || "anonymous",
      timestamp: new Date().toISOString(),
    });
  }

  next();
};

// ✅ Performance: Compression Middleware
const compressionMiddleware = () => {
  return compression({
    level: 6, // Balance between compression ratio and speed
    threshold: 1024, // Only compress files larger than 1KB
    filter: (req, res) => {
      // Don't compress images or already compressed files
      if (req.headers["x-no-compression"]) {
        return false;
      }

      const contentType = res.getHeader("Content-Type");
      if (typeof contentType === "string") {
        // Don't compress images, videos, or already compressed formats
        const skipCompression = [
          "image/",
          "video/",
          "audio/",
          "application/pdf",
          "application/zip",
          "application/gzip",
        ];

        if (skipCompression.some((type) => contentType.includes(type))) {
          return false;
        }
      }

      return compression.filter(req, res);
    },
  });
};

// ✅ Performance: Caching Headers Middleware
const cacheControlMiddleware = (req, res, next) => {
  const url = req.url;

  // Set cache headers based on file type
  if (url.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    // Static assets - cache for 1 year with versioning
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.setHeader("Expires", new Date(Date.now() + 31536000000).toUTCString());
  } else if (url.match(/\.(html|json)$/)) {
    // HTML and API responses - cache for 5 minutes
    res.setHeader("Cache-Control", "public, max-age=300, must-revalidate");
  } else if (url.startsWith("/api/")) {
    // API routes - no cache by default unless specified
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  } else {
    // Default - short cache for dynamic content
    res.setHeader("Cache-Control", "public, max-age=60");
  }

  // Add ETag for conditional requests
  res.setHeader("ETag", `"${Date.now()}"`);

  next();
};

// ✅ 11. Password Security Utilities
class PasswordSecurity {
  static async hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  static async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  static generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString("hex");
  }

  static async isPasswordCompromised(password) {
    // Simple check against common passwords
    const commonPasswords = [
      "123456",
      "password",
      "123456789",
      "qwerty",
      "abc123",
      "password123",
      "admin",
      "letmein",
      "welcome",
      "monkey",
    ];

    return commonPasswords.includes(password.toLowerCase());
  }
}

module.exports = {
  securityHeaders,
  rateLimits,
  InputValidator,
  validateInput,
  csrfProtection,
  authenticateJWT,
  requireRole,
  requirePermission,
  secureErrorHandler,
  securityMonitoring,
  PasswordSecurity,
  compressionMiddleware,
  cacheControlMiddleware,
};
