import { useState, useEffect } from "react";

interface PlatformInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  platform: "ios" | "android" | "web";
  isCapacitor: boolean;
  isPWA: boolean;
  orientation: "portrait" | "landscape";
  screenSize: "sm" | "md" | "lg" | "xl";
}

export function usePlatform(): PlatformInfo {
  const [platform, setPlatform] = useState<PlatformInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    platform: "web",
    isCapacitor: false,
    isPWA: false,
    orientation: "landscape",
    screenSize: "lg",
  });

  useEffect(() => {
    const detectPlatform = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Detect mobile/tablet/desktop
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const isDesktop = width >= 1024;

      // Detect platform
      let platformType: "ios" | "android" | "web" = "web";
      if (userAgent.includes("iphone") || userAgent.includes("ipad")) {
        platformType = "ios";
      } else if (userAgent.includes("android")) {
        platformType = "android";
      }

      // Detect Capacitor
      const isCapacitor = !!(window as any).Capacitor;

      // Detect PWA
      const isPWA =
        window.matchMedia("(display-mode: standalone)").matches ||
        window.matchMedia("(display-mode: fullscreen)").matches ||
        (window.navigator as any).standalone === true;

      // Detect orientation
      const orientation = height > width ? "portrait" : "landscape";

      // Determine screen size
      let screenSize: "sm" | "md" | "lg" | "xl" = "lg";
      if (width < 640) screenSize = "sm";
      else if (width < 768) screenSize = "md";
      else if (width < 1024) screenSize = "lg";
      else screenSize = "xl";

      setPlatform({
        isMobile,
        isTablet,
        isDesktop,
        platform: platformType,
        isCapacitor,
        isPWA,
        orientation,
        screenSize,
      });
    };

    detectPlatform();

    // Listen for resize events
    window.addEventListener("resize", detectPlatform);
    window.addEventListener("orientationchange", detectPlatform);

    return () => {
      window.removeEventListener("resize", detectPlatform);
      window.removeEventListener("orientationchange", detectPlatform);
    };
  }, []);

  return platform;
}

export function useResponsiveClasses() {
  const platform = usePlatform();

  const getResponsiveClasses = (config: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
    base?: string;
  }) => {
    const { mobile = "", tablet = "", desktop = "", base = "" } = config;

    let classes = base;

    if (platform.isMobile && mobile) {
      classes += ` ${mobile}`;
    } else if (platform.isTablet && tablet) {
      classes += ` ${tablet}`;
    } else if (platform.isDesktop && desktop) {
      classes += ` ${desktop}`;
    }

    return classes.trim();
  };

  return { platform, getResponsiveClasses };
}

export function useCapacitor() {
  const [isReady, setIsReady] = useState(false);
  const [plugins, setPlugins] = useState<any>({});

  useEffect(() => {
    const initCapacitor = async () => {
      if ((window as any).Capacitor) {
        try {
          const { Capacitor } = await import("@capacitor/core");

          // Import commonly used plugins
          const [
            { SplashScreen },
            { StatusBar },
            { Keyboard },
            { App },
            { Device },
            { Haptics },
          ] = await Promise.all([
            import("@capacitor/splash-screen"),
            import("@capacitor/status-bar"),
            import("@capacitor/keyboard"),
            import("@capacitor/app"),
            import("@capacitor/device"),
            import("@capacitor/haptics"),
          ]);

          setPlugins({
            Capacitor,
            SplashScreen,
            StatusBar,
            Keyboard,
            App,
            Device,
            Haptics,
          });

          setIsReady(true);

          // Hide splash screen
          await SplashScreen.hide();

          console.log("✅ Capacitor ready");
        } catch (error) {
          console.error("❌ Capacitor initialization failed:", error);
        }
      }
    };

    initCapacitor();
  }, []);

  return { isReady, plugins };
}

// Utility functions for platform-specific behavior
export const platformUtils = {
  // Get safe area insets for iPhone X+
  getSafeAreaInsets: () => {
    const style = getComputedStyle(document.documentElement);
    return {
      top: parseInt(style.getPropertyValue("--safe-area-inset-top") || "0"),
      bottom: parseInt(
        style.getPropertyValue("--safe-area-inset-bottom") || "0",
      ),
      left: parseInt(style.getPropertyValue("--safe-area-inset-left") || "0"),
      right: parseInt(style.getPropertyValue("--safe-area-inset-right") || "0"),
    };
  },

  // Trigger haptic feedback (mobile only)
  hapticFeedback: async (type: "light" | "medium" | "heavy" = "light") => {
    try {
      if ((window as any).Capacitor) {
        const { Haptics, ImpactStyle } = await import("@capacitor/haptics");

        const impactStyle = {
          light: ImpactStyle.Light,
          medium: ImpactStyle.Medium,
          heavy: ImpactStyle.Heavy,
        }[type];

        await Haptics.impact({ style: impactStyle });
      } else if (navigator.vibrate) {
        // Fallback for web
        const patterns = {
          light: [10],
          medium: [20],
          heavy: [30],
        };
        navigator.vibrate(patterns[type]);
      }
    } catch (error) {
      // Silently fail - not critical
    }
  },

  // Show/hide status bar
  setStatusBar: async (visible: boolean, style?: "light" | "dark") => {
    try {
      if ((window as any).Capacitor) {
        const { StatusBar, Style } = await import("@capacitor/status-bar");

        if (visible) {
          await StatusBar.show();
          if (style) {
            await StatusBar.setStyle({
              style: style === "light" ? Style.Light : Style.Dark,
            });
          }
        } else {
          await StatusBar.hide();
        }
      }
    } catch (error) {
      console.warn("Status bar control failed:", error);
    }
  },

  // Handle back button (Android)
  onBackButton: (callback: () => boolean) => {
    let handler: any;

    const setupHandler = async () => {
      try {
        if ((window as any).Capacitor) {
          const { App } = await import("@capacitor/app");
          handler = App.addListener("backButton", (event) => {
            const shouldExit = callback();
            if (shouldExit) {
              App.exitApp();
            }
          });
        }
      } catch (error) {
        console.warn("Back button handler setup failed:", error);
      }
    };

    setupHandler();

    // Return cleanup function
    return () => {
      if (handler) {
        handler.remove();
      }
    };
  },

  // Check if app is in background/foreground
  onAppStateChange: (callback: (isActive: boolean) => void) => {
    let handler: any;

    const setupHandler = async () => {
      try {
        if ((window as any).Capacitor) {
          const { App } = await import("@capacitor/app");
          handler = App.addListener("appStateChange", (state) => {
            callback(state.isActive);
          });
        }
      } catch (error) {
        console.warn("App state handler setup failed:", error);
      }
    };

    setupHandler();

    return () => {
      if (handler) {
        handler.remove();
      }
    };
  },

  // Open external URL
  openUrl: async (url: string) => {
    try {
      if ((window as any).Capacitor) {
        const { Browser } = await import("@capacitor/browser");
        await Browser.open({ url });
      } else {
        window.open(url, "_blank");
      }
    } catch (error) {
      // Fallback
      window.open(url, "_blank");
    }
  },

  // Share content
  share: async (options: { title: string; text: string; url?: string }) => {
    try {
      if (navigator.share) {
        await navigator.share(options);
      } else if ((window as any).Capacitor) {
        const { Share } = await import("@capacitor/share");
        await Share.share(options);
      } else {
        // Fallback: copy to clipboard
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(
            `${options.title}\n${options.text}\n${options.url || ""}`,
          );
          alert("Copiado para a área de transferência!");
        }
      }
    } catch (error) {
      console.error("Share failed:", error);
    }
  },
};
