# SDR CRM â€” Prova TÃ©cnica Vibe Coding Full Stack

Este ExecPlan Ã© um documento vivo. Atualizar o Progress a cada tarefa concluÃ­da.

---

## Purpose / Big Picture

Desenvolver um Mini CRM para equipes de SDR (Sales Development Representatives) com geraÃ§Ã£o de mensagens personalizadas via IA.

**Resultado visÃ­vel:** AplicaÃ§Ã£o web funcional com autenticaÃ§Ã£o, gestÃ£o de leads em kanban, campanhas de abordagem e geraÃ§Ã£o de mensagens via LLM â€” rodando localmente via Docker e pronta para migraÃ§Ã£o ao Supabase no final.

**Stack:**
- Frontend: React + TypeScript + Tailwind CSS + Shadcn/UI
- Backend: Node.js + Express + TypeScript
- Banco: PostgreSQL (Docker local â†’ Supabase no final)
- Auth: JWT local â†’ Supabase Auth no final
- IA: API da Anthropic (Claude) ou OpenAI
- Infra local: Docker + Docker Compose
- Versionamento: Git + GitHub (commit a cada tarefa)

---

## Progress

### Fase 0 â€” Setup
- [x] 0.1 Criar repositÃ³rio no GitHub
- [x] 0.2 Inicializar estrutura do projeto (monorepo)
- [x] 0.3 Configurar Docker Compose (frontend + backend + postgres)
- [x] 0.4 Configurar variÃ¡veis de ambiente (.env)
- [x] 0.5 Validar que tudo sobe com `docker compose up`
- [x] 0.6 Commit: `chore: setup inicial do projeto com Docker`

### Fase 1 â€” Banco de Dados (Migrations)
- [x] 1.1 Migration: tabela `workspaces`
- [x] 1.2 Migration: tabela `users` + relaÃ§Ã£o com workspaces
- [x] 1.3 Migration: tabela `workspace_members` (multi-workspace)
- [x] 1.4 Migration: tabela `leads` (campos padrÃ£o)
- [x] 1.5 Migration: tabela `custom_fields` (campos personalizados por workspace)
- [x] 1.6 Migration: tabela `lead_custom_values` (valores dos campos personalizados)
- [x] 1.7 Migration: tabela `funnel_stages` (etapas do funil)
- [x] 1.8 Migration: tabela `stage_required_fields` (campos obrigatÃ³rios por etapa)
- [x] 1.9 Migration: tabela `campaigns` (campanhas de abordagem)
- [x] 1.10 Migration: tabela `generated_messages` (mensagens geradas pela IA)
- [x] 1.11 Migration: tabela `activity_logs` (histÃ³rico de atividades)
- [x] 1.12 Seed: etapas padrÃ£o do funil
- [x] 1.13 Commit: `feat: migrations e seed do banco de dados`

### Fase 2 â€” Backend (API REST)
- [x] 2.1 Setup Express + TypeScript + middlewares (cors, helmet, morgan)
- [x] 2.2 Rota: POST /auth/register
- [x] 2.3 Rota: POST /auth/login
- [x] 2.4 Middleware de autenticaÃ§Ã£o JWT
- [x] 2.5 Commit: `feat: autenticaÃ§Ã£o JWT (register + login)`
- [x] 2.6 CRUD: workspaces
- [x] 2.7 CRUD: leads (com isolamento por workspace)
- [x] 2.8 CRUD: campos personalizados
- [x] 2.9 Commit: `feat: endpoints de workspaces, leads e campos personalizados`
- [x] 2.10 CRUD: etapas do funil
- [x] 2.11 Rota: PATCH /leads/:id/stage (mover lead com validaÃ§Ã£o de campos obrigatÃ³rios)
- [x] 2.12 Commit: `feat: funil de leads com validaÃ§Ã£o de campos obrigatÃ³rios`
- [x] 2.13 CRUD: campanhas
- [x] 2.14 Rota: POST /campaigns/:id/generate-messages (geraÃ§Ã£o via LLM)
- [x] 2.15 Rota: POST /leads/:id/send-message (simulado â€” move lead para "Tentando Contato")
- [x] 2.16 Commit: `feat: campanhas e geraÃ§Ã£o de mensagens via IA`
- [x] 2.17 LÃ³gica: geraÃ§Ã£o automÃ¡tica por etapa gatilho (background)
- [x] 2.18 Commit: `feat: geraÃ§Ã£o automÃ¡tica de mensagens por etapa gatilho`
- [x] 2.19 Rota: GET /dashboard (mÃ©tricas por workspace)
- [x] 2.20 Commit: `feat: endpoint de dashboard com mÃ©tricas`

