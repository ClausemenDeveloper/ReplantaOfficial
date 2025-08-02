import { useState, useEffect } from "react";

interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
}

interface GoogleAuthResponse {
  credential: string;
  select_by: string;
}

declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export const useGoogleAuth = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasValidCredentials, setHasValidCredentials] = useState(false);

  // Google OAuth Client ID - obtido das variáveis de ambiente
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    // Check if we have valid credentials
    if (
      !GOOGLE_CLIENT_ID ||
      GOOGLE_CLIENT_ID === "YOUR_GOOGLE_CLIENT_ID_HERE"
    ) {
      console.warn(
        "Google OAuth Client ID not configured. Google sign-in will be disabled.",
      );
      setHasValidCredentials(false);
      return;
    }

    setHasValidCredentials(true);

    const loadGoogleScript = () => {
      if (window.google) {
        setIsLoaded(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initializeGoogleAuth();
      };
      document.head.appendChild(script);
    };

    const initializeGoogleAuth = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          auto_select: false,
        });
        setIsLoaded(true);
      }
    };

    loadGoogleScript();
  }, []);

  const handleCredentialResponse = (response: GoogleAuthResponse) => {
    setIsLoading(true);
    try {
      // Decode JWT token to get user info
      const payload = JSON.parse(atob(response.credential.split(".")[1]));
      const googleUser: GoogleUser = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        given_name: payload.given_name,
        family_name: payload.family_name,
      };

      setUser(googleUser);
      return googleUser;
    } catch (error) {
      console.error("Error processing Google auth response:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = (callback?: (user: GoogleUser | null) => void) => {
    if (!isLoaded) {
      console.error("Google Auth not loaded yet");
      return;
    }

    // Override the callback temporarily if provided
    if (callback) {
      const originalCallback = handleCredentialResponse;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response: GoogleAuthResponse) => {
          const user = originalCallback(response);
          callback(user);
        },
        auto_select: false,
      });
    }

    window.google.accounts.id.prompt();
  };

  const renderGoogleButton = (
    element: HTMLElement,
    options: {
      theme?: "outline" | "filled_blue" | "filled_black";
      size?: "large" | "medium" | "small";
      shape?: "rectangular" | "pill" | "circle" | "square";
      text?: "signin_with" | "signup_with" | "continue_with" | "signin";
      logo_alignment?: "left" | "center";
      width?: number;
      callback?: (user: GoogleUser | null) => void;
    } = {},
  ) => {
    if (!hasValidCredentials) {
      element.innerHTML = `
        <div style="
          width: ${options.width || 300}px;
          height: 40px;
          border: 1px solid #dadce0;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f8f9fa;
          color: #5f6368;
          font-family: 'Roboto', arial, sans-serif;
          font-size: 14px;
          cursor: not-allowed;
        ">
          <svg width="18" height="18" viewBox="0 0 24 24" style="margin-right: 8px; opacity: 0.5;">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google OAuth não configurado
        </div>
      `;
      return;
    }

    if (!isLoaded || !window.google) {
      // Render a loading state
      element.innerHTML = `
        <div style="
          width: ${options.width || 300}px;
          height: 40px;
          border: 1px solid #dadce0;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f8f9fa;
          color: #5f6368;
          font-family: 'Roboto', arial, sans-serif;
          font-size: 14px;
        ">
          Carregando Google OAuth...
        </div>
      `;
      return;
    }

    try {
      // Set up callback if provided
      if (options.callback) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response: GoogleAuthResponse) => {
            const user = handleCredentialResponse(response);
            options.callback!(user);
          },
          auto_select: false,
        });
      }

      window.google.accounts.id.renderButton(element, {
        theme: options.theme || "outline",
        size: options.size || "large",
        shape: options.shape || "rectangular",
        text: options.text || "signin_with",
        logo_alignment: options.logo_alignment || "left",
        width: options.width || 300,
      });
    } catch (error) {
      console.error("Error rendering Google button:", error);
      element.innerHTML = `
        <div style="
          width: ${options.width || 300}px;
          height: 40px;
          border: 1px solid #fbbf24;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #fef3c7;
          color: #92400e;
          font-family: 'Roboto', arial, sans-serif;
          font-size: 14px;
        ">
          Erro ao carregar Google OAuth
        </div>
      `;
    }
  };

  const signOut = () => {
    setUser(null);
    // Clear any stored tokens if you're using them
    localStorage.removeItem("google_auth_token");
  };

  return {
    isLoaded,
    user,
    isLoading,
    hasValidCredentials,
    signInWithGoogle,
    renderGoogleButton,
    signOut,
  };
};

// Utility function to simulate authentication with backend
export const authenticateWithBackend = async (
  googleUser: GoogleUser,
  role: string,
) => {
  try {
    // Simulate API call to backend
    const response = await fetch("/api/auth/google", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        googleUser,
        role,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        user: data.user,
        token: data.token,
      };
    } else {
      return {
        success: false,
        error: "Authentication failed",
      };
    }
  } catch (error) {
    console.error("Backend authentication error:", error);
    return {
      success: false,
      error: "Network error",
    };
  }
};
