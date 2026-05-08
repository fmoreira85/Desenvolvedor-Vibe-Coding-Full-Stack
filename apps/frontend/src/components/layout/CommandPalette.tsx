import { Command } from "cmdk";
import { Building2, LayoutDashboard, KanbanSquare, Megaphone, Settings2 } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { useSessionStore } from "../../hooks/useSessionStore";
import { cn } from "../../utils/cn";

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const routes = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/leads", label: "Leads", icon: KanbanSquare },
  { to: "/campaigns", label: "Campanhas", icon: Megaphone },
  { to: "/settings", label: "Configuracoes", icon: Settings2 },
  { to: "/workspaces", label: "Workspaces", icon: Building2 }
];

export const CommandPalette = ({ open, onOpenChange }: CommandPaletteProps) => {
  const navigate = useNavigate();
  const workspaces = useSessionStore((state) => state.workspaces);
  const setActiveWorkspaceId = useSessionStore((state) => state.setActiveWorkspaceId);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpenChange(!open);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80] bg-slate-950/35 p-4 backdrop-blur-sm" onClick={() => onOpenChange(false)}>
      <div
        className="mx-auto mt-16 w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-white shadow-ambient"
        onClick={(event) => event.stopPropagation()}
      >
        <Command className="overflow-hidden">
          <div className="border-b border-border px-4 py-3">
            <Command.Input
              autoFocus
              placeholder="Buscar pagina ou workspace..."
              className="h-11 w-full border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>

          <Command.List className="max-h-[420px] overflow-y-auto p-3">
            <Command.Empty className="px-3 py-10 text-center text-sm text-muted-foreground">
              Nenhum resultado encontrado.
            </Command.Empty>

            <Command.Group heading="Navegacao" className="mb-3">
              {routes.map((item) => {
                const Icon = item.icon;
                return (
                  <Command.Item
                    key={item.to}
                    value={item.label}
                    onSelect={() => {
                      navigate(item.to);
                      onOpenChange(false);
                    }}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-3 text-sm text-foreground outline-none",
                      "data-[selected=true]:bg-muted"
                    )}
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    {item.label}
                  </Command.Item>
                );
              })}
            </Command.Group>

            <Command.Group heading="Workspaces">
              {workspaces.map((workspace) => (
                <Command.Item
                  key={workspace.id}
                  value={workspace.name}
                  onSelect={() => {
                    setActiveWorkspaceId(workspace.id);
                    navigate("/dashboard");
                    onOpenChange(false);
                  }}
                  className={cn(
                    "flex cursor-pointer items-center justify-between rounded-lg px-3 py-3 text-sm text-foreground outline-none",
                    "data-[selected=true]:bg-muted"
                  )}
                >
                  <span>{workspace.name}</span>
                  <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    {workspace.role}
                  </span>
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
};
