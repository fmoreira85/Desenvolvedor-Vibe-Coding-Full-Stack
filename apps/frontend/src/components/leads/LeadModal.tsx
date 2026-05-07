import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { activityLogsApi, type ActivityLogItem } from "../../services/api/activityLogsApi";
import { campaignsApi } from "../../services/api/campaignsApi";
import { getApiErrorMessage } from "../../services/api/client";
import { leadsApi } from "../../services/api/leadsApi";
import type { Campaign, CustomField, GeneratedMessage, Lead } from "../../types/models";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Input } from "../ui/Input";
import { Modal } from "../ui/Modal";
import { Select } from "../ui/Select";
import { Textarea } from "../ui/Textarea";

type LeadModalProps = {
  lead: Lead | null;
  customFields: CustomField[];
  campaigns: Campaign[];
  isOpen: boolean;
  onClose: () => void;
  onLeadUpdated: (lead: Lead) => void;
};

export const LeadModal = ({
  lead,
  customFields,
  campaigns,
  isOpen,
  onClose,
  onLeadUpdated
}: LeadModalProps) => {
  const [messages, setMessages] = useState<GeneratedMessage[]>([]);
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [saving, setSaving] = useState(false);
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
      ...Object.fromEntries(
        lead.customFieldValues.map((item) => [item.customFieldId, item.value ?? ""])
      )
    });

    setSelectedCampaignId(campaigns[0]?.id ?? "");

    void leadsApi.messages(lead.id).then(setMessages).catch(() => setMessages([]));
    void activityLogsApi.listByLead(lead.id).then(setLogs).catch(() => setLogs([]));
  }, [lead, campaigns]);

  return (
    <Modal
      isOpen={isOpen && !!lead}
      onClose={onClose}
      title={lead?.name ?? "Lead"}
      description="Atualize os dados do lead, gere mensagens e acompanhe a trilha de atividade."
    >
      {lead ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
          <div className="space-y-6">
            <Card className="space-y-4">
              <div>
                <p className="label">Detalhes</p>
                <h4 className="mt-2 text-lg font-semibold">Editar informações do lead</h4>
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
                      onChange={(event) =>
                        setForm((current) => ({ ...current, [key]: event.target.value }))
                      }
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="label">Notas</label>
                <Textarea
                  value={form.notes ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, notes: event.target.value }))
                  }
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
                          onChange={(event) =>
                            setForm((current) => ({ ...current, [field.id]: event.target.value }))
                          }
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
                          onChange={(event) =>
                            setForm((current) => ({ ...current, [field.id]: event.target.value }))
                          }
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : null}

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
                      customFieldValues: customFields.map((field) => ({
                        customFieldId: field.id,
                        value: form[field.id] ?? ""
                      }))
                    });
                    onLeadUpdated(updatedLead);
                    toast.success("Lead atualizado.");
                    const freshLogs = await activityLogsApi.listByLead(lead.id);
                    setLogs(freshLogs);
                  } catch (error) {
                    toast.error(getApiErrorMessage(error));
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {saving ? "Salvando..." : "Salvar alterações"}
              </Button>
            </Card>

            <Card className="space-y-4">
              <div>
                <p className="label">Histórico</p>
                <h4 className="mt-2 text-lg font-semibold">Atividade recente</h4>
              </div>

              <div className="space-y-3">
                {logs.length === 0 ? (
                  <p className="text-sm text-muted">Nenhuma atividade registrada para este lead.</p>
                ) : (
                  logs.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-border/70 bg-white/60 p-4">
                      <p className="text-sm font-semibold text-foreground">{item.action}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted">
                        {new Date(item.createdAt).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="space-y-4">
              <div>
                <p className="label">Mensagens IA</p>
                <h4 className="mt-2 text-lg font-semibold">Gerar e enviar abordagem</h4>
              </div>

              <div>
                <label className="label">Campanha</label>
                <Select
                  value={selectedCampaignId}
                  onChange={(event) => setSelectedCampaignId(event.target.value)}
                >
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
                disabled={!selectedCampaignId}
                onClick={async () => {
                  if (!selectedCampaignId) {
                    return;
                  }

                  try {
                    const generated = await campaignsApi.generateMessages(selectedCampaignId, lead.id);
                    setMessages((current) => [generated, ...current]);
                    toast.success("Mensagens geradas com sucesso.");
                    const freshLogs = await activityLogsApi.listByLead(lead.id);
                    setLogs(freshLogs);
                  } catch (error) {
                    toast.error(getApiErrorMessage(error));
                  }
                }}
              >
                Gerar 3 mensagens
              </Button>

              <div className="space-y-3">
                {messages.length === 0 ? (
                  <p className="text-sm text-muted">Nenhuma mensagem gerada ainda para este lead.</p>
                ) : (
                  messages.map((message) => (
                    <div key={message.id} className="rounded-3xl border border-border/70 bg-white/70 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {message.provider ? `${message.provider} • ${message.model}` : "Mensagem"}
                          </p>
                          <p className="text-xs uppercase tracking-[0.16em] text-muted">
                            {new Date(message.generatedAt).toLocaleString("pt-BR")}
                          </p>
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={async () => {
                            try {
                              await leadsApi.sendMessage(lead.id, message.id);
                              const refreshedLead = await leadsApi.get(lead.id);
                              const refreshedMessages = await leadsApi.messages(lead.id);
                              onLeadUpdated(refreshedLead);
                              setMessages(refreshedMessages);
                              toast.success("Mensagem marcada como enviada.");
                            } catch (error) {
                              toast.error(getApiErrorMessage(error));
                            }
                          }}
                        >
                          {message.sentAt ? "Enviado" : "Enviar"}
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {message.messages.map((item, index) => (
                          <div key={`${message.id}-${index}`} className="rounded-2xl bg-background/70 p-3">
                            <p className="text-sm leading-6 text-foreground">{item}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      ) : null}
    </Modal>
  );
};
