# Roteiro de Video Obrigatorio

Este roteiro foi preparado com base no requisito:

- video de ate 10 minutos
- visao geral da aplicacao e funcionalidades implementadas
- fluxo principal: cadastro -> criar lead -> gerar mensagem com IA
- decisoes tecnicas relevantes
- diferenciais implementados

## Estrutura Recomendada

1. abertura
2. visao geral da aplicacao
3. demonstracao do fluxo principal
4. decisoes tecnicas relevantes
5. diferenciais implementados
6. encerramento

## Duracao Sugerida

- abertura: 30 segundos
- visao geral: 1 minuto
- fluxo principal: 4 a 5 minutos
- decisoes tecnicas: 2 minutos
- diferenciais: 1 minuto
- encerramento: 30 segundos

Tempo total estimado: 8 a 10 minutos

---

## Roteiro Pronto Para Falar

## 1. Abertura

### O que mostrar

- tela inicial do sistema ou login

### Fala sugerida

"Neste video eu vou apresentar o projeto SDR CRM, uma aplicacao web voltada para equipes de SDR e pre-vendas. A proposta do sistema e organizar a operacao comercial em um unico ambiente, com autenticacao, workspaces, leads em kanban, campanhas e geracao de mensagens com IA."

"Eu vou mostrar primeiro uma visao geral da aplicacao, depois o fluxo principal de uso, que vai de cadastro ate a geracao de mensagem com IA, e no final vou destacar algumas decisoes tecnicas e diferenciais implementados."

---

## 2. Visao Geral da Aplicacao e Funcionalidades

### O que mostrar

- navegar rapidamente entre login, dashboard, leads, campanhas e configuracoes

### Fala sugerida

"O sistema possui autenticacao de usuarios, organizacao por workspace, dashboard com metricas, gestao de leads em formato kanban, configuracao de etapas do funil, campos personalizados, convite de membros e campanhas com geracao de mensagens."

"Na pratica, a ideia foi criar uma base de operacao comercial onde o time consegue visualizar o pipeline, registrar contexto dos leads e padronizar abordagens."

"O dashboard resume indicadores importantes. A tela de leads concentra a operacao diaria. A area de configuracoes permite adaptar o workspace. E a parte de campanhas conecta contexto comercial com geracao assistida por IA."

---

## 3. Fluxo Principal Obrigatorio

Este e o bloco mais importante do video.

## 3.1 Cadastro

### O que mostrar

- tela de cadastro
- preenchimento de nome, email e senha
- se quiser, explicar rapidamente que existe confirmacao por email

### Fala sugerida

"O fluxo principal comeca no cadastro. O usuario informa nome, email e senha para criar uma conta no sistema."

"A autenticacao foi integrada com Supabase Auth. Isso permite um fluxo mais seguro de criacao de conta e confirmacao de email."

"Depois da confirmacao, o usuario consegue acessar a aplicacao normalmente."

Se voce nao quiser depender de email real durante a gravacao:

"Para a demonstracao, eu vou seguir com um usuario ja confirmado para focar no fluxo funcional dentro da plataforma."

---

## 3.2 Login e entrada no sistema

### O que mostrar

- tela de login
- entrada do usuario

### Fala sugerida

"Depois do cadastro, o usuario faz login e entra no sistema. Nesse momento, a aplicacao carrega a sessao do usuario e os workspaces aos quais ele tem acesso."

"Esse passo conecta a autenticacao do Supabase com a sessao interna da aplicacao, que inclui informacoes como usuario, token e workspaces."

---

## 3.3 Workspace

### O que mostrar

- tela de workspaces
- selecionar um workspace ou criar um novo

### Fala sugerida

"Depois do login, o sistema trabalha com o conceito de workspace. Isso permite separar operacoes e times, mantendo os dados organizados por ambiente."

"Aqui o usuario pode selecionar um workspace existente ou criar um novo workspace para iniciar a operacao."

---

## 3.4 Criar lead

### O que mostrar

- entrar na tela de leads
- mostrar o kanban
- abrir o painel de novo lead
- preencher campos principais
- criar o lead

### Fala sugerida

"Agora eu entro na tela de leads, que funciona como um kanban operacional. Cada coluna representa uma etapa do funil."

"No painel lateral, eu consigo criar um novo lead com informacoes como nome, empresa, email, telefone, cargo, origem, etapa inicial, responsavel e observacoes."

"Tambem e possivel trabalhar com campos personalizados, dependendo da configuracao do workspace."

"Ao salvar, o lead entra no pipeline e passa a fazer parte da operacao."

---

## 3.5 Visualizar e gerenciar lead

### O que mostrar

- clicar no lead criado
- abrir modal
- mostrar dados do lead, etapa, historico e mensagens

### Fala sugerida

"Ao abrir um lead, o sistema mostra um modal com os detalhes completos. Aqui eu consigo editar informacoes, trocar responsavel, mover etapa e acompanhar o historico de interacoes."

