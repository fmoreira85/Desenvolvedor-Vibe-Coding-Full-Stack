import { apiClient } from "./client";
export const funnelStagesApi = {
    list: async (workspaceId) => {
        const { data } = await apiClient.get(`/funnel-stages?workspace_id=${workspaceId}`);
        return data.items;
    },
    replaceRequiredFields: async (stageId, requiredFields) => {
        const { data } = await apiClient.patch(`/funnel-stages/${stageId}/required-fields`, { requiredFields });
        return data;
    }
};
