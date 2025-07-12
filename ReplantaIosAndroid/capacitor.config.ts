import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.replantasystem.app",
  appName: "ReplantaSystem",
  webDir: "dist/spa",
  server: {
    androidScheme: "https",
    // Para desenvolvimento local - remover em produção
    // url: 'http://localhost:8080',
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#22c55e",
      showSpinner: false,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#ffffff",
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "dark",
      backgroundColor: "#22c55e",
    },
    Keyboard: {
      resize: "body",
      style: "dark",
      resizeOnFullScreen: true,
    },
    App: {
      backButtonDispatcher: true,
    },
  },
};

export default config;
