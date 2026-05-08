# SDR CRM

Mini CRM para equipes de SDR com autenticacao, gestao de leads em kanban, campanhas de abordagem e geracao de mensagens com IA.

## Visao Geral

O projeto foi construido como monorepo TypeScript com frontend React/Vite e backend Node.js/Express. O fluxo cobre:

- autenticacao de usuarios
- workspaces isolados por time
- kanban de leads com validacao por etapa
- campos personalizados por workspace
- campanhas de abordagem com geracao de 3 mensagens via IA
- dashboard com metricas e historico recente
- migracao de auth e banco para Supabase

## Stack

- Frontend: React 18, TypeScript, Vite, Tailwind CSS, componentes utilitarios no estilo shadcn/ui
- Backend: Node.js, Express, TypeScript, JWT local na fase inicial e integracao com Supabase
- Banco: PostgreSQL local em Docker, com schema compartilhado em `supabase/migrations`
- Auth: JWT local e Supabase Auth
- IA: Anthropic ou OpenAI, com fallback local quando nenhuma chave esta configurada
- Infra local: Docker Compose

## Estrutura

```text
.
|-- apps/
|   |-- backend/
|   `-- frontend/
|-- supabase/
|   `-- migrations/
|-- docker-compose.yml
|-- netlify.toml
`-- Plans.md
```

## Principais Funcionalidades

### Autenticacao e multi-workspace

- cadastro e login de usuarios
- selecao e criacao de workspace
- isolamento de dados por workspace
- convite de membros com papeis `admin` e `member`

### Operacao de leads

- kanban com drag and drop entre etapas
- bloqueio de mudanca de etapa quando faltam campos obrigatorios
- edicao completa do lead em modal
- campos personalizados por workspace
- filtros por nome, empresa, responsavel e etapa
- historico de atividades e mensagens enviadas

### Campanhas e IA

- criacao e edicao de campanhas
- etapa gatilho para geracao automatica
- geracao manual de 3 mensagens por lead
- envio simulado que move o lead para `Tentando Contato`

### Dashboard

- total de leads
- total de campanhas
- mensagens geradas e enviadas
- distribuicao de leads por etapa
- leads criados por semana
- tabela com leads mais recentes

## Variaveis de Ambiente

Use a raiz do monorepo como fonte das variaveis. O frontend le o `.env` da raiz via `envDir`.

```env
# Banco de dados
POSTGRES_USER=sdrcrm
POSTGRES_PASSWORD=sdrcrm123
POSTGRES_DB=sdrcrm
POSTGRES_PORT=5433
DATABASE_URL=postgresql://sdrcrm:sdrcrm123@postgres:5432/sdrcrm

# Backend
PORT=3001
JWT_SECRET=change-me-in-development
NODE_ENV=development

# IA
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini

# Frontend
VITE_API_URL=http://localhost:3001
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Como Rodar Localmente

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar ambiente

```bash
cp .env.example .env
```

Preencha as chaves opcionais de IA e, se estiver usando a fase com Supabase, configure as credenciais correspondentes.

### 3. Subir com Docker

```bash
docker compose up --build
```

Servicos locais:

- frontend: `http://localhost:5173`
- backend: `http://localhost:3001/api`
- postgres: `localhost:5433`

### 4. Rodar sem Docker

Backend:

```bash
npm run dev --workspace apps/backend
```

Frontend:

```bash
npm run dev --workspace apps/frontend
```

## Scripts Uteis

Na raiz:

```bash
npm run docker:up
npm run docker:down
```

No backend:

```bash
npm run db:migrate --workspace apps/backend
npm run db:seed --workspace apps/backend
npm run build --workspace apps/backend
```

No frontend:

```bash
npm run build --workspace apps/frontend
npm run preview --workspace apps/frontend
```

## Deploy do Frontend no Netlify

O repositorio ja esta preparado com `netlify.toml` para build de SPA React.

### Configuracao recomendada

- Build command: `npm run build --workspace apps/frontend`
- Publish directory: `apps/frontend/dist`
- Node version: `20`

### Variaveis necessarias no Netlify

- `VITE_API_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Observacoes importantes

- O frontend usa React Router com `BrowserRouter`, entao o deploy precisa de fallback para `index.html`.
- O app continua dependendo de um backend publico acessivel em `VITE_API_URL`.
- Nenhuma chave sensivel deve ser exposta no frontend. Apenas variaveis `VITE_*` seguras para cliente.

## Endpoints Principais

```text
POST   /api/auth/register
POST   /api/auth/login
GET    /api/workspaces
POST   /api/workspaces
GET    /api/leads
POST   /api/leads
PATCH  /api/leads/:id
PATCH  /api/leads/:id/stage
GET    /api/custom-fields
POST   /api/custom-fields
GET    /api/funnel-stages
PATCH  /api/funnel-stages/:id/required-fields
GET    /api/campaigns
POST   /api/campaigns/:id/generate-messages
POST   /api/leads/:id/send-message
GET    /api/dashboard
GET    /api/activity-logs
```

## Checklist Manual

- cadastrar usuario e fazer login
- criar workspace e selecionar workspace ativo
- cadastrar lead e mover no kanban
- validar bloqueio de etapa por campos obrigatorios
- criar campanha e gerar mensagens
- enviar mensagem simulada
- conferir metricas do dashboard

## Status da Fase 6

- deploy do frontend preparado para Netlify com suporte a SPA
- README finalizado com setup, arquitetura e instrucoes de deploy
- pendente: publicar o site com credenciais do Netlify e registrar o video de demonstracao
