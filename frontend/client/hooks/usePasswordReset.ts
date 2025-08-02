import { useState, useCallback } from "react";
import {
  SecurityValidator,
  SecureHTTP,
  SecureErrorHandler,
} from "../lib/security";

interface PasswordResetState {
  isLoading: boolean;
  message: string;
  error: string;
  step: "request" | "reset";
}

interface RequestResetData {
  email: string;
  userType: "client" | "admin" | "collaborator";
}

interface ConfirmResetData {
  token: string;
  password: string;
  confirmPassword: string;
  userType: "client" | "admin" | "collaborator";
}

export const usePasswordReset = () => {
  const [state, setState] = useState<PasswordResetState>({
    isLoading: false,
    message: "",
    error: "",
    step: "request",
  });

  // Clear messages
  const clearMessages = useCallback(() => {
    setState((prev) => ({ ...prev, message: "", error: "" }));
  }, []);

  // Set step
  const setStep = useCallback((step: "request" | "reset") => {
    setState((prev) => ({ ...prev, step }));
  }, []);

  // Request password reset
  const requestReset = useCallback(
    async ({ email, userType }: RequestResetData) => {
      clearMessages();

      // Validation
      if (!SecurityValidator.validateEmail(email)) {
        setState((prev) => ({ ...prev, error: "Email inválido" }));
        return { success: false, error: "Email inválido" };
      }

      // Check rate limiting
      if (
        !SecurityValidator.checkRateLimit("password_reset", 3, 60 * 60 * 1000)
      ) {
        const error = "Muitas tentativas. Tente novamente em 1 hora.";
        setState((prev) => ({ ...prev, error }));
        return { success: false, error };
      }

      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        const endpoint = `/api/auth/${userType}/reset-password-request`;
        const response = await SecureHTTP.post(endpoint, {
          email: SecurityValidator.sanitizeInput(email),
        });

        if (response.ok) {
          const message = getUserTypeMessage(userType, "request");
          setState((prev) => ({ ...prev, message, isLoading: false }));

          // Log security event
          SecureErrorHandler.logSecurityEvent("password_reset_requested", {
            email,
            userType,
          });

          return { success: true, message };
        } else {
          const data = await response.json();
          const error = data.error || "Erro ao solicitar reset de password";
          setState((prev) => ({ ...prev, error, isLoading: false }));
          return { success: false, error };
        }
      } catch (error) {
        SecureErrorHandler.handleError(
          error as Error,
          "Password reset request",
        );
        const errorMessage = "Erro de conexão. Tente novamente.";
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isLoading: false,
        }));
        return { success: false, error: errorMessage };
      }
    },
    [clearMessages],
  );

  // Confirm password reset
  const confirmReset = useCallback(
    async ({
      token,
      password,
      confirmPassword,
      userType,
    }: ConfirmResetData) => {
      clearMessages();

      // Validation
      const passwordValidation = SecurityValidator.validatePassword(password);
      if (!passwordValidation.isValid) {
        const error = passwordValidation.errors[0];
        setState((prev) => ({ ...prev, error }));
        return { success: false, error };
      }

      if (password !== confirmPassword) {
        const error = "As passwords não coincidem";
        setState((prev) => ({ ...prev, error }));
        return { success: false, error };
      }

      if (!token) {
        const error = "Token de reset inválido";
        setState((prev) => ({ ...prev, error }));
        return { success: false, error };
      }

      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        const endpoint = `/api/auth/${userType}/reset-password-confirm`;
        const response = await SecureHTTP.post(endpoint, {
          token,
          password,
        });

        if (response.ok) {
          const message = getUserTypeMessage(userType, "confirm");
          setState((prev) => ({ ...prev, message, isLoading: false }));

          // Log security event
          SecureErrorHandler.logSecurityEvent("password_reset_completed", {
            userType,
          });

          return { success: true, message };
        } else {
          const data = await response.json();
          const error = data.error || "Erro ao alterar password";
          setState((prev) => ({ ...prev, error, isLoading: false }));
          return { success: false, error };
        }
      } catch (error) {
        SecureErrorHandler.handleError(
          error as Error,
          "Password reset confirm",
        );
        const errorMessage = "Erro de conexão. Tente novamente.";
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isLoading: false,
        }));
        return { success: false, error: errorMessage };
      }
    },
    [clearMessages],
  );

  // Validate password strength in real-time
  const validatePassword = useCallback((password: string) => {
    return SecurityValidator.validatePassword(password);
  }, []);

  // Check if passwords match
  const validatePasswordMatch = useCallback(
    (password: string, confirmPassword: string) => {
      return password === confirmPassword;
    },
    [],
  );

  // Get rate limit info
  const getRateLimitInfo = useCallback(() => {
    const key = "rate_limit_password_reset";
    const attempts = JSON.parse(localStorage.getItem(key) || "[]");
    const now = Date.now();
    const windowMs = 60 * 60 * 1000; // 1 hour
    const maxAttempts = 3;

    const validAttempts = attempts.filter(
      (timestamp: number) => now - timestamp < windowMs,
    );

    return {
      attemptsRemaining: Math.max(0, maxAttempts - validAttempts.length),
      timeUntilReset:
        validAttempts.length >= maxAttempts
          ? Math.max(0, windowMs - (now - validAttempts[0]))
          : 0,
    };
  }, []);

  return {
    // State
    isLoading: state.isLoading,
    message: state.message,
    error: state.error,
    step: state.step,

    // Actions
    requestReset,
    confirmReset,
    clearMessages,
    setStep,

    // Utilities
    validatePassword,
    validatePasswordMatch,
    getRateLimitInfo,
  };
};

// Helper function to get user-specific messages
function getUserTypeMessage(
  userType: "client" | "admin" | "collaborator",
  action: "request" | "confirm",
): string {
  const userTypeNames = {
    client: "cliente",
    admin: "administrador",
    collaborator: "colaborador",
  };

  const userTypeName = userTypeNames[userType];

  if (action === "request") {
    return `Se o email estiver registado como ${userTypeName}, receberá as instruções de reset em breve.`;
  } else {
    return "Password alterada com sucesso! Pode agora fazer login.";
  }
}

export default usePasswordReset;
