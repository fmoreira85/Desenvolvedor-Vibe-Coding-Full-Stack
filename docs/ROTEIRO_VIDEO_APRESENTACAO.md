# Roteiro de Video de Apresentacao

Este documento traz um roteiro pronto para gravar um video explicando o projeto SDR CRM, com fala sugerida e fluxo de navegacao no sistema.

## Objetivo do Video

Apresentar de forma clara:

- o problema que o sistema resolve
- a proposta do produto
- a arquitetura geral
- o fluxo principal de uso
- os diferenciais tecnicos e funcionais

## Duracao Sugerida

- versao curta: 4 a 6 minutos
- versao completa: 7 a 10 minutos

## Estrutura Recomendada

1. abertura e contexto
2. visao geral do produto
3. arquitetura e stack
4. demonstracao do fluxo no sistema
5. destaque de funcionalidades principais
6. encerramento

---

## 1. Abertura

### O que mostrar

- tela inicial do sistema ou login

### Fala sugerida

"Neste video eu vou apresentar o SDR CRM, um mini CRM voltado para equipes de SDR e pre-vendas. A ideia do projeto foi centralizar a operacao comercial em um sistema com autenticacao, workspaces, leads em kanban, campanhas de abordagem e geracao de mensagens com apoio de IA."

"Ao longo da demonstracao eu vou mostrar rapidamente a arquitetura do projeto e depois o fluxo principal de uso dentro da aplicacao."

---

## 2. Visao Geral do Produto

### O que mostrar

- tela de login
- dashboard ou tela principal depois do login

### Fala sugerida

"O sistema foi pensado para organizar a rotina comercial. Cada usuario pode acessar o ambiente, entrar em um workspace, gerenciar leads em etapas do funil, configurar campos personalizados, criar campanhas e gerar mensagens para abordagem."

"O foco foi unir operacao e contexto, deixando o time com uma visao mais clara do pipeline e com mais padronizacao no processo."

---

## 3. Arquitetura e Stack

### O que mostrar

- codigo aberto no editor
- estrutura do monorepo
- pastas `apps/frontend`, `apps/backend` e `supabase`

### Fala sugerida

"O projeto foi construido em formato de monorepo. No frontend eu usei React com TypeScript e Vite. No backend eu usei Node.js com Express, tambem em TypeScript. A autenticacao foi integrada com Supabase Auth, e a estrutura de banco e migracoes fica organizada junto ao projeto."

"O frontend consome uma API propria do backend, e o backend concentra as regras de negocio, acesso aos dados e integracoes."

"Tambem existe uma camada de autenticacao e sessao para conectar o login do Supabase com o contexto interno da aplicacao, como usuario, token e workspaces."

### Resumo tecnico curto

- frontend: React + TypeScript + Vite + Tailwind
- backend: Node.js + Express + TypeScript
- auth: Supabase Auth
- banco: PostgreSQL / Supabase
- deploy frontend: Netlify
- deploy backend: Railway

---

## 4. Fluxo Principal do Sistema

Esta e a parte mais importante da gravacao.

## 4.1 Login e autenticacao

### O que mostrar

- tela de login
- opcionalmente explicar cadastro e confirmacao por email

### Fala sugerida

"O fluxo comeca pela autenticacao. O usuario pode criar a conta, confirmar o email e depois acessar normalmente o sistema. Depois do login, a aplicacao carrega a sessao do usuario e os workspaces disponiveis."

"Essa etapa foi integrada com Supabase Auth, mas o sistema tambem conversa com o backend para montar a sessao da aplicacao."

---

## 4.2 Workspaces

### O que mostrar

- tela de workspaces
- selecao de workspace
- criacao de um novo workspace, se fizer sentido no video

### Fala sugerida

"Depois do login, o usuario entra no conceito de workspace. Isso permite separar times ou operacoes diferentes dentro da mesma plataforma."

"Aqui o usuario pode selecionar um workspace existente ou criar um novo ambiente. Essa separacao ajuda no isolamento dos dados e no controle da operacao por equipe."

---

## 4.3 Dashboard

### O que mostrar

- dashboard com cards e graficos

### Fala sugerida

"Ao entrar no workspace, o usuario visualiza o dashboard principal. Ele resume indicadores como total de leads, campanhas, mensagens geradas e distribuicao dos leads por etapa."

"A proposta do dashboard e dar visibilidade rapida para a operacao, sem o usuario precisar navegar por varias telas."

---

## 4.4 Gestao de Leads

### O que mostrar

- pagina de leads
- filtros
- criacao de lead
- movimentacao no kanban
- abertura do modal de detalhe

### Fala sugerida

