# Deploy do SDR CRM na Netlify

Este documento explica, passo a passo, como publicar o frontend do SDR CRM na Netlify.

## Objetivo

Publicar a aplicação React do projeto para que ela fique acessível publicamente, usando a configuração já preparada em `netlify.toml`.

## O que será publicado

Na Netlify, vamos publicar apenas o frontend:

- origem do código: este repositório
- app publicada: `apps/frontend`
- build real: `npm run build --workspace apps/frontend`
- saída gerada: `apps/frontend/dist`

## Pré-requisitos

Antes de começar, confirme que você já tem:

1. Uma conta na Netlify
2. Acesso ao repositório no GitHub
3. Um backend público funcionando
4. As variáveis de ambiente do frontend em mãos

## Variáveis necessárias

No deploy da Netlify, você precisa configurar estas variáveis:

- `VITE_API_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Exemplo

```env
VITE_API_URL=https://seu-backend-publico.com
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-publica
```

## Passo a passo no painel da Netlify

### 1. Entrar na Netlify

1. Acesse `https://app.netlify.com`
2. Faça login

### 2. Criar um novo site

1. Clique em `Add new site`
2. Clique em `Import an existing project`
3. Escolha `GitHub`
4. Autorize a Netlify, se for solicitado
5. Selecione o repositório `Desenvolvedor-Vibe-Coding-Full-Stack`

### 3. Configurar o build

Na tela de configuração do projeto, preencha:

- `Base directory`: deixe vazio
- `Build command`: `npm run build --workspace apps/frontend`
- `Publish directory`: `apps/frontend/dist`

Se a interface da Netlify mostrar os valores do `netlify.toml`, pode mantê-los como estão.

## 4. Configurar as variáveis de ambiente

Antes de publicar, abra a seção de environment variables e cadastre:

- `VITE_API_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Onde cadastrar

1. Dentro do projeto na Netlify, vá em `Site configuration`
2. Abra `Environment variables`
3. Clique em `Add a variable`
4. Cadastre cada chave com seu valor correspondente

## 5. Iniciar o deploy

1. Clique em `Deploy site`
2. Aguarde o build terminar
3. Verifique se o deploy ficou com status `Published`

## 6. Validar o site publicado

Depois que a Netlify terminar:

1. Abra a URL pública gerada
2. Teste carregamento inicial
3. Acesse rotas como `/auth`, `/dashboard` e `/leads`
4. Confirme se a aplicação não quebra ao atualizar a página
5. Valide se as chamadas para API funcionam normalmente

## Como o roteamento funciona

O projeto usa `React Router` com `BrowserRouter`. Por isso, o deploy precisa de fallback para `index.html`.

Isso já está configurado no arquivo [netlify.toml](../netlify.toml):

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

Sem isso, atualizar páginas internas como `/dashboard` ou `/campaigns` pode retornar erro `404`.

## Rebuild após mudar variáveis

Se você alterar alguma variável de ambiente depois do primeiro deploy:

1. Vá até o projeto na Netlify
2. Abra a aba `Deploys`
3. Clique em `Trigger deploy`
4. Escolha `Deploy site`

As variáveis `VITE_*` são incorporadas no build, então a aplicação precisa ser rebuildada para refletir mudanças.

## Troubleshooting

### A página abre, mas não carrega dados

Possíveis causas:

- `VITE_API_URL` incorreta
- backend fora do ar
- CORS não configurado para a URL publicada

### Erro 404 ao atualizar uma rota

Verifique se o `netlify.toml` foi considerado no deploy e se o redirect para `index.html` está ativo.

### Build falha na Netlify

Confira:

- se o projeto está usando Node 20
- se `npm install` está conseguindo resolver as dependências
- se o comando de build está exatamente como abaixo:

```bash
npm run build --workspace apps/frontend
```

### Login ou sessão não funcionam

Confira:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- configuração do projeto Supabase
- se o domínio da Netlify está aceito nas configurações de autenticação do Supabase

## Checklist final

Antes de considerar o deploy concluído, confirme:

- frontend publicado com sucesso
- URL pública abrindo normalmente
- login funcionando
- dashboard carregando
- leads carregando
- navegação entre rotas funcionando
- refresh da página funcionando sem 404

## Resumo rápido

Se quiser fazer o caminho curto, use estes valores:

- `Build command`: `npm run build --workspace apps/frontend`
- `Publish directory`: `apps/frontend/dist`
- `Environment variables`: `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

Com isso, a Netlify já deve conseguir publicar o frontend do SDR CRM corretamente.
