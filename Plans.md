# SDR CRM — Prova Técnica Vibe Coding Full Stack

Este ExecPlan é um documento vivo. Atualizar o Progress a cada tarefa concluída.

---

## Purpose / Big Picture

Desenvolver um Mini CRM para equipes de SDR (Sales Development Representatives) com geração de mensagens personalizadas via IA.

**Resultado visível:** Aplicação web funcional com autenticação, gestão de leads em kanban, campanhas de abordagem e geração de mensagens via LLM — rodando localmente via Docker e pronta para migração ao Supabase no final.

**Stack:**
- Frontend: React + TypeScript + Tailwind CSS + Shadcn/UI
- Backend: Node.js + Express + TypeScript
- Banco: PostgreSQL (Docker local → Supabase no final)
- Auth: JWT local → Supabase Auth no final
- IA: API da Anthropic (Claude) ou OpenAI
- Infra local: Docker + Docker Compose
- Versionamento: Git + GitHub (commit a cada tarefa)

---

## Progress

### Fase 0 — Setup
- [x] 0.1 Criar repositório no GitHub
- [x] 0.2 Inicializar estrutura do projeto (monorepo)
- [x] 0.3 Configurar Docker Compose (frontend + backend + postgres)
- [x] 0.4 Configurar variáveis de ambiente (.env)
- [x] 0.5 Validar que tudo sobe com `docker compose up`
- [x] 0.6 Commit: `chore: setup inicial do projeto com Docker`

### Fase 1 — Banco de Dados (Migrations)
- [x] 1.1 Migration: tabela `workspaces`
- [x] 1.2 Migration: tabela `users` + relação com workspaces
- [x] 1.3 Migration: tabela `workspace_members` (multi-workspace)
- [x] 1.4 Migration: tabela `leads` (campos padrão)
- [x] 1.5 Migration: tabela `custom_fields` (campos personalizados por workspace)
- [x] 1.6 Migration: tabela `lead_custom_values` (valores dos campos personalizados)
- [x] 1.7 Migration: tabela `funnel_stages` (etapas do funil)
- [x] 1.8 Migration: tabela `stage_required_fields` (campos obrigatórios por etapa)
- [x] 1.9 Migration: tabela `campaigns` (campanhas de abordagem)
- [x] 1.10 Migration: tabela `generated_messages` (mensagens geradas pela IA)
- [x] 1.11 Migration: tabela `activity_logs` (histórico de atividades)
- [x] 1.12 Seed: etapas padrão do funil
- [x] 1.13 Commit: `feat: migrations e seed do banco de dados`

### Fase 2 — Backend (API REST)
- [x] 2.1 Setup Express + TypeScript + middlewares (cors, helmet, morgan)
- [x] 2.2 Rota: POST /auth/register
- [x] 2.3 Rota: POST /auth/login
- [x] 2.4 Middleware de autenticação JWT
- [x] 2.5 Commit: `feat: autenticação JWT (register + login)`
- [x] 2.6 CRUD: workspaces
- [x] 2.7 CRUD: leads (com isolamento por workspace)
- [x] 2.8 CRUD: campos personalizados
- [x] 2.9 Commit: `feat: endpoints de workspaces, leads e campos personalizados`
- [x] 2.10 CRUD: etapas do funil
- [x] 2.11 Rota: PATCH /leads/:id/stage (mover lead com validação de campos obrigatórios)
- [x] 2.12 Commit: `feat: funil de leads com validação de campos obrigatórios`
- [x] 2.13 CRUD: campanhas
- [x] 2.14 Rota: POST /campaigns/:id/generate-messages (geração via LLM)
- [x] 2.15 Rota: POST /leads/:id/send-message (simulado — move lead para "Tentando Contato")
- [x] 2.16 Commit: `feat: campanhas e geração de mensagens via IA`
- [x] 2.17 Lógica: geração automática por etapa gatilho (background)
- [x] 2.18 Commit: `feat: geração automática de mensagens por etapa gatilho`
- [x] 2.19 Rota: GET /dashboard (métricas por workspace)
- [x] 2.20 Commit: `feat: endpoint de dashboard com métricas`

