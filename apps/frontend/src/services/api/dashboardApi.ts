import { apiClient } from "./client";
import type { DashboardMetrics } from "../../types/models";

export const dashboardApi = {
  get: async (workspaceId: string) => {
    const { data } = await apiClient.get<DashboardMetrics>(`/dashboard?workspace_id=${workspaceId}`);
    return data;
  }
};
