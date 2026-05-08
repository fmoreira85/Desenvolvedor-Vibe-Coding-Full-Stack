import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Mail, Settings2, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { Input } from "../components/ui/Input";
import { AlertDialog } from "../components/ui/AlertDialog";
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

const tabs = [
  { id: "workspace", label: "Workspace" },
  { id: "fields", label: "Campos Personalizados" },
  { id: "stages", label: "Etapas do Funil" },
  { id: "members", label: "Membros" }
] as const;

const fieldTypeVariant: Record<CustomField["fieldType"], "default" | "success" | "warning"> = {
  text: "default",
  number: "success",
  select: "warning"
};

const StageRow = ({
  stage,
  customFields,
  selectedRequirements,
  isAdmin,
  onColorChange,
  onNameChange,
  onRequirementChange
}: {
  stage: FunnelStage;
  customFields: CustomField[];
  selectedRequirements: Record<string, boolean>;
  isAdmin: boolean;
  onColorChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onRequirementChange: (key: string, checked: boolean) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: stage.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="rounded-xl border border-border bg-white p-4"
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded-md border border-border bg-muted p-2 text-muted-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <input
          type="color"
          value={stage.color}
          onChange={(event) => onColorChange(event.target.value)}
          className="h-10 w-10 cursor-pointer rounded-full border-0 bg-transparent p-0"
          disabled={!isAdmin}
        />
        <Input value={stage.name} onChange={(event) => onNameChange(event.target.value)} disabled={!isAdmin} />
      </div>

      <details className="mt-4 rounded-lg border border-border bg-muted p-4">
        <summary className="cursor-pointer text-sm font-semibold text-foreground">
          Campos obrigatorios
        </summary>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {standardFields.map((field) => {
            const key = `standard:${field.value}`;
            return (
              <label key={key} className="flex items-center gap-3 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={selectedRequirements[key] ?? false}
                  disabled={!isAdmin}
                  onChange={(event) => onRequirementChange(key, event.target.checked)}
                />
                {field.label}
              </label>
            );
          })}

          {customFields.map((field) => {
            const key = `custom:${field.id}`;
            return (
              <label key={key} className="flex items-center gap-3 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={selectedRequirements[key] ?? false}
                  disabled={!isAdmin}
                  onChange={(event) => onRequirementChange(key, event.target.checked)}
                />
                {field.name}
              </label>
            );
          })}
        </div>
      </details>
    </div>
  );
};