### Fase 3 â€” Frontend (React)
- [x] 3.1 Setup React + Vite + TypeScript + Tailwind + Shadcn/UI
- [x] 3.2 Configurar React Router + layout base
- [x] 3.3 Configurar Axios + interceptors de autenticaÃ§Ã£o
- [x] 3.4 Commit: `feat: setup frontend com roteamento e autenticaÃ§Ã£o`
- [x] 3.5 Tela: Login e Cadastro
- [x] 3.6 Tela: CriaÃ§Ã£o/seleÃ§Ã£o de Workspace
- [x] 3.7 Commit: `feat: telas de login, cadastro e workspace`
- [x] 3.8 Tela: Kanban de Leads (drag and drop entre etapas)
- [x] 3.9 Tela: Modal de detalhes/ediÃ§Ã£o do Lead
- [x] 3.10 Tela: FormulÃ¡rio de criaÃ§Ã£o de Lead
- [x] 3.11 Commit: `feat: kanban de leads com drag and drop`
- [x] 3.12 Tela: GestÃ£o de Campos Personalizados
- [x] 3.13 Tela: ConfiguraÃ§Ã£o de campos obrigatÃ³rios por etapa
- [x] 3.14 Commit: `feat: campos personalizados e configuraÃ§Ã£o de etapas`
- [x] 3.15 Tela: Lista e criaÃ§Ã£o de Campanhas
- [x] 3.16 Tela: GeraÃ§Ã£o de mensagens IA dentro do Lead
- [x] 3.17 Tela: BotÃ£o "Enviar" simulado (move lead para Tentando Contato)
- [x] 3.18 Commit: `feat: campanhas e geraÃ§Ã£o de mensagens no frontend`
- [x] 3.19 Tela: Dashboard com mÃ©tricas
- [x] 3.20 Commit: `feat: dashboard com mÃ©tricas do workspace`

### Fase 3B Design
- [x] 3B.1 Configurar tokens de design em globals.css e tailwind.config.ts
- [x] 3B.2 Instalar dependencias: sonner, recharts, cmdk, class-variance-authority
- [x] 3B.3 Criar AppLayout.tsx com Sidebar (dark) + Navbar (light) + Outlet
- [x] 3B.4 Sidebar: nav items com icones Lucide, active state, user menu
- [x] 3B.5 Navbar: workspace selector, busca (cmdk), avatar dropdown
- [x] 3B.6 Sidebar responsiva: Sheet no mobile, colapsada no tablet
- [x] 3B.7 Dashboard: 4 KPI Cards com icones e trend badges
- [x] 3B.8 Dashboard: BarChart horizontal (leads por etapa) via Recharts
- [x] 3B.9 Dashboard: AreaChart semanal (leads criados) via Recharts
- [x] 3B.10 Dashboard: tabela dos 5 leads mais recentes
- [x] 3B.11 Kanban: toolbar de filtros (busca, etapa, responsavel)
- [x] 3B.12 Kanban: colunas com header colorido, badge count e drop zone visual
- [x] 3B.13 LeadCard: empresa, fonte, avatar responsavel, icone IA
- [x] 3B.14 LeadDetailModal: formulario completo com custom fields
- [x] 3B.15 LeadDetailModal: secao de mensagens IA com copiar/enviar
- [x] 3B.16 LeadDetailModal: timeline de historico (activity_logs)
- [x] 3B.17 Campanhas: grid de cards com status, toggle ativo, Sheet de edicao
- [x] 3B.18 Campanhas: fluxo geracao IA com skeleton loading e 3 cards de resultado
- [x] 3B.19 Configuracoes: Tabs com 4 secoes
- [x] 3B.20 Configuracoes: CRUD de campos personalizados com Badge de tipo
- [x] 3B.21 Configuracoes: etapas do funil drag-and-drop + required fields collapsible
- [x] 3B.22 Configuracoes: gestao de membros com convite por email
- [x] 3B.23 Auth: split layout dark/light para Login e Cadastro
- [x] 3B.24 Globais: Empty states em todas as listas
- [x] 3B.25 Globais: Skeleton loading em cards, tabelas e kanban
- [x] 3B.26 Globais: AlertDialog para todas as acoes destrutivas
- [x] 3B.27 Commit: `feat: fase 3B - design SaaS light clean completo`

