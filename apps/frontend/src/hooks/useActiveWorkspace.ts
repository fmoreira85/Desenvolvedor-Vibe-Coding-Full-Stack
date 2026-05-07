import { useSessionStore } from "./useSessionStore";

export const useActiveWorkspace = () => {
  const activeWorkspaceId = useSessionStore((state) => state.activeWorkspaceId);
  const workspaces = useSessionStore((state) => state.workspaces);

  return workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? null;
};
