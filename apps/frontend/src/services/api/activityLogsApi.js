import { apiClient } from "./client";
export const activityLogsApi = {
    listByLead: async (leadId) => {
        const { data } = await apiClient.get(`/activity-logs?lead_id=${leadId}`);
        return data.items;
    }
};