### Fase 4 â€” Diferenciais
- [x] 4.1 HistÃ³rico de atividades por lead
- [x] 4.2 HistÃ³rico de mensagens enviadas
- [x] 4.3 Filtros e busca de leads (por responsÃ¡vel, etapa, nome, empresa)
- [x] 4.4 Convite de usuÃ¡rios para o workspace (admin/membro)
- [x] 4.5 EdiÃ§Ã£o de etapas do funil (criar/renomear etapas)
- [x] 4.6 Commit: `feat: diferenciais â€” histÃ³rico, filtros e convite de usuÃ¡rios`

### Fase 5 â€” MigraÃ§Ã£o para Supabase
- [x] 5.1 Criar projeto no Supabase
- [x] 5.2 Rodar as migrations no Supabase (SQL Editor)
- [x] 5.3 Configurar Supabase Auth (substituir JWT local)
- [x] 5.4 Configurar RLS (Row Level Security) por workspace
- [x] 5.5 Migrar Edge Functions (reescrever backend crÃ­tico em Deno se necessÃ¡rio)
- [x] 5.6 Atualizar variÃ¡veis de ambiente para apontar ao Supabase
- [x] 5.7 Testar fluxo completo apontando para Supabase
- [x] 5.8 Commit: `chore: migraÃ§Ã£o para Supabase (auth, banco, RLS)`

### Fase 6 â€” Deploy e Entrega
- [ ] 6.1 Deploy do frontend ( Netlify)
- [ ] 6.2 Confirmar que o deploy estÃ¡ acessÃ­vel publicamente
- [x] 6.3 Escrever README completo
- [ ] 6.4 Gravar vÃ­deo de demonstraÃ§Ã£o (atÃ© 10 minutos)
- [ ] 6.5 Commit: `docs: README final e link do vÃ­deo`

---

## Surprises & Discoveries

