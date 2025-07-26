import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  AuthSecurity,
  CSRFProtection,
  SecurityValidator,
  SecureHTTP,
  SecureErrorHandler,
} from "@/lib/security";

interface User {
  id: string;
  name: string;
  email: string;
  role: "client" | "admin" | "collaborator";
  status: "active" | "pending" | "inactive";
  permissions?: string[];
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: "client" | "admin" | "collaborator";
  [key: string]: any;
}

export const useSecureAuth = () => {
  const navigate = useNavigate();
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // ✅ Initialize authentication state
  useEffect(() => {
    initializeAuth();
  }, []);

  // ✅ Initialize CSRF token
  useEffect(() => {
    if (!CSRFProtection.getToken()) {
      CSRFProtection.generateToken();
    }
  }, []);

  const initializeAuth = async () => {
    try {
      const token = AuthSecurity.getSecureToken();

      if (!token) {
        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          isAuthenticated: false,
        }));
        return;
      }

      // Verify token with backend
      const response = await SecureHTTP.get("/api/auth/verify");

      if (response.ok) {
        const userData = await response.json();
        setAuthState({
          user: userData.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        // Log successful authentication
        SecureErrorHandler.logSecurityEvent("auth_verified", {
          userId: userData.user.id,
          role: userData.user.role,
        });
      } else {
        throw new Error("Token verification failed");
      }
    } catch (error) {
      SecureErrorHandler.handleError(error as Error, "Auth initialization");
      AuthSecurity.clearSecureToken();
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        isAuthenticated: false,
      }));
    }
  };

  // ✅ Secure login with validation and rate limiting
  const login = useCallback(
    async (credentials: LoginCredentials, role: string) => {
      try {
        // Check rate limiting
        if (!SecurityValidator.checkRateLimit("login", 5, 15 * 60 * 1000)) {
          throw new Error(
            "Muitas tentativas de login. Tente novamente em 15 minutos.",
          );
        }

        // Validate input
        if (!SecurityValidator.validateEmail(credentials.email)) {
          throw new Error("Email inválido");
        }

        if (!credentials.password || credentials.password.length < 8) {
          throw new Error("Password deve ter pelo menos 8 caracteres");
        }

        // Sanitize input
        const sanitizedCredentials = {
          email: SecurityValidator.sanitizeInput(credentials.email),
          password: credentials.password, // Don't sanitize password
          role: SecurityValidator.sanitizeInput(role),
          rememberMe: credentials.rememberMe || false,
        };

        setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

        // Send login request
        const response = await SecureHTTP.post("/api/auth/login", {
          ...sanitizedCredentials,
          deviceFingerprint: AuthSecurity.getDeviceFingerprint(),
        });

        if (response.ok) {
          const data = await response.json();

          // Store tokens securely
          AuthSecurity.storeSecureToken(data.token);

          // Clear rate limit on successful login
          SecurityValidator.clearRateLimit("login");

          setAuthState({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          // Log successful login
          SecureErrorHandler.logSecurityEvent("login_success", {
            userId: data.user.id,
            role: data.user.role,
            method: "password",
          });

          // Redirect to appropriate dashboard
          navigate(`/${data.user.role}/dashboard`);

          return { success: true, user: data.user };
        } else {
          const errorData = await response.json();

          // Log failed login attempt
          SecureErrorHandler.logSecurityEvent(
            "login_failure",
            {
              email: credentials.email,
              reason: errorData.message,
            },
            "medium",
          );

          throw new Error(errorData.message || "Credenciais inválidas");
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Erro no login";

        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));

        SecureErrorHandler.handleError(error as Error, "Login");
        return { success: false, error: errorMessage };
      }
    },
    [navigate],
  );

  // ✅ Secure registration with validation
  const register = useCallback(async (data: RegisterData) => {
    try {
      // Validate input data
      if (!SecurityValidator.validateName(data.name)) {
        throw new Error("Nome inválido");
      }

      if (!SecurityValidator.validateEmail(data.email)) {
        throw new Error("Email inválido");
      }

      const passwordValidation = SecurityValidator.validatePassword(
        data.password,
      );
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.errors.join(", "));
      }

      if (data.phone && !SecurityValidator.validatePhone(data.phone)) {
        throw new Error("Número de telefone inválido");
      }

      // Check for common passwords
      if (await AuthSecurity.checkPasswordBreach(data.password)) {
        throw new Error(
          "Esta password é muito comum. Escolha uma password mais segura.",
        );
      }

      // Sanitize input data
      const sanitizedData = {
        name: SecurityValidator.sanitizeInput(data.name),
        email: SecurityValidator.sanitizeInput(data.email),
        password: data.password, // Don't sanitize password
        phone: data.phone
          ? SecurityValidator.sanitizeInput(data.phone)
          : undefined,
        role: data.role,
        // Sanitize additional fields
        ...Object.keys(data).reduce((acc, key) => {
          if (!["name", "email", "password", "phone", "role"].includes(key)) {
            acc[key] = SecurityValidator.sanitizeInput(data[key]);
          }
          return acc;
        }, {} as any),
      };

      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

      const response = await SecureHTTP.post("/api/auth/register", {
        ...sanitizedData,
        deviceFingerprint: AuthSecurity.getDeviceFingerprint(),
      });

      if (response.ok) {
        const responseData = await response.json();

        // Log successful registration
        SecureErrorHandler.logSecurityEvent("registration_success", {
          email: data.email,
          role: data.role,
        });

        setAuthState((prev) => ({ ...prev, isLoading: false }));

        return {
          success: true,
          message: responseData.message || "Registo realizado com sucesso!",
        };
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro no registo");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro no registo";

      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      SecureErrorHandler.handleError(error as Error, "Registration");
      return { success: false, error: errorMessage };
    }
  }, []);

  // ✅ Google OAuth login
  const loginWithGoogle = useCallback(
    async (googleUser: any, role: string) => {
      try {
        setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

        const response = await SecureHTTP.post("/api/auth/google", {
          googleUser,
          role: SecurityValidator.sanitizeInput(role),
          deviceFingerprint: AuthSecurity.getDeviceFingerprint(),
        });

        if (response.ok) {
          const data = await response.json();

          AuthSecurity.storeSecureToken(data.token);

          setAuthState({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          // Log successful Google login
          SecureErrorHandler.logSecurityEvent("login_success", {
            userId: data.user.id,
            role: data.user.role,
            method: "google",
          });

          navigate(`/${data.user.role}/dashboard`);

          return { success: true, user: data.user };
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || "Erro no login com Google");
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Erro no login com Google";

        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));

        SecureErrorHandler.handleError(error as Error, "Google Login");
        return { success: false, error: errorMessage };
      }
    },
    [navigate],
  );

  // ✅ Secure logout
  const logout = useCallback(async () => {
    try {
      // Notify server about logout
      await SecureHTTP.post("/api/auth/logout", {});

      // Log logout
      if (authState.user) {
        SecureErrorHandler.logSecurityEvent("logout", {
          userId: authState.user.id,
        });
      }
    } catch (error) {
      SecureErrorHandler.handleError(error as Error, "Logout");
    } finally {
      // Clear all tokens and session data
      AuthSecurity.clearSecureToken();
      CSRFProtection.clearToken();

      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });

      navigate("/select-interface");
    }
  }, [authState.user, navigate]);

  // ✅ Check user permissions
  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!authState.user) return false;

      // Admin has all permissions
      if (authState.user.role === "admin") return true;

      // Check specific permissions
      return authState.user.permissions?.includes(permission) || false;
    },
    [authState.user],
  );

  // ✅ Check user role
  const hasRole = useCallback(
    (role: string): boolean => {
      return authState.user?.role === role;
    },
    [authState.user],
  );

  // ✅ Refresh authentication
  const refreshAuth = useCallback(async () => {
    await initializeAuth();
  }, []);

  // ✅ Update user profile
  const updateProfile = useCallback(async (updateData: Partial<User>) => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

      // Sanitize input
      const sanitizedData = Object.keys(updateData).reduce((acc, key) => {
        if (key === "email" && updateData.email) {
          if (!SecurityValidator.validateEmail(updateData.email)) {
            throw new Error("Email inválido");
          }
          acc.email = SecurityValidator.sanitizeInput(updateData.email);
        } else if (key === "name" && updateData.name) {
          if (!SecurityValidator.validateName(updateData.name)) {
            throw new Error("Nome inválido");
          }
          acc.name = SecurityValidator.sanitizeInput(updateData.name);
        } else if (updateData[key as keyof User]) {
          acc[key] = SecurityValidator.sanitizeInput(
            updateData[key as keyof User] as string,
          );
        }
        return acc;
      }, {} as any);

      const response = await SecureHTTP.put("/api/auth/profile", sanitizedData);

      if (response.ok) {
        const updatedUser = await response.json();

        setAuthState((prev) => ({
          ...prev,
          user: updatedUser.user,
          isLoading: false,
        }));

        // Log profile update
        SecureErrorHandler.logSecurityEvent("profile_updated", {
          userId: updatedUser.user.id,
          updatedFields: Object.keys(sanitizedData),
        });

        return { success: true, user: updatedUser.user };
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao atualizar perfil");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao atualizar perfil";

      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      SecureErrorHandler.handleError(error as Error, "Profile Update");
      return { success: false, error: errorMessage };
    }
  }, []);

  return {
    // State
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    error: authState.error,

    // Actions
    login,
    register,
    loginWithGoogle,
    logout,
    refreshAuth,
    updateProfile,

    // Utilities
    hasPermission,
    hasRole,

    // Clear error
    clearError: () => setAuthState((prev) => ({ ...prev, error: null })),
  };
};

export default useSecureAuth;
