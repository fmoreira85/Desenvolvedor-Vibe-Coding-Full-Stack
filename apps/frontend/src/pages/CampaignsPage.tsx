import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Textarea } from "../components/ui/Textarea";
import { useActiveWorkspace } from "../hooks/useActiveWorkspace";
import { campaignsApi } from "../services/api/campaignsApi";
import { getApiErrorMessage } from "../services/api/client";
import { funnelStagesApi } from "../services/api/funnelStagesApi";
import type { Campaign, FunnelStage } from "../types/models";

export const CampaignsPage = () => {
  const workspace = useActiveWorkspace();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stages, setStages] = useState<FunnelStage[]>([]);
  const [form, setForm] = useState({
    name: "",
    context: "",
    prompt: "",
    triggerStageId: "",
    isActive: true
  });

  const reload = async () => {
    if (!workspace) {
      return;
    }

    const [campaignItems, stageItems] = await Promise.all([
      campaignsApi.list(workspace.id),
      funnelStagesApi.list(workspace.id)
    ]);
    setCampaigns(campaignItems);
    setStages(stageItems);
  };

  useEffect(() => {
    if (!workspace) {
      return;
    }

    void reload().catch((error) => toast.error(getApiErrorMessage(error)));
  }, [workspace]);

  return (
    <section className="page-shell px-0 py-0">
      <div className="grid gap-6 xl:grid-cols-[minmax(340px,0.8fr)_minmax(0,1.2fr)]">
        <Card className="space-y-5">
          <div>
            <p className="label">Nova campanha</p>
            <h1 className="section-title mt-2">Crie abordagens guiadas por contexto</h1>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label">Nome</label>
              <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </div>

            <div>
              <label className="label">Contexto</label>
              <Textarea
                value={form.context}
                onChange={(event) => setForm({ ...form, context: event.target.value })}
              />
            </div>

            <div>
              <label className="label">Prompt</label>
              <Textarea
                value={form.prompt}
                onChange={(event) => setForm({ ...form, prompt: event.target.value })}
              />
            </div>

            <div>
              <label className="label">Etapa gatilho</label>
              <Select
                value={form.triggerStageId}
                onChange={(event) => setForm({ ...form, triggerStageId: event.target.value })}
              >
                <option value="">Sem automação</option>
                {stages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name}
                  </option>
                ))}
              </Select>
            </div>

            <label className="flex items-center gap-3 rounded-2xl border border-border bg-white/70 px-4 py-3">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
              />
              Campanha ativa
            </label>

            <Button
              className="w-full"
              onClick={async () => {
                if (!workspace) {
                  return;
                }

                try {
                  await campaignsApi.create({
                    workspaceId: workspace.id,
                    name: form.name,
                    context: form.context,
                    prompt: form.prompt,
                    triggerStageId: form.triggerStageId || null,
                    isActive: form.isActive
                  });
                  setForm({
                    name: "",
                    context: "",
                    prompt: "",
                    triggerStageId: "",
                    isActive: true
                  });
                  await reload();
                  toast.success("Campanha criada.");
                } catch (error) {
                  toast.error(getApiErrorMessage(error));
                }
              }}
            >
              Criar campanha
            </Button>
          </div>
        </Card>

        <div className="space-y-4">
          <div>
            <p className="label">Campanhas existentes</p>
            <h2 className="section-title mt-2">Cadência ativa do workspace</h2>
          </div>

          {campaigns.length === 0 ? (
            <Card>
              <p className="text-sm text-muted">Nenhuma campanha cadastrada ainda.</p>
            </Card>
          ) : (
            campaigns.map((campaign) => (
              <Card key={campaign.id} className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="label">{campaign.isActive ? "Ativa" : "Inativa"}</p>
                    <h3 className="mt-2 text-xl font-semibold">{campaign.name}</h3>
                  </div>
                  <span className="rounded-full border border-border bg-background/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                    {campaign.triggerStageId ? "Com gatilho" : "Manual"}
                  </span>
                </div>

                <p className="text-sm leading-6 text-muted">{campaign.context}</p>
                <div className="rounded-2xl bg-background/70 p-4 text-sm leading-6 text-foreground">
                  {campaign.prompt}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </section>
  );
};
