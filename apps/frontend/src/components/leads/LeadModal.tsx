import { Copy, History, Send, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { activityLogsApi, type ActivityLogItem } from "../../services/api/activityLogsApi";
import { campaignsApi } from "../../services/api/campaignsApi";
import { getApiErrorMessage } from "../../services/api/client";
import { leadsApi } from "../../services/api/leadsApi";
import type {
  Campaign,
  CustomField,
  FunnelStage,
  GeneratedMessage,
  Lead,
  WorkspaceMember
} from "../../types/models";
import { formatRelativeTime } from "../../utils/formatters";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { Input } from "../ui/Input";
import { Modal } from "../ui/Modal";
import { Select } from "../ui/Select";
import { Textarea } from "../ui/Textarea";

type LeadModalProps = {
  lead: Lead | null;
  stages: FunnelStage[];
  customFields: CustomField[];
  campaigns: Campaign[];
  members: WorkspaceMember[];
  isOpen: boolean;
  onClose: () => void;
  onLeadUpdated: (lead: Lead) => void;
};

const formatActionLabel = (item: ActivityLogItem) => {
  switch (item.action) {
    case "lead.created":
      return "Lead criado";
    case "lead.updated":
      return "Lead atualizado";
    case "lead.stage_changed":
      return "Etapa alterada";
    case "message.generated":
      return "Mensagens geradas";
    case "message.sent":
      return "Mensagem enviada";
    case "message.generation_failed":
      return "Falha na geracao";
    default:
      return item.action;
  }
};

export const LeadModal = ({
  lead,
  stages,
  customFields,
  campaigns,
  members,
  isOpen,
  onClose,
  onLeadUpdated
}: LeadModalProps) => {
  const [messages, setMessages] = useState<GeneratedMessage[]>([]);
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [selectedStageId, setSelectedStageId] = useState("");
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!lead) {
      return;
    }

    setForm({
      name: lead.name,
      email: lead.email ?? "",
      phone: lead.phone ?? "",
      company: lead.company ?? "",
      role: lead.role ?? "",
      leadSource: lead.leadSource ?? "",
      notes: lead.notes ?? "",
      assignedUserId: lead.assignedUserId ?? "",
      ...Object.fromEntries(lead.customFieldValues.map((item) => [item.customFieldId, item.value ?? ""]))
    });
    setSelectedCampaignId(campaigns[0]?.id ?? "");
    setSelectedStageId(lead.stageId);

    void leadsApi.messages(lead.id).then(setMessages).catch(() => setMessages([]));
    void activityLogsApi.listByLead(lead.id).then(setLogs).catch(() => setLogs([]));
  }, [lead, campaigns]);

  const refreshLeadContext = async (leadId: string) => {
    const [refreshedLead, refreshedMessages, freshLogs] = await Promise.all([
      leadsApi.get(leadId),
      leadsApi.messages(leadId),
      activityLogsApi.listByLead(leadId)
    ]);

    onLeadUpdated(refreshedLead);
    setMessages(refreshedMessages);
    setLogs(freshLogs);
  };

  return (
    <Modal
      isOpen={isOpen && !!lead}
      onClose={onClose}
      title={lead?.name ?? "Lead"}
      description="Atualize os dados, mova etapas e acompanhe o historico completo do relacionamento."
    >
      {lead ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
          <div className="space-y-6">
            <Card className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="outline" style={{ borderColor: lead.stage.color, color: lead.stage.color }}>
                  {lead.stage.name}
                </Badge>
                {lead.generatedMessagesCount > 0 ? (
                  <Badge variant="secondary">{lead.generatedMessagesCount} geracoes IA</Badge>
                ) : null}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {[
                  ["name", "Nome"],
                  ["company", "Empresa"],
                  ["email", "Email"],
                  ["phone", "Telefone"],
                  ["role", "Cargo"],
                  ["leadSource", "Origem"]
                ].map(([key, label]) => (
                  <div key={key}>
                    <label className="label">{label}</label>
                    <Input
                      value={form[key] ?? ""}
                      onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
                    />
                  </div>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="label">Responsavel</label>
                  <Select
                    value={form.assignedUserId ?? ""}
                    onChange={(event) => setForm((current) => ({ ...current, assignedUserId: event.target.value }))}
                  >
                    <option value="">Sem responsavel</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.userId}>
                        {member.name} ({member.role})
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="label">Mover para etapa</label>
                  <div className="flex gap-2">
                    <Select value={selectedStageId} onChange={(event) => setSelectedStageId(event.target.value)}>
                      {stages.map((stage) => (
                        <option key={stage.id} value={stage.id}>
                          {stage.name}
                        </option>
                      ))}
                    </Select>
                    <Button
                      variant="secondary"
                      onClick={async () => {
                        try {
                          await leadsApi.moveStage(lead.id, selectedStageId);
                          await refreshLeadContext(lead.id);
                          toast.success("Etapa atualizada.");
                        } catch (error) {
                          toast.error(getApiErrorMessage(error));
                        }
                      }}
                    >
                      Mover
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <label className="label">Notas</label>
                <Textarea
                  value={form.notes ?? ""}
                  onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                />
              </div>

              {customFields.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {customFields.map((field) => (
                    <div key={field.id}>
                      <label className="label">{field.name}</label>
                      {field.fieldType === "select" ? (
                        <Select
                          value={form[field.id] ?? ""}
                          onChange={(event) => setForm((current) => ({ ...current, [field.id]: event.target.value }))}
                        >
                          <option value="">Selecione</option>
                          {field.options.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </Select>
                      ) : (
                        <Input
                          type={field.fieldType === "number" ? "number" : "text"}
                          value={form[field.id] ?? ""}
                          onChange={(event) => setForm((current) => ({ ...current, [field.id]: event.target.value }))}
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="flex justify-end">
                <Button
                  disabled={saving}
                  onClick={async () => {
                    setSaving(true);
                    try {
                      const updatedLead = await leadsApi.update(lead.id, {
                        name: form.name,
                        email: form.email,
                        phone: form.phone,
                        company: form.company,
                        role: form.role,
                        leadSource: form.leadSource,
                        notes: form.notes,
                        assignedUserId: form.assignedUserId || null,
                        customFieldValues: customFields.map((field) => ({
                          customFieldId: field.id,
                          value: form[field.id] ?? ""
                        }))
                      });
                      onLeadUpdated(updatedLead);
                      setSelectedStageId(updatedLead.stageId);
                      setLogs(await activityLogsApi.listByLead(lead.id));
                      toast.success("Lead atualizado.");
                    } catch (error) {
                      toast.error(getApiErrorMessage(error));
                    } finally {
                      setSaving(false);
                    }
                  }}
                >
                  {saving ? "Salvando..." : "Salvar alteracoes"}
                </Button>
              </div>
            </Card>

            <Card className="space-y-4">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-lg font-semibold text-foreground">Timeline de historico</h4>
              </div>

              {logs.length === 0 ? (
                <EmptyState
                  icon={History}
                  title="Sem historico ainda"
                  description="As proximas acoes sobre este lead aparecem aqui para facilitar o acompanhamento."
                />
              ) : (
                <div className="space-y-3">
                  {logs.map((item) => (
                    <div key={item.id} className="rounded-xl border border-border bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{formatActionLabel(item)}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatRelativeTime(item.createdAt)}
                          </p>
                        </div>
                        {item.actor ? (
                          <Badge variant="secondary">{item.actor.name}</Badge>
                        ) : null}
                      </div>
                      {item.actor ? (
                        <p className="mt-2 text-sm text-muted-foreground">{item.actor.email}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h4 className="text-lg font-semibold text-foreground">Mensagens IA</h4>
              </div>

              <div>
                <label className="label">Campanha</label>
                <Select value={selectedCampaignId} onChange={(event) => setSelectedCampaignId(event.target.value)}>
                  <option value="">Selecione uma campanha</option>
                  {campaigns.map((campaign) => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </option>
                  ))}
                </Select>
              </div>

              <Button
                className="w-full"
                disabled={!selectedCampaignId || generating}
                onClick={async () => {
                  if (!selectedCampaignId) {
                    return;
                  }

                  setGenerating(true);
                  try {
                    const generated = await campaignsApi.generateMessages(selectedCampaignId, lead.id);
                    setMessages((current) => [generated, ...current]);
                    setLogs(await activityLogsApi.listByLead(lead.id));
                    toast.success("Mensagens geradas com sucesso.");
                  } catch (error) {
                    toast.error(getApiErrorMessage(error));
                  } finally {
                    setGenerating(false);
                  }
                }}
              >
                {generating ? "Gerando com IA..." : "Gerar 3 mensagens"}
              </Button>

              {generating ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="rounded-xl border border-border bg-muted p-4">
                      <div className="skeleton h-4 w-28" />
                      <div className="skeleton mt-4 h-16 w-full" />
                    </div>
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <EmptyState
                  icon={Sparkles}
                  title="Nenhuma mensagem gerada"
                  description="Escolha uma campanha e gere variacoes personalizadas para este lead."
                />
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className="rounded-xl border border-border bg-white p-4">
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {campaigns.find((campaign) => campaign.id === message.campaignId)?.name ?? "Campanha"}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatRelativeTime(message.generatedAt)}
                          </p>
                        </div>
                        <Badge variant={message.sentAt ? "success" : "secondary"}>
                          {message.sentAt ? "Enviada" : "Pronta"}
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        {message.messages.map((item, index) => (
                          <div key={`${message.id}-${index}`} className="rounded-lg bg-muted p-3">
                            <p className="text-sm leading-6 text-foreground">{item}</p>
                            <div className="mt-3 flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={async () => {
                                  await navigator.clipboard.writeText(item);
                                  toast.success("Mensagem copiada.");
                                }}
                              >
                                <Copy className="h-3.5 w-3.5" />
                                Copiar
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                disabled={Boolean(message.sentAt)}
                                onClick={async () => {
                                  try {
                                    await leadsApi.sendMessage(lead.id, message.id);
                                    await refreshLeadContext(lead.id);
                                    toast.success("Mensagem marcada como enviada.");
                                  } catch (error) {
                                    toast.error(getApiErrorMessage(error));
                                  }
                                }}
                              >
                                <Send className="h-3.5 w-3.5" />
                                {message.sentAt ? "Enviado" : "Enviar"}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      ) : null}
    </Modal>
  );
};