### Fase 3 — Frontend (React)
- [x] 3.1 Setup React + Vite + TypeScript + Tailwind + Shadcn/UI
- [x] 3.2 Configurar React Router + layout base
- [x] 3.3 Configurar Axios + interceptors de autenticação
- [x] 3.4 Commit: `feat: setup frontend com roteamento e autenticação`
- [x] 3.5 Tela: Login e Cadastro
- [x] 3.6 Tela: Criação/seleção de Workspace
- [x] 3.7 Commit: `feat: telas de login, cadastro e workspace`
- [x] 3.8 Tela: Kanban de Leads (drag and drop entre etapas)
- [x] 3.9 Tela: Modal de detalhes/edição do Lead
- [x] 3.10 Tela: Formulário de criação de Lead
- [x] 3.11 Commit: `feat: kanban de leads com drag and drop`
- [x] 3.12 Tela: Gestão de Campos Personalizados
- [x] 3.13 Tela: Configuração de campos obrigatórios por etapa
- [x] 3.14 Commit: `feat: campos personalizados e configuração de etapas`
- [x] 3.15 Tela: Lista e criação de Campanhas
- [x] 3.16 Tela: Geração de mensagens IA dentro do Lead
- [x] 3.17 Tela: Botão "Enviar" simulado (move lead para Tentando Contato)
- [x] 3.18 Commit: `feat: campanhas e geração de mensagens no frontend`
- [x] 3.19 Tela: Dashboard com métricas
- [x] 3.20 Commit: `feat: dashboard com métricas do workspace`

### Fase 4 — Diferenciais
- [x] 4.1 Histórico de atividades por lead
- [x] 4.2 Histórico de mensagens enviadas
- [x] 4.3 Filtros e busca de leads (por responsável, etapa, nome, empresa)
- [x] 4.4 Convite de usuários para o workspace (admin/membro)
- [x] 4.5 Edição de etapas do funil (criar/renomear etapas)
- [x] 4.6 Commit: `feat: diferenciais — histórico, filtros e convite de usuários`

### Fase 5 — Migração para Supabase
- [ ] 5.1 Criar projeto no Supabase
- [ ] 5.2 Rodar as migrations no Supabase (SQL Editor)
- [ ] 5.3 Configurar Supabase Auth (substituir JWT local)
- [ ] 5.4 Configurar RLS (Row Level Security) por workspace
- [ ] 5.5 Migrar Edge Functions (reescrever backend crítico em Deno se necessário)
- [ ] 5.6 Atualizar variáveis de ambiente para apontar ao Supabase
- [ ] 5.7 Testar fluxo completo apontando para Supabase
- [ ] 5.8 Commit: `chore: migração para Supabase (auth, banco, RLS)`

### Fase 6 — Deploy e Entrega
- [ ] 6.1 Deploy do frontend (Vercel ou Netlify)
- [ ] 6.2 Confirmar que o deploy está acessível publicamente
- [ ] 6.3 Escrever README completo
- [ ] 6.4 Gravar vídeo de demonstração (até 10 minutos)
- [ ] 6.5 Commit: `docs: README final e link do vídeo`

---

## Surprises & Discoveries

_(Preencher durante o desenvolvimento)_
- O repositório GitHub já existia com remoto `origin` apontando para `fmoreira85/Desenvolvedor-Vibe-Coding-Full-Stack`, então a Fase 0 partiu da estrutura existente em vez de criar um repositório novo.
- O Docker Desktop estava instalado, mas com o engine parado; foi necessário iniciar o Docker Desktop antes da validação com `docker compose`.
- A porta `5432` do host já estava em uso. Ajustamos o mapeamento local para `5433:5432` via `POSTGRES_PORT` sem alterar a `DATABASE_URL` interna entre containers.
- Centralizamos o schema em `supabase/migrations/0001_initial_schema.sql` e usamos scripts TypeScript no backend para aplicar migrations e seeds localmente, o que reduz divergência entre o ambiente Docker e a futura migração para Supabase.
- O seed das etapas padrão foi validado de forma idempotente: após criar um workspace temporário, duas execuções consecutivas mantiveram exatamente 7 etapas no funil.
- Ao adicionar novas dependências no backend, o volume anônimo de `node_modules` do Docker precisou ser renovado com `--renew-anon-volumes`; sem isso, o container continuava usando pacotes antigos mesmo após rebuild.
- Montar o mesmo router do backend na raiz e em `/api` fez o middleware de autenticação interceptar `/api/auth/*` cedo demais. O ajuste final foi manter o router da aplicação apenas em `/api`.
- A geração de mensagens ganhou fallback local em template quando nenhuma chave de LLM está configurada, o que permitiu validar fluxo completo da Fase 2 sem hard-code de credenciais.
- O frontend passou a usar componentes utilitários no estilo shadcn sobre Tailwind e páginas com React Router; isso acelerou a entrega visual sem depender do CLI oficial do shadcn/UI dentro do ambiente.
- No container do frontend, o `tsconfig` não podia estender `../../tsconfig.base.json`, porque apenas `apps/frontend` é montado em `/app`. A solução foi internalizar a configuração TypeScript no próprio app frontend.
- O build da Fase 3 pegou cedo uma inconsistência de `@apply` com uma utility customizada de focus ring no Tailwind, então padronizamos esses estados usando classes nativas do framework.
- Na Fase 4, o convite de membros foi implementado sobre usuários já cadastrados: o admin convida por email e o backend faz upsert do papel em `workspace_members`, o que cobre convite e ajuste de permissão no mesmo fluxo.
- A edição de leads precisava diferenciar `undefined` de `null` nos campos opcionais. Sem isso, limpar responsável, telefone ou notas no frontend mantinha silenciosamente o valor anterior no banco.
- O histórico por lead ficou mais útil quando a consulta de `activity_logs` passou a fazer join com `users`, permitindo mostrar ator, email e contexto legível para geração e envio de mensagens.

