import { apiClient } from "./client";
import type { Campaign, GeneratedMessage } from "../../types/models";

export const campaignsApi = {
  list: async (workspaceId: string) => {
    const { data } = await apiClient.get<{ items: Campaign[] }>(
      `/campaigns?workspace_id=${workspaceId}`
    );
    return data.items;
  },
  create: async (payload: Record<string, unknown>) => {
    const { data } = await apiClient.post<Campaign>("/campaigns", payload);
    return data;
  },
  update: async (campaignId: string, payload: Record<string, unknown>) => {
    const { data } = await apiClient.patch<Campaign>(`/campaigns/${campaignId}`, payload);
    return data;
  },
  generateMessages: async (campaignId: string, leadId: string) => {
    const { data } = await apiClient.post<GeneratedMessage>(
      `/campaigns/${campaignId}/generate-messages`,
      { leadId }
    );
    return data;
  }
};
