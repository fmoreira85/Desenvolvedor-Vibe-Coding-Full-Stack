import { apiClient } from "./client";
import type { GeneratedMessage, Lead } from "../../types/models";

export const leadsApi = {
  list: async (filters: {
    workspaceId: string;
    stageId?: string;
    search?: string;
    assignedTo?: string;
  }) => {
    const searchParams = new URLSearchParams({ workspace_id: filters.workspaceId });

    if (filters.stageId) {
      searchParams.set("stage_id", filters.stageId);
    }

    if (filters.search) {
      searchParams.set("search", filters.search);
    }

    if (filters.assignedTo) {
      searchParams.set("assigned_to", filters.assignedTo);
    }

    const { data } = await apiClient.get<{ items: Lead[] }>(`/leads?${searchParams.toString()}`);
    return data.items;
  },
  create: async (payload: Record<string, unknown>) => {
    const { data } = await apiClient.post<Lead>("/leads", payload);
    return data;
  },
  get: async (leadId: string) => {
    const { data } = await apiClient.get<Lead>(`/leads/${leadId}`);
    return data;
  },
  update: async (leadId: string, payload: Record<string, unknown>) => {
    const { data } = await apiClient.patch<Lead>(`/leads/${leadId}`, payload);
    return data;
  },
  moveStage: async (leadId: string, stageId: string) => {
    const { data } = await apiClient.patch<Lead>(`/leads/${leadId}/stage`, { stageId });
    return data;
  },
  messages: async (leadId: string) => {
    const { data } = await apiClient.get<{ leadId: string; items: GeneratedMessage[] }>(
      `/leads/${leadId}/messages`
    );
    return data.items;
  },
  sendMessage: async (leadId: string, generatedMessageId?: string) => {
    const { data } = await apiClient.post<{ generatedMessageId: string; movedToStageId: string }>(
      `/leads/${leadId}/send-message`,
      generatedMessageId ? { generatedMessageId } : {}
    );
    return data;
  }
};
