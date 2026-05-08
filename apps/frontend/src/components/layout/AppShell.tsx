import { BarChart3, Building2, KanbanSquare, LogOut, Megaphone, Settings2 } from "lucide-react";
import { startTransition } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

import { useActiveWorkspace } from "../../hooks/useActiveWorkspace";
import { useSessionStore } from "../../hooks/useSessionStore";
import { authApi } from "../../services/api/authApi";
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

  return (
    <div className="min-h-screen">
      <div className="page-shell lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
        <aside className="panel hidden overflow-hidden lg:flex lg:min-h-[calc(100vh-3rem)] lg:flex-col lg:justify-between">
          <div className="space-y-6 p-6">
            <div className="space-y-3">
              <span className="label">SDR CRM</span>
              <div>
                <h1 className="font-display text-3xl font-semibold leading-none">
                  Pré-vendas com cadência, contexto e IA.
                </h1>
                <p className="mt-3 text-sm leading-6 text-muted">
                  Um cockpit operacional para organizar leads, disparar campanhas e manter o funil
                  em movimento.
                </p>
              </div>
            </div>

            <nav className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                        isActive
                          ? "bg-foreground text-white shadow-lg"
                          : "text-foreground/80 hover:bg-white/70 hover:text-foreground"
                      )
                    }
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          <div className="border-t border-border/70 p-6">
            <button
              type="button"
              onClick={async () => {
                await authApi.logout();
                logout();
                navigate("/auth");
              }}
              className="flex w-full items-center justify-between rounded-2xl bg-foreground px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Encerrar sessão
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </aside>

        <div className="flex min-h-[calc(100vh-3rem)] flex-col gap-6">
          <header className="panel flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="label">Workspace ativo</span>
              <h2 className="mt-2 font-display text-2xl font-semibold">
                {activeWorkspace?.name ?? "Selecione um workspace"}
              </h2>
              <p className="mt-1 text-sm text-muted">
                {user?.name} • {location.pathname.replace("/", "") || "dashboard"}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:items-end">
              <select
                className="field mt-0 min-w-[250px]"
                value={activeWorkspaceId ?? ""}
                onChange={(event) => {
                  const value = event.target.value;
                  startTransition(() => {
                    setActiveWorkspaceId(value || null);
                    if (value && location.pathname === "/workspaces") {
                      navigate("/dashboard");
                    }
                  });
                }}
              >
                <option value="">Escolha um workspace</option>
                {workspaces.map((workspace) => (
                  <option key={workspace.id} value={workspace.id}>
                    {workspace.name}
                  </option>
                ))}
              </select>
              <div className="flex gap-2 lg:hidden">
                <button
                  type="button"
                  onClick={() => navigate("/workspaces")}
                  className="rounded-2xl border border-border bg-white/70 px-4 py-2 text-sm font-medium"
                >
                  Workspaces
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await authApi.logout();
                    logout();
                    navigate("/auth");
                  }}
                  className="rounded-2xl bg-foreground px-4 py-2 text-sm font-medium text-white"
                >
                  Sair
                </button>
              </div>
            </div>
          </header>

          <Outlet />
        </div>
      </div>
    </div>
  );
};