---

## Decision Log

- **Docker primeiro, Supabase depois** — permite desenvolvimento offline, iteração rápida e sem dependência de serviço externo. O PostgreSQL local é 100% compatível com o Supabase.
- **Monorepo (apps/frontend + apps/backend)** — facilita compartilhamento de tipos TypeScript entre frontend e backend, e simplifica o Docker Compose.
- **JWT local na Fase 1** — evita complexidade do Supabase Auth durante o desenvolvimento. A migração é feita apenas na Fase 5, substituindo os endpoints /auth por Supabase Auth SDK.
- **Anthropic Claude como LLM** — API simples, respostas de alta qualidade para geração de mensagens de vendas. Pode ser trocado por OpenAI mudando apenas o adaptador.
- **Shadcn/UI + Tailwind** — componentes prontos e acessíveis, acelera o desenvolvimento do frontend sem reinventar a roda.
- **React DnD ou @dnd-kit** — para o drag and drop do kanban. @dnd-kit é mais moderno e tem suporte melhor a acessibilidade.

---

## Outcomes & Retrospective

_(Preencher ao final)_

---

## Context and Orientation

### Domínio do negócio

SDR (Sales Development Representative) é o profissional responsável pela prospecção e qualificação de leads. O sistema precisa:

1. Organizar leads em um funil visual (Kanban)
2. Permitir campanhas de abordagem com contexto personalizado
3. Gerar mensagens via IA usando os dados de cada lead
4. Controlar qualidade dos dados exigindo campos obrigatórios por etapa

### Etapas padrão do funil

| Ordem | Nome | Descrição |
|-------|------|-----------|
| 1 | Base | Lead recém cadastrado |
| 2 | Lead Mapeado | Informações enriquecidas |
| 3 | Tentando Contato | Em processo de abordagem |
| 4 | Conexão Iniciada | Primeiro contato realizado |
| 5 | Desqualificado | Sem fit ou interesse |
| 6 | Qualificado | Potencial confirmado |
| 7 | Reunião Agendada | Próximo passo definido |

### Multi-tenancy

Cada workspace é isolado. Todos os dados (leads, campanhas, campos personalizados) pertencem a um workspace. Um usuário pode pertencer a múltiplos workspaces.

---

## Plan of Work

### Estrutura de pastas do projeto

```
sdr-crm/
├── docker-compose.yml
├── .env.example
├── apps/
│   ├── frontend/          ← React + Vite + TypeScript
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── hooks/
│   │   │   ├── services/  ← chamadas à API
│   │   │   └── types/
│   │   └── Dockerfile
│   └── backend/           ← Node.js + Express + TypeScript
│       ├── src/
│       │   ├── routes/
│       │   ├── controllers/
│       │   ├── services/
│       │   ├── middlewares/
│       │   ├── db/        ← migrations e queries
│       │   └── types/
│       └── Dockerfile
└── supabase/              ← migrations prontas para o Supabase
    └── migrations/
```

### Schema do banco de dados

