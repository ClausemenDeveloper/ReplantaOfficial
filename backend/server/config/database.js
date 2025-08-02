import mongoose from "mongoose";

// Conexão padrão local

class DatabaseService {
  connection = null;
  isConnected = false;
  _listenersAdded = false;

  async connect() {
    try {
      if (this.isConnected && mongoose.connection.readyState === 1) {
        console.log("✅ Database já conectada");
        return this.connection;
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
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      this.isConnected = true;
      console.log("✅ MongoDB conectado com sucesso");

      // Event listeners (add only once)
      if (!this._listenersAdded) {
        mongoose.connection.on("error", (error) => {
          console.error("❌ Erro na conexão MongoDB:", error instanceof Error ? error.message : error);
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

        this._listenersAdded = true;
      }

      return this.connection;
    } catch (error) {
      console.error("❌ Erro ao conectar com MongoDB:", error instanceof Error ? error.message : error);
      this.isConnected = false;
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.isConnected && mongoose.connection.readyState === 1) {
        await mongoose.disconnect();
        this.isConnected = false;
        console.log("✅ MongoDB desconectado");
      }
    } catch (error) {
      console.error("❌ Erro ao desconectar MongoDB:", error instanceof Error ? error.message : error);
      throw error;
    }
  }

  getConnection() {
    return mongoose.connection;
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
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }

  getStatus() {
    // Método compatível com interface DatabaseService
    if (this.isConnectedToDatabase()) {
      return {
        status: "connected",
        message: "Banco de dados funcionando corretamente",
      };
    } else {
      return {
        status: "disconnected",
        message: "Não conectado ao banco de dados",
      };
    }
  }
}

const databaseService = new DatabaseService();
export default databaseService;
