import { apiClient } from "./client";
export const dashboardApi = {
    get: async (workspaceId) => {
        const { data } = await apiClient.get(`/dashboard?workspace_id=${workspaceId}`);
        return data;
    }
};
