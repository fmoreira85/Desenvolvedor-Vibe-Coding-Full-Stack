import { apiClient } from "./client";

export type ActivityLogItem = {
  id: string;
  leadId: string | null;
  workspaceId: string;
  userId: string | null;
  action: string;
  metadata: unknown;
  createdAt: string;
};

export const activityLogsApi = {
  listByLead: async (leadId: string) => {
    const { data } = await apiClient.get<{ items: ActivityLogItem[] }>(
      `/activity-logs?lead_id=${leadId}`
    );
    return data.items;
  }
};
