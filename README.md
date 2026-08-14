# Nautilus - Sistema de Gestão Naval

Sistema completo para gestão de projetos navais, incluindo controle de embarcações, propostas, tarefas, ordens de serviço e equipe.

## 📋 Pré-requisitos

- **Node.js** v18+ ou **Bun**
- **PostgreSQL** 14+
- **npm** ou **bun** como gerenciador de pacotes

## 🚀 Instalação

### 1. Clone o repositório
```bash
git clone <repository-url>
cd nautilus
```

### 2. Instale as dependências
```bash
npm install
# ou
bun install
```

### 3. Configure as variáveis de ambiente
Copie o arquivo `.env.example` para `.env` e configure:
```bash
cp .env.example .env
```

Edite o `.env` com suas configurações:
```env
POSTGRES_DB=nautilus_db
POSTGRES_USER=nautilus_user
POSTGRES_PASSWORD=<senha-forte-aqui>
SESSION_SECRET=<segredo-aleatorio-com-mais-de-32-caracteres>
APP_PORT=3000
COOKIE_SECURE=false
TRUST_PROXY=false
```

### 4. Configure o banco de dados
```bash
# Execute as migrações
npm run db:migrate

# Popule com dados iniciais (opcional)
npm run db:seed

# Migre tabelas de ordens de serviço
npm run db:migrate-os

# Migre fluxo de propostas
npm run db:migrate-proposal-flow

# Configure permissões
npm run db:seed-permissions
```

## 🏃‍♂️ Executando a Aplicação

### Modo Desenvolvimento
```bash
npm run dev
```
A aplicação estará disponível em `http://localhost:3000`

### Modo Produção
```bash
# Build da aplicação
npm run build

# Inicie o servidor
npm start
```

## 📁 Estrutura do Projeto

```
/workspace/
├── server.ts              # Servidor Express principal
├── src/
│   ├── App.tsx           # Componente principal React
│   ├── components/       # Componentes UI reutilizáveis
│   ├── hooks/           # Custom hooks (useApi, useForm, useModal, etc.)
│   ├── utils/           # Utilitários (constants, normalizers, formatters)
│   ├── server/          # Backend routes e auth
│   │   ├── routes/      # Rotas da API
│   │   ├── auth.ts      # Middleware de autenticação
│   │   └── serializers.ts
│   └── db/              # Schema e migrações do banco
├── public/              # Assets estáticos
└── uploads/             # Arquivos uploadados
```

## 🔐 Autenticação e Permissões

O sistema possui 3 níveis de acesso:
- **admin**: Acesso completo ao sistema
- **financeiro**: Gestão financeira e relatórios
- **tecnico**: Tarefas e ordens de serviço

## 📊 Funcionalidades Principais

### Gestão de Embarcações
- Cadastro e acompanhamento de embarcações
- Status e etapa atual do projeto
- Valores e pagamentos

### Propostas
- Criação de propostas técnicas
- Aceite formal com assinatura digital
- Geração automática de OS após aceite

### Ordens de Serviço (OS)
- Fluxo completo de OS
- Agendamento de vistorias
- Upload e versionamento de documentos
- Submissão externa para certificadoras
- Entregas e comprovantes

### Tarefas
- Tarefas padrão geradas automaticamente
- Atribuição de responsáveis
- Acompanhamento de prazos

### Financeiro
- Contas a receber
- Lançamentos financeiros
- Relatórios de pagamento

### Equipe
- Gestão de usuários
- Redefinição de senhas
- Controle de permissões

## 🔧 Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Inicia servidor em modo desenvolvimento |
| `npm run build` | Build para produção |
| `npm start` | Inicia servidor em produção |
| `npm run db:migrate` | Executa migrações do banco |
| `npm run db:seed` | Popula banco com dados iniciais |
| `npm run lint` | Validação TypeScript |
| `npm run clean` | Remove arquivos de build |

## 🛡️ Segurança

- Senhas hash com Argon2
- Sessions persistentes em PostgreSQL
- Headers de segurança (XSS, Clickjacking, MIME sniffing)
- Validação de inputs nas rotas da API
- Controle de acesso baseado em roles

## 📝 Melhorias Implementadas

### Código e Arquitetura
- ✅ Constants centralizadas (`src/utils/constants.ts`)
- ✅ Normalizadores de dados (`src/utils/normalizers.ts`)
- ✅ Custom hooks reutilizáveis (`src/hooks/index.ts`)
- ✅ Mensagens de erro em português

### Segurança
- ✅ Validação de inputs nas rotas
- ✅ Headers de segurança configurados
- ✅ Session secret via variável de ambiente

### Error Handling
- ✅ Logs de erro detalhados no backend
- ✅ Mensagens de erro específicas por contexto
- ✅ Tratamento de erros em async operations

### Banco de Dados
- ✅ Schema Drizzle ORM completo
- ✅ Índices únicos configurados
- ✅ Migrações estruturadas

## 🐛 Solução de Problemas

### Erro de conexão com banco
Verifique se o PostgreSQL está rodando e as credenciais no `.env` estão corretas.

### Sessions não persistem
Certifique-se de que a tabela `user_sessions` foi criada pelas migrações.

### Erro de build
Execute `npm run clean` e tente novamente.

## 📄 Licença

Proprietário - Todos os direitos reservados.

---

**Nautilus Projetos Navais** - Sistema de Gestão © 2024
