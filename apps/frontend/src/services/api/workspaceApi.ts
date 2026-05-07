import { apiClient } from "./client";
import type { Workspace, WorkspaceMember, WorkspaceRole } from "../../types/models";

export const workspaceApi = {
  list: async () => {
    const { data } = await apiClient.get<{ items: Workspace[] }>("/workspaces");
    return data.items;
  },
  create: async (name: string) => {
    const { data } = await apiClient.post<Workspace>("/workspaces", { name });
    return data;
  },
  listMembers: async (workspaceId: string) => {
    const { data } = await apiClient.get<{ items: WorkspaceMember[] }>(
      `/workspaces/${workspaceId}/members`
    );
    return data.items;
  },
  inviteMember: async (
    workspaceId: string,
    payload: { email: string; role: WorkspaceRole }
  ) => {
    const { data } = await apiClient.post<WorkspaceMember>(
      `/workspaces/${workspaceId}/members`,
      payload
    );
    return data;
  }
};
