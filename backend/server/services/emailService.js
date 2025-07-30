// Email Notification Service for ReplantaSystem
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const handlebars = require("handlebars");
const { validateInput } = require("../middleware/security");

class EmailService {
  constructor() {
    this.transporter = null;
    this.templates = new Map();
    this.initializeTransporter();
    this.loadEmailTemplates();
  }

  // ===============================
  // TRANSPORTER SETUP
  // ===============================

  initializeTransporter() {
    const emailConfig = {
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        // Em produção, esta opção DEVE ser true.
        rejectUnauthorized: process.env.NODE_ENV === 'development' ? false : true,
      },
    };

    // Support for different email providers
    if (process.env.EMAIL_PROVIDER === "sendgrid") {
      emailConfig.host = "smtp.sendgrid.net";
      emailConfig.port = 587;
      emailConfig.auth = {
        user: "apikey",
        pass: process.env.SENDGRID_API_KEY,
      };
    } else if (process.env.EMAIL_PROVIDER === "mailgun") {
      emailConfig.host = "smtp.mailgun.org";
      emailConfig.port = 587;
      emailConfig.auth = {
        user: process.env.MAILGUN_USERNAME,
        pass: process.env.MAILGUN_PASSWORD,
      };
    }

    try {
      this.transporter = nodemailer.createTransport(emailConfig);

      // Verify connection
      this.transporter.verify((error, success) => {
        if (error) {
          console.error("Email transporter verification failed:", error);
        } else {
          console.log("Email server is ready to take our messages");
        }
      });
    } catch (error) {
      console.error("Failed to initialize email transporter:", error);
    }
  }

  // ===============================
  // EMAIL TEMPLATES
  // ===============================

  loadEmailTemplates() {
    const templatesDir = path.join(__dirname, "../templates/email");

    // Ensure templates directory exists
    if (!fs.existsSync(templatesDir)) {
      fs.mkdirSync(templatesDir, { recursive: true });
    }

    // Carrega dinamicamente todos os ficheiros .hbs do diretório de templates.
    // Isto torna a adição de novos templates mais fácil, sem precisar de alterar o código.
    const templateFiles = fs.readdirSync(templatesDir).filter(file => file.endsWith('.hbs'));

    templateFiles.forEach((file) => {
      const templatePath = path.join(templatesDir, file);
      const templateName = path.basename(file, ".hbs");

      try {
        if (fs.existsSync(templatePath)) {
          const templateContent = fs.readFileSync(templatePath, "utf8");
          const compiledTemplate = handlebars.compile(templateContent);
          this.templates.set(templateName, compiledTemplate);
        } else {
          // Create default template if it doesn't exist
          this.createDefaultTemplate(templateName, templatePath);
        }
      } catch (error) {
        console.error(`Error loading template ${templateName}:`, error);
      }
    });

    console.log(`Loaded ${this.templates.size} email templates`);
  }

  createDefaultTemplate(templateName, templatePath) {
    let defaultContent = "";

    switch (templateName) {
      case "welcome":
        defaultContent = this.getWelcomeTemplate();
        break;
      case "project_update":
        defaultContent = this.getProjectUpdateTemplate();
        break;
      case "project_completion":
        defaultContent = this.getProjectCompletionTemplate();
        break;
      case "maintenance_reminder":
        defaultContent = this.getMaintenanceReminderTemplate();
        break;
      case "payment_reminder":
        defaultContent = this.getPaymentReminderTemplate();
        break;
      case "password_reset":
        defaultContent = this.getPasswordResetTemplate();
        break;
      case "account_activation":
        defaultContent = this.getAccountActivationTemplate();
        break;
      case "weekly_report":
        defaultContent = this.getWeeklyReportTemplate();
        break;
      case "userApproved":
        defaultContent = this.getUserApprovedTemplate();
        break;
      case "userRejected":
        defaultContent = this.getUserRejectedTemplate();
        break;
      default:
        defaultContent = this.getGenericTemplate();
    }

    try {
      fs.writeFileSync(templatePath, defaultContent);
      const compiledTemplate = handlebars.compile(defaultContent);
      this.templates.set(templateName, compiledTemplate);
      console.log(`Created default template: ${templateName}`);
    } catch (error) {
      console.error(`Error creating default template ${templateName}:`, error);
    }
  }

  // ===============================
  // CORE EMAIL SENDING
  // ===============================

  async sendEmail(emailData) {
    try {
      // Validate email data
      if (!validateInput(emailData.to, "email")) {
        throw new Error("Invalid recipient email address");
      }

      if (!emailData.subject || !emailData.template) {
        throw new Error("Missing required email data");
      }

      // Get template
      const template = this.templates.get(emailData.template);
      if (!template) {
        throw new Error(`Template '${emailData.template}' not found`);
      }

      // Compile email content
      const htmlContent = template({
        ...emailData.data,
        currentYear: new Date().getFullYear(),
        companyName: "ReplantaSystem",
        supportEmail: process.env.SUPPORT_EMAIL || "suporte@replantasystem.com",
        websiteUrl: process.env.WEBSITE_URL || "https://replantasystem.com",
      });

      // Create text version (strip HTML)
      const textContent = htmlContent.replace(/<[^>]*>/g, "");

      // Email options
      const mailOptions = {
        from: {
          name: "ReplantaSystem",
          address: process.env.SMTP_USER || "noreply@replantasystem.com",
        },
        to: emailData.to,
        subject: emailData.subject,
        text: textContent,
        html: htmlContent,
        priority: emailData.priority || "normal",
        headers: {
          "X-Entity-ID": `replanta-${Date.now()}`,
          "X-Template": emailData.template,
        },
      };

      // Handle scheduled emails
      if (emailData.sendAt && new Date(emailData.sendAt) > new Date()) {
        return this.scheduleEmail(mailOptions, emailData.sendAt);
      }

      // Send immediately
      const result = await this.transporter.sendMail(mailOptions);

      console.log("Email sent successfully:", {
        messageId: result.messageId,
        to: emailData.to,
        template: emailData.template,
      });

      return {
        success: true,
        messageId: result.messageId,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error sending email:", error);

      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async scheduleEmail(mailOptions, sendAt) {
    // Simple scheduling - in production, use a job queue like Bull or Agenda
    const delay = new Date(sendAt).getTime() - Date.now();

    if (delay <= 0) {
      return this.transporter.sendMail(mailOptions);
    }

    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        try {
          const result = await this.transporter.sendMail(mailOptions);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  }

  // ===============================
  // BATCH EMAIL SENDING
  // ===============================

  async sendBulkEmails(emailList) {
    const results = [];
    const batchSize = 10; // Send in batches to avoid rate limits

    for (let i = 0; i < emailList.length; i += batchSize) {
      const batch = emailList.slice(i, i + batchSize);
      const batchPromises = batch.map((emailData) => this.sendEmail(emailData));

      try {
        const batchResults = await Promise.allSettled(batchPromises);
        results.push(...batchResults);

        // Add delay between batches
        if (i + batchSize < emailList.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error("Error in batch email sending:", error);
      }
    }

    return results;
  }

  // ===============================
  // PREDEFINED EMAIL FUNCTIONS
  // ===============================

  async sendWelcomeEmail(userEmail, userName, userRole) {
    return this.sendEmail({
      to: userEmail,
      subject: "Bem-vindo ao ReplantaSystem! 🌱",
      template: "welcome",
      priority: "normal",
      data: {
        userName,
        userRole,
        loginUrl: `${process.env.WEBSITE_URL}/select-interface`,
      },
    });
  }

  async sendProjectUpdateEmail(
    clientEmail,
    projectName,
    status,
    collaboratorName,
    projectUrl,
  ) {
    const statusMessages = {
      started: "foi iniciado",
      progress: "teve progresso atualizado",
      completed: "foi concluído",
      delayed: "teve o prazo adiado",
      cancelled: "foi cancelado",
    };

    return this.sendEmail({
      to: clientEmail,
      subject: `${projectName} - ${statusMessages[status]}`,
      template: "project_update",
      priority: status === "completed" ? "high" : "normal",
      data: {
        projectName,
        status: statusMessages[status],
        collaboratorName,
        projectUrl,
        statusColor: this.getStatusColor(status),
      },
    });
  }

  async sendMaintenanceReminder(
    collaboratorEmail,
    location,
    scheduledDate,
    taskDetails,
  ) {
    return this.sendEmail({
      to: collaboratorEmail,
      subject: `Manutenção Agendada - ${location}`,
      template: "maintenance_reminder",
      priority: "normal",
      data: {
        location,
        scheduledDate: new Date(scheduledDate).toLocaleDateString("pt-PT"),
        taskDetails,
        mapUrl: `https://maps.google.com/search/${encodeURIComponent(location)}`,
      },
    });
  }

  async sendPasswordResetEmail(userEmail, resetToken, userName) {
    const resetUrl = `${process.env.WEBSITE_URL}/reset-password?token=${resetToken}`;

    return this.sendEmail({
      to: userEmail,
      subject: "Redefinir Palavra-passe - ReplantaSystem",
      template: "password_reset",
      priority: "high",
      data: {
        userName,
        resetUrl,
        expiryTime: "24 horas",
      },
    });
  }

  async sendWeeklyReport(userEmail, userName, reportData) {
    return this.sendEmail({
      to: userEmail,
      subject: "Relatório Semanal - ReplantaSystem",
      template: "weekly_report",
      priority: "normal",
      data: {
        userName,
        weekStart: reportData.weekStart,
        weekEnd: reportData.weekEnd,
        projectsCompleted: reportData.projectsCompleted,
        maintenanceTasks: reportData.maintenanceTasks,
        upcomingDeadlines: reportData.upcomingDeadlines,
        reportUrl: reportData.reportUrl,
      },
    });
  }

  // ===============================
  // UTILITY METHODS
  // ===============================

  getStatusColor(status) {
    const colors = {
      started: "#22c55e",
      progress: "#3b82f6",
      completed: "#10b981",
      delayed: "#f59e0b",
      cancelled: "#ef4444",
    };
    return colors[status] || "#6b7280";
  }

  async testEmailConnection() {
    try {
      await this.transporter.verify();
      return { success: true, message: "Email connection successful" };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  getWelcomeTemplate() {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bem-vindo ao ReplantaSystem</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #22c55e, #16a34a); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .feature { margin: 15px 0; padding: 15px; background: #f0f9f0; border-radius: 6px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌱 Bem-vindo ao ReplantaSystem!</h1>
            <p>A sua plataforma de gestão de jardinagem</p>
        </div>
        <div class="content">
            <h2>Olá {{userName}}! 👋</h2>
            <p>É com grande prazer que damos as boas-vindas ao ReplantaSystem como <strong>{{userRole}}</strong>.</p>
            
            <div class="feature">
                <h3>🎯 O que pode fazer agora:</h3>
                <ul>
                    <li>Aceder ao seu painel personalizado</li>
                    <li>Gerir os seus projetos de jardinagem</li>
                    <li>Comunicar diretamente com a equipa</li>
                    <li>Acompanhar o progresso em tempo real</li>
                </ul>
            </div>

            <p style="text-align: center;">
                <a href="{{loginUrl}}" class="button">Aceder à Plataforma</a>
            </p>

            <p>Se tiver alguma dúvida, não hesite em contactar-nos através do email {{supportEmail}}.</p>
        </div>
        <div class="footer">
            <p>&copy; {{currentYear}} {{companyName}}. Todos os direitos reservados.</p>
            <p><a href="{{websiteUrl}}">{{websiteUrl}}</a></p>
        </div>
    </div>
</body>
</html>`;
  }

  getProjectUpdateTemplate() {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Atualização do Projeto</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: {{statusColor}}; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .update-box { background: #f0f9f0; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid {{statusColor}}; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📋 Atualização do Projeto</h1>
        </div>
        <div class="content">
            <div class="update-box">
                <h3>{{projectName}}</h3>
                <p><strong>Status:</strong> {{status}}</p>
                <p><strong>Responsável:</strong> {{collaboratorName}}</p>
            </div>

            <p>O seu projeto <strong>{{projectName}}</strong> {{status}}.</p>
            
            <p style="text-align: center;">
                <a href="{{projectUrl}}" class="button">Ver Detalhes do Projeto</a>
            </p>

            <p>Para mais informações ou questões, pode sempre contactar diretamente o responsável pelo projeto.</p>
        </div>
        <div class="footer">
            <p>&copy; {{currentYear}} {{companyName}}. Todos os direitos reservados.</p>
        </div>
    </div>
</body>
</html>`;
  }

  getMaintenanceReminderTemplate() {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Manutenção Agendada</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f59e0b; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .task-details { background: #fffbeb; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔧 Manutenção Agendada</h1>
        </div>
        <div class="content">
            <div class="task-details">
                <h3>📍 {{location}}</h3>
                <p><strong>Data:</strong> {{scheduledDate}}</p>
                <p><strong>Detalhes:</strong> {{taskDetails}}</p>
            </div>

            <p>Tem uma tarefa de manutenção agendada para <strong>{{location}}</strong> no dia <strong>{{scheduledDate}}</strong>.</p>
            
            <p style="text-align: center;">
                <a href="{{mapUrl}}" class="button">Ver Localização</a>
            </p>

            <p>Certifique-se de que tem todo o equipamento necessário antes de se dirigir ao local.</p>
        </div>
        <div class="footer">
            <p>&copy; {{currentYear}} {{companyName}}. Todos os direitos reservados.</p>
        </div>
    </div>
</body>
</html>`;
  }

  getPasswordResetTemplate() {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Redefinir Palavra-passe</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ef4444; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .warning { background: #fef2f2; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ef4444; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔒 Redefinir Palavra-passe</h1>
        </div>
        <div class="content">
            <h2>Olá {{userName}},</h2>
            <p>Recebemos um pedido para redefinir a palavra-passe da sua conta ReplantaSystem.</p>
            
            <p style="text-align: center;">
                <a href="{{resetUrl}}" class="button">Redefinir Palavra-passe</a>
            </p>

            <div class="warning">
                <p><strong>⚠️ Importante:</strong></p>
                <ul>
                    <li>Este link é válido por {{expiryTime}}</li>
                    <li>Se não solicitou esta alteração, ignore este email</li>
                    <li>A sua palavra-passe atual permanece inalterada até usar este link</li>
                </ul>
            </div>

            <p>Se o botão não funcionar, copie e cole este link no seu navegador:</p>
            <p style="word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 4px;">{{resetUrl}}</p>
        </div>
        <div class="footer">
            <p>&copy; {{currentYear}} {{companyName}}. Todos os direitos reservados.</p>
        </div>
    </div>
</body>
</html>`;
  }

  getAccountActivationTemplate() {
    return `<!-- Similar structure for account activation -->`;
  }

  getWeeklyReportTemplate() {
    return `<!-- Weekly report template with charts and statistics -->`;
  }

  getPaymentReminderTemplate() {
    return `<!-- Payment reminder template -->`;
  }

  getProjectCompletionTemplate() {
    return `<!-- Project completion template with final photos and documents -->`;
  }

  getUserApprovedTemplate() {
    return `
<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Conta Aprovada - ReplantaSystem</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4ade80, #22c55e); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
        .success-badge { background: #dcfce7; color: #15803d; padding: 10px 20px; border-radius: 20px; font-weight: 600; margin: 20px 0; }
        .btn { display: inline-block; padding: 12px 30px; margin: 10px; text-decoration: none; border-radius: 6px; font-weight: 600; background: #22c55e; color: white; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🌱 Conta Aprovada!</h1>
    </div>
    <div class="content">
        <p>Olá <strong>{{userName}}</strong>,</p>
        <div class="success-badge">✅ A sua conta foi aprovada com sucesso!</div>
        <p>A sua conta ReplantaSystem foi aprovada. Já pode aceder à plataforma.</p>
        <p><strong>Aprovado por:</strong> {{approvedBy}}<br><strong>Data:</strong> {{approvedAt}}</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{loginUrl}}" class="btn">🚀 Fazer Login</a>
        </div>
    </div>
    <div class="footer">
        <p>ReplantaSystem - Sistema de Gestão de Projetos de Jardinagem</p>
        <p>Precisa de ajuda? <a href="mailto:{{supportEmail}}">{{supportEmail}}</a></p>
    </div>
</body>
</html>`;
  }

  getUserRejectedTemplate() {
    return `
<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Informação sobre a sua conta - ReplantaSystem</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
        .warning-badge { background: #fef2f2; color: #dc2626; padding: 10px 20px; border-radius: 20px; font-weight: 600; margin: 20px 0; border: 1px solid #fecaca; }
        .reason-box { background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .btn { display: inline-block; padding: 12px 30px; margin: 10px; text-decoration: none; border-radius: 6px; font-weight: 600; background: #3b82f6; color: white; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>⚠️ Informação Importante</h1>
    </div>
    <div class="content">
        <p>Olá <strong>{{userName}}</strong>,</p>
        <div class="warning-badge">❌ Estado da conta: Não aprovada</div>
        <p>A sua candidatura ao ReplantaSystem não foi aprovada neste momento.</p>
        <div class="reason-box">
            <h4>📝 Motivo da Decisão:</h4>
            <p>{{rejectionReason}}</p>
        </div>
        <p><strong>Analisado por:</strong> {{rejectedBy}}<br><strong>Data:</strong> {{rejectedAt}}</p>
        <p>Pode contactar-nos para esclarecimentos ou nova candidatura.</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{contactUrl}}" class="btn">📧 Contactar Administrador</a>
        </div>
    </div>
    <div class="footer">
        <p>ReplantaSystem - Sistema de Gestão de Projetos de Jardinagem</p>
        <p>Precisa de ajuda? <a href="mailto:{{supportEmail}}">{{supportEmail}}</a></p>
    </div>
</body>
</html>`;
  }

  getGenericTemplate() {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{subject}}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #22c55e; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{title}}</h1>
        </div>
        <div class="content">
            {{content}}
        </div>
        <div class="footer">
            <p>&copy; {{currentYear}} {{companyName}}. Todos os direitos reservados.</p>
        </div>
    </div>
</body>
</html>`;
  }
}

module.exports = new EmailService();
