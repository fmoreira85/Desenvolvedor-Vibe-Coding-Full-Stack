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
import type { CustomField, FunnelStage } from "../types/models";

const standardFields = [
  { value: "name", label: "Nome" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Telefone" },
  { value: "company", label: "Empresa" },
  { value: "role", label: "Cargo" },
  { value: "lead_source", label: "Origem" },
  { value: "notes", label: "Notas" }
];

export const SettingsPage = () => {
  const workspace = useActiveWorkspace();
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [stages, setStages] = useState<FunnelStage[]>([]);
  const [selectedStageId, setSelectedStageId] = useState("");
  const [fieldType, setFieldType] = useState<CustomField["fieldType"]>("text");
  const [fieldName, setFieldName] = useState("");
  const [fieldOptions, setFieldOptions] = useState("");
  const [selectedRequirements, setSelectedRequirements] = useState<Record<string, boolean>>({});

  const selectedStage = stages.find((stage) => stage.id === selectedStageId) ?? null;

  const reload = async () => {
    if (!workspace) {
      return;
    }

    const [fields, stageItems] = await Promise.all([
      customFieldsApi.list(workspace.id),
      funnelStagesApi.list(workspace.id)
    ]);

    setCustomFields(fields);
    setStages(stageItems);
    setSelectedStageId((current) => current || stageItems[0]?.id || "");
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

    const entries = selectedStage.requiredFields.map((field) => [
      `${field.isCustomField ? "custom" : "standard"}:${field.fieldName}`,
      true
    ]);

    setSelectedRequirements(Object.fromEntries(entries));
  }, [selectedStage]);

  return (
    <section className="page-shell px-0 py-0">
      <div className="grid gap-6 xl:grid-cols-[minmax(340px,0.8fr)_minmax(0,1.2fr)]">
        <Card className="space-y-5">
          <div>
            <p className="label">Campos personalizados</p>
            <h1 className="section-title mt-2">Estruture o contexto da prospecção</h1>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label">Nome do campo</label>
              <Input value={fieldName} onChange={(event) => setFieldName(event.target.value)} />
            </div>

            <div>
              <label className="label">Tipo</label>
              <Select
                value={fieldType}
                onChange={(event) => setFieldType(event.target.value as CustomField["fieldType"])}
              >
                <option value="text">Texto</option>
                <option value="number">Número</option>
                <option value="select">Seleção</option>
              </Select>
            </div>

            {fieldType === "select" ? (
              <div>
                <label className="label">Opções (separadas por vírgula)</label>
                <Input
                  value={fieldOptions}
                  onChange={(event) => setFieldOptions(event.target.value)}
                  placeholder="Ex.: Alto fit, Médio fit, Baixo fit"
                />
              </div>
            ) : null}

            <Button
              className="w-full"
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
                        ? fieldOptions.split(",").map((item) => item.trim()).filter(Boolean)
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
              <div key={field.id} className="flex items-center justify-between rounded-2xl border border-border/70 bg-white/70 p-3">
                <div>
                  <p className="font-medium">{field.name}</p>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted">
                    {field.fieldType}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
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
            <p className="label">Campos obrigatórios por etapa</p>
            <h2 className="section-title mt-2">Defina a régua de avanço do funil</h2>
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
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">
                  Campos padrão
                </h3>
                {standardFields.map((field) => {
                  const key = `standard:${field.value}`;
                  return (
                    <label key={key} className="flex items-center gap-3 rounded-2xl border border-border/70 bg-white/70 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedRequirements[key] ?? false}
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
                      <label key={key} className="flex items-center gap-3 rounded-2xl border border-border/70 bg-white/70 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedRequirements[key] ?? false}
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
    </section>
  );
};
