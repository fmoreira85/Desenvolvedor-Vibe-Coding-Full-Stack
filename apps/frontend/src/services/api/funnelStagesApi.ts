import { apiClient } from "./client";
import type { FunnelStage } from "../../types/models";

export const funnelStagesApi = {
  list: async (workspaceId: string) => {
    const { data } = await apiClient.get<{ items: FunnelStage[] }>(
      `/funnel-stages?workspace_id=${workspaceId}`
    );
    return data.items;
  },
  create: async (payload: {
    workspaceId: string;
    name: string;
    order: number;
    color: string;
  }) => {
    const { data } = await apiClient.post<FunnelStage>("/funnel-stages", payload);
    return data;
  },
  update: async (
    stageId: string,
    payload: Partial<{ name: string; order: number; color: string }>
  ) => {
    const { data } = await apiClient.patch<FunnelStage>(`/funnel-stages/${stageId}`, payload);
    return data;
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
