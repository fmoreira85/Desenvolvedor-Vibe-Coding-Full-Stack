import { apiClient } from "./client";
export const leadsApi = {
    list: async (workspaceId) => {
        const { data } = await apiClient.get(`/leads?workspace_id=${workspaceId}`);
        return data.items;
    },
    create: async (payload) => {
        const { data } = await apiClient.post("/leads", payload);
        return data;
    },
    get: async (leadId) => {
        const { data } = await apiClient.get(`/leads/${leadId}`);
        return data;
    },
    update: async (leadId, payload) => {
        const { data } = await apiClient.patch(`/leads/${leadId}`, payload);
        return data;
    },
    moveStage: async (leadId, stageId) => {
        const { data } = await apiClient.patch(`/leads/${leadId}/stage`, { stageId });
        return data;
    },
    messages: async (leadId) => {
        const { data } = await apiClient.get(`/leads/${leadId}/messages`);
        return data.items;
    },
    sendMessage: async (leadId, generatedMessageId) => {
        const { data } = await apiClient.post(`/leads/${leadId}/send-message`, generatedMessageId ? { generatedMessageId } : {});
        return data;
    }
};
