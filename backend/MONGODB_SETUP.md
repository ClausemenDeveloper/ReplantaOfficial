# MongoDB Setup - ReplantaSystem

## 🚀 Como Executar na Sua Máquina

### Pré-requisitos

- Node.js 18+ instalado
- MongoDB instalado localmente OU conta no MongoDB Atlas

## 📦 Instalação

### 1. Clone e Instale Dependências

```bash
git clone <repository-url>
cd ReplantaSystem
npm install
```

### 2. Configuração do Banco de Dados

#### Opção A: MongoDB Local

```bash
# Instalar MongoDB (Ubuntu/Debian)
sudo apt-get install mongodb

# Ou instalar MongoDB (macOS com Homebrew)
brew install mongodb/brew/mongodb-community

# Iniciar MongoDB
sudo systemctl start mongodb
# ou
brew services start mongodb/brew/mongodb-community
```

#### Opção B: MongoDB Atlas (Recomendado)

1. Criar conta gratuita em [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Criar cluster gratuito
3. Configurar usuário e senha
4. Obter string de conexão

#### Opção C: Docker

```bash
# Executar MongoDB via Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 3. Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar .env com suas configurações
nano .env
```

### 4. Configurações Essenciais no .env

```bash
# MongoDB (escolha uma opção)
DB_CONNECTION_STRING=mongodb://localhost:27017/replantasystem
# OU para Atlas:
# DB_CONNECTION_STRING=mongodb+srv://username:password@cluster.mongodb.net/replantasystem

# JWT (gerar chave segura)
JWT_SECRET=sua_chave_secreta_super_segura_aqui

# Google Maps (opcional)
VITE_GOOGLE_MAPS_API_KEY=sua_chave_google_maps

# Google OAuth (opcional)
VITE_GOOGLE_CLIENT_ID=seu_client_id_google

# Email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_senha_de_app
```

## 🎯 Executar a Aplicação

### Desenvolvimento

```bash
# Executar aplicação completa
npm run dev

# A aplicação estará disponível em:
# Frontend: http://localhost:5173
# Backend API: http://localhost:3000
```

### Verificar Conexão

```bash
# Testar API
curl http://localhost:3000/api/ping
curl http://localhost:3000/api/health
```

## 🔧 Comandos Úteis

### Build para Produção

```bash
npm run build
npm start
```

### Testes

```bash
npm test
```

### Verificar Tipos

```bash
npm run typecheck
```

## 📊 Estrutura do Banco de Dados

### Collections Criadas:

- **users** - Usuários (clientes, admins, colaboradores)
- **projects** - Projetos de jardinagem
- **notifications** - Sistema de notificações

### Usuários Padrão:

A aplicação criará automaticamente usuários de exemplo na primeira execução.

## 🐛 Troubleshooting

### Erro de Conexão MongoDB

```bash
# Verificar se MongoDB está rodando
sudo systemctl status mongodb
# ou
brew services list | grep mongodb

# Verificar logs
tail -f /var/log/mongodb/mongod.log
```

### Erro de Porta em Uso

```bash
# Verificar processos na porta 3000
lsof -i :3000

# Verificar processos na porta 5173
lsof -i :5173
```

### Reset do Banco de Dados

```bash
# Conectar ao MongoDB
mongo replantasystem

# Limpar todas as collections
db.users.deleteMany({})
db.projects.deleteMany({})
db.notifications.deleteMany({})
```

## 🔐 Primeiros Passos

1. **Acesse a aplicação**: `http://localhost:5173`
2. **Registre-se** como novo usuário
3. **Explore os dashboards** baseados no seu perfil
4. **Configure Google Maps** (opcional) para funcionalidades de localização

## 📚 APIs Disponíveis

### Autenticação

- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Perfil atual

### Projetos

- `GET /api/projects` - Listar projetos
- `POST /api/projects` - Criar projeto
- `GET /api/projects/:id` - Obter projeto
- `PUT /api/projects/:id` - Atualizar projeto

### Notificações

- `GET /api/notifications` - Listar notificações
- `POST /api/notifications/send` - Enviar notificação

## 🌟 Recursos Implementados

✅ **Sistema de Autenticação** completo com JWT  
✅ **Gestão de Projetos** com CRUD completo  
✅ **Sistema de Notificações** push e email  
✅ **Dashboard Multi-perfil** (Cliente, Admin, Colaborador)  
✅ **Integração Google Maps** para localização  
✅ **Performance Otimizada** com code splitting  
✅ **Design Responsivo** com Tailwind CSS

## 🔄 Próximos Passos

- [ ] Implementar upload de imagens
- [ ] Adicionar sistema de pagamentos
- [ ] Criar app mobile
- [ ] Implementar chat em tempo real
- [ ] Adicionar relatórios avançados

---

**Suporte**: Para dúvidas ou problemas, consulte a documentação ou abra uma issue no repositório.
