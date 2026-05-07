import { useEffect, useState } from "react";

import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Textarea } from "../ui/Textarea";
import type { CustomField, FunnelStage, WorkspaceMember } from "../../types/models";

type LeadCreatePanelProps = {
  stages: FunnelStage[];
  customFields: CustomField[];
  members: WorkspaceMember[];
  onCreate: (input: Record<string, unknown>) => Promise<void>;
};

export const LeadCreatePanel = ({
  stages,
  customFields,
  members,
  onCreate
}: LeadCreatePanelProps) => {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    role: "",
    leadSource: "",
    notes: "",
    stageId: stages[0]?.id ?? "",
    assignedUserId: ""
  });
  const [customValues, setCustomValues] = useState<Record<string, string>>({});

  useEffect(() => {
    setForm((current) => ({
      ...current,
      stageId: stages.some((stage) => stage.id === current.stageId)
        ? current.stageId
        : stages[0]?.id || ""
    }));
  }, [stages]);

  return (
    <Card className="h-fit">
      <div className="mb-4">
        <p className="label">Novo lead</p>
        <h3 className="mt-2 font-display text-2xl font-semibold">Adicionar ao funil</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="label">Nome</label>
          <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        </div>

        <div>
          <label className="label">Empresa</label>
          <Input
            value={form.company}
            onChange={(event) => setForm({ ...form, company: event.target.value })}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">Email</label>
            <Input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
          </div>
          <div>
            <label className="label">Telefone</label>
            <Input
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">Cargo</label>
            <Input value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} />
          </div>
          <div>
            <label className="label">Origem</label>
            <Input
              value={form.leadSource}
              onChange={(event) => setForm({ ...form, leadSource: event.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="label">Etapa inicial</label>
          <Select
            value={form.stageId}
            onChange={(event) => setForm({ ...form, stageId: event.target.value })}
          >
            {stages.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.name}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="label">Responsavel</label>
          <Select
            value={form.assignedUserId}
            onChange={(event) => setForm({ ...form, assignedUserId: event.target.value })}
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
          <label className="label">Notas</label>
          <Textarea
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
          />
        </div>

        {customFields.length > 0 ? (
          <div className="space-y-4 rounded-3xl border border-border/70 bg-background/60 p-4">
            <h4 className="text-sm font-semibold text-foreground">Campos personalizados</h4>
            {customFields.map((field) => (
              <div key={field.id}>
                <label className="label">{field.name}</label>
                {field.fieldType === "select" ? (
                  <Select
                    value={customValues[field.id] ?? ""}
                    onChange={(event) =>
                      setCustomValues((current) => ({ ...current, [field.id]: event.target.value }))
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
                    value={customValues[field.id] ?? ""}
                    onChange={(event) =>
                      setCustomValues((current) => ({ ...current, [field.id]: event.target.value }))
                    }
                  />
                )}
              </div>
            ))}
          </div>
        ) : null}

        <Button
          className="w-full"
          disabled={submitting}
          onClick={async () => {
            setSubmitting(true);
            try {
              await onCreate({
                ...form,
                customFieldValues: Object.entries(customValues).map(([customFieldId, value]) => ({
                  customFieldId,
                  value
                }))
              });
              setForm({
                name: "",
                email: "",
                phone: "",
                company: "",
                role: "",
                leadSource: "",
                notes: "",
                stageId: stages[0]?.id ?? "",
                assignedUserId: ""
              });
              setCustomValues({});
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {submitting ? "Criando lead..." : "Criar lead"}
        </Button>
      </div>
    </Card>
  );
};
