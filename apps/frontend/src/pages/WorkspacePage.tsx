import { ArrowLeft, Building2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { Input } from "../components/ui/Input";
import { useSessionStore } from "../hooks/useSessionStore";
import { getApiErrorMessage } from "../services/api/client";
import { workspaceApi } from "../services/api/workspaceApi";

export const WorkspacePage = () => {
  const navigate = useNavigate();
  const workspaces = useSessionStore((state) => state.workspaces);
  const activeWorkspaceId = useSessionStore((state) => state.activeWorkspaceId);
  const setWorkspaces = useSessionStore((state) => state.setWorkspaces);
  const setActiveWorkspaceId = useSessionStore((state) => state.setActiveWorkspaceId);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void workspaceApi
      .list()
      .then(setWorkspaces)
      .catch((error) => toast.error(getApiErrorMessage(error)));
  }, [setWorkspaces]);

  return (
    <main className="page-shell">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="label">Workspaces</p>
          <h1 className="mt-2 text-2xl font-bold text-foreground">Gerencie seus ambientes de operacao</h1>
        </div>
        <Button variant="ghost" onClick={() => navigate(activeWorkspaceId ? "/dashboard" : "/auth")}>
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        <Card className="space-y-4">
          <div>
            <p className="label">Novo workspace</p>
            <h2 className="mt-2 text-lg font-semibold text-foreground">Crie um ambiente isolado</h2>
          </div>

          <div>
            <label className="label">Nome do workspace</label>
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Vendas Brasil" />
          </div>

          <Button
            className="w-full"
            disabled={loading || name.trim().length === 0}
            onClick={async () => {
              setLoading(true);
              try {
                const workspace = await workspaceApi.create(name.trim());
                const refreshed = await workspaceApi.list();
                setWorkspaces(refreshed);
                setActiveWorkspaceId(workspace.id);
                toast.success("Workspace criado.");
                navigate("/dashboard");
              } catch (error) {
                toast.error(getApiErrorMessage(error));
              } finally {
                setLoading(false);
              }
            }}
          >
            {loading ? "Criando..." : "Criar workspace"}
          </Button>
        </Card>

        {workspaces.length === 0 ? (
          <Card>
            <EmptyState
              icon={Building2}
              title="Voce ainda nao participa de nenhum workspace"
              description="Crie o primeiro ambiente para comecar a operar leads, campanhas e configuracoes."
            />
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {workspaces.map((workspace) => (
              <Card key={workspace.id} className="flex flex-col justify-between gap-5">
                <div>
                  <BadgeRow role={workspace.role} />
                  <h3 className="mt-3 text-lg font-semibold text-foreground">{workspace.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Criado em {new Date(workspace.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>

                <Button
                  variant={activeWorkspaceId === workspace.id ? "primary" : "secondary"}
                  onClick={() => {
                    setActiveWorkspaceId(workspace.id);
                    navigate("/dashboard");
                  }}
                >
                  {activeWorkspaceId === workspace.id ? "Workspace ativo" : "Entrar"}
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

const BadgeRow = ({ role }: { role: string }) => (
  <div className="inline-flex rounded-full bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
    {role}
  </div>
);
