import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { AuthPayload, User, Workspace } from "../types/models";

type SessionState = {
  token: string | null;
  user: User | null;
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  setSession: (payload: AuthPayload) => void;
  setWorkspaces: (workspaces: Workspace[]) => void;
  setActiveWorkspaceId: (workspaceId: string | null) => void;
  logout: () => void;
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      workspaces: [],
      activeWorkspaceId: null,
      setSession: (payload) =>
        set((state) => ({
          token: payload.token,
          user: payload.user,
          workspaces: payload.workspaces,
          activeWorkspaceId:
            payload.workspaces.find((workspace) => workspace.id === state.activeWorkspaceId)?.id ??
            payload.workspaces[0]?.id ??
            null
        })),
      setWorkspaces: (workspaces) =>
        set((state) => ({
          workspaces,
          activeWorkspaceId:
            workspaces.find((workspace) => workspace.id === state.activeWorkspaceId)?.id ??
            workspaces[0]?.id ??
            null
        })),
      setActiveWorkspaceId: (workspaceId) => set({ activeWorkspaceId: workspaceId }),
      logout: () =>
        set({
          token: null,
          user: null,
          workspaces: [],
          activeWorkspaceId: null
        })
    }),
    {
      name: "sdr-crm-session"
    }
  )
);