"Esse ponto e importante porque centraliza o contexto do lead em um unico lugar."

---

## 3.6 Gerar mensagem com IA

### O que mostrar

- abrir a area de campanhas ou a geracao dentro do modal do lead
- selecionar campanha
- clicar em gerar mensagens
- mostrar as tres variacoes

### Fala sugerida

"Com o lead criado, eu posso usar uma campanha para gerar mensagens com IA. A campanha define contexto, prompt e, em alguns casos, etapa gatilho."

"Ao selecionar uma campanha e gerar mensagens, o sistema produz tres variacoes personalizadas para esse lead."

"A ideia aqui e acelerar a abordagem comercial, mas mantendo contexto e padronizacao no processo."

"Depois disso, o usuario pode copiar a melhor mensagem ou registrar o envio dentro do proprio sistema."

---

## 4. Decisoes Tecnicas Relevantes

### O que mostrar

- editor com estrutura do projeto
- pastas do frontend, backend e supabase

### Fala sugerida

"Em relacao as decisoes tecnicas, o projeto foi estruturado como monorepo. O frontend foi construido com React, TypeScript e Vite, enquanto o backend foi feito com Node.js, Express e TypeScript."

"A autenticacao foi integrada com Supabase Auth. Essa escolha ajudou a simplificar o fluxo de cadastro, login, confirmacao de email e sessao."

"Outra decisao importante foi separar bem o frontend da API. O frontend cuida da experiencia do usuario e o backend centraliza regras de negocio, validacoes e acesso aos dados."

"Tambem houve preocupacao com deploy em ambiente real, usando Netlify no frontend e Railway no backend."

### Resumo tecnico curto

- frontend com React, Vite e Tailwind
- backend com Express e TypeScript
- autenticacao com Supabase
- estrutura preparada para producao
- separacao clara entre interface e regras de negocio

---

## 5. Diferenciais Implementados

### O que mostrar

- tela de configuracoes
- funil configuravel
- campos personalizados
- campanhas

### Fala sugerida

"Como diferenciais, eu destacaria primeiro a organizacao por workspace, que permite isolar operacoes por equipe."

"Outro diferencial e a configuracao do funil, com possibilidade de definir etapas e campos obrigatorios por etapa."

"Tambem existe suporte a campos personalizados, o que deixa o sistema mais adaptavel a diferentes contextos comerciais."

"E por fim, a geracao de mensagens com IA integrada ao fluxo do lead e das campanhas, que traz um ganho de produtividade e padronizacao."

---

## 6. Encerramento

### O que mostrar

- voltar para dashboard ou tela de leads

### Fala sugerida

"Em resumo, o SDR CRM foi desenvolvido para apoiar o dia a dia de equipes de SDR, unindo autenticacao, organizacao por workspace, gestao de leads, configuracao de funil e campanhas com apoio de IA."

"Esse foi o fluxo principal da aplicacao, desde o cadastro ate a criacao de lead e a geracao de mensagem com IA, junto com as principais decisoes tecnicas e diferenciais do projeto."

"Obrigado."

---

## Ordem Ideal da Gravacao

Para evitar travar durante o video, siga esta ordem:

1. abrir a tela de login
2. mostrar rapidamente o cadastro
3. entrar com um usuario ja confirmado
4. abrir o workspace
5. abrir a tela de leads
6. criar um lead novo
7. abrir o lead
8. gerar mensagem com IA
9. mostrar rapidamente configuracoes e campanhas
10. abrir o codigo e explicar as decisoes tecnicas
11. encerrar

---

## Versao Super Direta Para Falar

Se quiser gravar de forma mais objetiva, pode usar esta versao resumida:

"Este projeto e o SDR CRM, uma aplicacao full stack para equipes de SDR e pre-vendas. O sistema permite autenticar usuarios, organizar operacoes por workspace, gerenciar leads em um kanban, configurar funil e gerar mensagens com IA a partir de campanhas. Neste fluxo principal, o usuario se cadastra, acessa o sistema, cria um lead e depois gera mensagens personalizadas com IA para esse lead. Tecnicamente, o projeto foi desenvolvido com React, TypeScript, Vite, Node.js, Express e Supabase Auth, com deploy em ambiente real. Como diferenciais, eu destacaria a estrutura por workspace, a configuracao do funil com regras por etapa, os campos personalizados e a integracao da IA ao fluxo comercial."

---

## Dicas Para o Video Ficar Melhor

- deixe um usuario ja confirmado para nao depender de email na hora
- deixe um workspace pronto
- se possivel, comece com poucos dados para o fluxo ficar facil de entender
- deixe uma campanha ja criada para acelerar a parte da IA
- fale com frases curtas
- navegue devagar entre telas
- se errar uma parte, refaca apenas aquele bloco
