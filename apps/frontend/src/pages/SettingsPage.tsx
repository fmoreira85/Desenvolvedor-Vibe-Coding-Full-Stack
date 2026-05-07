import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { useActiveWorkspace } from "../hooks/useActiveWorkspace";
import { customFieldsApi } from "../services/api/customFieldsApi";
import { funnelStagesApi } from "../services/api/funnelStagesApi";
import { getApiErrorMessage } from "../services/api/client";
import { workspaceApi } from "../services/api/workspaceApi";
import type { CustomField, FunnelStage, WorkspaceMember, WorkspaceRole } from "../types/models";

const standardFields = [
  { value: "name", label: "Nome" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Telefone" },
  { value: "company", label: "Empresa" },
  { value: "role", label: "Cargo" },
  { value: "lead_source", label: "Origem" },
  { value: "notes", label: "Notas" },
  { value: "assigned_user_id", label: "Responsavel" }
];

const defaultStageColor = "#0f766e";

export const SettingsPage = () => {
  const workspace = useActiveWorkspace();
  const isAdmin = workspace?.role === "admin";
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [stages, setStages] = useState<FunnelStage[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [selectedStageId, setSelectedStageId] = useState("");
  const [fieldType, setFieldType] = useState<CustomField["fieldType"]>("text");
  const [fieldName, setFieldName] = useState("");
  const [fieldOptions, setFieldOptions] = useState("");
  const [selectedRequirements, setSelectedRequirements] = useState<Record<string, boolean>>({});
  const [stageNameDraft, setStageNameDraft] = useState("");
  const [stageColorDraft, setStageColorDraft] = useState(defaultStageColor);
  const [newStageName, setNewStageName] = useState("");
  const [newStageColor, setNewStageColor] = useState("#1d4ed8");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<WorkspaceRole>("member");

  const selectedStage = stages.find((stage) => stage.id === selectedStageId) ?? null;

  const reload = async () => {
    if (!workspace) {
      return;
    }

    const [fields, stageItems, memberItems] = await Promise.all([
      customFieldsApi.list(workspace.id),
      funnelStagesApi.list(workspace.id),
      workspaceApi.listMembers(workspace.id)
    ]);

    setCustomFields(fields);
    setStages(stageItems);
    setMembers(memberItems);
    setSelectedStageId((current) =>
      stageItems.some((stage) => stage.id === current) ? current : stageItems[0]?.id || ""
    );
  };

  useEffect(() => {
    if (!workspace) {
      return;
    }

    void reload().catch((error) => toast.error(getApiErrorMessage(error)));
  }, [workspace]);

  useEffect(() => {
    if (!selectedStage) {
      return;
    }

    setStageNameDraft(selectedStage.name);
    setStageColorDraft(selectedStage.color);

    const entries = selectedStage.requiredFields.map((field) => [
      `${field.isCustomField ? "custom" : "standard"}:${field.fieldName}`,
      true
    ]);

    setSelectedRequirements(Object.fromEntries(entries));
  }, [selectedStage]);

  return (
    <section className="page-shell px-0 py-0">
      <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]">
        <Card className="space-y-5">
          <div>
            <p className="label">Workspace e membros</p>
            <h1 className="section-title mt-2">Convide o time e defina os papeis</h1>
            <p className="mt-3 text-sm text-muted">
              {isAdmin
                ? "Admins podem convidar usuarios ja cadastrados e controlar permissoes."
                : "Voce esta neste workspace como membro. Somente admins podem editar esta area."}
            </p>
          </div>

          <div className="space-y-4 rounded-3xl border border-border/70 bg-background/60 p-4">
            <div>
              <label className="label">Email do usuario</label>
              <Input
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                placeholder="pessoa@empresa.com"
                disabled={!isAdmin}
              />
            </div>

            <div>
              <label className="label">Papel</label>
              <Select
                value={inviteRole}
                onChange={(event) => setInviteRole(event.target.value as WorkspaceRole)}
                disabled={!isAdmin}
              >
                <option value="member">member</option>
                <option value="admin">admin</option>
              </Select>
            </div>

            <Button
              className="w-full"
              disabled={!isAdmin}
              onClick={async () => {
                if (!workspace) {
                  return;
                }

                try {
                  await workspaceApi.inviteMember(workspace.id, {
                    email: inviteEmail,
                    role: inviteRole
                  });
                  setInviteEmail("");
                  setInviteRole("member");
                  await reload();
                  toast.success("Membro atualizado no workspace.");
                } catch (error) {
                  toast.error(getApiErrorMessage(error));
                }
              }}
            >
              Convidar ou atualizar membro
            </Button>
          </div>

          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-2xl border border-border/70 bg-white/70 p-3"
              >
                <div>
                  <p className="font-medium">{member.name}</p>
                  <p className="text-sm text-muted">{member.email}</p>
                </div>
                <span className="rounded-full bg-foreground px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white">
                  {member.role}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="space-y-5">
            <div>
              <p className="label">Etapas do funil</p>
              <h2 className="section-title mt-2">Crie, renomeie e ajuste o fluxo</h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {stages.map((stage) => (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => setSelectedStageId(stage.id)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    selectedStageId === stage.id
                      ? "bg-foreground text-white"
                      : "border border-border bg-white/70 text-foreground"
                  }`}
                >
                  {stage.name}
                </button>
              ))}
            </div>

            {selectedStage ? (
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_160px_auto]">
                <div>
                  <label className="label">Nome da etapa</label>
                  <Input
                    value={stageNameDraft}
                    onChange={(event) => setStageNameDraft(event.target.value)}
                    disabled={!isAdmin}
                  />
                </div>
                <div>
                  <label className="label">Cor</label>
                  <Input
                    type="color"
                    value={stageColorDraft}
                    onChange={(event) => setStageColorDraft(event.target.value)}
                    disabled={!isAdmin}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    className="w-full"
                    disabled={!isAdmin}
                    onClick={async () => {
                      try {
                        await funnelStagesApi.update(selectedStage.id, {
                          name: stageNameDraft,
                          color: stageColorDraft
                        });
                        await reload();
                        toast.success("Etapa atualizada.");
                      } catch (error) {
                        toast.error(getApiErrorMessage(error));
                      }
                    }}
                  >
                    Salvar etapa
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="grid gap-4 rounded-3xl border border-border/70 bg-background/60 p-4 md:grid-cols-[minmax(0,1fr)_160px_auto]">
              <div>
                <label className="label">Nova etapa</label>
                <Input
                  value={newStageName}
                  onChange={(event) => setNewStageName(event.target.value)}
                  placeholder="Ex.: Follow-up avancado"
                  disabled={!isAdmin}
                />
              </div>
              <div>
                <label className="label">Cor</label>
                <Input
                  type="color"
                  value={newStageColor}
                  onChange={(event) => setNewStageColor(event.target.value)}
                  disabled={!isAdmin}
                />
              </div>
              <div className="flex items-end">
                <Button
                  className="w-full"
                  disabled={!isAdmin}
                  onClick={async () => {
                    if (!workspace) {
                      return;
                    }

                    try {
                      await funnelStagesApi.create({
                        workspaceId: workspace.id,
                        name: newStageName,
                        color: newStageColor,
                        order:
                          stages.reduce((max, stage) => Math.max(max, stage.order), 0) + 1
                      });
                      setNewStageName("");
                      setNewStageColor("#1d4ed8");
                      await reload();
                      toast.success("Nova etapa criada.");
                    } catch (error) {
                      toast.error(getApiErrorMessage(error));
                    }
                  }}
                >
                  Criar etapa
                </Button>
              </div>
            </div>
          </Card>

          <Card className="space-y-5">
            <div>
              <p className="label">Campos personalizados</p>
              <h2 className="section-title mt-2">Estruture o contexto da prospeccao</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">Nome do campo</label>
                <Input
                  value={fieldName}
                  onChange={(event) => setFieldName(event.target.value)}
                  disabled={!isAdmin}
                />
              </div>

              <div>
                <label className="label">Tipo</label>
                <Select
                  value={fieldType}
                  onChange={(event) => setFieldType(event.target.value as CustomField["fieldType"])}
                  disabled={!isAdmin}
                >
                  <option value="text">Texto</option>
                  <option value="number">Numero</option>
                  <option value="select">Selecao</option>
                </Select>
              </div>

              {fieldType === "select" ? (
                <div>
                  <label className="label">Opcoes (separadas por virgula)</label>
                  <Input
                    value={fieldOptions}
                    onChange={(event) => setFieldOptions(event.target.value)}
                    placeholder="Ex.: Alto fit, Medio fit, Baixo fit"
                    disabled={!isAdmin}
                  />
                </div>
              ) : null}

              <Button
                className="w-full"
                disabled={!isAdmin}
                onClick={async () => {
                  if (!workspace) {
                    return;
                  }

                  try {
                    await customFieldsApi.create({
                      workspaceId: workspace.id,
                      name: fieldName,
                      fieldType,
                      options:
                        fieldType === "select"
                          ? fieldOptions
                              .split(",")
                              .map((item) => item.trim())
                              .filter(Boolean)
                          : undefined
                    });
                    setFieldName("");
                    setFieldOptions("");
                    await reload();
                    toast.success("Campo criado.");
                  } catch (error) {
                    toast.error(getApiErrorMessage(error));
                  }
                }}
              >
                Criar campo personalizado
              </Button>
            </div>

            <div className="space-y-3">
              {customFields.map((field) => (
                <div
                  key={field.id}
                  className="flex items-center justify-between rounded-2xl border border-border/70 bg-white/70 p-3"
                >
                  <div>
                    <p className="font-medium">{field.name}</p>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted">
                      {field.fieldType}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!isAdmin}
                    onClick={async () => {
                      try {
                        await customFieldsApi.delete(field.id);
                        await reload();
                        toast.success("Campo removido.");
                      } catch (error) {
                        toast.error(getApiErrorMessage(error));
                      }
                    }}
                  >
                    Remover
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          <Card className="space-y-5">
            <div>
              <p className="label">Campos obrigatorios por etapa</p>
              <h2 className="section-title mt-2">Defina a regua de avanco do funil</h2>
            </div>

            {selectedStage ? (
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">
                    Campos padrao
                  </h3>
                  {standardFields.map((field) => {
                    const key = `standard:${field.value}`;
                    return (
                      <label
                        key={key}
                        className="flex items-center gap-3 rounded-2xl border border-border/70 bg-white/70 px-4 py-3"
                      >
                        <input
                          type="checkbox"
                          checked={selectedRequirements[key] ?? false}
                          disabled={!isAdmin}
                          onChange={(event) =>
                            setSelectedRequirements((current) => ({
                              ...current,
                              [key]: event.target.checked
                            }))
                          }
                        />
                        <span>{field.label}</span>
                      </label>
                    );
                  })}
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">
                    Campos personalizados
                  </h3>
                  {customFields.length === 0 ? (
                    <p className="text-sm text-muted">
                      Crie campos personalizados para exigir mais contexto nas etapas.
                    </p>
                  ) : (
                    customFields.map((field) => {
                      const key = `custom:${field.id}`;
                      return (
                        <label
                          key={key}
                          className="flex items-center gap-3 rounded-2xl border border-border/70 bg-white/70 px-4 py-3"
                        >
                          <input
                            type="checkbox"
                            checked={selectedRequirements[key] ?? false}
                            disabled={!isAdmin}
                            onChange={(event) =>
                              setSelectedRequirements((current) => ({
                                ...current,
                                [key]: event.target.checked
                              }))
                            }
                          />
                          <span>{field.name}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            ) : null}

            <Button
              disabled={!isAdmin}
              onClick={async () => {
                if (!selectedStage) {
                  return;
                }

                const requiredFields = Object.entries(selectedRequirements)
                  .filter(([, isChecked]) => isChecked)
                  .map(([key]) => {
                    const [kind, value] = key.split(":");
                    return {
                      fieldName: value,
                      isCustomField: kind === "custom"
                    };
                  });

                try {
                  await funnelStagesApi.replaceRequiredFields(selectedStage.id, requiredFields);
                  await reload();
                  toast.success("Regras da etapa atualizadas.");
                } catch (error) {
                  toast.error(getApiErrorMessage(error));
                }
              }}
            >
              Salvar obrigatoriedades da etapa
            </Button>
          </Card>
        </div>
      </div>
    </section>
  );
};
