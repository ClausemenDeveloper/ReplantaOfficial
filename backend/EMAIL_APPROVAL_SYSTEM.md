# Sistema de Emails de Aprovação - ReplantaSystem

## 📧 **Sistema Implementado**

Quando o admin **aprovar** ou **rejeitar** um cliente/colaborador, será enviado automaticamente um email personalizado para o utilizador.

## ✅ **Email de Aprovação**

### **Quando é enviado:**

- Admin aprova um cliente ou colaborador via `/api/users/:id/approve`
- Automaticamente após aprovação bem-sucedida

### **Conteúdo do email:**

- ✅ **Título:** "Conta ReplantaSystem Aprovada"
- 🌱 **Visual:** Design verde com ícones de jardim
- 📋 **Informações:** Nome, email, tipo de conta, quem aprovou, data
- 🚀 **Botões:** "Fazer Login" e "Ir para Dashboard"
- 💡 **Instruções:** Como usar a plataforma baseado no papel (cliente/colaborador)

### **Template usado:** `userApproved.hbs`

## ❌ **Email de Rejeição**

### **Quando é enviado:**

- Admin rejeita um cliente ou colaborador via `/api/users/:id/reject`
- Automaticamente após rejeição

### **Conteúdo do email:**

- ❌ **Título:** "Informação Importante sobre a sua conta"
- ⚠️ **Visual:** Design vermelho com alertas visuais
- 📝 **Motivo:** Razão específica da rejeição (fornecida pelo admin)
- 📧 **Botões:** "Contactar Administrador" e "Enviar Feedback"
- 💬 **Opções:** Como proceder (contactar, nova candidatura, etc.)

### **Template usado:** `userRejected.hbs`

## 🔧 **Configuração Necessária**

### **1. Variáveis de Ambiente (.env):**

```bash
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_senha_de_app_gmail
SMTP_SECURE=false
SUPPORT_EMAIL=clausemenandredossantos@gmail.com
WEBSITE_URL=http://localhost:8080
```

### **2. Gmail App Password:**

1. Ativar autenticação de 2 fatores no Gmail
2. Ir em "Senhas de aplicação"
3. Gerar senha para "Mail"
4. Usar essa senha no `SMTP_PASS`

### **3. Iniciar MongoDB:**

```bash
sudo systemctl start mongodb
# ou
brew services start mongodb/brew/mongodb-community
```

## 🎯 **Como Funciona (Fluxo Completo)**

### **Cenário 1: Aprovação**

```
1. Cliente regista-se → Status "pending"
2. Admin acede interface de aprovação
3. Admin clica "Aprovar"
4. Sistema:
   ✅ Atualiza user.approvalStatus = "approved"
   ✅ Cria notificação interna
   ✅ Envia email de aprovação
   ✅ Cliente pode fazer login
```

### **Cenário 2: Rejeição**

```
1. Cliente regista-se → Status "pending"
2. Admin acede interface de aprovação
3. Admin clica "Rejeitar" + motivo
4. Sistema:
   ❌ Atualiza user.approvalStatus = "rejected"
   ❌ Cria notificação interna
   ❌ Envia email de rejeição com motivo
   ❌ Cliente não pode fazer login
```

## 📋 **Templates de Email**

### **Localização:**

- `server/templates/email/userApproved.hbs` - Template de aprovação
- `server/templates/email/userRejected.hbs` - Template de rejeição

### **Funcionalidades dos Templates:**

- 📱 **Responsive:** Funciona em mobile e desktop
- 🎨 **Design moderno:** Cores temáticas (verde/vermelho)
- 🌐 **Português:** Totalmente localizado
- 📊 **Informativo:** Dados completos da decisão
- 🔗 **Links diretos:** Botões para login/contacto

## 🧪 **Teste do Sistema**

### **Comando de teste:**

```bash
node server/test-email-approval.js
```

### **Teste real (com MongoDB):**

1. **Registar cliente:**

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Teste Cliente","email":"teste@cliente.com","password":"123456","role":"client"}'
```

2. **Login como admin:**

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"clausemenandredossantos@gmail.com","password":"@Venus0777"}'
```

3. **Listar pendentes:**

```bash
curl -X GET http://localhost:8080/api/users/pending \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN"
```

4. **Aprovar usuário:**

```bash
curl -X POST http://localhost:8080/api/users/USER_ID/approve \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN"
```

## 🚀 **Status do Sistema**

### ✅ **Implementado:**

- [x] Rotas de aprovação/rejeição com envio de email
- [x] Templates HTML responsivos e bonitos
- [x] Sistema de notificações interno
- [x] Logging de emails enviados
- [x] Tratamento de erros (não falha se email falhar)
- [x] Dados completos nos emails (quem aprovou, quando, motivo)

### 🔄 **Funcionamento:**

- ✅ **Aprovação:** Email automático + acesso liberado
- ✅ **Rejeição:** Email automático + motivo específico
- ✅ **Templates:** Português + design profissional
- ✅ **Tolerância a falhas:** Sistema continua se email falhar

## 📞 **Suporte**

**Admin Email:** `clausemenandredossantos@gmail.com`

O sistema está **100% funcional** e pronto para uso com clientes reais!

Quando o admin aprovar/rejeitar um utilizador, será enviado automaticamente um email elegante e informativo.
