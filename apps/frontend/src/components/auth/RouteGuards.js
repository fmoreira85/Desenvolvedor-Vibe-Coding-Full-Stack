import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Navigate } from "react-router-dom";
import { useSessionStore } from "../../hooks/useSessionStore";
const Authenticated = ({ children }) => {
    const token = useSessionStore((state) => state.token);
    if (!token) {
        return _jsx(Navigate, { to: "/auth", replace: true });
    }
    return _jsx(_Fragment, { children: children });
};
const PublicOnly = ({ children }) => {
    const token = useSessionStore((state) => state.token);
    const activeWorkspaceId = useSessionStore((state) => state.activeWorkspaceId);
    if (token) {
        return _jsx(Navigate, { to: activeWorkspaceId ? "/dashboard" : "/workspaces", replace: true });
    }
    return _jsx(_Fragment, { children: children });
};
const WorkspaceSelected = ({ children }) => {
    const token = useSessionStore((state) => state.token);
    const activeWorkspaceId = useSessionStore((state) => state.activeWorkspaceId);
    if (!token) {
        return _jsx(Navigate, { to: "/auth", replace: true });
    }
    if (!activeWorkspaceId) {
        return _jsx(Navigate, { to: "/workspaces", replace: true });
    }
    return _jsx(_Fragment, { children: children });
};
export const RouteGuards = {
    Authenticated,
    PublicOnly,
    WorkspaceSelected
};
