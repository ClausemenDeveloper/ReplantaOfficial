import mongoose from "mongoose";
import bcryptjs from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Nome é obrigatório"],
      trim: true,
      maxlength: [100, "Nome não pode ter mais de 100 caracteres"],
    },
    email: {
      type: String,
      required: [true, "Email é obrigatório"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Por favor, insira um email válido",
      ],
    },
    password: {
      type: String,
      required: [true, "Senha é obrigatória"],
      minlength: [6, "Senha deve ter pelo menos 6 caracteres"],
      select: false, // Por padrão não incluir a senha nas consultas
    },
    role: {
      type: String,
      enum: ["client", "admin", "collaborator"],
      default: "client",
      required: true,
    },
    avatar: {
      type: String,
      default: null,
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[\d\s\-\(\)]+$/, "Por favor, insira um telefone válido"],
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: { type: String, default: "Portugal" },
    },
    preferences: {
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
      },
      language: { type: String, default: "pt" },
      theme: { type: String, enum: ["light", "dark"], default: "light" },
    },
    googleId: {
      type: String,
      sparse: true, // Permite valores únicos ou null
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    passwordResetToken: String,
    passwordResetExpires: Date,
    lastLogin: Date,
    isActive: {
      type: Boolean,
      default: true,
    },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: function () {
        // Admin users are auto-approved, others need approval
        return this.role === "admin" ? "approved" : "pending";
      },
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: Date,
    rejectedAt: Date,
    rejectionReason: String,
    registrationToken: {
      type: String,
      default: function () {
        return (
          Math.random().toString(36).substring(2, 15) +
          Math.random().toString(36).substring(2, 15)
        );
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.emailVerificationToken;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpires;
        delete ret.__v;
        return ret;
      },
    },
  },
);

// Índices
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ approvalStatus: 1 });
userSchema.index({ registrationToken: 1 }, { sparse: true });
userSchema.index({ googleId: 1 }, { sparse: true });

// Middleware para hash da senha antes de salvar
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcryptjs.genSalt(12);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para verificar senha
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcryptjs.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error("Erro ao verificar senha");
  }
};

// Método para obter dados públicos do usuário
userSchema.methods.getPublicProfile = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    avatar: this.avatar,
    phone: this.phone,
    preferences: this.preferences,
    emailVerified: this.emailVerified,
    lastLogin: this.lastLogin,
    approvalStatus: this.approvalStatus,
    approvedAt: this.approvedAt,
    createdAt: this.createdAt,
  };
};

// Métodos para gerenciar aprovação
userSchema.methods.approve = function (adminId) {
  this.approvalStatus = "approved";
  this.approvedBy = adminId;
  this.approvedAt = new Date();
  this.rejectedAt = undefined;
  this.rejectionReason = undefined;
  return this.save();
};

userSchema.methods.reject = function (adminId, reason = "Não especificado") {
  this.approvalStatus = "rejected";
  this.approvedBy = adminId;
  this.rejectedAt = new Date();
  this.rejectionReason = reason;
  this.approvedAt = undefined;
  return this.save();
};

// Método estático para encontrar por email
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Método estático para encontrar usuários ativos
userSchema.statics.findActive = function (filter = {}) {
  return this.find({ ...filter, isActive: true });
};

// Método estático para encontrar usuários por status de aprovação
userSchema.statics.findByApprovalStatus = function (status) {
  return this.find({ approvalStatus: status, isActive: true }).populate(
    "approvedBy",
    "name email",
  );
};

// Método estático para encontrar usuários pendentes de aprovação
userSchema.statics.findPendingApproval = function () {
  return this.find({
    approvalStatus: "pending",
    isActive: true,
    role: { $in: ["client", "collaborator"] },
  }).sort({ createdAt: -1 });
};

// Método estático para verificar se usuário pode fazer login
userSchema.statics.canLogin = function (email) {
  return this.findOne({
    email: email.toLowerCase(),
    isActive: true,
    $or: [
      { role: "admin" }, // Admin sempre pode entrar se estiver na DB
      {
        role: { $in: ["client", "collaborator"] },
        approvalStatus: "approved",
      },
    ],
  });
};

export default mongoose.model("User", userSchema);
