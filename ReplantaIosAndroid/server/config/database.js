import mongoose from "mongoose";

class DatabaseService {
  constructor() {
    this.connection = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      if (this.isConnected) {
        console.log("✅ Database já conectada");
        return this.connection;
      }

      const connectionString =
        process.env.DB_CONNECTION_STRING ||
        "mongodb://localhost:27017/replantasystem";

      console.log("🔄 Conectando ao MongoDB...");

      this.connection = await mongoose.connect(connectionString, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
        maxPoolSize: 10,
        minPoolSize: 5,
        maxIdleTimeMS: 30000,
      });

      this.isConnected = true;
      console.log("✅ MongoDB conectado com sucesso");

      // Event listeners
      mongoose.connection.on("error", (error) => {
        console.error("❌ Erro na conexão MongoDB:", error);
        this.isConnected = false;
      });

      mongoose.connection.on("disconnected", () => {
        console.log("⚠️  MongoDB desconectado");
        this.isConnected = false;
      });

      mongoose.connection.on("reconnected", () => {
        console.log("🔄 MongoDB reconectado");
        this.isConnected = true;
      });

      return this.connection;
    } catch (error) {
      console.error("❌ Erro ao conectar com MongoDB:", error.message);
      this.isConnected = false;
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.connection && this.isConnected) {
        await mongoose.disconnect();
        this.isConnected = false;
        console.log("✅ MongoDB desconectado");
      }
    } catch (error) {
      console.error("❌ Erro ao desconectar MongoDB:", error.message);
      throw error;
    }
  }

  getConnection() {
    return this.connection;
  }

  isConnectedToDatabase() {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  async healthCheck() {
    try {
      if (!this.isConnectedToDatabase()) {
        return {
          status: "disconnected",
          message: "Não conectado ao banco de dados",
        };
      }

      // Teste simples de ping
      await mongoose.connection.db.admin().ping();

      return {
        status: "connected",
        message: "Banco de dados funcionando corretamente",
        database: mongoose.connection.db.databaseName,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
      };
    } catch (error) {
      return {
        status: "error",
        message: error.message,
      };
    }
  }
}

// Instância singleton
const databaseService = new DatabaseService();

export default databaseService;
