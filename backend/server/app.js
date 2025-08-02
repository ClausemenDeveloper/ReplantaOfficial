import express from "express";
import cors from "cors";
import { createServer } from "./index"; // Importa a função createServer do index.ts

// Cria o aplicativo Express
const app = createServer();

// Middleware adicional (se necessário)
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas básicas (se necessário)
app.get("/", (_req, res) => {
  res.send("Bem-vindo à API do ReplantaSystem!");
});

// Exporta o aplicativo para uso em testes e inicialização do servidor
export default app;