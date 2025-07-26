// Service Worker for ReplantaSystem
// Implements caching strategies for performance and offline support

const CACHE_NAME = "replanta-system-v1";
const STATIC_CACHE = "replanta-static-v1";
const DYNAMIC_CACHE = "replanta-dynamic-v1";

// Files to cache immediately
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/offline.html",
  // Add more critical assets as needed
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("Service Worker installing...");

  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log("Caching static assets...");
      return cache.addAll(STATIC_ASSETS);
    }),
  );

  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker activating...");

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return (
              cacheName !== STATIC_CACHE &&
              cacheName !== DYNAMIC_CACHE &&
              cacheName !== CACHE_NAME
            );
          })
          .map((cacheName) => {
            console.log("Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }),
      );
    }),
  );

  self.clients.claim();
});

// Fetch event - implement caching strategies
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  event.respondWith(handleRequest(request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  try {
    // Strategy 1: Cache First (for static assets)
    if (isStaticAsset(pathname)) {
      return await cacheFirst(request);
    }

    // Strategy 2: Network First (for API calls)
    if (pathname.startsWith("/api/")) {
      return await networkFirst(request);
    }

    // Strategy 3: Stale While Revalidate (for HTML pages)
    if (
      pathname.endsWith(".html") ||
      pathname === "/" ||
      !pathname.includes(".")
    ) {
      return await staleWhileRevalidate(request);
    }

    // Default: Network First
    return await networkFirst(request);
  } catch (error) {
    console.error("Service Worker fetch error:", error);

    // Return offline page for navigation requests
    if (request.mode === "navigate") {
      return caches.match("/offline.html");
    }

    // Return cached version if available
    return caches.match(request);
  }
}

// Cache First Strategy - good for static assets
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  const networkResponse = await fetch(request);

  if (networkResponse && networkResponse.status === 200) {
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, networkResponse.clone());
  }

  return networkResponse;
}

// Network First Strategy - good for API calls
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse && networkResponse.status === 200) {
      // Cache successful API responses for short term
      if (request.url.includes("/api/")) {
        const cache = await caches.open(DYNAMIC_CACHE);
        cache.put(request, networkResponse.clone());
      }
    }

    return networkResponse;
  } catch (error) {
    // Return cached version if network fails
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    throw error;
  }
}

// Stale While Revalidate Strategy - good for HTML pages
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);

  // Fetch from network in background
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  });

  // Return cached version immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }

  // Otherwise wait for network
  return fetchPromise;
}

// Helper function to identify static assets
function isStaticAsset(pathname) {
  const staticExtensions = [
    ".js",
    ".css",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".svg",
    ".ico",
    ".woff",
    ".woff2",
    ".ttf",
    ".eot",
    ".pdf",
  ];

  return staticExtensions.some((ext) => pathname.endsWith(ext));
}

// Background sync for failed requests
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Retry failed requests when connection is restored
  console.log("Background sync triggered");

  // Implementation for retrying failed API calls
  // This would typically involve checking a queue of failed requests
  // and retrying them when the connection is restored
}

// Enhanced Push Notifications for ReplantaSystem
self.addEventListener("push", (event) => {
  console.log("Push event received:", event);

  if (!event.data) {
    console.warn("Push event has no data");
    return;
  }

  try {
    const data = event.data.json();
    console.log("Push notification data:", data);

    const options = {
      body: data.body || data.message,
      icon: data.icon || "/icon-192.png",
      badge: data.badge || "/badge-72.png",
      image: data.image,
      tag: data.tag || "replanta-notification",
      renotify: true,
      requireInteraction: data.priority === "urgent",
      silent: data.priority === "low",
      timestamp: Date.now(),
      data: {
        url: data.url || data.actionUrl || "/",
        notificationId: data.notificationId,
        type: data.type,
        projectId: data.projectId,
        taskId: data.taskId,
        ...data.data,
      },
      actions: data.actions || [
        {
          action: "open",
          title: data.actionLabel || "Ver",
          icon: "/icon-open.png",
        },
        {
          action: "close",
          title: "Fechar",
          icon: "/icon-close.png",
        },
      ],
      vibrate: data.priority === "urgent" ? [200, 100, 200] : [100],
      dir: "ltr",
      lang: "pt-PT",
    };

    // Add custom styling based on notification type
    if (data.type === "project") {
      options.icon = "/icon-project.png";
    } else if (data.type === "maintenance") {
      options.icon = "/icon-maintenance.png";
    } else if (data.type === "error") {
      options.icon = "/icon-error.png";
      options.requireInteraction = true;
    }

    event.waitUntil(
      self.registration
        .showNotification(data.title, options)
        .then(() => {
          console.log("Notification shown successfully");
          // Track notification display
          return fetch("/api/notifications/track", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              notificationId: data.notificationId,
              action: "displayed",
              timestamp: new Date().toISOString(),
            }),
          }).catch((err) => console.warn("Failed to track notification:", err));
        })
        .catch((error) => {
          console.error("Error showing notification:", error);
        }),
    );
  } catch (error) {
    console.error("Error processing push event:", error);
  }
});

