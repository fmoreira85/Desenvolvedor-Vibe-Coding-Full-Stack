import type { PropsWithChildren } from "react";
import { Navigate } from "react-router-dom";

import { useSessionStore } from "../../hooks/useSessionStore";

const Authenticated = ({ children }: PropsWithChildren) => {
  const token = useSessionStore((state) => state.token);

  if (!token) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

const PublicOnly = ({ children }: PropsWithChildren) => {
  const token = useSessionStore((state) => state.token);
  const activeWorkspaceId = useSessionStore((state) => state.activeWorkspaceId);

  if (token) {
    return <Navigate to={activeWorkspaceId ? "/dashboard" : "/workspaces"} replace />;
  }

  return <>{children}</>;
};

const WorkspaceSelected = ({ children }: PropsWithChildren) => {
  const token = useSessionStore((state) => state.token);
  const activeWorkspaceId = useSessionStore((state) => state.activeWorkspaceId);

  if (!token) {
    return <Navigate to="/auth" replace />;
  }

  if (!activeWorkspaceId) {
    return <Navigate to="/workspaces" replace />;
  }

  return <>{children}</>;
};

export const RouteGuards = {
  Authenticated,
  PublicOnly,
  WorkspaceSelected
};
