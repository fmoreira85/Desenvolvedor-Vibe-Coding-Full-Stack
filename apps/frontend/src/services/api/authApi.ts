import { apiClient } from "./client";
import type { AuthPayload } from "../../types/models";

export const authApi = {
  register: async (input: { name: string; email: string; password: string }) => {
    const { data } = await apiClient.post<AuthPayload>("/auth/register", input);
    return data;
  },
  login: async (input: { email: string; password: string }) => {
    const { data } = await apiClient.post<AuthPayload>("/auth/login", input);
    return data;
  }
};
