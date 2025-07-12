import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";

// Dynamic imports for MongoDB routes to avoid startup issues
let databaseService: any = null;
let authRoutes: any = null;
let projectRoutes: any = null;
let notificationRoutes: any = null;
let userManagementRoutes: any = null;

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Initialize MongoDB connection
  initializeMongoDB();

  // Basic API routes
  app.get("/api/ping", (_req, res) => {
    res.json({ message: "ReplantaSystem API v1.0 - Ready!" });
  });

  app.get("/api/health", async (_req, res) => {
    let dbStatus = "disconnected";
    let dbMessage = "No database connection";

    if (databaseService) {
      try {
        if (databaseService.healthCheck) {
          const dbHealth = await databaseService.healthCheck();
          dbStatus = dbHealth.status;
          dbMessage = dbHealth.message;
        } else if (databaseService.getStatus) {
          const status = databaseService.getStatus();
          dbStatus = status.status;
          dbMessage = status.message;
        } else {
          dbStatus = "connected";
          dbMessage = "Database service available";
        }
      } catch (error) {
        dbStatus = "error";
        dbMessage = error.message;
      }
    }

    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: dbStatus,
      message: dbMessage,
    });
  });

  app.get("/api/demo", handleDemo);

  // MongoDB routes (loaded dynamically)
  app.use("/api/auth", (req, res, next) => {
    if (authRoutes) {
      authRoutes(req, res, next);
    } else {
      res.status(503).json({
        success: false,
        message: "Database not ready",
      });
    }
  });

  app.use("/api/projects", (req, res, next) => {
    if (projectRoutes) {
      projectRoutes(req, res, next);
    } else {
      res.status(503).json({
        success: false,
        message: "Database not ready",
      });
    }
  });

  app.use("/api/notifications", (req, res, next) => {
    if (notificationRoutes) {
      notificationRoutes(req, res, next);
    } else {
      res.status(503).json({
        success: false,
        message: "Database not ready",
      });
    }
  });

  app.use("/api/users", (req, res, next) => {
    if (userManagementRoutes) {
      userManagementRoutes(req, res, next);
    } else {
      res.status(503).json({
        success: false,
        message: "Database not ready",
      });
    }
  });

  return app;
}

async function initializeMongoDB() {
  try {
    // Dynamic import to prevent startup issues
    const { default: db } = await import("./config/database.js");
    databaseService = db;

    // Connect to MongoDB
    await databaseService.connect();
    console.log("✅ MongoDB connected successfully");

    // Load routes after successful connection
    const { default: auth } = await import("./routes/auth.js");
    const { default: projects } = await import("./routes/projects.js");
    const { default: notifications } = await import(
      "./routes/notifications.js"
    );
    const { default: userManagement } = await import(
      "./routes/userManagement.js"
    );

    authRoutes = auth;
    projectRoutes = projects;
    notificationRoutes = notifications;
    userManagementRoutes = userManagement;

    console.log("✅ MongoDB routes loaded");

    // Initialize admin user
    await initializeAdminUser();
  } catch (error) {
    console.error("❌ MongoDB initialization failed:", error.message);
    console.log("🔄 Switching to fallback memory storage...");

    // Use fallback memory storage
    await initializeFallbackStorage();
  }
}

async function initializeFallbackStorage() {
  try {
    // Load fallback memory store
    const { default: memoryStore } = await import("./fallback/memoryStore.js");
    databaseService = memoryStore;

    // Load fallback auth routes
    const { default: fallbackAuth } = await import("./routes/authFallback.js");
    const { default: fallbackUserManagement } = await import(
      "./routes/userManagementFallback.js"
    );

    authRoutes = fallbackAuth;
    userManagementRoutes = fallbackUserManagement;

    // Simple project and notification routes for fallback
    projectRoutes = (req, res, next) => {
      res.json({
        success: false,
        message: "Projects require MongoDB connection",
      });
    };
    notificationRoutes = (req, res, next) => {
      res.json({
        success: false,
        message: "Notifications require MongoDB connection",
      });
    };

    console.log("✅ Fallback memory storage initialized");
    console.log("⚠️  Note: Data will be lost when server restarts");
  } catch (error) {
    console.error("❌ Failed to initialize fallback storage:", error.message);
  }
}

async function initializeAdminUser() {
  try {
    const { default: User } = await import("./models/User.js");

    const adminEmail = "clausemenandredossantos@gmail.com";
    const existingAdmin = await User.findByEmail(adminEmail);

    if (!existingAdmin) {
      const admin = new User({
        name: "Clausemen André dos Santos",
        email: adminEmail,
        password: "@Venus0777",
        role: "admin",
        emailVerified: true,
        isActive: true,
      });

      await admin.save();
      console.log("✅ Admin user created successfully");
    } else {
      console.log("✅ Admin user already exists");
    }
  } catch (error) {
    console.error("❌ Failed to create admin user:", error.message);
  }
}