// Enhanced notification click handling
self.addEventListener("notificationclick", (event) => {
  console.log("Notification clicked:", event);

  event.notification.close();

  const data = event.notification.data || {};
  const action = event.action;

  // Track notification interaction
  const trackInteraction = fetch("/api/notifications/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      notificationId: data.notificationId,
      action: action || "clicked",
      timestamp: new Date().toISOString(),
    }),
  }).catch((err) => console.warn("Failed to track interaction:", err));

  if (action === "close") {
    // Just track and close
    event.waitUntil(trackInteraction);
    return;
  }

  // Determine the URL to open
  let urlToOpen = data.url || "/";

  // Add specific routing based on notification type
  if (data.type === "project" && data.projectId) {
    const userRole = data.userRole || "client";
    urlToOpen = `/${userRole}/dashboard?project=${data.projectId}`;
  } else if (data.type === "maintenance" && data.taskId) {
    urlToOpen = `/collaborator/dashboard?task=${data.taskId}`;
  }

  event.waitUntil(
    Promise.all([
      trackInteraction,
      clients
        .matchAll({
          type: "window",
          includeUncontrolled: true,
        })
        .then((clientList) => {
          // Check if the app is already open
          const existingClient = clientList.find(
            (client) =>
              client.url.includes(self.location.origin) && client.focused,
          );

          if (existingClient) {
            // Focus existing window and navigate
            return existingClient
              .focus()
              .then(() => {
                return existingClient.postMessage({
                  type: "NAVIGATE",
                  url: urlToOpen,
                  data: data,
                });
              })
              .catch(() => {
                // Fallback: open new window
                return clients.openWindow(urlToOpen);
              });
          } else {
            // Open new window
            return clients.openWindow(urlToOpen);
          }
        }),
    ]),
  );
});

// Handle notification close events
self.addEventListener("notificationclose", (event) => {
  console.log("Notification closed:", event);

  const data = event.notification.data || {};

  // Track notification dismissal
  event.waitUntil(
    fetch("/api/notifications/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        notificationId: data.notificationId,
        action: "dismissed",
        timestamp: new Date().toISOString(),
      }),
    }).catch((err) => console.warn("Failed to track dismissal:", err)),
  );
});

// Enhanced message handling including notifications
self.addEventListener("message", (event) => {
  const data = event.data;

  if (!data || !data.type) return;

  switch (data.type) {
    case "SKIP_WAITING":
      self.skipWaiting();
      break;

    case "CLEAN_CACHE":
      event.waitUntil(cleanOldCacheEntries());
      break;

    case "SHOW_NOTIFICATION":
      // Handle immediate notification display from the app
      event.waitUntil(
        self.registration
          .showNotification(data.notification.title, data.notification)
          .catch((error) => {
            console.error("Error showing notification from message:", error);
          }),
      );
      break;

    case "UPDATE_BADGE":
      // Update app badge with unread count
      if ("setAppBadge" in navigator) {
        navigator.setAppBadge(data.count || 0).catch((error) => {
          console.warn("Failed to update app badge:", error);
        });
      }
      break;

    case "NAVIGATE":
      // Handle navigation requests from notifications
      event.waitUntil(
        clients
          .matchAll({ type: "window" })
          .then((clientList) => {
            if (clientList.length > 0) {
              const client = clientList[0];
              client.focus();
              client.postMessage({
                type: "NAVIGATE_TO",
                url: data.url,
              });
            } else {
              clients.openWindow(data.url);
            }
          })
          .catch((error) => {
            console.error("Navigation error:", error);
          }),
      );
      break;

    case "SYNC_NOTIFICATIONS":
      // Sync notifications with server
      event.waitUntil(syncNotificationsWithServer());
      break;

    default:
      console.log("Unknown message type:", data.type);
  }
});

// Sync notifications with server when online
async function syncNotificationsWithServer() {
  try {
    // Get stored failed notifications
    const cache = await caches.open(DYNAMIC_CACHE);
    const failedNotifications = await cache.match("/failed-notifications");

    if (failedNotifications) {
      const notifications = await failedNotifications.json();

      // Retry sending each notification
      for (const notification of notifications) {
        try {
          const response = await fetch("/api/notifications/retry", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(notification),
          });

          if (response.ok) {
            console.log("Notification synced successfully");
          }
        } catch (error) {
          console.warn("Failed to sync notification:", error);
        }
      }

      // Clear successful syncs
      await cache.delete("/failed-notifications");
    }
  } catch (error) {
    console.error("Error syncing notifications:", error);
  }
}

async function cleanOldCacheEntries() {
  const cache = await caches.open(DYNAMIC_CACHE);
  const requests = await cache.keys();

  // Remove entries older than 24 hours
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

  const deletePromises = requests
    .filter(async (request) => {
      const response = await cache.match(request);
      const dateHeader = response?.headers.get("date");

      if (!dateHeader) return false;

      const responseDate = new Date(dateHeader).getTime();
      return responseDate < oneDayAgo;
    })
    .map((request) => cache.delete(request));

  await Promise.all(deletePromises);
  console.log(`Cleaned ${deletePromises.length} old cache entries`);
}
