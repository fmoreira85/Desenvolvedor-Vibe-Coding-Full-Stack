import { apiClient } from "./client";
import type { Workspace } from "../../types/models";

export const workspaceApi = {
  list: async () => {
    const { data } = await apiClient.get<{ items: Workspace[] }>("/workspaces");
    return data.items;
  },
  create: async (name: string) => {
    const { data } = await apiClient.post<Workspace>("/workspaces", { name });
    return data;
  }
};
