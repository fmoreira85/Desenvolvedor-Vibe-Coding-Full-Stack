import { apiClient } from "./client";
import type { FunnelStage } from "../../types/models";

export const funnelStagesApi = {
  list: async (workspaceId: string) => {
    const { data } = await apiClient.get<{ items: FunnelStage[] }>(
      `/funnel-stages?workspace_id=${workspaceId}`
    );
    return data.items;
  },
  replaceRequiredFields: async (
    stageId: string,
    requiredFields: Array<{ fieldName: string; isCustomField: boolean }>
  ) => {
    const { data } = await apiClient.patch<FunnelStage>(
      `/funnel-stages/${stageId}/required-fields`,
      { requiredFields }
    );
    return data;
  }
};
