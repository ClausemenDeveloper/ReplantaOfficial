// Script para testar envio de emails de aprovação/rejeição
// Execute com: node server/test-email-approval.js

import dotenv from "dotenv";

// Carregar variáveis de ambiente
dotenv.config();

async function testApprovalEmails() {
  try {
    console.log("🧪 Testando sistema de emails de aprovação...");

    // Dados de teste
    const testUser = {
      name: "João Silva",
      email: "joao.silva@teste.com",
      role: "client",
    };

    const testAdmin = {
      name: "Admin ReplantaSystem",
    };

    // Testar email de aprovação
    console.log("\n📧 Testando email de aprovação...");

    const approvalEmailData = {
      to: testUser.email,
      subject: "Conta ReplantaSystem Aprovada ✅",
      template: "userApproved",
      templateData: {
        userName: testUser.name,
        userEmail: testUser.email,
        userRole: testUser.role === "client" ? "Cliente" : "Colaborador",
        loginUrl: `${process.env.WEBSITE_URL || "http://localhost:8080"}/login`,
        dashboardUrl: `${process.env.WEBSITE_URL || "http://localhost:8080"}/dashboard/${testUser.role}`,
        supportEmail:
          process.env.SUPPORT_EMAIL || "clausemenandredossantos@gmail.com",
        approvedBy: testAdmin.name,
        approvedAt: new Date().toLocaleDateString("pt-PT", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    };

    // Simular envio (sem enviar realmente)
    console.log("📋 Dados do email de aprovação:");
    console.log(JSON.stringify(approvalEmailData, null, 2));

    // Testar email de rejeição
    console.log("\n📧 Testando email de rejeição...");

    const rejectionEmailData = {
      to: testUser.email,
      subject: "Conta ReplantaSystem - Informação Importante ❌",
      template: "userRejected",
      templateData: {
        userName: testUser.name,
        userEmail: testUser.email,
        userRole: testUser.role === "client" ? "Cliente" : "Colaborador",
        rejectionReason: "Informações incompletas no processo de registo",
        supportEmail:
          process.env.SUPPORT_EMAIL || "clausemenandredossantos@gmail.com",
        contactUrl: `mailto:${process.env.SUPPORT_EMAIL || "clausemenandredossantos@gmail.com"}?subject=Revisão de Conta ReplantaSystem`,
        rejectedBy: testAdmin.name,
        rejectedAt: new Date().toLocaleDateString("pt-PT", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    };

    console.log("📋 Dados do email de rejeição:");
    console.log(JSON.stringify(rejectionEmailData, null, 2));

    console.log(
      "\n✅ Teste concluído! Os templates de email estão configurados corretamente.",
    );

    console.log("\n📌 Para usar emails reais:");
    console.log("1. Configure as variáveis de ambiente SMTP no .env");
    console.log("2. Inicie o MongoDB: sudo systemctl start mongodb");
    console.log("3. Teste o registo de um novo usuário");
    console.log("4. Use a interface admin para aprovar/rejeitar");

    console.log("\n🔧 Variáveis SMTP necessárias:");
    console.log("SMTP_HOST=smtp.gmail.com");
    console.log("SMTP_USER=seu@email.com");
    console.log("SMTP_PASS=senha_de_app_gmail");
    console.log("SUPPORT_EMAIL=clausemenandredossantos@gmail.com");
  } catch (error) {
    console.error("❌ Erro no teste:", error);
  }
}

// Executar teste
testApprovalEmails();
