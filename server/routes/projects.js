import express from "express";
import { body, param, validationResult } from "express-validator";
import Project from "../models/Project.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import databaseService from "../config/database.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// Middleware para verificar conexão com DB
const checkDatabaseConnection = async (req, res, next) => {
  if (!databaseService.isConnectedToDatabase()) {
    return res.status(503).json({
      success: false,
      message: "Serviço temporariamente indisponível",
      error: "Database not connected",
    });
  }
  next();
};

// Middleware para autenticação
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token não fornecido",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret_key");
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Token inválido",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Token inválido",
    });
  }
};

// Validações
const createProjectValidation = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage("Nome deve ter entre 2 e 200 caracteres"),
  body("description")
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage("Descrição deve ter entre 10 e 2000 caracteres"),
  body("type")
    .isIn([
      "landscaping",
      "garden_design",
      "maintenance",
      "installation",
      "consultation",
    ])
    .withMessage("Tipo de projeto inválido"),
  body("priority")
    .optional()
    .isIn(["low", "medium", "high", "urgent"])
    .withMessage("Prioridade inválida"),
];

// GET /api/projects - Listar projetos
router.get("/", checkDatabaseConnection, authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type, priority } = req.query;
    const skip = (page - 1) * limit;

    let filter = { isActive: true };

    // Filtros baseados no papel do usuário
    if (req.user.role === "client") {
      filter.client = req.user._id;
    } else if (req.user.role === "collaborator") {
      filter["collaborators.user"] = req.user._id;
    }
    // Admin pode ver todos os projetos

    // Filtros adicionais
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (priority) filter.priority = priority;

    const projects = await Project.find(filter)
      .populate("client", "name email")
      .populate("collaborators.user", "name email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Project.countDocuments(filter);

    res.json({
      success: true,
      data: {
        projects,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: projects.length,
          totalItems: total,
        },
      },
    });
  } catch (error) {
    console.error("Erro ao listar projetos:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  }
});

// GET /api/projects/:id - Obter projeto específico
router.get(
  "/:id",
  checkDatabaseConnection,
  authenticate,
  [param("id").isMongoId().withMessage("ID inválido")],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "ID inválido",
          errors: errors.array(),
        });
      }

      const project = await Project.findById(req.params.id)
        .populate("client", "name email phone")
        .populate("collaborators.user", "name email role avatar")
        .populate("tasks.assignedTo", "name email");

      if (!project || !project.isActive) {
        return res.status(404).json({
          success: false,
          message: "Projeto não encontrado",
        });
      }

      // Verificar permissões
      const hasPermission =
        req.user.role === "admin" ||
        project.client._id.toString() === req.user._id.toString() ||
        project.collaborators.some(
          (collab) => collab.user._id.toString() === req.user._id.toString(),
        );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: "Acesso negado",
        });
      }

      res.json({
        success: true,
        data: { project },
      });
    } catch (error) {
      console.error("Erro ao obter projeto:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  },
);

// POST /api/projects - Criar novo projeto
router.post(
  "/",
  checkDatabaseConnection,
  authenticate,
  createProjectValidation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Dados inválidos",
          errors: errors.array(),
        });
      }

      // Apenas admin pode criar projetos ou cliente pode criar para si mesmo
      let clientId = req.body.clientId || req.user._id;

      if (req.user.role === "client") {
        clientId = req.user._id;
      } else if (req.user.role === "collaborator") {
        return res.status(403).json({
          success: false,
          message: "Colaboradores não podem criar projetos",
        });
      }

      const projectData = {
        ...req.body,
        client: clientId,
      };

      const project = new Project(projectData);
      await project.save();

      // Notificar cliente se criado por admin
      if (req.user.role === "admin" && clientId !== req.user._id) {
        await Notification.createProjectNotification(
          clientId,
          project._id,
          "project_update",
          "Novo Projeto Criado",
          `O projeto "${project.name}" foi criado para você.`,
        );
      }

      const populatedProject = await Project.findById(project._id)
        .populate("client", "name email")
        .populate("collaborators.user", "name email role");

      res.status(201).json({
        success: true,
        message: "Projeto criado com sucesso",
        data: { project: populatedProject },
      });
    } catch (error) {
      console.error("Erro ao criar projeto:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        error: error.message,
      });
    }
  },
);

