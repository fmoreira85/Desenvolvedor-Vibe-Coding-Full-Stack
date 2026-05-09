import {
  Bell,
  Building2,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Search,
  Settings2,
  Users,
  X
} from "lucide-react";
import { startTransition, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

import { useActiveWorkspace } from "../../hooks/useActiveWorkspace";
import { useSessionStore } from "../../hooks/useSessionStore";
import { authApi } from "../../services/api/authApi";
import { cn } from "../../utils/cn";
import { getInitials } from "../../utils/formatters";
import { Button } from "../ui/Button";
import { CommandPalette } from "./CommandPalette";

const navigationItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, shortLabel: "Dash" },
  { to: "/leads", label: "Leads", icon: Users, shortLabel: "Leads" },
  { to: "/campaigns", label: "Campanhas", icon: Megaphone, shortLabel: "Camp" },
  { to: "/settings", label: "Configuracoes", icon: Settings2, shortLabel: "Setup" }
];

const getPageTitle = (pathname: string) => {
  if (pathname.startsWith("/leads")) {
    return "Leads";
  }

  if (pathname.startsWith("/campaigns")) {
    return "Campanhas";
  }

  if (pathname.startsWith("/settings")) {
    return "Configuracoes";
  }

  return "Dashboard";
};

const SidebarContent = ({
  compact,
  onNavigate
}: {
  compact?: boolean;
  onNavigate?: () => void;
}) => {
  const navigate = useNavigate();
  const user = useSessionStore((state) => state.user);
  const activeWorkspace = useActiveWorkspace();

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className={cn("border-b border-white/10", compact ? "px-4 py-5" : "px-6 py-5")}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white">
            SDR
          </div>
          {!compact ? (
            <div>
              <p className="font-display text-lg font-bold text-white">SDR CRM</p>
              <p className="text-xs text-sidebar-text">SaaS para pre-vendas</p>
            </div>
          ) : null}
        </div>

        {!compact ? (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-xs text-white/80">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            {activeWorkspace?.name ?? "Sem workspace"}
          </div>
        ) : null}
      </div>

      <div className="px-3 py-5">
        <p className={cn("mb-2 text-xs uppercase tracking-[0.2em] text-slate-500", compact && "px-1 text-center")}>
          {compact ? "NAV" : "Principal"}
        </p>

        <nav className="space-y-1.5">
          {navigationItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    compact
                      ? isActive
                        ? "sidebar-link-active-compact"
                        : "sidebar-link-compact"
                      : isActive
                        ? "sidebar-link-active"
                        : "sidebar-link"
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!compact ? <span>{item.label}</span> : <span className="sr-only">{item.shortLabel}</span>}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto border-t border-white/10 p-4">
        <button
          type="button"
          onClick={() => {
            navigate("/workspaces");
            onNavigate?.();
          }}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl bg-white/5 px-3 py-3 text-left transition hover:bg-white/10",
            compact && "justify-center px-0"
          )}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white">
            {getInitials(user?.name ?? "U")}
          </div>
          {!compact ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{user?.name ?? "Usuario"}</p>
              <p className="truncate text-xs text-sidebar-text">{user?.email}</p>
            </div>
          ) : null}
        </button>
      </div>
    </div>
  );
};

export const AppShell = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const pageTitle = useMemo(() => getPageTitle(location.pathname), [location.pathname]);
  const user = useSessionStore((state) => state.user);
  const workspaces = useSessionStore((state) => state.workspaces);
  const activeWorkspaceId = useSessionStore((state) => state.activeWorkspaceId);
  const setActiveWorkspaceId = useSessionStore((state) => state.setActiveWorkspaceId);
  const logout = useSessionStore((state) => state.logout);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const activeWorkspace = useActiveWorkspace();

  const handleWorkspaceChange = (value: string) => {
    startTransition(() => {
      setActiveWorkspaceId(value || null);
      if (value && location.pathname === "/workspaces") {
        navigate("/dashboard");
      }
    });
  };

  const handleLogout = async () => {
    await authApi.logout();
    logout();
    navigate("/auth");
  };

  return (
    <>
      <div className="flex h-screen bg-background">
        <aside className="hidden border-r border-border md:flex md:w-20 xl:hidden">
          <SidebarContent compact />
        </aside>
        <aside className="hidden border-r border-border xl:flex xl:w-64">
          <SidebarContent />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="sticky top-0 z-30 flex h-14 items-center border-b border-border bg-white/80 px-4 backdrop-blur sm:px-6">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(true)}>
                <Menu className="h-4 w-4" />
              </Button>

              <div className="min-w-0">
                <h1 className="truncate text-lg font-semibold text-foreground">{pageTitle}</h1>
                <p className="hidden text-xs text-muted-foreground sm:block">
                  {activeWorkspace?.name ?? "Selecione um workspace para continuar"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex" onClick={() => setPaletteOpen(true)}>
                <Search className="h-4 w-4" />
                Buscar
                <span className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  Ctrl K
                </span>
              </Button>

              <select
                className="field mt-0 hidden min-w-[180px] sm:block"
                value={activeWorkspaceId ?? ""}
                onChange={(event) => handleWorkspaceChange(event.target.value)}
              >
                <option value="">Escolha um workspace</option>
                {workspaces.map((workspace) => (
                  <option key={workspace.id} value={workspace.id}>
                    {workspace.name}
                  </option>
                ))}
              </select>

              <Button variant="ghost" size="icon" aria-label="Notificacoes">
                <Bell className="h-4 w-4" />
              </Button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((current) => !current)}
                  className="flex items-center gap-2 rounded-md border border-border bg-white px-3 py-2 text-left shadow-sm"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
                    {getInitials(user?.name ?? "U")}
                  </div>
                  <div className="hidden min-w-0 sm:block">
                    <p className="truncate text-sm font-semibold text-foreground">{user?.name ?? "Usuario"}</p>
                    <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
                </button>

                {menuOpen ? (
                  <div className="absolute right-0 top-[calc(100%+0.5rem)] z-40 w-56 rounded-xl border border-border bg-white p-2 shadow-ambient">
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted"
                      onClick={() => {
                        setMenuOpen(false);
                        navigate("/workspaces");
                      }}
                    >
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      Workspaces
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger hover:bg-red-50"
                      onClick={() => {
                        setMenuOpen(false);
                        void handleLogout();
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      Sair
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>

      {mobileOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 overflow-hidden md:hidden">
            <div className="flex h-14 items-center justify-end border-b border-white/10 bg-sidebar px-4">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white" onClick={() => setMobileOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </>
      ) : null}

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </>
  );
};