_(Preencher durante o desenvolvimento)_
- O repositÃ³rio GitHub jÃ¡ existia com remoto `origin` apontando para `fmoreira85/Desenvolvedor-Vibe-Coding-Full-Stack`, entÃ£o a Fase 0 partiu da estrutura existente em vez de criar um repositÃ³rio novo.
- O Docker Desktop estava instalado, mas com o engine parado; foi necessÃ¡rio iniciar o Docker Desktop antes da validaÃ§Ã£o com `docker compose`.
- A porta `5432` do host jÃ¡ estava em uso. Ajustamos o mapeamento local para `5433:5432` via `POSTGRES_PORT` sem alterar a `DATABASE_URL` interna entre containers.
- Centralizamos o schema em `supabase/migrations/0001_initial_schema.sql` e usamos scripts TypeScript no backend para aplicar migrations e seeds localmente, o que reduz divergÃªncia entre o ambiente Docker e a futura migraÃ§Ã£o para Supabase.
- O seed das etapas padrÃ£o foi validado de forma idempotente: apÃ³s criar um workspace temporÃ¡rio, duas execuÃ§Ãµes consecutivas mantiveram exatamente 7 etapas no funil.
- Ao adicionar novas dependÃªncias no backend, o volume anÃ´nimo de `node_modules` do Docker precisou ser renovado com `--renew-anon-volumes`; sem isso, o container continuava usando pacotes antigos mesmo apÃ³s rebuild.
- Montar o mesmo router do backend na raiz e em `/api` fez o middleware de autenticaÃ§Ã£o interceptar `/api/auth/*` cedo demais. O ajuste final foi manter o router da aplicaÃ§Ã£o apenas em `/api`.
- A geraÃ§Ã£o de mensagens ganhou fallback local em template quando nenhuma chave de LLM estÃ¡ configurada, o que permitiu validar fluxo completo da Fase 2 sem hard-code de credenciais.
- O frontend passou a usar componentes utilitÃ¡rios no estilo shadcn sobre Tailwind e pÃ¡ginas com React Router; isso acelerou a entrega visual sem depender do CLI oficial do shadcn/UI dentro do ambiente.
- No container do frontend, o `tsconfig` nÃ£o podia estender `../../tsconfig.base.json`, porque apenas `apps/frontend` Ã© montado em `/app`. A soluÃ§Ã£o foi internalizar a configuraÃ§Ã£o TypeScript no prÃ³prio app frontend.
- O build da Fase 3 pegou cedo uma inconsistÃªncia de `@apply` com uma utility customizada de focus ring no Tailwind, entÃ£o padronizamos esses estados usando classes nativas do framework.
- Na Fase 4, o convite de membros foi implementado sobre usuÃ¡rios jÃ¡ cadastrados: o admin convida por email e o backend faz upsert do papel em `workspace_members`, o que cobre convite e ajuste de permissÃ£o no mesmo fluxo.
- A ediÃ§Ã£o de leads precisava diferenciar `undefined` de `null` nos campos opcionais. Sem isso, limpar responsÃ¡vel, telefone ou notas no frontend mantinha silenciosamente o valor anterior no banco.
- O histÃ³rico por lead ficou mais Ãºtil quando a consulta de `activity_logs` passou a fazer join com `users`, permitindo mostrar ator, email e contexto legÃ­vel para geraÃ§Ã£o e envio de mensagens.

---

## Decision Log

