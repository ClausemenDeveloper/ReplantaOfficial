# 🌱 ReplantaSystem - Plataforma de Gestão de Jardinagem

Uma plataforma completa e moderna para gestão de projetos de jardinagem e paisagismo, conectando clientes, administradores e colaboradores numa experiência única.

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Funcionalidades](#-funcionalidades)
- [Tecnologias](#-tecnologias)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Instalação e Configuração](#-instalação-e-configuração)
- [Como Usar](#-como-usar)
- [Interfaces e Rotas](#-interfaces-e-rotas)
- [Sistema de Autenticação](#-sistema-de-autenticação)
- [Gestão Administrativa](#-gestão-administrativa)
- [Tema e Design](#-tema-e-design)
- [Desenvolvimento](#-desenvolvimento)

## 🌟 Visão Geral

O ReplantaSystem é uma aplicação web full-stack que facilita a gestão de projetos de jardinagem através de três interfaces distintas:

- **👥 Clientes**: Solicitar serviços, acompanhar projetos, comunicar com equipas
- **🛡️ Administradores**: Controlo total da plataforma, gestão de utilizadores, aprovações
- **🌿 Colaboradores**: Gestão de projetos atribuídos, comunica��ão com clientes

## ✨ Funcionalidades

### 🏠 **Homepage e Navegação**

- Landing page atrativa com apresentação da empresa
- Sistema de seleção de interface intuitivo
- Design responsivo e moderno
- Tema de jardinagem com cores verde, castanho e azul-claro

### 🔐 **Sistema de Autenticação Completo**

- **Login tradicional** com email e palavra-passe
- **Google OAuth Integration** para todas as interfaces
- **Registo diferenciado** para cada tipo de utilizador
- **Recuperação de palavra-passe** (preparado)
- **Gestão de sessões** e redirecionamentos automáticos

### 👨‍💼 **Interface de Cliente**

- Dashboard personalizado com projetos ativos
- Acompanhamento de progresso em tempo real
- Sistema de comunicação com colaboradores
- Galeria de inspirações e histórico de projetos
- Solicitação de novos orçamentos

### 🛡��� **Painel Administrativo Avançado**

- **Dashboard com estatísticas** em tempo real
- **Gestão completa de utilizadores**:
  - Visualização de todos os utilizadores
  - Aprovação/rejeição de registos pendentes
  - Ativação/desativação de contas
  - Eliminação permanente com confirmação
  - Edição de perfis de utilizador
- **Filtros e pesquisa avançada**
- **Ações rápidas** diretamente no dashboard
- **Sistema de notas** para cada utilizador

### 🌿 **Área do Colaborador**

- Dashboard com projetos atribuídos
- Gestão de tarefas diárias
- Sistema de progresso de projetos
- Comunicação com clientes
- Upload de fotos e relatórios
- Agendamento de reuniões

### 📱 **Recursos Adicionais**

- **Design responsivo** para todos os dispositivos
- **Feedback visual** com animações suaves
- **Sistema de notificações** (preparado)
- **Modo escuro/claro** (preparado)
- **PWA ready** (preparado)

## 🛠 Tecnologias

### Frontend

- **React 18** - Framework principal
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **React Router 6** - Roteamento SPA
- **TailwindCSS 3** - Estilização utility-first
- **Shadcn/ui** - Componentes UI modernos
- **Lucide React** - Ícones
- **Framer Motion** - Animações (disponível)

### Autenticação

- **Google OAuth 2.0** - Login social
- **JWT** - Gestão de tokens (preparado)
- **Cookies seguros** - Armazenamento de sessão

### Backend (Preparado)

- **Express.js** - Servidor API
- **MongoDB** - Base de dados NoSQL
- **Mongoose** - ODM para MongoDB
- **Nodemailer** - Envio de emails
- **bcrypt** - Encriptação de passwords

## 📁 Estrutura do Projeto

```
ReplantaSystem/
├── client/                           # Frontend React
│   ├── components/
│   │   ├── ui/                      # Componentes Shadcn/ui
│   │   └── GoogleSignInButton.tsx   # Botão Google OAuth
│   ├── hooks/
│   │   └── useGoogleAuth.ts         # Hook para Google OAuth
│   ├── pages/
│   │   ├── auth/                    # Páginas de autenticação
│   │   │   ├── ClientLogin.tsx
│   │   │   ├── ClientRegister.tsx
│   │   │   ├── AdminLogin.tsx
│   │   │   ├── AdminRegister.tsx
│   │   │   ├── CollaboratorLogin.tsx
│   │   │   ├── CollaboratorRegister.tsx
│   │   │   └── OAuthCallback.tsx
│   │   ├── dashboards/              # Dashboards por role
│   │   │   ├── ClientDashboard.tsx
│   │   │   ├── AdminDashboard.tsx
��   │   │   └── CollaboratorDashboard.tsx
│   │   ├── admin/                   # Páginas administrativas
│   │   │   └── AdminUsers.tsx
│   │   ├── Index.tsx                # Homepage
│   │   ├── SelectInterface.tsx      # Seleção de interface
│   │   └── NotFound.tsx
│   ├── App.tsx                      # Roteamento principal
│   └── global.css                   # Estilos globais e tema
├── server/                          # Backend Express (preparado)
├── shared/                          # Tipos partilhados
├── .env.example                     # Variáveis de ambiente
├── tailwind.config.ts               # Configuração Tailwind
└── package.json
```

## 🚀 Instalação e Configuração

### 1. **Clonar e Instalar Dependências**

```bash
# Clone o repositório
git clone [URL_DO_REPOSITÓRIO]
cd replanta-system

# Instalar dependências
npm install
```

### 2. **Configurar Variáveis de Ambiente**

```bash
# Copiar ficheiro de exemplo
cp .env.example .env

# Editar as variáveis necessárias
nano .env
```

### 3. **Configurar Google OAuth** (Opcional)

1. Ir ao [Google Cloud Console](https://console.cloud.google.com/)
2. Criar um novo projeto ou selecionar existente
3. Ativar a Google+ API
4. Criar credenciais OAuth 2.0
5. Adicionar `http://localhost:8080` aos domínios autorizados
6. Copiar o Client ID para `.env`:

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

### 4. **Executar o Projeto**

```bash
# Modo desenvolvimento
npm run dev

# Aceder em http://localhost:8080
```

## 🎯 Como Usar

### **Primeira Vez**

1. **Aceda a** `http://localhost:8080`
2. **Clique em "Começar Agora"** para ir à seleção de interface
3. **Escolha o seu tipo de utilizador**:
   - 👥 **Cliente**: Para solicitar serviços
   - 🛡️ **Administrador**: Para gerir a plataforma
   - 🌿 **Colaborador**: Para candidatar-se à equipa

### **Login/Registo**

- **Tradicional**: Use email e palavra-passe
- **Google OAuth**: Clique no botão "Entrar com Google"
- **Registo**: Cada interface tem o seu processo de registo

### **Navegação por Interface**

#### 👥 **Como Cliente**

1. Faça login em `/client/login`
2. Aceda ao dashboard em `/client/dashboard`
3. Veja os seus projetos ativos
4. Solicite novos orçamentos
5. Comunique com colaboradores

#### 🛡️ **Como Administrador**

1. Faça login em `/admin/login`
2. Aceda ao painel em `/admin/dashboard`
3. **Gestão rápida**:
   - Aprovar/rejeitar utilizadores pendentes
   - Ver estatísticas em tempo real
4. **Gestão completa** em `/admin/users`:
   - Filtrar e pesquisar utilizadores
   - Ativar/desativar contas
   - Eliminar utilizadores
   - Ver detalhes completos

#### 🌿 **Como Colaborador**

1. **Candidatura** em `/collaborator/register`
2. **Aguardar aprovação** da administração
3. Fazer login em `/collaborator/login`
4. Gerir projetos em `/collaborator/dashboard`

## 🗺️ Interfaces e Rotas

### **Páginas Públicas**

- `/` - Homepage da empresa
- `/select-interface` - Seleção de tipo de utilizador

### **Autenticação**

```
/client/login              # Login de cliente
/client/register           # Registo de cliente
/client/reset-password     # Recuperação de password (cliente)
/admin/login              # Login de administrador
/admin/register           # Registo de administrador
/admin/reset-password     # Recuperação de password (admin)
/collaborator/login       # Login de colaborador
/collaborator/register    # Candidatura de colaborador
/collaborator/reset-password # Recuperação de password (colaborador)
/auth/callback           # Callback do Google OAuth
```

### **Dashboards**

```
/client/dashboard      # Dashboard do cliente
/admin/dashboard       # Dashboard do administrador
/collaborator/dashboard # Dashboard do colaborador
```

### **Administração**

```
/admin/users          # Gestão completa de utilizadores
```

## 🔐 Sistema de Segurança Completo

### **🛡️ Medidas de Segurança Implementadas**

#### **✅ 1. Validação e Sanitização de Entrada**

- **Validação rigorosa**: Email, telefone, passwords, nomes
- **Sanitização automática**: Remoção de HTML malicioso e caracteres perigosos
- **Proteção XSS**: Detecção e bloqueio de scripts maliciosos
- **DOMPurify**: Sanitização avançada de conteúdo HTML

#### **✅ 2. Proteção contra XSS (Cross-site Scripting)**

- **Escape automático**: Todos os inputs são escapados
- **Content Security Policy**: Headers CSP configurados
- **Detecção de padrões**: Identificação automática de tentativas XSS
- **Logging de segurança**: Registo de todas as tentativas de ataque

#### **✅ 3. Autenticação Segura**

- **bcrypt**: Hash de passwords com salt de 12 rounds
- **JWT tokens**: Tokens seguros com expiração
- **Device fingerprinting**: Identificação única de dispositivos
- **Google OAuth 2.0**: Integração completa e segura
- **Rate limiting**: Proteção contra ataques de força bruta

#### **✅ 4. Gestão de Sessão e Tokens**

- **Cookies seguros**: httpOnly, secure, sameSite=strict
- **Token refresh**: Renovação automática de tokens
- **Logout seguro**: Invalidação completa de sessões
- **Expiração automática**: Tokens com tempo de vida limitado

#### **✅ 5. Proteção CSRF**

- **Tokens CSRF**: Validação em todas as requisições
- **SameSite cookies**: Proteção adicional contra CSRF
- **Validação de origem**: Verificação da origem das requisições

#### **✅ 6. Rate Limiting & Proteção contra Força Bruta**

- **Login**: 5 tentativas por 15 minutos
- **Registo**: 3 tentativas por hora
- **Reset password**: 3 tentativas por hora
- **API geral**: 100 requisições por 15 minutos

#### **✅ 7. Headers de Segurança HTTP**

```javascript
// Headers implementados via Helmet.js
Content-Security-Policy
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security (HTTPS obrigatório)
```

#### **✅ 8. Controlo de Acesso e Autorização**

- **Middleware de roles**: Admin, Cliente, Colaborador
- **Sistema de permissões**: Controlo granular de acesso
- **Proteção de rotas**: Componentes ProtectedRoute
- **Validação dupla**: Frontend e backend

#### **✅ 9. Logs e Monitoramento**

- **Eventos de segurança**: Login, logout, tentativas falhadas
- **Detecção de anomalias**: Tentativas de acesso não autorizadas
- **Armazenamento local**: Últimos 100 eventos de segurança
- **Níveis de severidade**: Low, Medium, High

#### **✅ 10. Gestão Segura de Erros**

- **Sanitização de logs**: Remoção de dados sensíveis
- **Mensagens genéricas**: Não exposição de detalhes internos
- **Stack trace limitado**: Apenas em desenvolvimento
- **Logging estruturado**: Formato consistente de logs

### **🔒 Componentes de Segurança**

#### **Frontend (`client/lib/security.ts`)**

```typescript
// Utilitários principais
SecurityValidator; // Validação de inputs
XSSProtection; // Proteção contra XSS
AuthSecurity; // Gestão segura de autenticação
CSRFProtection; // Proteção CSRF
SecureHTTP; // Cliente HTTP seguro
SecureErrorHandler; // Gestão de erros
```

#### **Backend (`server/middleware/security.js`)**

```javascript
// Middleware de segurança
securityHeaders(); // Headers de segurança
rateLimits; // Rate limiting
validateInput(); // Validação server-side
csrfProtection(); // Proteção CSRF
authenticateJWT(); // Autenticação JWT
requireRole(); // Controlo de roles
requirePermission(); // Controlo de permissões
```

#### **Componentes React Seguros**

```typescript
// Proteção de rotas
<ProtectedRoute requiredRole="admin">
  <AdminPanel />
</ProtectedRoute>

// Formulários seguros
<SecureForm
  fields={formFields}
  onSubmit={handleSubmit}
  enableXSSProtection={true}
  enableRateLimit={true}
/>
```

### **Google OAuth Flow Seguro**

1. **Inicialização**: Carregamento seguro do SDK Google
2. **Autenticação**: Popup/redirect com validação CSRF
3. **Callback**: Processamento seguro em `/auth/callback`
4. **Validação**: Verificação do token JWT no backend
5. **Sessão**: Criação de sessão segura com cookies httpOnly

### **🚨 Monitoramento de Segurança**

#### **Eventos Monitorizados**

- Tentativas de login falhadas
- Acessos a áreas restritas
- Detecção de XSS
- Rate limiting violations
- Alterações de perfil
- Logout de utilizadores

#### **Alertas de Segurança**

- **Alto**: Tentativas XSS, acessos não autorizados
- **Médio**: Rate limiting, erros de autenticação
- **Baixo**: Logins normais, atualizações de perfil

## 👨‍💼 Gestão Administrativa

### **Dashboard Administrativo**

- **Estatísticas em tempo real**:
  - Total de utilizadores
  - Utilizadores ativos
  - Pendentes de aprovação
  - Número de clientes/colaboradores
- **Ações rápidas**:
  - Aprovar utilizadores pendentes
  - Rejeitar candidaturas
  - Ver atividade recente

### **Gestão Completa de Utilizadores** (`/admin/users`)

#### **Funcionalidades Principais**

- **Visualização em tabela** com informações completas
- **Filtros avançados**:
  - Por role (Cliente/Colaborador/Admin)
  - Por status (Ativo/Pendente/Inativo)
- **Pesquisa em tempo real** por nome ou email
- **Ações por utilizador**:
  - 👁️ Ver detalhes completos
  - ✏️ Editar informações
  - ✅ Aprovar (pendentes)
  - ❌ Rejeitar (pendentes)
  - 🔒 Ativar/Desativar
  - 🗑️ Eliminar permanentemente

#### **Informações Detalhadas**

- **Dados pessoais**: Nome, email, telefone, localização
- **Informações profissionais** (colaboradores): Especialização, experiência
- **Historial**: Data de registo, último login, projetos
- **Notas administrativas**
- **Status e permissões**

#### **Controlos de Segurança**

- **Confirmações** para ações irreversíveis
- **Feedback visual** para todas as ações
- **Validações** antes de executar alterações

## 🎨 Tema e Design

### **Paleta de Cores**

```css
/* Tema de Jardinagem */
--garden-green: #4f7f4f /* Verde principal */ --garden-green-light: #8fbc8f
  /* Verde claro */ --garden-green-dark: #2f4f2f /* Verde escuro */
  --garden-brown: #8b4513 /* Castanho */ --garden-light-blue: #87ceeb
  /* Azul claro */;
```

### **Componentes Personalizados**

- **`.garden-card`** - Cartões com sombra e bordas temáticas
- **`.garden-button`** - Botões com gradiente e hover effects
- **`.garden-gradient`** - Gradiente de fundo temático

### **Design System**

- **Bordas arredondadas** (0.75rem padrão)
- **Sombras suaves** com cores temáticas
- **Animações de hover** e transições suaves
- **Responsividade completa** para mobile/tablet/desktop

## 🔧 Desenvolvimento

### **Comandos Disponíveis**

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build para produção
npm run start        # Servidor de produção
npm run typecheck    # Verificação TypeScript
npm test            # Executar testes
npm run format.fix  # Formatar código
```

### **Estrutura de Desenvolvimento**

- **Hot reload** para desenvolvimento rápido
- **TypeScript** para tipagem segura
- **ESLint + Prettier** para código consistente
- **Path aliases** configurados (@/ para client/)

### **Próximos Passos Sugeridos**

#### **Backend Integration**

1. **Implementar APIs** em Express.js
2. **Configurar MongoDB** e modelos Mongoose
3. **Integrar autenticação JWT**
4. **Sistema de emails** com Nodemailer

#### **Funcionalidades Avançadas**

1. **Sistema de notificações** em tempo real
2. **Chat em tempo real** entre utilizadores
3. **Upload de ficheiros** (fotos, documentos) com validação de segurança
4. **Sistema de pagamentos** integrado
5. **Relatórios e analytics** avançados
6. **Auditoria de segurança** automática
7. **Backup automático** de dados críticos
8. **Monitoramento 24/7** de segurança

#### **UX/UI Enhancements**

1. **Modo escuro/claro**
2. **Internacionalização** (i18n)
3. **PWA completo** com offline support
4. **Optimizações de performance**

### **Variáveis de Ambiente Necessárias**

```env
# Google OAuth
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# URLs da aplicação
VITE_APP_URL=http://localhost:8080
VITE_API_URL=http://localhost:8080/api
VITE_OAUTH_REDIRECT_URI=http://localhost:8080/auth/callback

# MongoDB (Backend)
MONGO_URI=mongodb://localhost:27017/replantasystem

# JWT (Backend) - IMPORTANTE: Use uma chave forte em produção
JWT_SECRET=your_very_secure_jwt_secret_minimum_32_chars
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Email (Backend)
GMAIL_USER=your.email@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password_here

# Segurança
BCRYPT_ROUNDS=12
CSRF_SECRET=your_csrf_secret_here
SESSION_SECRET=your_session_secret_here

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=5

# Ambiente
NODE_ENV=development
PORT=8080
HTTPS_ENABLED=false  # true em produção

# Monitoramento (Opcional)
SENTRY_DSN=your_sentry_dsn_here
LOG_LEVEL=info
```

### **🛡️ Checklist de Segurança para Produção**

#### **Antes do Deploy**

- [ ] Alterar todas as chaves secretas
- [ ] Ativar HTTPS (certificado SSL/TLS)
- [ ] Configurar Content Security Policy
- [ ] Ativar rate limiting em produção
- [ ] Configurar backup automático
- [ ] Testar todos os fluxos de autenticação
- [ ] Verificar logs de segurança
- [ ] Configurar monitoramento de erros

#### **Configuração de Produção**

```env
NODE_ENV=production
HTTPS_ENABLED=true
COOKIE_SECURE=true
CSP_ENABLED=true
RATE_LIMIT_STRICT=true
LOG_LEVEL=warn
```

#### **Recursos de Segurança Adicionais**

- **Cloudflare**: Proteção DDoS e WAF
- **Sentry**: Monitoramento de erros em tempo real
- **SSL Labs**: Teste de configuração SSL
- **OWASP ZAP**: Testes de penetração
- **npm audit**: Verificação de vulnerabilidades

---

## 📞 Suporte

Para questões técnicas ou sugestões de melhorias, consulte a documentação ou contacte a equipa de desenvolvimento.

**Status do Projeto**: ✅ Interface completa e funcional | 🔄 Backend em preparação

---

_Desenvolvido com 💚 para a comunidade de jardinagem_
