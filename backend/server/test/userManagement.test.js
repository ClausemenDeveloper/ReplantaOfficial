beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await User.deleteMany({});
});

import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../app.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

describe("Promoção de Colaboradores", () => {
  it("Deve promover um colaborador a administrador", async () => {
    // Crie um colaborador
    const collaborator = await User.create({
      name: "Colaborador Teste",
      email: "colaborador@teste.com",
      password: "senha123",
      role: "collaborator",
      isActive: true,
    });

    // Crie um admin
    const admin = await User.create({
      name: "Admin Teste",
      email: "admin@teste.com",
      password: "senha123",
      role: "admin",
      isActive: true,
    });

    // Gere token válido de admin
    const adminToken = jwt.sign({ userId: admin._id }, process.env.JWT_SECRET || "test_secret", { expiresIn: "1h" });

    // Promova o colaborador
    const res = await request(app)
      .post(`/api/users/${collaborator._id}/promote`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body.data).toHaveProperty("role", "admin");
  });
});

describe("Restrições de Acesso", () => {
  it("Deve impedir que um colaborador promova outro usuário", async () => {
    // Crie um colaborador
    const collaborator = await User.create({
      name: "Colaborador Teste",
      email: "colaborador@teste.com",
      password: "senha123",
      role: "collaborator",
      isActive: true,
    });

    // Gere token válido de colaborador
    const collaboratorToken = jwt.sign({ userId: collaborator._id }, process.env.JWT_SECRET || "test_secret", { expiresIn: "1h" });

    // Tente promover outro usuário como colaborador
    const res = await request(app)
      .post(`/api/users/${collaborator._id}/promote`)
      .set("Authorization", `Bearer ${collaboratorToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty("success", false);
    expect(res.body).toHaveProperty("message");
  });
});

describe("Restrições de Acesso", () => {
  it("Deve impedir que um colaborador promova outro usuário", async () => {
    // Crie um colaborador
    const collaborator = await User.create({
      name: "Colaborador Teste",
      email: "colaborador@teste.com",
      password: "senha123",
      role: "collaborator",
      isActive: true,
    });

    // Gere token válido de colaborador
    const collaboratorToken = jwt.sign({ userId: collaborator._id }, process.env.JWT_SECRET || "test_secret", { expiresIn: "1h" });

    // Tente promover outro usuário como colaborador
    const res = await request(app)
      .post(`/api/users/${collaborator._id}/promote`)
      .set("Authorization", `Bearer ${collaboratorToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty("success", false);
    expect(res.body).toHaveProperty("message");
  });
});