// PUT /api/projects/:id - Atualizar projeto
router.put(
  "/:id",
  checkDatabaseConnection,
  authenticate,
  [param("id").isMongoId().withMessage("ID inválido")],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "ID inválido",
          errors: errors.array(),
        });
      }

      const project = await Project.findById(req.params.id);
      if (!project || !project.isActive) {
        return res.status(404).json({
          success: false,
          message: "Projeto não encontrado",
        });
      }

      // Verificar permissões
      const canEdit =
        req.user.role === "admin" ||
        project.collaborators.some(
          (collab) =>
            collab.user.toString() === req.user._id.toString() &&
            ["lead", "designer"].includes(collab.role),
        );

      if (!canEdit) {
        return res.status(403).json({
          success: false,
          message: "Sem permissão para editar este projeto",
        });
      }

      // Campos que podem ser atualizados
      const allowedUpdates = [
        "name",
        "description",
        "status",
        "priority",
        "location",
        "budget",
        "timeline",
        "progress",
      ];

      const updates = {};
      allowedUpdates.forEach((field) => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });

      const updatedProject = await Project.findByIdAndUpdate(
        req.params.id,
        updates,
        { new: true, runValidators: true },
      )
        .populate("client", "name email")
        .populate("collaborators.user", "name email role");

      // Notificar sobre mudanças importantes
      if (updates.status && updates.status !== project.status) {
        await Notification.createProjectNotification(
          project.client,
          project._id,
          "project_update",
          "Status do Projeto Atualizado",
          `O projeto "${project.name}" agora está ${updates.status}.`,
        );
      }

      res.json({
        success: true,
        message: "Projeto atualizado com sucesso",
        data: { project: updatedProject },
      });
    } catch (error) {
      console.error("Erro ao atualizar projeto:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  },
);

// POST /api/projects/:id/collaborators - Adicionar colaborador
router.post(
  "/:id/collaborators",
  checkDatabaseConnection,
  authenticate,
  [
    param("id").isMongoId().withMessage("ID inválido"),
    body("userId").isMongoId().withMessage("ID do usuário inválido"),
    body("role")
      .isIn(["lead", "designer", "maintenance", "consultant"])
      .withMessage("Papel inválido"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Dados inválidos",
          errors: errors.array(),
        });
      }

      if (req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Apenas administradores podem adicionar colaboradores",
        });
      }

      const project = await Project.findById(req.params.id);
      if (!project || !project.isActive) {
        return res.status(404).json({
          success: false,
          message: "Projeto não encontrado",
        });
      }

      const user = await User.findById(req.body.userId);
      if (!user || user.role !== "collaborator") {
        return res.status(400).json({
          success: false,
          message: "Usuário inválido ou não é colaborador",
        });
      }

      await project.addCollaborator(req.body.userId, req.body.role);

      // Notificar o colaborador
      await Notification.createProjectNotification(
        req.body.userId,
        project._id,
        "task_assigned",
        "Projeto Atribuído",
        `Você foi adicionado ao projeto "${project.name}" como ${req.body.role}.`,
      );

      const updatedProject = await Project.findById(req.params.id)
        .populate("client", "name email")
        .populate("collaborators.user", "name email role");

      res.json({
        success: true,
        message: "Colaborador adicionado com sucesso",
        data: { project: updatedProject },
      });
    } catch (error) {
      console.error("Erro ao adicionar colaborador:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  },
);

// GET /api/projects/dashboard/stats - Estatísticas do dashboard
router.get(
  "/dashboard/stats",
  checkDatabaseConnection,
  authenticate,
  async (req, res) => {
    try {
      let filter = { isActive: true };

      // Filtrar baseado no papel
      if (req.user.role === "client") {
        filter.client = req.user._id;
      } else if (req.user.role === "collaborator") {
        filter["collaborators.user"] = req.user._id;
      }

      const stats = await Project.aggregate([
        { $match: filter },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            avgProgress: { $avg: "$progress" },
          },
        },
      ]);

      const total = await Project.countDocuments(filter);
      const recentProjects = await Project.find(filter)
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("client", "name")
        .select("name status priority createdAt");

      res.json({
        success: true,
        data: {
          total,
          byStatus: stats,
          recent: recentProjects,
        },
      });
    } catch (error) {
      console.error("Erro nas estatísticas:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  },
);

export default router;
