import { apiClient } from "./client";
export const campaignsApi = {
    list: async (workspaceId) => {
        const { data } = await apiClient.get(`/campaigns?workspace_id=${workspaceId}`);
        return data.items;
    },
    create: async (payload) => {
        const { data } = await apiClient.post("/campaigns", payload);
        return data;
    },
    generateMessages: async (campaignId, leadId) => {
        const { data } = await apiClient.post(`/campaigns/${campaignId}/generate-messages`, { leadId });
        return data;
    }
};
