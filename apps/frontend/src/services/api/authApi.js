import { apiClient } from "./client";
export const authApi = {
    register: async (input) => {
        const { data } = await apiClient.post("/auth/register", input);
        return data;
    },
    login: async (input) => {
        const { data } = await apiClient.post("/auth/login", input);
        return data;
    }
};
