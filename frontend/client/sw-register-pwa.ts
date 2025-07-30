// PWA Service Worker Registration for ReplantaSystem
// Multi-platform support: Web, Android, iOS

interface ServiceWorkerConfig {
  scope?: string;
  updateViaCache?: "imports" | "all" | "none";
}

class PWAServiceWorker {
  private registration: ServiceWorkerRegistration | null = null;
  private isOnline = navigator.onLine;
  private updateAvailable = false;

  constructor() {
    this.init();
    this.setupEventListeners();
  }

  private async init() {
    if ("serviceWorker" in navigator) {
      try {
        await this.registerServiceWorker();
        await this.requestNotificationPermission();
        this.monitorNetworkStatus();
        this.setupPeriodicSync();
      } catch (error) {
        console.error("❌ PWA initialization failed:", error);
      }
    } else {
      console.warn("⚠️ Service Worker not supported");
    }
  }

  private async registerServiceWorker() {
    const config: ServiceWorkerConfig = {
      scope: "/",
      updateViaCache: "none",
    };

    try {
      this.registration = await navigator.serviceWorker.register(
        "/sw-pwa.js",
        config,
      );

      console.log("✅ PWA Service Worker registered:", this.registration.scope);

      // Handle updates
      this.registration.addEventListener("updatefound", () => {
        const newWorker = this.registration?.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              this.updateAvailable = true;
              this.notifyUpdateAvailable();
            }
          });
        }
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener("message", (event) => {
        this.handleServiceWorkerMessage(event);
      });
    } catch (error) {
      console.error("❌ Service Worker registration failed:", error);
    }
  }

  private async requestNotificationPermission() {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      console.log("🔔 Notification permission:", permission);

      if (permission === "granted") {
        await this.subscribeToPushNotifications();
      }
    }
  }

  private async subscribeToPushNotifications() {
    if (!this.registration) return;

    try {
      // Get VAPID public key from environment
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

      if (!vapidPublicKey) {
        console.warn("⚠️ VAPID public key not configured");
        return;
      }

      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey),
      });

      console.log("📱 Push subscription:", subscription);

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);
    } catch (error) {
      console.error("❌ Push subscription failed:", error);
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private async sendSubscriptionToServer(subscription: PushSubscription) {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      const response = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(subscription),
      });

      if (response.ok) {
        console.log("✅ Push subscription sent to server");
      }
    } catch (error) {
      console.error("❌ Failed to send subscription to server:", error);
    }
  }

  private setupEventListeners() {
    // Online/offline events
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.handleOnlineStatusChange(true);
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
      this.handleOnlineStatusChange(false);
    });

    // Before install prompt (PWA installation)
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      this.showInstallPrompt(e);
    });

    // App installed
    window.addEventListener("appinstalled", () => {
      console.log("✅ PWA installed successfully");
      this.trackInstallation();
    });
  }

  private handleOnlineStatusChange(isOnline: boolean) {
    console.log(`🌐 Network status: ${isOnline ? "Online" : "Offline"}`);

    // Show toast notification
    this.showNetworkStatusToast(isOnline);

    if (isOnline && this.registration) {
      // Trigger background sync when back online
      if ("sync" in this.registration) {
        (this.registration as any).sync.register("sync-user-data");
        (this.registration as any).sync.register("sync-projects");
      }
    }
  }

  private showNetworkStatusToast(isOnline: boolean) {
    // Create or update network status indicator
    const existingToast = document.getElementById("network-status-toast");
    if (existingToast) {
      existingToast.remove();
    }

    const toast = document.createElement("div");
    toast.id = "network-status-toast";
    toast.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg transition-all duration-300 ${
      isOnline ? "bg-green-500 text-white" : "bg-red-500 text-white"
    }`;
    toast.textContent = isOnline ? "🌐 Online" : "📱 Modo Offline";

    document.body.appendChild(toast);

    // Remove after 3 seconds for online, keep for offline
    if (isOnline) {
      setTimeout(() => {
        toast.remove();
      }, 3000);
    }
  }

  private showInstallPrompt(e: any) {
    // Show custom install button
    const installButton = document.createElement("button");
    installButton.className =
      "fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50";
    installButton.textContent = "📱 Instalar App";
    installButton.onclick = () => {
      e.prompt();
      e.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === "accepted") {
          console.log("✅ User accepted the install prompt");
        }
        installButton.remove();
      });
    };

    document.body.appendChild(installButton);

    // Remove button after 10 seconds
    setTimeout(() => {
      installButton.remove();
    }, 10000);
  }

  private trackInstallation() {
    // Track app installation analytics
    if (typeof gtag !== "undefined") {
      gtag("event", "pwa_install", {
        event_category: "engagement",
        event_label: "PWA Installation",
      });
    }
  }

  private monitorNetworkStatus() {
    // Periodic connectivity check
    setInterval(async () => {
      try {
        const response = await fetch("/api/health", {
          method: "GET",
          cache: "no-cache",
        });

        const wasOnline = this.isOnline;
        this.isOnline = response.ok;

        if (wasOnline !== this.isOnline) {
          this.handleOnlineStatusChange(this.isOnline);
        }
      } catch {
        const wasOnline = this.isOnline;
        this.isOnline = false;

        if (wasOnline) {
          this.handleOnlineStatusChange(false);
        }
      }
    }, 30000); // Check every 30 seconds
  }

  private setupPeriodicSync() {
    // Register periodic background sync (if supported)
    if (
      "serviceWorker" in navigator &&
      "periodicSync" in window.ServiceWorkerRegistration.prototype
    ) {
      navigator.serviceWorker.ready
        .then((registration) => {
          return (registration as any).periodicSync.register("sync-data", {
            minInterval: 24 * 60 * 60 * 1000, // 24 hours
          });
        })
        .catch((error) => {
          console.log("❌ Periodic sync not supported:", error);
        });
    }
  }

  private handleServiceWorkerMessage(event: MessageEvent) {
    const { type, payload } = event.data;

    switch (type) {
      case "NEW_VERSION_AVAILABLE":
        this.notifyUpdateAvailable();
        break;

      case "SYNC_COMPLETE":
        console.log("✅ Background sync completed");
        break;

      default:
        console.log("📨 SW Message:", type, payload);
    }
  }

  private notifyUpdateAvailable() {
    // Show update notification
    const updateBanner = document.createElement("div");
    updateBanner.className =
      "fixed top-0 left-0 right-0 bg-blue-500 text-white p-3 text-center z-50 flex items-center justify-center gap-4";
    updateBanner.innerHTML = `
      <span>🔄 Nova versão disponível!</span>
      <button id="update-pwa-btn" class="ml-4 bg-white text-blue-500 px-3 py-1 rounded">Atualizar</button>
      <button id="close-pwa-btn" class="ml-2 text-white">✕</button>
    `;

    document.body.prepend(updateBanner);

    const updateBtn = document.getElementById("update-pwa-btn");
    const closeBtn = document.getElementById("close-pwa-btn");
    if (updateBtn) {
      updateBtn.addEventListener("click", () => {
        this.activateUpdate();
        updateBanner.remove();
      });
    }
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        updateBanner.remove();
      });
    }
  }

  private activateUpdate() {
    if (this.registration?.waiting) {
      this.registration.waiting.postMessage({ type: "SKIP_WAITING" });
    }
    window.location.reload();
  }

  // Public methods
  public async clearCache() {
    if (this.registration) {
      const messageChannel = new MessageChannel();
      this.registration.active?.postMessage({ type: "CLEAR_CACHE" }, [
        messageChannel.port2,
      ]);

      return new Promise((resolve) => {
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data);
        };
      });
    }
  }

  public getNetworkStatus() {
    return this.isOnline;
  }

  public isUpdateAvailable() {
    return this.updateAvailable;
  }
}

// Initialize PWA Service Worker
const pwaServiceWorker = new PWAServiceWorker();

// Export for external use
export default pwaServiceWorker;

// Global functions for debugging
(window as any).pwaServiceWorker = pwaServiceWorker;
/**
 * Envia eventos para o Google Analytics via gtag ou faz fallback para log local.
 * @param event - Nome do evento (ex: "event")
 * @param action - Ação do evento (ex: "pwa_install")
 * @param params - Parâmetros do evento
 */
function gtag(event: string, action: string, params: { event_category: string; event_label: string; }) {
  if (typeof window !== "undefined" && typeof (window as any).gtag === "function") {
    try {
      (window as any).gtag(event, action, params);
    } catch (err) {
      console.warn("Erro ao enviar evento gtag:", err, event, action, params);
    }
  } else {
    // Fallback: log para depuração
    console.log("[DEBUG] gtag event:", { event, action, params });
  }
}