- **Docker primeiro, Supabase depois** â€” permite desenvolvimento offline, iteraÃ§Ã£o rÃ¡pida e sem dependÃªncia de serviÃ§o externo. O PostgreSQL local Ã© 100% compatÃ­vel com o Supabase.
- **Monorepo (apps/frontend + apps/backend)** â€” facilita compartilhamento de tipos TypeScript entre frontend e backend, e simplifica o Docker Compose.
- **JWT local na Fase 1** â€” evita complexidade do Supabase Auth durante o desenvolvimento. A migraÃ§Ã£o Ã© feita apenas na Fase 5, substituindo os endpoints /auth por Supabase Auth SDK.
- **Anthropic Claude como LLM** â€” API simples, respostas de alta qualidade para geraÃ§Ã£o de mensagens de vendas. Pode ser trocado por OpenAI mudando apenas o adaptador.
- A CLI do Supabase deixou de suportar `npm install -g supabase`; nesta fase o caminho estÃ¡vel foi adicionar `supabase` ao monorepo e usar `npx supabase ...`.
- Os scripts do backend executados via `npm run --workspace apps/backend ...` nÃ£o enxergavam automaticamente o `.env` da raiz do monorepo. Criamos um bootstrap de ambiente que procura `.env` no diretÃ³rio atual e tambÃ©m na raiz.
- O host direto `db.<project-ref>.supabase.co` nÃ£o respondeu neste ambiente. O `pooler` do Supabase continuou sendo a opÃ§Ã£o correta para `DATABASE_URL`, mas a validaÃ§Ã£o da Fase 5 passou a usar `@supabase/supabase-js` nas rotas crÃ­ticas do backend para evitar dependÃªncia do `pg`.
- O client server-side do Supabase em Node 20 precisou de `ws` injetado explicitamente no helper compartilhado do backend; sem isso, a inicializaÃ§Ã£o do client falhava ao montar o Realtime internamente.
- O Docker Desktop ficou indisponÃ­vel no fim da fase, entÃ£o o smoke test final apontando para o Supabase foi validado com o backend rodando localmente via `npm run dev --workspace apps/backend`.
- A Fase 6 ficou parcialmente bloqueada neste ambiente porque o deploy no Netlify exige credenciais externas (`NETLIFY_AUTH_TOKEN` e `NETLIFY_SITE_ID`) que nÃ£o estavam configuradas no shell.
- **Shadcn/UI + Tailwind** â€” componentes prontos e acessÃ­veis, acelera o desenvolvimento do frontend sem reinventar a roda.
- **React DnD ou @dnd-kit** â€” para o drag and drop do kanban. @dnd-kit Ã© mais moderno e tem suporte melhor a acessibilidade.

---

## Outcomes & Retrospective

_(Preencher ao final)_

---

## Context and Orientation

### DomÃ­nio do negÃ³cio

SDR (Sales Development Representative) Ã© o profissional responsÃ¡vel pela prospecÃ§Ã£o e qualificaÃ§Ã£o de leads. O sistema precisa:

1. Organizar leads em um funil visual (Kanban)
2. Permitir campanhas de abordagem com contexto personalizado
3. Gerar mensagens via IA usando os dados de cada lead
4. Controlar qualidade dos dados exigindo campos obrigatÃ³rios por etapa

### Etapas padrÃ£o do funil

| Ordem | Nome | DescriÃ§Ã£o |
|-------|------|-----------|
| 1 | Base | Lead recÃ©m cadastrado |
| 2 | Lead Mapeado | InformaÃ§Ãµes enriquecidas |
| 3 | Tentando Contato | Em processo de abordagem |
| 4 | ConexÃ£o Iniciada | Primeiro contato realizado |
| 5 | Desqualificado | Sem fit ou interesse |
| 6 | Qualificado | Potencial confirmado |
| 7 | ReuniÃ£o Agendada | PrÃ³ximo passo definido |

### Multi-tenancy

Cada workspace Ã© isolado. Todos os dados (leads, campanhas, campos personalizados) pertencem a um workspace. Um usuÃ¡rio pode pertencer a mÃºltiplos workspaces.

---

## Plan of Work

### Estrutura de pastas do projeto

```
sdr-crm/
â”œâ”€â”€ docker-compose.yml
â”œâ”€â”€ .env.example
â”œâ”€â”€ apps/
â”‚   â”œâ”€â”€ frontend/          â† React + Vite + TypeScript
â”‚   â”‚   â”œâ”€â”€ src/
â”‚   â”‚   â”‚   â”œâ”€â”€ components/
â”‚   â”‚   â”‚   â”œâ”€â”€ pages/
â”‚   â”‚   â”‚   â”œâ”€â”€ hooks/
â”‚   â”‚   â”‚   â”œâ”€â”€ services/  â† chamadas Ã  API
â”‚   â”‚   â”‚   â””â”€â”€ types/
â”‚   â”‚   â””â”€â”€ Dockerfile
â”‚   â””â”€â”€ backend/           â† Node.js + Express + TypeScript
â”‚       â”œâ”€â”€ src/
â”‚       â”‚   â”œâ”€â”€ routes/
â”‚       â”‚   â”œâ”€â”€ controllers/
â”‚       â”‚   â”œâ”€â”€ services/
â”‚       â”‚   â”œâ”€â”€ middlewares/
â”‚       â”‚   â”œâ”€â”€ db/        â† migrations e queries
â”‚       â”‚   â””â”€â”€ types/
â”‚       â””â”€â”€ Dockerfile
â””â”€â”€ supabase/              â† migrations prontas para o Supabase
    â””â”€â”€ migrations/
```

