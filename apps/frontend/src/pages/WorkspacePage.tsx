import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
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
      <section className="panel overflow-hidden p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(320px,0.75fr)_minmax(0,1fr)]">
          <Card className="space-y-5">
            <div>
              <p className="label">Novo workspace</p>
              <h1 className="mt-2 font-display text-3xl font-semibold">Organize a operação comercial</h1>
              <p className="mt-3 text-sm leading-6 text-muted">
                Cada workspace isola dados, funis, campanhas e regras de qualificação.
              </p>
            </div>

            <div>
              <label className="label">Nome do workspace</label>
              <Input value={name} onChange={(event) => setName(event.target.value)} />
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

          <div className="space-y-4">
            <div>
              <p className="label">Selecionar workspace</p>
              <h2 className="mt-2 font-display text-3xl font-semibold">Operações disponíveis</h2>
            </div>

            {workspaces.length === 0 ? (
              <Card>
                <p className="text-sm text-muted">
                  Você ainda não participa de nenhum workspace. Crie o primeiro para continuar.
                </p>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {workspaces.map((workspace) => (
                  <Card key={workspace.id} className="flex flex-col justify-between gap-4">
                    <div>
                      <p className="label">{workspace.role}</p>
                      <h3 className="mt-2 text-lg font-semibold">{workspace.name}</h3>
                      <p className="mt-2 text-sm text-muted">
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
        </div>
      </section>
    </main>
  );
};
