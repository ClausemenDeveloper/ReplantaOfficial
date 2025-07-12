import { useEffect, useRef } from "react";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";

interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
}

interface GoogleSignInButtonProps {
  onSuccess: (user: GoogleUser) => void;
  onError?: (error: string) => void;
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  shape?: "rectangular" | "pill" | "circle" | "square";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  width?: number;
  className?: string;
}

export default function GoogleSignInButton({
  onSuccess,
  onError,
  theme = "outline",
  size = "large",
  shape = "rectangular",
  text = "signin_with",
  width = 300,
  className = "",
}: GoogleSignInButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const { isLoaded, renderGoogleButton } = useGoogleAuth();

  useEffect(() => {
    if (isLoaded && buttonRef.current) {
      // Clear any existing content
      buttonRef.current.innerHTML = "";

      renderGoogleButton(buttonRef.current, {
        theme,
        size,
        shape,
        text,
        width,
        callback: (user) => {
          if (user) {
            onSuccess(user);
          } else {
            onError?.("Failed to authenticate with Google");
          }
        },
      });
    }
  }, [isLoaded, theme, size, shape, text, width, onSuccess, onError]);

  if (!isLoaded) {
    return (
      <div
        className={`flex items-center justify-center border border-gray-300 rounded-lg p-3 ${className}`}
        style={{ width: width || 300 }}
      >
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-garden-green rounded-full animate-spin"></div>
          <span className="text-gray-600">A carregar Google...</span>
        </div>
      </div>
    );
  }

  return <div ref={buttonRef} className={className}></div>;
}