### Schema do banco de dados

```sql
-- Workspaces
workspaces (id, name, created_at)

-- UsuÃ¡rios
users (id, email, password_hash, name, created_at)

-- Membros do workspace (multi-workspace + roles)
workspace_members (id, workspace_id, user_id, role: admin|member, created_at)

-- Etapas do funil
funnel_stages (id, workspace_id, name, order, color, created_at)

-- Campos obrigatÃ³rios por etapa
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

### Fase 0 â€” Setup

```bash
# 1. Criar repositÃ³rio e clonar
git init sdr-crm
cd sdr-crm
git remote add origin https://github.com/SEU_USER/sdr-crm.git

# 2. Criar estrutura de pastas
mkdir -p apps/frontend apps/backend supabase/migrations

# 3. Criar docker-compose.yml
# (Codex deve gerar este arquivo com: postgres, backend, frontend)

# 4. Criar .env.example
# (Codex deve gerar com todas as variÃ¡veis necessÃ¡rias)

# 5. Subir o ambiente
docker compose up --build

# 6. Commit
git add .
git commit -m "chore: setup inicial do projeto com Docker"
git push origin main
```

### VariÃ¡veis de ambiente (.env)

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
# - network compartilhada entre os serviÃ§os
```

### Prompt para geraÃ§Ã£o de mensagens (LLM)

```
O Codex deve montar o prompt da seguinte forma:

SYSTEM:
  VocÃª Ã© um assistente especializado em gerar mensagens de abordagem
  para equipes de vendas. Gere exatamente 3 variaÃ§Ãµes de mensagem.
  Responda APENAS em JSON: { "messages": ["msg1", "msg2", "msg3"] }

USER:
  ## Contexto da Campanha
  {campaign.context}

  ## InstruÃ§Ãµes de GeraÃ§Ã£o
  {campaign.prompt}

  ## Dados do Lead
  - Nome: {lead.name}
  - Empresa: {lead.company}
  - Cargo: {lead.role}
  - Telefone: {lead.phone}
  - Origem: {lead.lead_source}
  - ObservaÃ§Ãµes: {lead.notes}
  {custom_fields_block}

  Gere 3 variaÃ§Ãµes de mensagem personalizadas para este lead.
```

### MigraÃ§Ã£o para Supabase (Fase 5)

```bash
# 1. Instalar Supabase CLI
npm install -g supabase

# 2. Login
supabase login

# 3. Linkar ao projeto
supabase link --project-ref SEU_PROJECT_REF

# 4. Rodar migrations
supabase db push

# 5. Deploy de Edge Functions (se necessÃ¡rio)
supabase functions deploy nome-da-function

# 6. Atualizar .env com credenciais do Supabase
# 7. Testar fluxo completo
```

### PadrÃ£o de commit a cada tarefa

```bash
# ApÃ³s concluir cada tarefa do Progress:
git add .
git commit -m "feat: descriÃ§Ã£o da tarefa concluÃ­da"
git push origin main

# Tipos de commit:
# feat:  nova funcionalidade
# fix:   correÃ§Ã£o de bug
# chore: configuraÃ§Ã£o, setup, dependÃªncias
# docs:  documentaÃ§Ã£o
# refactor: refatoraÃ§Ã£o sem mudanÃ§a de comportamento
```

---

## Validation and Acceptance

### Checklist de testes manuais antes da entrega

**AutenticaÃ§Ã£o**
- [ ] Cadastrar novo usuÃ¡rio
- [ ] Fazer login
- [ ] Criar workspace
- [ ] Token expira e redireciona para login

