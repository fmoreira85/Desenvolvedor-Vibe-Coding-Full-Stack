import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BarChart3, Building2, KanbanSquare, LogOut, Megaphone, Settings2 } from "lucide-react";
import { startTransition } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useActiveWorkspace } from "../../hooks/useActiveWorkspace";
import { useSessionStore } from "../../hooks/useSessionStore";
import { cn } from "../../utils/cn";
const navigationItems = [
    { to: "/dashboard", label: "Dashboard", icon: BarChart3 },
    { to: "/leads", label: "Leads", icon: KanbanSquare },
    { to: "/campaigns", label: "Campanhas", icon: Megaphone },
    { to: "/settings", label: "Configurações", icon: Settings2 },
    { to: "/workspaces", label: "Workspaces", icon: Building2 }
];
export const AppShell = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const user = useSessionStore((state) => state.user);
    const workspaces = useSessionStore((state) => state.workspaces);
    const activeWorkspaceId = useSessionStore((state) => state.activeWorkspaceId);
    const setActiveWorkspaceId = useSessionStore((state) => state.setActiveWorkspaceId);
    const logout = useSessionStore((state) => state.logout);
    const activeWorkspace = useActiveWorkspace();
    return (_jsx("div", { className: "min-h-screen", children: _jsxs("div", { className: "page-shell lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start", children: [_jsxs("aside", { className: "panel hidden overflow-hidden lg:flex lg:min-h-[calc(100vh-3rem)] lg:flex-col lg:justify-between", children: [_jsxs("div", { className: "space-y-6 p-6", children: [_jsxs("div", { className: "space-y-3", children: [_jsx("span", { className: "label", children: "SDR CRM" }), _jsxs("div", { children: [_jsx("h1", { className: "font-display text-3xl font-semibold leading-none", children: "Pr\u00E9-vendas com cad\u00EAncia, contexto e IA." }), _jsx("p", { className: "mt-3 text-sm leading-6 text-muted", children: "Um cockpit operacional para organizar leads, disparar campanhas e manter o funil em movimento." })] })] }), _jsx("nav", { className: "space-y-2", children: navigationItems.map((item) => {
                                        const Icon = item.icon;
                                        return (_jsxs(NavLink, { to: item.to, className: ({ isActive }) => cn("flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition", isActive
                                                ? "bg-foreground text-white shadow-lg"
                                                : "text-foreground/80 hover:bg-white/70 hover:text-foreground"), children: [_jsx(Icon, { className: "h-4 w-4" }), item.label] }, item.to));
                                    }) })] }), _jsx("div", { className: "border-t border-border/70 p-6", children: _jsxs("button", { type: "button", onClick: () => {
                                    logout();
                                    navigate("/auth");
                                }, className: "flex w-full items-center justify-between rounded-2xl bg-foreground px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90", children: ["Encerrar sess\u00E3o", _jsx(LogOut, { className: "h-4 w-4" })] }) })] }), _jsxs("div", { className: "flex min-h-[calc(100vh-3rem)] flex-col gap-6", children: [_jsxs("header", { className: "panel flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between", children: [_jsxs("div", { children: [_jsx("span", { className: "label", children: "Workspace ativo" }), _jsx("h2", { className: "mt-2 font-display text-2xl font-semibold", children: activeWorkspace?.name ?? "Selecione um workspace" }), _jsxs("p", { className: "mt-1 text-sm text-muted", children: [user?.name, " \u2022 ", location.pathname.replace("/", "") || "dashboard"] })] }), _jsxs("div", { className: "flex flex-col gap-3 sm:items-end", children: [_jsxs("select", { className: "field mt-0 min-w-[250px]", value: activeWorkspaceId ?? "", onChange: (event) => {
                                                const value = event.target.value;
                                                startTransition(() => {
                                                    setActiveWorkspaceId(value || null);
                                                    if (value && location.pathname === "/workspaces") {
                                                        navigate("/dashboard");
                                                    }
                                                });
                                            }, children: [_jsx("option", { value: "", children: "Escolha um workspace" }), workspaces.map((workspace) => (_jsx("option", { value: workspace.id, children: workspace.name }, workspace.id)))] }), _jsxs("div", { className: "flex gap-2 lg:hidden", children: [_jsx("button", { type: "button", onClick: () => navigate("/workspaces"), className: "rounded-2xl border border-border bg-white/70 px-4 py-2 text-sm font-medium", children: "Workspaces" }), _jsx("button", { type: "button", onClick: () => {
                                                        logout();
                                                        navigate("/auth");
                                                    }, className: "rounded-2xl bg-foreground px-4 py-2 text-sm font-medium text-white", children: "Sair" })] })] })] }), _jsx(Outlet, {})] })] }) }));
};
