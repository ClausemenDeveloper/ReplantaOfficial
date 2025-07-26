import validator from "validator";
import DOMPurify from "dompurify";

// ✅ 1. Input Validation and Sanitization
export class SecurityValidator {
  // Email validation
  static validateEmail(email: string): boolean {
    if (!email || typeof email !== "string") return false;
    return validator.isEmail(email.trim());
  }

  // Phone validation (Portuguese format)
  static validatePhone(phone: string): boolean {
    if (!phone || typeof phone !== "string") return false;
    const phoneRegex = /^(\+351)?[0-9]{9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ""));
  }

  // Password strength validation
  static validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!password || typeof password !== "string") {
      return { isValid: false, errors: ["Password é obrigatório"] };
    }

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

  // Name validation (no special characters except spaces, hyphens)
  static validateName(name: string): boolean {
    if (!name || typeof name !== "string") return false;
    const nameRegex = /^[a-zA-ZÀ-ÿ\s\-']{2,50}$/;
    return nameRegex.test(name.trim());
  }

  // General text validation
  static validateText(
    text: string,
    minLength: number = 1,
    maxLength: number = 1000,
  ): boolean {
    if (!text || typeof text !== "string") return false;
    const trimmed = text.trim();
    return trimmed.length >= minLength && trimmed.length <= maxLength;
  }

  // Sanitize input to prevent XSS
  static sanitizeInput(input: string): string {
    if (!input || typeof input !== "string") return "";

    // Remove HTML tags and sanitize
    let sanitized = DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });

    // Additional sanitization
    sanitized = validator.escape(sanitized);

    return sanitized.trim();
  }

  // Sanitize HTML content (for rich text)
  static sanitizeHTML(html: string): string {
    if (!html || typeof html !== "string") return "";

    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        "p",
        "br",
        "strong",
        "em",
        "u",
        "ol",
        "ul",
        "li",
        "a",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
      ],
      ALLOWED_ATTR: ["href", "title"],
    });
  }

  // Validate URL
  static validateURL(url: string): boolean {
    if (!url || typeof url !== "string") return false;
    return validator.isURL(url, {
      protocols: ["http", "https"],
      require_tld: true,
      require_protocol: true,
    });
  }

  // Validate admin code
  static validateAdminCode(code: string): boolean {
    if (!code || typeof code !== "string") return false;
    // Admin code should be alphanumeric, 8-16 characters
    const codeRegex = /^[A-Z0-9]{8,16}$/;
    return codeRegex.test(code.trim());
  }

  // Rate limiting check (client-side)
  static checkRateLimit(
    action: string,
    maxAttempts: number = 5,
    windowMs: number = 15 * 60 * 1000,
  ): boolean {
    const key = `rate_limit_${action}`;
    const now = Date.now();
    const attempts = JSON.parse(localStorage.getItem(key) || "[]");

    // Remove old attempts outside window
    const validAttempts = attempts.filter(
      (timestamp: number) => now - timestamp < windowMs,
    );

    if (validAttempts.length >= maxAttempts) {
      return false;
    }

    // Add current attempt
    validAttempts.push(now);
    localStorage.setItem(key, JSON.stringify(validAttempts));

    return true;
  }

  // Clear rate limit for action
  static clearRateLimit(action: string): void {
    const key = `rate_limit_${action}`;
    localStorage.removeItem(key);
  }
}

// ✅ 2. XSS Protection Utilities
export class XSSProtection {
  // Check for potential XSS in input
  static detectXSS(input: string): boolean {
    if (!input || typeof input !== "string") return false;

    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe/gi,
      /<object/gi,
      /<embed/gi,
      /<link/gi,
      /<meta/gi,
      /data:text\/html/gi,
      /vbscript:/gi,
    ];

    return xssPatterns.some((pattern) => pattern.test(input));
  }

  // Encode HTML entities
  static encodeHTML(str: string): string {
    if (!str || typeof str !== "string") return "";

    const entityMap: { [key: string]: string } = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
      "/": "&#x2F;",
    };

    return str.replace(/[&<>"'\/]/g, (s) => entityMap[s]);
  }

  // Decode HTML entities
  static decodeHTML(str: string): string {
    if (!str || typeof str !== "string") return "";

    const entityMap: { [key: string]: string } = {
      "&amp;": "&",
      "&lt;": "<",
      "&gt;": ">",
      "&quot;": '"',
      "&#39;": "'",
      "&#x2F;": "/",
    };

    return str.replace(
      /&amp;|&lt;|&gt;|&quot;|&#39;|&#x2F;/g,
      (s) => entityMap[s],
    );
  }
}

// ✅ 3. Secure Authentication Patterns
export class AuthSecurity {
  // Generate secure random token
  static generateSecureToken(length: number = 32): string {
    const charset =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const values = new Uint32Array(length);
    crypto.getRandomValues(values);

    return Array.from(values, (value) => charset[value % charset.length]).join(
      "",
    );
  }

  // Check if password was compromised (simple check)
  static async checkPasswordBreach(password: string): Promise<boolean> {
    try {
      // Simple common password check (in production, use HaveIBeenPwned API)
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
    } catch (error) {
      console.error("Error checking password breach:", error);
      return false;
    }
  }

  // Secure storage of tokens
  static storeSecureToken(token: string, key: string = "auth_token"): void {
    try {
      // In production, prefer httpOnly cookies
      // This is client-side fallback
      const secureData = {
        token,
        timestamp: Date.now(),
        fingerprint: this.getDeviceFingerprint(),
      };

      localStorage.setItem(key, btoa(JSON.stringify(secureData)));
    } catch (error) {
      console.error("Error storing secure token:", error);
    }
  }