```sql
-- Workspaces
workspaces (id, name, created_at)

-- Usuários
users (id, email, password_hash, name, created_at)

-- Membros do workspace (multi-workspace + roles)
workspace_members (id, workspace_id, user_id, role: admin|member, created_at)

-- Etapas do funil
funnel_stages (id, workspace_id, name, order, color, created_at)

-- Campos obrigatórios por etapa
stage_required_fields (id, stage_id, field_name, is_custom_field)

-- Campos personalizados do workspace
custom_fields (id, workspace_id, name, field_type: text|number|select, options, created_at)

-- Leads
leads (id, workspace_id, stage_id, assigned_user_id,
       name, email, phone, company, role, lead_source,
       notes, created_at, updated_at)

-- Valores dos campos personalizados
lead_custom_values (id, lead_id, custom_field_id, value)

-- Campanhas
campaigns (id, workspace_id, name, context, prompt,
           trigger_stage_id, is_active, created_at)

-- Mensagens geradas
generated_messages (id, lead_id, campaign_id,
                    messages: jsonb, generated_at, sent_at)

-- Log de atividades
activity_logs (id, lead_id, workspace_id, user_id,
               action, metadata: jsonb, created_at)
```

---

## Concrete Steps

### Fase 0 — Setup

```bash
# 1. Criar repositório e clonar
git init sdr-crm
cd sdr-crm
git remote add origin https://github.com/SEU_USER/sdr-crm.git

# 2. Criar estrutura de pastas
mkdir -p apps/frontend apps/backend supabase/migrations

# 3. Criar docker-compose.yml
# (Codex deve gerar este arquivo com: postgres, backend, frontend)

# 4. Criar .env.example
# (Codex deve gerar com todas as variáveis necessárias)

# 5. Subir o ambiente
docker compose up --build

# 6. Commit
git add .
git commit -m "chore: setup inicial do projeto com Docker"
git push origin main
```

### Variáveis de ambiente (.env)

```env
# Banco de dados
POSTGRES_USER=sdrcrm
POSTGRES_PASSWORD=sdrcrm123
POSTGRES_DB=sdrcrm
DATABASE_URL=postgresql://sdrcrm:sdrcrm123@postgres:5432/sdrcrm

# Backend
PORT=3001
JWT_SECRET=sua_chave_secreta_aqui

# IA
ANTHROPIC_API_KEY=sk-ant-...
# ou
OPENAI_API_KEY=sk-...

# Frontend
VITE_API_URL=http://localhost:3001

# Supabase (preencher apenas na Fase 5)
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### Docker Compose (estrutura esperada)

```yaml
# O Codex deve gerar o docker-compose.yml completo com:
# - service: postgres (imagem postgres:15, volume persistente)
# - service: backend (build ./apps/backend, porta 3001, depends_on postgres)
# - service: frontend (build ./apps/frontend, porta 5173, depends_on backend)
# - network compartilhada entre os serviços
```

### Prompt para geração de mensagens (LLM)

```
O Codex deve montar o prompt da seguinte forma:

SYSTEM:
  Você é um assistente especializado em gerar mensagens de abordagem
  para equipes de vendas. Gere exatamente 3 variações de mensagem.
  Responda APENAS em JSON: { "messages": ["msg1", "msg2", "msg3"] }

USER:
  ## Contexto da Campanha
  {campaign.context}

  ## Instruções de Geração
  {campaign.prompt}

  ## Dados do Lead
  - Nome: {lead.name}
  - Empresa: {lead.company}
  - Cargo: {lead.role}
  - Telefone: {lead.phone}
  - Origem: {lead.lead_source}
  - Observações: {lead.notes}
  {custom_fields_block}

  Gere 3 variações de mensagem personalizadas para este lead.
```

### Migração para Supabase (Fase 5)

```bash
# 1. Instalar Supabase CLI
npm install -g supabase

# 2. Login
supabase login

# 3. Linkar ao projeto
supabase link --project-ref SEU_PROJECT_REF

# 4. Rodar migrations
supabase db push

# 5. Deploy de Edge Functions (se necessário)
supabase functions deploy nome-da-function

# 6. Atualizar .env com credenciais do Supabase
# 7. Testar fluxo completo
```

### Padrão de commit a cada tarefa

```bash
# Após concluir cada tarefa do Progress:
git add .
git commit -m "feat: descrição da tarefa concluída"
git push origin main

