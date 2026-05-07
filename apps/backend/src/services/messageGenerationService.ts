import { env } from "../config/env";
import type { MessageGenerationResult } from "../types/domain";

const buildSystemPrompt = () => {
  return [
    "Voce e um assistente especializado em gerar mensagens de abordagem para equipes de vendas.",
    "Gere exatamente 3 variacoes de mensagem.",
    'Responda APENAS em JSON: { "messages": ["msg1", "msg2", "msg3"] }'
  ].join(" ");
};

const safeText = (value: string | null | undefined) => value?.trim() || "Nao informado";

const parseMessagesResponse = (content: string) => {
  const parsed = JSON.parse(content) as { messages?: unknown };

  if (!Array.isArray(parsed.messages) || parsed.messages.length !== 3) {
    throw new Error("LLM response did not include exactly 3 messages.");
  }

  return parsed.messages.map((message) => String(message));
};

const buildUserPrompt = (input: {
  campaign: { context: string; prompt: string };
  lead: {
    name: string;
    company: string | null;
    role: string | null;
    phone: string | null;
    leadSource: string | null;
    notes: string | null;
  };
  customFields: Array<{ name: string; value: string | null }>;
}) => {
  const customFieldsBlock =
    input.customFields.length === 0
      ? "- Campos personalizados: Nenhum"
      : input.customFields
          .map((field) => `- ${field.name}: ${safeText(field.value)}`)
          .join("\n");

  return `
## Contexto da Campanha
${input.campaign.context}

## Instrucoes de Geracao
${input.campaign.prompt}

## Dados do Lead
- Nome: ${input.lead.name}
- Empresa: ${safeText(input.lead.company)}
- Cargo: ${safeText(input.lead.role)}
- Telefone: ${safeText(input.lead.phone)}
- Origem: ${safeText(input.lead.leadSource)}
- Observacoes: ${safeText(input.lead.notes)}
${customFieldsBlock}

Gere 3 variacoes de mensagem personalizadas para este lead.
  `.trim();
};

const generateTemplateMessages = (input: {
  campaign: { context: string; prompt: string };
  lead: {
    name: string;
    company: string | null;
    role: string | null;
  };
}) => {
  const company = safeText(input.lead.company);
  const role = safeText(input.lead.role);

  return [
    `Oi ${input.lead.name}, vi que voce atua como ${role} na ${company}. ${input.campaign.context} Faz sentido te mostrar uma ideia rapida?`,
    `${input.lead.name}, tudo bem? Estou entrando em contato porque ${input.campaign.prompt.toLowerCase()} e acredito que a ${company} pode se beneficiar disso.`,
    `Oi ${input.lead.name}, preparei uma abordagem pensando no contexto da ${company}. Se fizer sentido para voce como ${role}, posso te mandar um resumo em 2 minutos.`
  ];
};

const generateWithOpenAi = async (systemPrompt: string, userPrompt: string) => {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.openAiApiKey}`
    },
    body: JSON.stringify({
      model: env.openAiModel,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = payload.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("OpenAI response did not contain message content.");
  }

  return parseMessagesResponse(content);
};

const generateWithAnthropic = async (systemPrompt: string, userPrompt: string) => {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": env.anthropicApiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: env.anthropicModel,
      max_tokens: 400,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }]
    })
  });

  if (!response.ok) {
    throw new Error(`Anthropic request failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };

  const content = payload.content?.find((item) => item.type === "text")?.text;

  if (!content) {
    throw new Error("Anthropic response did not contain text content.");
  }

  return parseMessagesResponse(content);
};

export const generateLeadMessages = async (input: {
  campaign: { context: string; prompt: string };
  lead: {
    name: string;
    company: string | null;
    role: string | null;
    phone: string | null;
    leadSource: string | null;
    notes: string | null;
  };
  customFields: Array<{ name: string; value: string | null }>;
}): Promise<MessageGenerationResult> => {
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(input);

  if (env.openAiApiKey) {
    const messages = await generateWithOpenAi(systemPrompt, userPrompt);
    return {
      messages,
      provider: "openai",
      model: env.openAiModel
    };
  }

  if (env.anthropicApiKey) {
    const messages = await generateWithAnthropic(systemPrompt, userPrompt);
    return {
      messages,
      provider: "anthropic",
      model: env.anthropicModel
    };
  }

  return {
    messages: generateTemplateMessages(input),
    provider: "template",
    model: "local-template-fallback"
  };
};
