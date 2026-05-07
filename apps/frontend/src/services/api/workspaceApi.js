import { apiClient } from "./client";
export const workspaceApi = {
    list: async () => {
        const { data } = await apiClient.get("/workspaces");
        return data.items;
    },
    create: async (name) => {
        const { data } = await apiClient.post("/workspaces", { name });
        return data;
    }
};