# Tipos de commit:
# feat:  nova funcionalidade
# fix:   correção de bug
# chore: configuração, setup, dependências
# docs:  documentação
# refactor: refatoração sem mudança de comportamento
```

---

## Validation and Acceptance

### Checklist de testes manuais antes da entrega

**Autenticação**
- [ ] Cadastrar novo usuário
- [ ] Fazer login
- [ ] Criar workspace
- [ ] Token expira e redireciona para login

**Leads**
- [ ] Criar lead com campos padrão
- [ ] Criar campo personalizado no workspace
- [ ] Preencher campo personalizado em um lead
- [ ] Mover lead entre etapas no kanban
- [ ] Bloquear movimentação se campo obrigatório vazio
- [ ] Atribuir responsável ao lead

**Campanhas e IA**
- [ ] Criar campanha com contexto e prompt
- [ ] Gerar 3 variações de mensagem para um lead
- [ ] Regenerar mensagens
- [ ] Copiar mensagem gerada
- [ ] Clicar em "Enviar" e lead mover para "Tentando Contato"
- [ ] Configurar etapa gatilho e verificar geração automática

**Dashboard**
- [ ] Ver quantidade de leads por etapa
- [ ] Ver total de leads cadastrados

**GitHub**
- [ ] Repositório público com histórico de commits
- [ ] README completo com todas as seções

---

## Idempotence and Recovery

- As migrations devem usar `CREATE TABLE IF NOT EXISTS` — podem ser re-executadas sem erro
- O seed das etapas padrão deve verificar se já existem antes de inserir (`INSERT ... ON CONFLICT DO NOTHING`)
- Se a geração de mensagens via LLM falhar, salvar o erro no log e permitir retry manual
- O Docker Compose usa volumes nomeados — `docker compose down -v` apaga os dados, `docker compose down` preserva
- Para resetar o banco local: `docker compose down -v && docker compose up --build`

---

## Artifacts and Notes

### Requisitos obrigatórios da prova (checklist final)

- [ ] Autenticação (cadastro + login)
- [ ] Workspaces isolados por usuário
- [ ] Cadastro de leads com campos padrão
- [ ] Campos personalizados por workspace
- [ ] Atribuição de responsável ao lead
- [ ] Kanban com drag and drop
- [ ] Visualização e edição de detalhes do lead
- [ ] Criação de campanhas (nome, contexto, prompt)
- [ ] Geração de 2-3 mensagens via IA por lead
- [ ] Regeneração de mensagens
- [ ] Envio simulado (move para "Tentando Contato")
- [ ] Campos obrigatórios por etapa do funil
- [ ] Dashboard com métricas básicas
- [ ] Repositório GitHub com commits descritivos
- [ ] README completo
- [ ] Aplicação publicada (deploy)
- [ ] Vídeo de até 10 minutos

### Diferenciais (bônus)

- [ ] Geração automática por etapa gatilho
- [ ] Edição de etapas do funil
- [ ] Multi-workspace
- [ ] Convite de usuários (admin/membro)
- [ ] Histórico de atividades
- [ ] Histórico de mensagens enviadas
- [ ] Filtros e busca de leads
- [ ] RLS no Supabase

---

## Interfaces and Dependencies

### Dependências do Backend

```json
{
  "dependencies": {
    "express": "^4.18",
    "typescript": "^5",
    "pg": "^8",
    "jsonwebtoken": "^9",
    "bcryptjs": "^2",
    "cors": "^2",
    "helmet": "^7",
    "dotenv": "^16",
    "@anthropic-ai/sdk": "^0.20"
  }
}
```

### Dependências do Frontend

```json
{
  "dependencies": {
    "react": "^18",
    "react-router-dom": "^6",
    "axios": "^1",
    "@dnd-kit/core": "^6",
    "@dnd-kit/sortable": "^7",
    "tailwindcss": "^3",
    "@shadcn/ui": "latest",
    "lucide-react": "^0.3",
    "react-hot-toast": "^2",
    "zustand": "^4"
  }
}
```

### Contratos de API (principais endpoints)

```
POST   /auth/register
POST   /auth/login

GET    /workspaces
POST   /workspaces

GET    /leads?workspace_id=&stage_id=&search=&assigned_to=
POST   /leads
GET    /leads/:id
PATCH  /leads/:id
PATCH  /leads/:id/stage        ← valida campos obrigatórios
DELETE /leads/:id

GET    /custom-fields?workspace_id=
POST   /custom-fields
DELETE /custom-fields/:id

GET    /funnel-stages?workspace_id=
POST   /funnel-stages
PATCH  /funnel-stages/:id
PATCH  /funnel-stages/:id/required-fields

GET    /campaigns?workspace_id=
POST   /campaigns
PATCH  /campaigns/:id
POST   /campaigns/:id/generate-messages  ← chama LLM

GET    /leads/:id/messages
POST   /leads/:id/send-message           ← simulado

GET    /dashboard?workspace_id=
GET    /activity-logs?lead_id=
```
