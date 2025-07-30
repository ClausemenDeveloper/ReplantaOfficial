// ReplantaSystem PWA Service Worker v3.0
// Multi-platform support: Web, Android, iOS
// Features: Offline support, Push notifications, Background sync

const CACHE_NAME = "replantasystem-pwa-v3.0";
const API_CACHE_NAME = "replantasystem-api-v2.0";
const STATIC_CACHE_NAME = "replantasystem-static-v2.0";
const IMAGES_CACHE_NAME = "replantasystem-images-v1.0";

// Assets to cache immediately
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/offline.html",
  "/login",
  "/register",
  "/favicon.ico",
  // Icons
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  // Critical CSS and JS will be added by build process
];

// API endpoints to cache
const API_ROUTES = ["/api/health", "/api/auth/me", "/api/users/stats"];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("🔧 PWA Service Worker installing...");

  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log("📦 Caching static assets...");
        return cache.addAll(STATIC_ASSETS);
      }),
      // Skip waiting to activate immediately
      self.skipWaiting(),
    ]),
  );
});

// Activate event - clean old caches
self.addEventListener("activate", (event) => {
  console.log("✅ PWA Service Worker activated");

  event.waitUntil(
    Promise.all([
      // Clean old caches
      caches.keys().then((cacheNames) => {
        const deletePromises = cacheNames
          .filter((cacheName) => {
            return (
              cacheName !== CACHE_NAME &&
              cacheName !== API_CACHE_NAME &&
              cacheName !== STATIC_CACHE_NAME &&
              cacheName !== IMAGES_CACHE_NAME
            );
          })
          .map((cacheName) => {
            console.log("🗑️ Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          });
        return Promise.all(deletePromises);
      }),
      // Take control of all pages
      self.clients.claim(),
    ]),
  );
});

// Fetch event - implement caching strategies
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip cross-origin requests (except APIs)
  if (url.origin !== location.origin && !url.pathname.startsWith("/api")) {
    return;
  }

  event.respondWith(handleFetch(request));
});

async function handleFetch(request) {
  const url = new URL(request.url);

  try {
    // Strategy 1: API calls - Network first with fallback
    if (url.pathname.startsWith("/api")) {
      return await networkFirstAPI(request);
    }

    // Strategy 2: Images - Cache first
    if (request.destination === "image") {
      return await cacheFirstImages(request);
    }

    // Strategy 3: Static assets - Cache first
    if (STATIC_ASSETS.some((asset) => url.pathname === asset)) {
      return await cacheFirst(request, STATIC_CACHE_NAME);
    }

    // Strategy 4: HTML pages - Network first with cache fallback
    if (request.headers.get("accept")?.includes("text/html")) {
      return await networkFirstHTML(request);
    }

    // Strategy 5: Other resources - Stale while revalidate
    return await staleWhileRevalidate(request);
  } catch (error) {
    console.error("Fetch error:", error);

    // Return offline page for HTML requests
    if (request.headers.get("accept")?.includes("text/html")) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      return cache.match("/offline.html");
    }

    // Return a generic offline response
    return new Response(
      JSON.stringify({
        success: false,
        message: "Sem conexão à internet",
        offline: true,
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

// Network first for API calls
async function networkFirstAPI(request) {
  try {
    const response = await fetch(request);

    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(API_CACHE_NAME);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    // Try cache on network failure
    const cache = await caches.open(API_CACHE_NAME);
    const cached = await cache.match(request);

    if (cached) {
      return cached;
    }

    throw error;
  }
}

// Cache first for images
async function cacheFirstImages(request) {
  const cache = await caches.open(IMAGES_CACHE_NAME);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response(
      `<svg width="200" height="150" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#6b7280">
          Imagem indisponível
        </text>
      </svg>`,
      { headers: { "Content-Type": "image/svg+xml" } },
    );
  }
}

// Cache first for static assets
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  const response = await fetch(request);
  if (response.ok) {
    cache.put(request, response.clone());
  }

  return response;
}

// Network first for HTML
async function networkFirstHTML(request) {
  try {
    const response = await fetch(request);

    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    // Try cache on network failure
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);

    if (cached) {
      return cached;
    }

    // Return offline page
    const staticCache = await caches.open(STATIC_CACHE_NAME);
    return staticCache.match("/offline.html");
  }
}

// Stale while revalidate
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  // Fetch in background
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  // Return cached version immediately or wait for network
  return cached || fetchPromise;
}

// Push notification handling
self.addEventListener("push", (event) => {
  console.log("📱 Push notification received");

  const data = event.data
    ? event.data.json()
    : {
        title: "ReplantaSystem",
        body: "Nova notificação disponível",
        icon: "/icons/icon-192x192.png",
        badge: "/icons/badge-72x72.png",
      };

  const options = {
    body: data.body,
    icon: data.icon || "/icons/icon-192x192.png",
    badge: data.badge || "/icons/badge-72x72.png",
    data: data.data || {},
    actions: data.actions || [
      {
        action: "open",
        title: "Abrir App",
        icon: "/icons/action-open.png",
      },
      {
        action: "close",
        title: "Fechar",
        icon: "/icons/action-close.png",
      },
    ],
    tag: data.tag || "replanta-notification",
    renotify: true,
    requireInteraction: data.priority === "high",
    silent: false,
    vibrate: [200, 100, 200],
    timestamp: Date.now(),
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Notification click handling
self.addEventListener("notificationclick", (event) => {
  console.log("📱 Notification clicked");

  event.notification.close();

  const action = event.action;
  const data = event.notification.data;

  if (action === "close") {
    return;
  }

  // Open or focus app
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Try to focus existing window
        for (const client of clientList) {
          if (client.url.includes(location.origin)) {
            return client.focus();
          }
        }

        // Open new window
        const url = data?.url || "/dashboard";
        return clients.openWindow(url);
      }),
  );
});

// Background sync (for offline actions)
self.addEventListener("sync", (event) => {
  console.log("🔄 Background sync triggered:", event.tag);

  if (event.tag === "sync-user-data") {
    event.waitUntil(syncUserData());
  }

  if (event.tag === "sync-projects") {
    event.waitUntil(syncProjects());
  }
});

async function syncUserData() {
  try {
    console.log("🔄 Syncing user data...");
    // Implement user data sync logic
    const response = await fetch("/api/auth/me");
    if (response.ok) {
      console.log("✅ User data synced");
    }
  } catch (error) {
    console.error("❌ Failed to sync user data:", error);
  }
}

async function syncProjects() {
  try {
    console.log("🔄 Syncing projects...");
    // Implement projects sync logic
    const response = await fetch("/api/projects");
    if (response.ok) {
      console.log("✅ Projects synced");
    }
  } catch (error) {
    console.error("❌ Failed to sync projects:", error);
  }
}

// Message handling from main thread
self.addEventListener("message", (event) => {
  const { type, payload } = event.data;

  switch (type) {
    case "SKIP_WAITING":
      self.skipWaiting();
      break;

    case "GET_VERSION":
      event.ports[0].postMessage({ version: CACHE_NAME });
      break;

    case "CLEAR_CACHE":
      clearAllCaches().then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;

    default:
      console.log("Unknown message type:", type);
  }
});

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  const deletePromises = cacheNames.map((name) => caches.delete(name));
  await Promise.all(deletePromises);
  console.log("🗑️ All caches cleared");
}

// Error handling
self.addEventListener("error", (event) => {
  console.error("💥 Service Worker error:", event.error);
});

self.addEventListener("unhandledrejection", (event) => {
  console.error("💥 Unhandled promise rejection:", event.reason);
});

console.log("🚀 ReplantaSystem PWA Service Worker v3.0 loaded");
