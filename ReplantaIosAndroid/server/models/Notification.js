import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Destinatário é obrigatório"],
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    type: {
      type: String,
      enum: [
        "project_update",
        "task_assigned",
        "task_completed",
        "maintenance_reminder",
        "system_alert",
        "welcome",
        "password_reset",
        "email_verification",
        "payment_reminder",
        "weather_alert",
      ],
      required: [true, "Tipo de notificação é obrigatório"],
    },
    title: {
      type: String,
      required: [true, "Título é obrigatório"],
      trim: true,
      maxlength: [200, "Título não pode ter mais de 200 caracteres"],
    },
    message: {
      type: String,
      required: [true, "Mensagem é obrigatória"],
      maxlength: [1000, "Mensagem não pode ter mais de 1000 caracteres"],
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    channels: {
      push: {
        sent: { type: Boolean, default: false },
        sentAt: Date,
        error: String,
      },
      email: {
        sent: { type: Boolean, default: false },
        sentAt: Date,
        error: String,
      },
      sms: {
        sent: { type: Boolean, default: false },
        sentAt: Date,
        error: String,
      },
    },
    status: {
      type: String,
      enum: ["pending", "sent", "delivered", "read", "failed"],
      default: "pending",
    },
    readAt: Date,
    expiresAt: Date,
    relatedProject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },
    relatedTask: String, // ID da tarefa dentro do projeto
    actionUrl: String,
    actionLabel: String,
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
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ status: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
notificationSchema.index({ relatedProject: 1 });
notificationSchema.index({ priority: 1 });

// Middleware para definir expiração padrão
notificationSchema.pre("save", function (next) {
  if (!this.expiresAt) {
    // Notificações expiram em 30 dias por padrão
    this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }
  next();
});

// Métodos do schema
notificationSchema.methods.markAsRead = function () {
  if (this.status !== "read") {
    this.status = "read";
    this.readAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

notificationSchema.methods.markAsSent = function (channel) {
  if (this.channels[channel]) {
    this.channels[channel].sent = true;
    this.channels[channel].sentAt = new Date();

    // Atualizar status geral se foi enviado por qualquer canal
    if (this.status === "pending") {
      this.status = "sent";
    }
  }
  return this.save();
};

notificationSchema.methods.markAsDelivered = function () {
  this.status = "delivered";
  return this.save();
};

notificationSchema.methods.markAsFailed = function (channel, error) {
  if (this.channels[channel]) {
    this.channels[channel].error = error;
  }
  this.status = "failed";
  return this.save();
};

// Métodos estáticos
notificationSchema.statics.findUnreadByUser = function (userId) {
  return this.find({
    recipient: userId,
    status: { $ne: "read" },
    isActive: true,
  })
    .sort({ createdAt: -1 })
    .populate("sender", "name avatar")
    .populate("relatedProject", "name status");
};

notificationSchema.statics.findByUser = function (userId, limit = 50) {
  return this.find({
    recipient: userId,
    isActive: true,
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("sender", "name avatar")
    .populate("relatedProject", "name status");
};

notificationSchema.statics.findPendingToSend = function () {
  return this.find({
    status: "pending",
    isActive: true,
    $or: [
      { "channels.push.sent": false },
      { "channels.email.sent": false },
      { "channels.sms.sent": false },
    ],
  }).populate("recipient", "preferences email phone");
};

notificationSchema.statics.createProjectNotification = function (
  recipientId,
  projectId,
  type,
  title,
  message,
  data = {},
) {
  return this.create({
    recipient: recipientId,
    type,
    title,
    message,
    data,
    relatedProject: projectId,
    priority: type.includes("urgent") ? "urgent" : "medium",
  });
};

notificationSchema.statics.createSystemNotification = function (
  recipientId,
  title,
  message,
  priority = "medium",
) {
  return this.create({
    recipient: recipientId,
    type: "system_alert",
    title,
    message,
    priority,
  });
};

notificationSchema.statics.markAllAsReadByUser = function (userId) {
  return this.updateMany(
    {
      recipient: userId,
      status: { $ne: "read" },
      isActive: true,
    },
    {
      status: "read",
      readAt: new Date(),
    },
  );
};

export default mongoose.model("Notification", notificationSchema);
