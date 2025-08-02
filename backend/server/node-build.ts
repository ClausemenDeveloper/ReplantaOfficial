import path from "path";
import { createServer } from "./index";
import express, { Express, Request, Response } from "express";
import { fileURLToPath } from "url";

const app: Express = createServer();
const port = Number(process.env.PORT) || 3000;

// CommonJS __dirname workaround
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, "../spa");

// Serve static files
app.use(express.static(distPath));

// Handle React Router - serve index.html for all non-API routes
app.get("*", (req: Request, res: Response) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith("/api/") || req.path.startsWith("/health")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }
  res.sendFile(path.join(distPath, "index.html"));
});

const server = app.listen(port, () => {
  console.log(`🚀 Fusion Starter server running on port ${port}`);
  console.log(`📱 Frontend: http://localhost:${port}`);
  console.log(`🔧 API: http://localhost:${port}/api`);
});

// Graceful shutdown
function shutdown(signal: string) {
  console.log(`🛑 Received ${signal}, shutting down gracefully`);
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