export const SettingsPage = () => {
  const workspace = useActiveWorkspace();
  const isAdmin = workspace?.role === "admin";
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["id"]>("workspace");
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [stages, setStages] = useState<FunnelStage[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [workspaceName, setWorkspaceName] = useState("");
  const [fieldType, setFieldType] = useState<CustomField["fieldType"]>("text");
  const [fieldName, setFieldName] = useState("");
  const [fieldOptions, setFieldOptions] = useState("");
  const [fieldPendingDelete, setFieldPendingDelete] = useState<CustomField | null>(null);
  const [selectedRequirements, setSelectedRequirements] = useState<Record<string, Record<string, boolean>>>({});
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<WorkspaceRole>("member");
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

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
    setWorkspaceName(workspace.name);
    setSelectedRequirements(
      Object.fromEntries(
        stageItems.map((stage) => [
          stage.id,
          Object.fromEntries(
            stage.requiredFields.map((field) => [
              `${field.isCustomField ? "custom" : "standard"}:${field.fieldName}`,
              true
            ])
          )
        ])
      )
    );
  };

  useEffect(() => {
    if (!workspace) {
      return;
    }

    void reload().catch((error) => toast.error(getApiErrorMessage(error)));
  }, [workspace]);

  return (
    <section className="page-shell">
      <div className="space-y-4">
        <div>
          <p className="label">Governanca do workspace</p>
          <h2 className="mt-2 text-xl font-semibold text-foreground">Configuracoes do sistema</h2>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-border pb-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                activeTab === tab.id ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "workspace" ? (
        <Card className="space-y-5">
          <div>
            <p className="label">Workspace</p>
            <h3 className="mt-2 text-lg font-semibold text-foreground">Dados principais do ambiente</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
            <div>
              <label className="label">Nome do workspace</label>
              <Input value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} disabled={!isAdmin} />
            </div>
            <div className="flex items-end">
              <Button
                disabled={!isAdmin || !workspace}
                onClick={async () => {
                  if (!workspace) {
                    return;
                  }

                  try {
                    await workspaceApi.update(workspace.id, workspaceName);
                    toast.success("Workspace atualizado.");
                  } catch (error) {
                    toast.error(getApiErrorMessage(error));
                  }
                }}
              >
                Salvar
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      {activeTab === "fields" ? (
        <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
          <Card className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Novo campo personalizado</h3>
            <div>
              <label className="label">Nome</label>
              <Input value={fieldName} onChange={(event) => setFieldName(event.target.value)} disabled={!isAdmin} />
            </div>
            <div>
              <label className="label">Tipo</label>
              <Select value={fieldType} onChange={(event) => setFieldType(event.target.value as CustomField["fieldType"])} disabled={!isAdmin}>
                <option value="text">Texto</option>
                <option value="number">Numero</option>
                <option value="select">Select</option>
              </Select>
            </div>
            {fieldType === "select" ? (
              <div>
                <label className="label">Opcoes</label>
                <Input
                  value={fieldOptions}
                  onChange={(event) => setFieldOptions(event.target.value)}
                  placeholder="Separadas por virgula"
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
                    options: fieldType === "select" ? fieldOptions.split(",").map((item) => item.trim()).filter(Boolean) : undefined
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
              Criar campo
            </Button>
          </Card>

          <Card>
            {customFields.length === 0 ? (
              <EmptyState
                icon={Settings2}
                title="Sem campos personalizados"
                description="Crie campos para enriquecer o contexto dos leads neste workspace."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-2">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      <th className="pb-2">Nome</th>
                      <th className="pb-2">Tipo</th>
                      <th className="pb-2">Acoes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customFields.map((field) => (
                      <tr key={field.id} className="bg-white shadow-sm">
                        <td className="rounded-l-xl px-4 py-4 text-sm font-semibold text-foreground">{field.name}</td>
                        <td className="px-4 py-4">
                          <Badge variant={fieldTypeVariant[field.fieldType]}>{field.fieldType}</Badge>
                        </td>
                        <td className="rounded-r-xl px-4 py-4">
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={!isAdmin}
                            onClick={() => setFieldPendingDelete(field)}
                          >
                            Remover
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      ) : null}

      {activeTab === "stages" ? (
        <div className="space-y-6">
          <Card className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="label">Etapas do funil</p>
                <h3 className="mt-2 text-lg font-semibold text-foreground">Reordene, renomeie e ajuste regras</h3>
              </div>
              <Button
                variant="secondary"
                disabled={!isAdmin}
                onClick={async () => {
                  if (!workspace) {
                    return;
                  }

                  try {
                    await funnelStagesApi.create({
                      workspaceId: workspace.id,
                      name: `Nova etapa ${stages.length + 1}`,
                      color: "#1818eb",
                      order: stages.length + 1
                    });
                    await reload();
                    toast.success("Etapa criada.");
                  } catch (error) {
                    toast.error(getApiErrorMessage(error));
                  }
                }}
              >
                Adicionar etapa
              </Button>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={async (event) => {
                const { active, over } = event;
                if (!over || active.id === over.id) {
                  return;
                }

                const oldIndex = stages.findIndex((stage) => stage.id === active.id);
                const newIndex = stages.findIndex((stage) => stage.id === over.id);
                const reordered = arrayMove(stages, oldIndex, newIndex).map((stage, index) => ({
                  ...stage,
                  order: index + 1
                }));
                setStages(reordered);

                try {
                  await Promise.all(
                    reordered.map((stage) => funnelStagesApi.update(stage.id, { order: stage.order, name: stage.name, color: stage.color }))
                  );
                  toast.success("Ordem das etapas atualizada.");
                } catch (error) {
                  toast.error(getApiErrorMessage(error));
                  await reload();
                }
              }}
            >
              <SortableContext items={stages.map((stage) => stage.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {stages.map((stage) => (
                    <StageRow
                      key={stage.id}
                      stage={stage}
                      customFields={customFields}
                      selectedRequirements={selectedRequirements[stage.id] ?? {}}
                      isAdmin={isAdmin}
                      onColorChange={(value) =>
                        setStages((current) => current.map((item) => (item.id === stage.id ? { ...item, color: value } : item)))
                      }
                      onNameChange={(value) =>
                        setStages((current) => current.map((item) => (item.id === stage.id ? { ...item, name: value } : item)))
                      }
                      onRequirementChange={(key, checked) =>
                        setSelectedRequirements((current) => ({
                          ...current,
                          [stage.id]: {
                            ...(current[stage.id] ?? {}),
                            [key]: checked
                          }
                        }))
                      }
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </Card>

          <Button
            disabled={!isAdmin}
            onClick={async () => {
              try {
                await Promise.all(
                  stages.map(async (stage) => {
                    await funnelStagesApi.update(stage.id, {
                      name: stage.name,
                      color: stage.color,
                      order: stage.order
                    });

                    const requiredFields = Object.entries(selectedRequirements[stage.id] ?? {})
                      .filter(([, isChecked]) => isChecked)
                      .map(([key]) => {
                        const [kind, value] = key.split(":");
                        return {
                          fieldName: value,
                          isCustomField: kind === "custom"
                        };
                      });

                    await funnelStagesApi.replaceRequiredFields(stage.id, requiredFields);
                  })
                );
                toast.success("Etapas e obrigatoriedades salvas.");
                await reload();
              } catch (error) {
                toast.error(getApiErrorMessage(error));
              }
            }}
          >
            Salvar configuracao do funil
          </Button>
        </div>
      ) : null}

      {activeTab === "members" ? (
        <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
          <Card className="space-y-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold text-foreground">Convidar membro</h3>
            </div>
            <div>
              <label className="label">Email</label>
              <Input value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} disabled={!isAdmin} />
            </div>
            <div>
              <label className="label">Papel</label>
              <Select value={inviteRole} onChange={(event) => setInviteRole(event.target.value as WorkspaceRole)} disabled={!isAdmin}>
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
                  await workspaceApi.inviteMember(workspace.id, { email: inviteEmail, role: inviteRole });
                  setInviteEmail("");
                  setInviteRole("member");
                  await reload();
                  toast.success("Membro atualizado no workspace.");
                } catch (error) {
                  toast.error(getApiErrorMessage(error));
                }
              }}
            >
              Convidar membro
            </Button>
          </Card>

          <Card>
            {members.length === 0 ? (
              <EmptyState
                icon={Users}
                title="Nenhum membro encontrado"
                description="Convide o time para compartilhar o workspace e operar em conjunto."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-2">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      <th className="pb-2">Nome</th>
                      <th className="pb-2">Email</th>
                      <th className="pb-2">Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => (
                      <tr key={member.id} className="bg-white shadow-sm">
                        <td className="rounded-l-xl px-4 py-4 text-sm font-semibold text-foreground">{member.name}</td>
                        <td className="px-4 py-4 text-sm text-muted-foreground">{member.email}</td>
                        <td className="rounded-r-xl px-4 py-4">
                          <Badge variant={member.role === "admin" ? "default" : "secondary"}>{member.role}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      ) : null}

      <AlertDialog
        open={!!fieldPendingDelete}
        title="Remover campo personalizado"
        description="Os valores associados a este campo deixarão de aparecer nos leads. Tem certeza de que deseja continuar?"
        confirmLabel="Remover campo"
        onCancel={() => setFieldPendingDelete(null)}
        onConfirm={async () => {
          if (!fieldPendingDelete) {
            return;
          }

          try {
            await customFieldsApi.delete(fieldPendingDelete.id);
            setFieldPendingDelete(null);
            await reload();
            toast.success("Campo removido.");
          } catch (error) {
            toast.error(getApiErrorMessage(error));
          }
        }}
      />
    </section>
  );
};
