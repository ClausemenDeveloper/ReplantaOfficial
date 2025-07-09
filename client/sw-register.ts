// Service Worker Registration for ReplantaSystem
// Handles SW installation, updates, and messaging

export function registerServiceWorker() {
  if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
    window.addEventListener("load", async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        console.log("SW registered: ", registration);

        // Handle updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                // New content is available
                showUpdateNotification(registration);
              }
            });
          }
        });

        // Check for updates every hour in production
        setInterval(
          () => {
            registration.update();
          },
          60 * 60 * 1000,
        );

        // Listen for messages from SW
        navigator.serviceWorker.addEventListener("message", (event) => {
          handleServiceWorkerMessage(event.data);
        });

        // Clean cache periodically
        setInterval(
          () => {
            sendMessageToSW({ type: "CLEAN_CACHE" });
          },
          24 * 60 * 60 * 1000,
        ); // Daily
      } catch (error) {
        console.log("SW registration failed: ", error);
      }
    });
  }
}

function showUpdateNotification(registration: ServiceWorkerRegistration) {
  // Create a simple notification for updates
  const notification = document.createElement("div");
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #4ade80;
    color: white;
    padding: 16px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    max-width: 300px;
    animation: slideIn 0.3s ease-out;
  `;

  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px;">
      <div>
        <div style="font-weight: 600; margin-bottom: 4px;">Nova versão disponível</div>
        <div style="opacity: 0.9;">Clique para atualizar</div>
      </div>
      <button 
        onclick="this.parentElement.parentElement.remove()" 
        style="background: none; border: none; color: white; opacity: 0.7; cursor: pointer; font-size: 18px; padding: 0; margin-left: auto;"
      >×</button>
    </div>
  `;

  // Add animation keyframes
  if (!document.querySelector("#sw-animations")) {
    const style = document.createElement("style");
    style.id = "sw-animations";
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  notification.addEventListener("click", () => {
    // Skip waiting and reload
    sendMessageToSW({ type: "SKIP_WAITING" });
    window.location.reload();
  });

  document.body.appendChild(notification);

  // Auto-remove after 10 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 10000);
}

function sendMessageToSW(message: any) {
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage(message);
  }
}

function handleServiceWorkerMessage(data: any) {
  console.log("Message from SW:", data);

  if (data.type === "CACHE_UPDATED") {
    console.log("Cache updated by service worker");
  }

  if (data.type === "OFFLINE") {
    showOfflineNotification();
  }

  if (data.type === "ONLINE") {
    hideOfflineNotification();
  }
}

let offlineNotification: HTMLElement | null = null;

function showOfflineNotification() {
  if (offlineNotification) return;

  offlineNotification = document.createElement("div");
  offlineNotification.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 20px;
    right: 20px;
    background: #f59e0b;
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    text-align: center;
    animation: slideUp 0.3s ease-out;
  `;

  offlineNotification.innerHTML = `
    <div style="font-weight: 600;">Modo Offline</div>
    <div style="opacity: 0.9; font-size: 12px; margin-top: 4px;">
      Algumas funcionalidades podem estar limitadas
    </div>
  `;

  document.body.appendChild(offlineNotification);
}

function hideOfflineNotification() {
  if (offlineNotification) {
    offlineNotification.remove();
    offlineNotification = null;
  }
}

// Network status monitoring
export function monitorNetworkStatus() {
  window.addEventListener("online", () => {
    console.log("App is online");
    hideOfflineNotification();
  });

  window.addEventListener("offline", () => {
    console.log("App is offline");
    showOfflineNotification();
  });

  // Initial status check
  if (!navigator.onLine) {
    showOfflineNotification();
  }
}

// Preload critical resources
export function preloadCriticalResources() {
  const criticalAssets = [
    "/manifest.json",
    // Add other critical assets
  ];

  criticalAssets.forEach((asset) => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.href = asset;
    link.as = asset.endsWith(".css") ? "style" : "fetch";
    link.crossOrigin = "anonymous";
    document.head.appendChild(link);
  });
}
