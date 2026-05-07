import { apiClient } from "./client";
export const customFieldsApi = {
    list: async (workspaceId) => {
        const { data } = await apiClient.get(`/custom-fields?workspace_id=${workspaceId}`);
        return data.items;
    },
    create: async (input) => {
        const { data } = await apiClient.post("/custom-fields", input);
        return data;
    },
    delete: async (id) => {
        await apiClient.delete(`/custom-fields/${id}`);
    }
};
