export type WorkspaceRole = "admin" | "member";
export type CustomFieldType = "text" | "number" | "select";

export type User = {
  id: string;
  email: string;
  name: string;
};

export type Workspace = {
  id: string;
  name: string;
  createdAt: string;
  role: WorkspaceRole;
};

export type WorkspaceMember = {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  createdAt: string;
  name: string;
  email: string;
};

export type AuthPayload = {
  token: string;
  user: User;
  workspaces: Workspace[];
};

export type CustomField = {
  id: string;
  workspaceId: string;
  name: string;
  fieldType: CustomFieldType;
  options: string[];
  createdAt: string;
};

export type RequiredField = {
  id: string;
  stageId: string;
  fieldName: string;
  isCustomField: boolean;
};

export type FunnelStage = {
  id: string;
  workspaceId: string;
  name: string;
  order: number;
  color: string;
  createdAt: string;
  requiredFields: RequiredField[];
};

export type LeadCustomFieldValue = {
  customFieldId: string;
  name: string;
  fieldType: string;
  value: string | null;
};

export type Lead = {
  id: string;
  workspaceId: string;
  stageId: string;
  assignedUserId: string | null;
  assignedUser: {
    id: string;
    name: string;
    email: string;
  } | null;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  role: string | null;
  leadSource: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  stage: {
    id: string;
    name: string;
    order: number;
    color: string;
  };
  customFieldValues: LeadCustomFieldValue[];
};

export type Campaign = {
  id: string;
  workspaceId: string;
  name: string;
  context: string;
  prompt: string;
  triggerStageId: string | null;
  isActive: boolean;
  createdAt: string;
};

export type GeneratedMessage = {
  id: string;
  leadId: string;
  campaignId: string;
  messages: string[];
  generatedAt: string;
  sentAt: string | null;
  provider?: string;
  model?: string;
};

export type DashboardMetrics = {
  workspaceId: string;
  totalLeads: number;
  totalCampaigns: number;
  totalGeneratedMessages: number;
  totalSentMessages: number;
  leadsByStage: Array<{
    stageId: string;
    name: string;
    order: number;
    color: string;
    count: number;
  }>;
};
