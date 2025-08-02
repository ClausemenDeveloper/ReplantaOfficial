import { ReactNode, useEffect } from "react";
import { usePlatform, platformUtils } from "../hooks/usePlatform";
import { cn } from "../lib/utils";

interface MobileLayoutProps {
  children: ReactNode;
  showStatusBar?: boolean;
  statusBarStyle?: "light" | "dark";
  backgroundColor?: string;
  safeArea?: boolean;
  className?: string;
}

export default function MobileLayout({
  children,
  showStatusBar = true,
  statusBarStyle = "dark",
  backgroundColor = "#ffffff",
  safeArea = true,
  className,
}: MobileLayoutProps) {
  const platform = usePlatform();

  useEffect(() => {
    // Configure status bar for mobile
    if (platform.isMobile || platform.isCapacitor) {
      platformUtils.setStatusBar(showStatusBar, statusBarStyle);
    }

    // Set background color
    document.body.style.backgroundColor = backgroundColor;

    return () => {
      // Cleanup
      document.body.style.backgroundColor = "";
    };
  }, [showStatusBar, statusBarStyle, backgroundColor, platform]);

  const getLayoutClasses = () => {
    let classes = "min-h-screen w-full";

    // Safe area support for iOS
    if (safeArea && (platform.platform === "ios" || platform.isPWA)) {
      classes += " safe-area-padding";
    }

    // Platform-specific adjustments
    if (platform.isMobile) {
      classes += " mobile-layout";
    } else if (platform.isTablet) {
      classes += " tablet-layout";
    } else {
      classes += " desktop-layout";
    }

    return classes;
  };

  return (
    <div className={cn(getLayoutClasses(), className)}>
      {/* Mobile-specific header spacing */}
      {platform.isMobile && safeArea && (
        <div className="h-safe-top bg-transparent" />
      )}
      {platform.isMobile && showStatusBar && (
        <div className="h-safe-top bg-transparent" />
      )}

      {/* Main content */}      <div className="flex-1 overflow-auto">{children}</div>
      {/* Ensure content is scrollable on mobile */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
      <div className="flex-1">{children}</div>

      {/* Mobile-specific footer spacing */}

      {/* Mobile-specific footer spacing */ }
      {platform.isMobile && safeArea && (
        <div className="h-safe-bottom bg-transparent" />
      )}

      {/* Add custom styles for safe areas */}
      <style>{`
        .safe-area-padding {
          padding-top: env(safe-area-inset-top);
          padding-bottom: env(safe-area-inset-bottom);
          padding-left: env(safe-area-inset-left);
          padding-right: env(safe-area-inset-right);
        }

        .h-safe-top {
          height: env(safe-area-inset-top);
        }

        .h-safe-bottom {
          height: env(safe-area-inset-bottom);
        }

        .mobile-layout {
          font-size: 16px; /* Prevent zoom on iOS */
          -webkit-text-size-adjust: 100%;
          -webkit-tap-highlight-color: transparent;
        }

        .tablet-layout {
          font-size: 18px;
        }

        .desktop-layout {
          font-size: 16px;
        }

        /* Hide scrollbars on mobile */
        @media (max-width: 768px) {
          ::-webkit-scrollbar {
            display: none;
          }

          * {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        }

        /* Touch optimizations */
        button,
        a,
        [role="button"] {
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          user-select: none;
        }

        /* Improve touch targets on mobile */
        @media (max-width: 768px) {
          button,
          a,
          [role="button"] {
            min-height: 44px;
            min-width: 44px;
          }
        }
      `}</style>
    </div>
  );
}

// Mobile-optimized navigation component
export function MobileNavigation({
  children,
  position = "bottom",
  className,
}: {
  children: ReactNode;
  position?: "top" | "bottom";
  className?: string;
}) {
  const platform = usePlatform();

  if (!platform.isMobile) return null;

  const navClasses = cn(
    "fixed left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-padding",
    position === "bottom" ? "bottom-0" : "top-0",
    position === "top" && "border-t-0 border-b",
    className,
  );

  return <nav className={navClasses}>{children}</nav>;
}

// Mobile-optimized button component
export function MobileButton({
  children,
  onClick,
  variant = "primary",
  size = "lg",
  haptic = true,
  className,
  ...props
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  haptic?: boolean;
  className?: string;
  [key: string]: any;
}) {
  const platform = usePlatform();

  const handleClick = async () => {
    // Haptic feedback on mobile
    if (haptic && (platform.isMobile || platform.isCapacitor)) {
      await platformUtils.hapticFeedback("light");
    }

    onClick?.();
  };

  const buttonClasses = cn(
    "rounded-lg font-medium transition-all active:scale-95",
    // Size variants
    {
      "px-3 py-1.5 text-sm min-h-[36px]": size === "sm",
      "px-4 py-2 text-base min-h-[40px]": size === "md",
      "px-6 py-3 text-lg min-h-[48px]": size === "lg",
    },
    // Color variants
    {
      "bg-garden-green text-white hover:bg-garden-green-dark active:bg-garden-green-dark":
        variant === "primary",
      "bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-200":
        variant === "secondary",
      "border-2 border-garden-green text-garden-green hover:bg-garden-green hover:text-white":
        variant === "outline",
    },
    // Mobile optimizations
    platform.isMobile && "touch-manipulation select-none",
    className,
  );

  return (
    <button className={buttonClasses} onClick={handleClick} {...props}>
      {children}
    </button>
  );
}

// Mobile-optimized input component
export function MobileInput({
  label,
  error,
  className,
  ...props
}: {
  label?: string;
  error?: string;
  className?: string;
  [key: string]: any;
}) {
  const platform = usePlatform();

  const inputClasses = cn(
    "w-full rounded-lg border border-gray-300 px-4 py-3 text-base transition-colors",
    "focus:border-garden-green focus:outline-none focus:ring-2 focus:ring-garden-green/20",
    // Mobile optimizations
    platform.isMobile && [
      "min-h-[48px]", // Minimum touch target
      "text-[16px]", // Prevent zoom on iOS
      "-webkit-appearance-none", // Remove iOS styling
    ],
    error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
    className,
  );

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input className={inputClasses} {...props} />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

// Pull-to-refresh component
export function PullToRefresh({
  onRefresh,
  children,
}: {
  onRefresh: () => Promise<void>;
  children: ReactNode;
}) {
  const platform = usePlatform();

  useEffect(() => {
    if (!platform.isMobile) return;

    let startY = 0;
    let isRefreshing = false;

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isRefreshing || window.scrollY > 0) return;

      const currentY = e.touches[0].clientY;
      const diff = currentY - startY;

      if (diff > 100) {
        e.preventDefault();
        // Show refresh indicator
      }
    };

    const handleTouchEnd = async (e: TouchEvent) => {
      if (isRefreshing || window.scrollY > 0) return;

      const endY = e.changedTouches[0].clientY;
      const diff = endY - startY;

      if (diff > 100) {
        isRefreshing = true;
        await platformUtils.hapticFeedback("medium");
        await onRefresh();
        isRefreshing = false;
      }
    };

    document.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd, { passive: false });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [platform.isMobile, onRefresh]);

  return <div className="pull-to-refresh-container">{children}</div>;
}