  // Retrieve secure token
  static getSecureToken(key: string = "auth_token"): string | null {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;

      const decoded = JSON.parse(atob(stored));
      const currentFingerprint = this.getDeviceFingerprint();

      // Verify device fingerprint
      if (decoded.fingerprint !== currentFingerprint) {
        this.clearSecureToken(key);
        return null;
      }

      // Check token age (max 24 hours)
      const maxAge = 24 * 60 * 60 * 1000;
      if (Date.now() - decoded.timestamp > maxAge) {
        this.clearSecureToken(key);
        return null;
      }

      return decoded.token;
    } catch (error) {
      console.error("Error retrieving secure token:", error);
      return null;
    }
  }

  // Clear secure token
  static clearSecureToken(key: string = "auth_token"): void {
    localStorage.removeItem(key);
  }

  // Generate device fingerprint
  static getDeviceFingerprint(): string {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    ctx?.fillText("fingerprint", 10, 10);

    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + "x" + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL(),
    ].join("|");

    return btoa(fingerprint).substring(0, 32);
  }
}

// ✅ 4. CSRF Protection
export class CSRFProtection {
  private static tokenKey = "csrf_token";

  // Generate CSRF token
  static generateToken(): string {
    const token = AuthSecurity.generateSecureToken(32);
    sessionStorage.setItem(this.tokenKey, token);
    return token;
  }

  // Get CSRF token
  static getToken(): string | null {
    return sessionStorage.getItem(this.tokenKey);
  }

  // Validate CSRF token
  static validateToken(token: string): boolean {
    const storedToken = this.getToken();
    return storedToken !== null && storedToken === token;
  }

  // Add CSRF token to request headers
  static addToHeaders(
    headers: Record<string, string> = {},
  ): Record<string, string> {
    const token = this.getToken();
    if (token) {
      headers["X-CSRF-Token"] = token;
    }
    return headers;
  }

  // Clear CSRF token
  static clearToken(): void {
    sessionStorage.removeItem(this.tokenKey);
  }
}

// ✅ 5. Secure HTTP Client
export class SecureHTTP {
  // Secure fetch wrapper
  static async secureRequest(
    url: string,
    options: RequestInit = {},
  ): Promise<Response> {
    // Add security headers
    const secureHeaders = {
      "Content-Type": "application/json",
      ...CSRFProtection.addToHeaders(),
      ...options.headers,
    };

    // Add auth token if available
    const authToken = AuthSecurity.getSecureToken();
    if (authToken) {
      secureHeaders["Authorization"] = `Bearer ${authToken}`;
    }

    // Secure fetch options
    const secureOptions: RequestInit = {
      ...options,
      headers: secureHeaders,
      credentials: "include", // Include cookies
      mode: "cors",
    };

    try {
      const response = await fetch(url, secureOptions);

      // Check for auth errors
      if (response.status === 401 || response.status === 403) {
        AuthSecurity.clearSecureToken();
        CSRFProtection.clearToken();
        // Redirect to login
        window.location.href = "/select-interface";
      }

      return response;
    } catch (error) {
      console.error("Secure request failed:", error);
      throw error;
    }
  }

  // GET request
  static async get(url: string): Promise<Response> {
    return this.secureRequest(url, { method: "GET" });
  }

  // POST request
  static async post(url: string, data: any): Promise<Response> {
    return this.secureRequest(url, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // PUT request
  static async put(url: string, data: any): Promise<Response> {
    return this.secureRequest(url, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  static async delete(url: string): Promise<Response> {
    return this.secureRequest(url, { method: "DELETE" });
  }
}

// ✅ 6. Error Handling
export class SecureErrorHandler {
  // Log security events
  static logSecurityEvent(
    event: string,
    details: any = {},
    severity: "low" | "medium" | "high" = "medium",
  ): void {
    const securityLog = {
      timestamp: new Date().toISOString(),
      event,
      severity,
      details: this.sanitizeLogData(details),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // In production, send to security monitoring service
    console.warn("Security Event:", securityLog);

    // Store locally for debugging (limit to 100 entries)
    const logs = JSON.parse(localStorage.getItem("security_logs") || "[]");
    logs.unshift(securityLog);
    if (logs.length > 100) logs.splice(100);
    localStorage.setItem("security_logs", JSON.stringify(logs));
  }

  // Sanitize log data (remove sensitive info)
  private static sanitizeLogData(data: any): any {
    const sensitiveKeys = [
      "password",
      "token",
      "secret",
      "key",
      "auth",
      "credential",
    ];

    if (typeof data === "object" && data !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk))) {
          sanitized[key] = "[REDACTED]";
        } else {
          sanitized[key] = value;
        }
      }
      return sanitized;
    }

    return data;
  }

  // Handle and log errors securely
  static handleError(error: Error, context: string = "Unknown"): void {
    this.logSecurityEvent("error_occurred", {
      context,
      message: error.message,
      stack: error.stack?.substring(0, 500), // Limit stack trace
    });

    // Show user-friendly message (never expose internal details)
    console.error(`Error in ${context}:`, error);
  }
}

// ✅ Utility function for common validation
export function validateInput(input: string, type: string): boolean {
  if (!input || typeof input !== "string") return false;

  switch (type.toLowerCase()) {
    case "email":
      return SecurityValidator.validateEmail(input);
    case "phone":
      return SecurityValidator.validatePhone(input);
    case "text":
      return SecurityValidator.validateText(input);
    case "url":
      return SecurityValidator.validateURL(input);
    default:
      return input.trim().length > 0;
  }
}

// Export all utilities
export {
  SecurityValidator as Validator,
  XSSProtection as XSS,
  AuthSecurity as Auth,
  CSRFProtection as CSRF,
  SecureHTTP as HTTP,
  SecureErrorHandler as ErrorHandler,
};
