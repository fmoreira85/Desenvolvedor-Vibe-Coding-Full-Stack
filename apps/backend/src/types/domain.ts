export type WorkspaceRole = "admin" | "member";

export type CustomFieldInput = {
  customFieldId: string;
  value: string | null;
};

export type RequiredFieldInput = {
  fieldName: string;
  isCustomField: boolean;
};

export type MessageGenerationResult = {
  messages: string[];
  provider: "openai" | "anthropic" | "template";
  model: string;
};
