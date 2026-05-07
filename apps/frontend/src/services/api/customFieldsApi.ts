import { apiClient } from "./client";
import type { CustomField } from "../../types/models";

export const customFieldsApi = {
  list: async (workspaceId: string) => {
    const { data } = await apiClient.get<{ items: CustomField[] }>(
      `/custom-fields?workspace_id=${workspaceId}`
    );
    return data.items;
  },
  create: async (input: {
    workspaceId: string;
    name: string;
    fieldType: "text" | "number" | "select";
    options?: string[];
  }) => {
    const { data } = await apiClient.post<CustomField>("/custom-fields", input);
    return data;
  },
  delete: async (id: string) => {
    await apiClient.delete(`/custom-fields/${id}`);
  }
};