"Na tela de leads, o sistema funciona com um kanban operacional. Cada coluna representa uma etapa do funil, e os leads podem ser criados, filtrados e movimentados entre essas etapas."

"Tambem e possivel definir responsavel, preencher informacoes do lead e usar filtros por nome, etapa e usuario."

"Quando eu abro um lead, o sistema mostra os detalhes completos, incluindo dados principais, campos personalizados, historico e mensagens associadas."

"Existe tambem validacao por etapa. Ou seja, o sistema pode impedir que um lead avance no funil se informacoes obrigatorias ainda nao tiverem sido preenchidas."

---

## 4.5 Campos personalizados e configuracoes

### O que mostrar

- pagina de configuracoes
- criacao de campo personalizado
- configuracao de etapas
- membros do workspace

### Fala sugerida

"Na area de configuracoes, o workspace pode ser adaptado para diferentes operacoes. Aqui e possivel criar campos personalizados, ajustar as etapas do funil e definir quais campos sao obrigatorios em cada etapa."

"Tambem existe a area de membros, onde o workspace pode convidar usuarios e atribuir papeis como admin ou member."

"Essa parte e importante porque mostra que o sistema nao e fixo. Ele pode ser ajustado de acordo com a operacao comercial."

---

## 4.6 Campanhas e geracao de mensagens

### O que mostrar

- pagina de campanhas
- criacao de campanha
- selecao de lead
- geracao de mensagens

### Fala sugerida

"Na parte de campanhas, o usuario consegue estruturar abordagens com contexto, prompt e etapa gatilho. Isso ajuda a padronizar a comunicacao comercial."

"A partir de uma campanha e de um lead, o sistema pode gerar tres variacoes de mensagem com apoio de IA. A ideia aqui e acelerar a prospeccao sem perder o contexto do lead e da campanha."

"Depois da geracao, o usuario pode escolher a melhor opcao e registrar o envio dentro do fluxo."

---

## 5. Diferenciais do Projeto

### O que mostrar

- navegar rapidamente entre dashboard, leads, campanhas e configuracoes

### Fala sugerida

"Os principais diferenciais do projeto sao a organizacao por workspace, o kanban operacional com regras de validacao, os campos personalizados, a configuracao do funil e o suporte a campanhas com geracao de mensagens."

"Do ponto de vista tecnico, eu tambem dei atencao especial a autenticacao com Supabase, integracao frontend e backend, controle de sessao e preparacao para deploy em producao."

---

## 6. Encerramento

### O que mostrar

- dashboard ou visao geral final do sistema

### Fala sugerida

"Em resumo, o SDR CRM foi desenvolvido para apoiar a rotina de times de pre-vendas, organizando autenticacao, funil, leads, campanhas e operacao em um unico sistema."

"O projeto combina uma interface web moderna com uma arquitetura full stack em TypeScript, autenticacao com Supabase e deploy em ambiente real."

"Esse foi o panorama geral da solucao. Obrigado por assistir."

---

## Fluxo de Gravacao Recomendado

Se quiser seguir uma ordem objetiva na gravacao, use esta sequencia:

1. abrir a tela inicial e apresentar o objetivo do projeto
2. mostrar rapidamente a estrutura do codigo
3. fazer login
4. mostrar a selecao de workspace
5. abrir o dashboard
6. abrir a tela de leads
7. criar ou abrir um lead
8. mostrar o modal e o historico
9. abrir configuracoes e mostrar customizacao
10. abrir campanhas e gerar mensagens
11. encerrar com resumo tecnico e funcional

---

## Versao Curta de Fala

Se quiser um resumo mais direto para um video curto:

"Este projeto e o SDR CRM, uma aplicacao full stack para equipes de SDR. Ele foi construido com React, TypeScript, Node.js, Express e Supabase Auth. O sistema permite autenticar usuarios, organizar workspaces, gerenciar leads em um kanban, configurar etapas do funil, criar campanhas e gerar mensagens com IA. O objetivo foi unir operacao comercial, contexto e produtividade em um unico ambiente."

---

## Dicas para Gravacao

- grave com zoom de interface em tamanho confortavel
- deixe um usuario e workspace ja preparados
- evite depender de fluxo externo durante a gravacao, como email real de confirmacao
- se possivel, deixe alguns leads e campanhas cadastrados antes
- ensaie a transicao entre telas para manter o ritmo
- fale em blocos curtos e objetivos

## Dicas de Ordem para Nao Travar no Video

- primeiro grave a demonstracao do sistema
- depois grave a explicacao tecnica
- por ultimo grave a abertura e o encerramento

Assim, se precisar refazer alguma parte, voce nao perde o video inteiro.
