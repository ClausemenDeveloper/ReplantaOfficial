import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Nome do projeto é obrigatório"],
      trim: true,
      maxlength: [200, "Nome não pode ter mais de 200 caracteres"],
    },
    description: {
      type: String,
      required: [true, "Descrição é obrigatória"],
      maxlength: [2000, "Descrição não pode ter mais de 2000 caracteres"],
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Cliente é obrigatório"],
    },
    collaborators: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        role: {
          type: String,
          enum: ["lead", "designer", "maintenance", "consultant"],
          default: "maintenance",
        },
        assignedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    status: {
      type: String,
      enum: ["planning", "in_progress", "completed", "on_hold", "cancelled"],
      default: "planning",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    type: {
      type: String,
      enum: [
        "landscaping",
        "garden_design",
        "maintenance",
        "installation",
        "consultation",
      ],
      required: [true, "Tipo de projeto é obrigatório"],
    },
    location: {
      address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: { type: String, default: "Portugal" },
      },
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    budget: {
      estimated: {
        type: Number,
        min: 0,
      },
      actual: {
        type: Number,
        min: 0,
      },
      currency: {
        type: String,
        default: "EUR",
      },
    },
    timeline: {
      startDate: Date,
      endDate: Date,
      estimatedDuration: Number, // em dias
    },
    materials: [
      {
        name: String,
        quantity: Number,
        unit: String,
        pricePerUnit: Number,
        supplier: String,
        status: {
          type: String,
          enum: ["pending", "ordered", "delivered", "installed"],
          default: "pending",
        },
      },
    ],
    tasks: [
      {
        name: String,
        description: String,
        assignedTo: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        status: {
          type: String,
          enum: ["pending", "in_progress", "completed"],
          default: "pending",
        },
        priority: {
          type: String,
          enum: ["low", "medium", "high"],
          default: "medium",
        },
        dueDate: Date,
        completedAt: Date,
      },
    ],
    images: [
      {
        url: String,
        description: String,
        type: {
          type: String,
          enum: ["before", "progress", "after", "plan"],
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    notes: [
      {
        content: String,
        author: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        isPrivate: {
          type: Boolean,
          default: false,
        },
      },
    ],
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  },
);

// Índices
projectSchema.index({ client: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ priority: 1 });
projectSchema.index({ type: 1 });
projectSchema.index({ "collaborators.user": 1 });
projectSchema.index({ "location.coordinates": "2dsphere" });
projectSchema.index({ createdAt: -1 });

// Middleware para atualizar progresso automaticamente
projectSchema.pre("save", function (next) {
  if (this.tasks && this.tasks.length > 0) {
    const completedTasks = this.tasks.filter(
      (task) => task.status === "completed",
    ).length;
    this.progress = Math.round((completedTasks / this.tasks.length) * 100);
  }
  next();
});

// Métodos do schema

// Adiciona colaborador ao projeto, evitando duplicidade
projectSchema.methods.addCollaborator = function (userId, role = "maintenance") {
  if (!userId) return Promise.reject(new Error("userId é obrigatório"));
  const exists = this.collaborators.some(
    (collab) => collab.user.toString() === userId.toString()
  );
  if (!exists) {
    this.collaborators.push({
      user: userId,
      role,
      assignedAt: new Date(),
    });
    return this.save();
  }
  return Promise.resolve(this);
};


// Remove colaborador do projeto
projectSchema.methods.removeCollaborator = function (userId) {
  if (!userId) return Promise.reject(new Error("userId é obrigatório"));
  this.collaborators = this.collaborators.filter(
    (collab) => collab.user.toString() !== userId.toString()
  );
  return this.save();
};


// Adiciona uma tarefa ao projeto
projectSchema.methods.addTask = function (taskData) {
  if (!taskData || !taskData.name) return Promise.reject(new Error("Dados da tarefa inválidos"));
  this.tasks.push(taskData);
  return this.save();
};


// Atualiza o status de uma tarefa
projectSchema.methods.updateTaskStatus = function (taskId, status) {
  if (!taskId || !status) return Promise.reject(new Error("taskId e status são obrigatórios"));
  const task = this.tasks.find((t) => t._id && t._id.toString() === taskId.toString());
  if (task) {
    task.status = status;
    if (status === "completed") {
      task.completedAt = new Date();
    }
    return this.save();
  }
  return Promise.reject(new Error("Tarefa não encontrada"));
};

// Métodos estáticos
projectSchema.statics.findByClient = function (clientId) {
  return this.find({ client: clientId, isActive: true })
    .populate("client", "name email")
    .populate("collaborators.user", "name email role");
};

projectSchema.statics.findByCollaborator = function (collaboratorId) {
  return this.find({
    "collaborators.user": collaboratorId,
    isActive: true,
  })
    .populate("client", "name email")
    .populate("collaborators.user", "name email role");
};

projectSchema.statics.findByStatus = function (status) {
  return this.find({ status, isActive: true })
    .populate("client", "name email")
    .populate("collaborators.user", "name email role");
};

export default mongoose.model("Project", projectSchema);
