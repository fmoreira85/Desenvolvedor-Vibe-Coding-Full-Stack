import { Pencil, Send, Sparkles, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { Select } from "../components/ui/Select";
import { Skeleton } from "../components/ui/Skeleton";
import { Textarea } from "../components/ui/Textarea";
import { useActiveWorkspace } from "../hooks/useActiveWorkspace";
import { campaignsApi } from "../services/api/campaignsApi";
import { getApiErrorMessage } from "../services/api/client";
import { funnelStagesApi } from "../services/api/funnelStagesApi";
import { leadsApi } from "../services/api/leadsApi";
import type { Campaign, FunnelStage, Lead } from "../types/models";
import { formatRelativeTime, truncate } from "../utils/formatters";

const emptyForm = {
  name: "",
  context: "",
  prompt: "",
  triggerStageId: "",
  isActive: true
};

export const CampaignsPage = () => {
  const workspace = useActiveWorkspace();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stages, setStages] = useState<FunnelStage[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [generatorCampaign, setGeneratorCampaign] = useState<Campaign | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [generatedMessages, setGeneratedMessages] = useState<string[]>([]);
  const [messageBatchId, setMessageBatchId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    if (!workspace) {
      return;
    }

    const [campaignItems, stageItems, leadItems] = await Promise.all([
      campaignsApi.list(workspace.id),
      funnelStagesApi.list(workspace.id),
      leadsApi.list({ workspaceId: workspace.id })
    ]);

    setCampaigns(campaignItems);
    setStages(stageItems);
    setLeads(leadItems);
  };

  useEffect(() => {
    if (!workspace) {
      return;
    }

    setLoading(true);
    void reload()
      .catch((error) => toast.error(getApiErrorMessage(error)))
      .finally(() => setLoading(false));
  }, [workspace]);

  const openDrawer = (campaign?: Campaign) => {
    setEditingCampaign(campaign ?? null);
    setForm(
      campaign
        ? {
            name: campaign.name,
            context: campaign.context,
            prompt: campaign.prompt,
            triggerStageId: campaign.triggerStageId ?? "",
            isActive: campaign.isActive
          }
        : emptyForm
    );
    setDrawerOpen(true);
  };

  return (
    <section className="page-shell">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-sm text-muted-foreground">Campanhas totais</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{campaigns.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">Ativas</p>
          <p className="mt-2 text-3xl font-bold text-foreground">
            {campaigns.filter((campaign) => campaign.isActive).length}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">Com gatilho</p>
          <p className="mt-2 text-3xl font-bold text-foreground">
            {campaigns.filter((campaign) => campaign.triggerStageId).length}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">Leads disponiveis</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{leads.length}</p>
        </Card>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="label">Motor de campanhas</p>
          <h2 className="mt-2 text-xl font-semibold text-foreground">Cadencias com contexto e IA</h2>
        </div>
        <Button onClick={() => openDrawer()}>Nova campanha</Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index}>
              <Skeleton className="h-5 w-40" />
              <Skeleton className="mt-5 h-20 w-full rounded-xl" />
              <Skeleton className="mt-4 h-10 w-full rounded-xl" />
            </Card>
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <Card>
          <EmptyState
            icon={Sparkles}
            title="Nenhuma campanha criada"
            description="Crie a primeira campanha para padronizar as mensagens e acelerar a operacao."
            actionLabel="Criar campanha"
            onAction={() => openDrawer()}
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {campaigns.map((campaign) => {
            const triggerStage = stages.find((stage) => stage.id === campaign.triggerStageId);

            return (
              <Card key={campaign.id} className="flex h-full flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{campaign.name}</h3>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge variant={campaign.isActive ? "success" : "secondary"}>
                          {campaign.isActive ? "Ativa" : "Inativa"}
                        </Badge>
                        <Badge variant="outline">
                          <Zap className="h-3 w-3" />
                          {triggerStage?.name ?? "Sem gatilho"}
                        </Badge>
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={campaign.isActive}
                        onChange={async (event) => {
                          try {
                            await campaignsApi.update(campaign.id, { isActive: event.target.checked });
                            await reload();
                            toast.success("Status da campanha atualizado.");
                          } catch (error) {
                            toast.error(getApiErrorMessage(error));
                          }
                        }}
                      />
                      Ativa
                    </label>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-muted-foreground">
                    {truncate(campaign.context, 120)}
                  </p>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="rounded-lg bg-muted p-3 text-sm text-foreground">
                    {truncate(campaign.prompt, 100)}
                  </div>
                  <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span>{formatRelativeTime(campaign.createdAt)}</span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => openDrawer(campaign)}>
                        <Pencil className="h-3.5 w-3.5" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setGeneratorCampaign(campaign);
                          setGeneratedMessages([]);
                          setMessageBatchId(null);
                          setSelectedLeadId("");
                        }}
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        Gerar
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {drawerOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-xl overflow-y-auto border-l border-border bg-white p-6 shadow-ambient">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="label">{editingCampaign ? "Editar campanha" : "Nova campanha"}</p>
                <h3 className="mt-2 text-xl font-semibold text-foreground">
                  {editingCampaign ? editingCampaign.name : "Crie uma campanha orientada por contexto"}
                </h3>
              </div>
              <Button variant="ghost" onClick={() => setDrawerOpen(false)}>
                Fechar
              </Button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="label">Nome da campanha</label>
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
                <label className="label">Prompt de geracao</label>
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
                  <option value="">Sem automacao</option>
                  {stages.map((stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.name}
                    </option>
                  ))}
                </Select>
              </div>
              <label className="flex items-center gap-3 rounded-lg border border-border bg-muted px-4 py-3 text-sm text-foreground">
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
                    if (editingCampaign) {
                      await campaignsApi.update(editingCampaign.id, {
                        ...form,
                        triggerStageId: form.triggerStageId || null
                      });
                      toast.success("Campanha atualizada.");
                    } else {
                      await campaignsApi.create({
                        workspaceId: workspace.id,
                        ...form,
                        triggerStageId: form.triggerStageId || null
                      });
                      toast.success("Campanha criada.");
                    }
                    setDrawerOpen(false);
                    setEditingCampaign(null);
                    setForm(emptyForm);
                    await reload();
                  } catch (error) {
                    toast.error(getApiErrorMessage(error));
                  }
                }}
              >
                {editingCampaign ? "Salvar campanha" : "Criar campanha"}
              </Button>
            </div>
          </aside>
        </>
      ) : null}

      <Modal
        isOpen={!!generatorCampaign}
        onClose={() => setGeneratorCampaign(null)}
        title={generatorCampaign?.name ?? "Gerar mensagens"}
        description="Escolha um lead para gerar tres variacoes personalizadas e enviar a melhor opcao."
      >
        {generatorCampaign ? (
          <div className="space-y-5">
            <div>
              <label className="label">Lead</label>
              <Select value={selectedLeadId} onChange={(event) => setSelectedLeadId(event.target.value)}>
                <option value="">Selecione um lead</option>
                {leads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.name} {lead.company ? `- ${lead.company}` : ""}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                disabled={!selectedLeadId || generating}
                onClick={async () => {
                  setGenerating(true);
                  try {
                    const result = await campaignsApi.generateMessages(generatorCampaign.id, selectedLeadId);
                    setGeneratedMessages(result.messages);
                    setMessageBatchId(result.id);
                    toast.success("Mensagens geradas.");
                  } catch (error) {
                    toast.error(getApiErrorMessage(error));
                  } finally {
                    setGenerating(false);
                  }
                }}
              >
                {generating ? "Gerando..." : "Gerar mensagens"}
              </Button>
              <Button
                variant="secondary"
                disabled={!selectedLeadId || generating}
                onClick={async () => {
                  setGenerating(true);
                  try {
                    const result = await campaignsApi.generateMessages(generatorCampaign.id, selectedLeadId);
                    setGeneratedMessages(result.messages);
                    setMessageBatchId(result.id);
                    toast.success("Mensagens regeneradas.");
                  } catch (error) {
                    toast.error(getApiErrorMessage(error));
                  } finally {
                    setGenerating(false);
                  }
                }}
              >
                Regenerar
              </Button>
            </div>

            {generating ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Card key={index}>
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="mt-4 h-16 w-full rounded-xl" />
                  </Card>
                ))}
              </div>
            ) : generatedMessages.length === 0 ? (
              <EmptyState
                icon={Sparkles}
                title="Nenhuma mensagem gerada"
                description="Selecione um lead e clique em gerar para receber tres variacoes prontas."
              />
            ) : (
              <div className="space-y-3">
                {generatedMessages.map((message, index) => (
                  <Card key={`${index}-${message.slice(0, 12)}`}>
                    <p className="text-sm leading-6 text-foreground">{message}</p>
                    <div className="mt-4 flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          await navigator.clipboard.writeText(message);
                          toast.success("Mensagem copiada.");
                        }}
                      >
                        Copiar
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={!selectedLeadId || !messageBatchId}
                        onClick={async () => {
                          if (!selectedLeadId || !messageBatchId) {
                            return;
                          }

                          try {
                            await leadsApi.sendMessage(selectedLeadId, messageBatchId);
                            await reload();
                            toast.success("Mensagem enviada e lead atualizado.");
                          } catch (error) {
                            toast.error(getApiErrorMessage(error));
                          }
                        }}
                      >
                        <Send className="h-3.5 w-3.5" />
                        Enviar
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </section>
  );
};