**Leads**
- [ ] Criar lead com campos padrÃ£o
- [ ] Criar campo personalizado no workspace
- [ ] Preencher campo personalizado em um lead
- [ ] Mover lead entre etapas no kanban
- [ ] Bloquear movimentaÃ§Ã£o se campo obrigatÃ³rio vazio
- [ ] Atribuir responsÃ¡vel ao lead

**Campanhas e IA**
- [ ] Criar campanha com contexto e prompt
- [ ] Gerar 3 variaÃ§Ãµes de mensagem para um lead
- [ ] Regenerar mensagens
- [ ] Copiar mensagem gerada
- [ ] Clicar em "Enviar" e lead mover para "Tentando Contato"
- [ ] Configurar etapa gatilho e verificar geraÃ§Ã£o automÃ¡tica

**Dashboard**
- [ ] Ver quantidade de leads por etapa
- [ ] Ver total de leads cadastrados

**GitHub**
- [ ] RepositÃ³rio pÃºblico com histÃ³rico de commits
- [ ] README completo com todas as seÃ§Ãµes

---

## Idempotence and Recovery

- As migrations devem usar `CREATE TABLE IF NOT EXISTS` â€” podem ser re-executadas sem erro
- O seed das etapas padrÃ£o deve verificar se jÃ¡ existem antes de inserir (`INSERT ... ON CONFLICT DO NOTHING`)
- Se a geraÃ§Ã£o de mensagens via LLM falhar, salvar o erro no log e permitir retry manual
- O Docker Compose usa volumes nomeados â€” `docker compose down -v` apaga os dados, `docker compose down` preserva
- Para resetar o banco local: `docker compose down -v && docker compose up --build`

---

## Artifacts and Notes

### Requisitos obrigatÃ³rios da prova (checklist final)

- [ ] AutenticaÃ§Ã£o (cadastro + login)
- [ ] Workspaces isolados por usuÃ¡rio
- [ ] Cadastro de leads com campos padrÃ£o
- [ ] Campos personalizados por workspace
- [ ] AtribuiÃ§Ã£o de responsÃ¡vel ao lead
- [ ] Kanban com drag and drop
- [ ] VisualizaÃ§Ã£o e ediÃ§Ã£o de detalhes do lead
- [ ] CriaÃ§Ã£o de campanhas (nome, contexto, prompt)
- [ ] GeraÃ§Ã£o de 2-3 mensagens via IA por lead
- [ ] RegeneraÃ§Ã£o de mensagens
- [ ] Envio simulado (move para "Tentando Contato")
- [ ] Campos obrigatÃ³rios por etapa do funil
- [ ] Dashboard com mÃ©tricas bÃ¡sicas
- [ ] RepositÃ³rio GitHub com commits descritivos
- [ ] README completo
- [ ] AplicaÃ§Ã£o publicada (deploy)
- [ ] VÃ­deo de atÃ© 10 minutos

### Diferenciais (bÃ´nus)

- [ ] GeraÃ§Ã£o automÃ¡tica por etapa gatilho
- [ ] EdiÃ§Ã£o de etapas do funil
- [ ] Multi-workspace
- [ ] Convite de usuÃ¡rios (admin/membro)
- [ ] HistÃ³rico de atividades
- [ ] HistÃ³rico de mensagens enviadas
- [ ] Filtros e busca de leads
- [ ] RLS no Supabase

---

## Interfaces and Dependencies

### DependÃªncias do Backend

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

### DependÃªncias do Frontend

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
PATCH  /leads/:id/stage        â† valida campos obrigatÃ³rios
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
POST   /campaigns/:id/generate-messages  â† chama LLM

GET    /leads/:id/messages
POST   /leads/:id/send-message           â† simulado

GET    /dashboard?workspace_id=
GET    /activity-logs?lead_id=
```
