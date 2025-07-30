import express, { Request, Response, Express, Router } from "express";
import cors from "cors";
import mongoose from "mongoose";

// Interface para o serviço de banco de dados
export interface DatabaseService {
  connect: () => Promise<void>;
  healthCheck: () => Promise<{ status: string; message: string }>;
  getStatus: () => { status: string; message: string };
}

let databaseService: DatabaseService | null = null;
let authRoutes: Router | null = null;
let projectRoutes: Router | null = null;
let notificationRoutes: Router | null = null;
let userManagementRoutes: Router | null = null;

export async function createServer(): Promise<Express> {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Inicializa o MongoDB antes de configurar as rotas
  await initializeMongoDB();

  // Rotas básicas da API
  app.get("/api/ping", (_req: Request, res: Response) => {
    res.json({ message: "ReplantaSystem API v1.0 - Ready!" });
  });

  app.get("/api/health", async (_req: Request, res: Response) => {
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
        dbMessage = error instanceof Error ? error.message : "Unknown error";
      }
    }

    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: dbStatus,
      message: dbMessage,
    });
  });

  // Rotas do MongoDB com middleware
  if (authRoutes) app.use("/api/auth", authRoutes);
  if (projectRoutes) app.use("/api/projects", projectRoutes);
  if (notificationRoutes) app.use("/api/notifications", notificationRoutes);
  if (userManagementRoutes) app.use("/api/users", userManagementRoutes);

  return app;
}

async function initializeMongoDB(): Promise<void> {
  try {
    const { default: db } = await import("./config/database.js");
    databaseService = db as DatabaseService;

    if (!databaseService?.connect) {
      throw new Error("Database service is not initialized or connect method is undefined");
    }

    const connectionString = process.env.MONGODB_URI || "mongodb://localhost:27017/replantasystem";
    console.log("🔄 Conectando ao MongoDB...", connectionString);

    this.connection = await mongoose.connect(connectionString, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      maxPoolSize: 10,
      minPoolSize: 5,
      maxIdleTimeMS: 30000,
    });

    console.log("✅ MongoDB connected successfully");

    // Carrega as rotas
    const [
      { default: auth },
      { default: projects },
      { default: notifications },
      { default: userManagement },
    ] = await Promise.all([
      import("./routes/auth.js").catch(() => ({ default: null })),
      import("./routes/projects.js").catch(() => ({ default: null })),
      import("./routes/notifications.js").catch(() => ({ default: null })),
      import("./routes/userManagement.js").catch(() => ({ default: null })),
    ]);

    authRoutes = auth as Router | null;
    projectRoutes = projects as Router | null;
    notificationRoutes = notifications as Router | null;
    userManagementRoutes = userManagement as Router | null;

    if (!authRoutes || !projectRoutes || !notificationRoutes || !userManagementRoutes) {
      console.warn("⚠️ One or more routes failed to load, using fallback for missing routes");
    }

    console.log("✅ MongoDB routes loaded");

    await initializeAdminUser();
  } catch (error) {
    console.error("❌ MongoDB initialization failed:", error instanceof Error ? error.message : "Unknown error");
    console.log("🔄 Switching to fallback memory storage...");
    await initializeFallbackStorage();
  }
}

async function initializeFallbackStorage(): Promise<void> {
  try {
    const { default: memoryStore } = await import("./fallback/memoryStore.js");
    databaseService = memoryStore as DatabaseService;

    const [
      { default: fallbackAuth },
      { default: fallbackUserManagement },
    ] = await Promise.all([
      import("./routes/authFallback.js").catch(() => ({ default: null })),
      import("./routes/userManagementFallback.js").catch(() => ({ default: null })),
    ]);

    authRoutes = fallbackAuth as Router | null;
    userManagementRoutes = fallbackUserManagement as Router | null;

    // Rotas de fallback para projects e notifications
    const fallbackRouter = express.Router();
    fallbackRouter.use((_req, res) => {
      res.json({
        success: false,
        message: "Endpoint requires MongoDB connection",
      });
    });

    projectRoutes = projectRoutes || fallbackRouter;
    notificationRoutes = notificationRoutes || fallbackRouter;

    console.log("✅ Fallback memory storage initialized");
    console.log("⚠️ Note: Data will be lost when server restarts");
  } catch (error) {
    console.error("❌ Failed to initialize fallback storage:", error instanceof Error ? error.message : "Unknown error");
  }
}

async function initializeAdminUser(): Promise<void> {
  try {
    const { default: User } = await import("./models/User.js").catch(() => ({ default: null }));
    if (!User) {
      throw new Error("User model could not be loaded");
    }

    const adminEmail = process.env.ADMIN_EMAIL || "clausemenandredossantos@gmail.com";
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminName = process.env.ADMIN_NAME || "Clausemen André dos Santos";

    if (!adminPassword) {
      console.error("❌ ADMIN_PASSWORD environment variable is not set");
      console.error("Please set ADMIN_PASSWORD environment variable for security");
      return;
    }

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      const admin = new User({
        name: adminName,
        email: adminEmail,
        password: adminPassword,
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
    console.error("❌ Failed to create admin user:", error instanceof Error ? error.message : "Unknown error");
  }
}