import mongoose from "mongoose";
import User from "./models/User.js";

async function createAdmin() {
  try {
    if (!process.env.DB_CONNECTION_STRING) {
      throw new Error("DB_CONNECTION_STRING não está definida nas variáveis de ambiente.");
    }
    await mongoose.connect(process.env.DB_CONNECTION_STRING);

    const adminEmail = process.env.ADMIN_EMAIL || "admin@replantasystem.com";
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      throw new Error("ADMIN_PASSWORD não está definida nas variáveis de ambiente.");
    }

    const adminExists = await User.findOne({ role: "admin" });
    if (!adminExists) {
      const admin = new User({
        name: process.env.ADMIN_NAME || "Admin Inicial",
        email: adminEmail,
        password: adminPassword,
        role: "admin",
        approvalStatus: "approved",
      });
      await admin.save();
      console.log("✅ Administrador inicial criado com sucesso!");
    } else {
      console.log("ℹ️ Administrador já existe.");
    }
  } catch (error) {
    console.error("❌ Erro ao criar administrador inicial:", error instanceof Error ? error.message : error);
  } finally {
    await mongoose.disconnect();
  }
}

createAdmin();