import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import { Plus, Search, UserCircle2, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { LeadCreatePanel } from "../components/leads/LeadCreatePanel";
import { LeadModal } from "../components/leads/LeadModal";
import { StageColumn } from "../components/leads/StageColumn";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Skeleton } from "../components/ui/Skeleton";
import { useActiveWorkspace } from "../hooks/useActiveWorkspace";
import { campaignsApi } from "../services/api/campaignsApi";
import { getApiErrorDetails, getApiErrorMessage } from "../services/api/client";
import { customFieldsApi } from "../services/api/customFieldsApi";
import { funnelStagesApi } from "../services/api/funnelStagesApi";
import { leadsApi } from "../services/api/leadsApi";
import { workspaceApi } from "../services/api/workspaceApi";
import type {
  Campaign,
  CustomField,
  FunnelStage,
  Lead,
  WorkspaceMember
} from "../types/models";

export const LeadsPage = () => {
  const workspace = useActiveWorkspace();
  const workspaceId = workspace?.id ?? null;
  const [stages, setStages] = useState<FunnelStage[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedStageId, setSelectedStageId] = useState("");
  const [selectedAssignedTo, setSelectedAssignedTo] = useState("");
  const [showCreatePanel, setShowCreatePanel] = useState(true);
  const [loading, setLoading] = useState(true);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const normalizeText = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();

  const visibleStages = selectedStageId ? stages.filter((stage) => stage.id === selectedStageId) : stages;
  const filteredLeads = leads.filter((lead) => {
    if (selectedStageId && lead.stageId !== selectedStageId) {
      return false;
    }

    if (selectedAssignedTo) {
      const assignedLeadUserIds = [lead.assignedUserId, lead.assignedUser?.id]
        .filter((value): value is string => Boolean(value))
        .map((value) => value.trim());

      if (!assignedLeadUserIds.includes(selectedAssignedTo.trim())) {
        return false;
      }
    }

    if (!debouncedSearch) {
      return true;
    }

    return [lead.name, lead.company ?? "", lead.email ?? "", lead.role ?? "", lead.phone ?? ""].some((value) =>
      normalizeText(value).includes(normalizeText(debouncedSearch))
    );
  });

  const assignedLeadsCount = filteredLeads.filter((lead) => Boolean(lead.assignedUserId || lead.assignedUser?.id)).length;

  const loadWorkspaceData = async () => {
    if (!workspaceId) {
      return;
    }

    const [stageItems, fieldItems, campaignItems, memberItems] = await Promise.all([
      funnelStagesApi.list(workspaceId),
      customFieldsApi.list(workspaceId),
      campaignsApi.list(workspaceId),
      workspaceApi.listMembers(workspaceId)
    ]);

    setStages(stageItems);
    setCustomFields(fieldItems);
    setCampaigns(campaignItems);
    setMembers(memberItems);
  };

  const loadLeads = async () => {
    if (!workspaceId) {
      return;
    }

    const leadItems = await leadsApi.list({ workspaceId });
    setLeads(leadItems);
  };

  useEffect(() => {
    if (!workspaceId) {
      return;
    }

    setLoading(true);
    setSelectedLead(null);
    setSearch("");
    setSelectedStageId("");
    setSelectedAssignedTo("");
    void Promise.all([loadWorkspaceData(), loadLeads()])
      .catch((error) => toast.error(getApiErrorMessage(error)))
      .finally(() => setLoading(false));
  }, [workspaceId]);

  return (
    <section className="page-shell">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-sm text-muted-foreground">Leads visiveis</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{filteredLeads.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">Com responsavel</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{assignedLeadsCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">Etapas carregadas</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{stages.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">Campanhas ativas</p>
          <p className="mt-2 text-3xl font-bold text-foreground">
            {campaigns.filter((campaign) => campaign.isActive).length}
          </p>
        </Card>
      </div>

      <Card className="space-y-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="label">Kanban operacional</p>
            <h2 className="mt-2 text-xl font-semibold text-foreground">Filtros e acao rapida do pipeline</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => setShowCreatePanel((current) => !current)}>
              <Plus className="h-4 w-4" />
              {showCreatePanel ? "Ocultar novo lead" : "Novo lead"}
            </Button>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,0.8fr)]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-[1.15rem] h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome ou empresa"
            />
          </div>

          <Select value={selectedStageId} onChange={(event) => setSelectedStageId(event.target.value)}>
            <option value="">Todas as etapas</option>
            {stages.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.name}
              </option>
            ))}
          </Select>

          <Select value={selectedAssignedTo} onChange={(event) => setSelectedAssignedTo(event.target.value)}>
            <option value="">Todos os responsaveis</option>
            {members.map((member) => (
              <option key={member.id} value={member.userId}>
                {member.name}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        {showCreatePanel ? (
          <LeadCreatePanel
            stages={stages}
            customFields={customFields}
            members={members}
            onCreate={async (input) => {
              try {
                await leadsApi.create({
                  workspaceId: workspace?.id,
                  ...input
                });
                await loadLeads();
                toast.success("Lead criado com sucesso.");
              } catch (error) {
                toast.error(getApiErrorMessage(error));
              }
            }}
          />
        ) : null}

        <Card className="overflow-hidden">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="rounded-xl border border-border bg-muted p-3">
                  <Skeleton className="h-5 w-28" />
                  <div className="mt-4 space-y-3">
                    <Skeleton className="h-28 w-full rounded-lg" />
                    <Skeleton className="h-28 w-full rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : visibleStages.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Nenhuma etapa encontrada"
              description="Ajuste os filtros ou configure o funil para visualizar o kanban."
            />
          ) : filteredLeads.length === 0 ? (
            <EmptyState
              icon={UserCircle2}
              title="Nenhum lead encontrado"
              description="Tente limpar os filtros ou criar o primeiro lead deste workspace."
              actionLabel={showCreatePanel ? "Criar primeiro lead" : "Abrir formulario"}
              onAction={() => setShowCreatePanel(true)}
            />
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={async (event: DragEndEvent) => {
                const leadId = String(event.active.id);
                const targetStageId = event.over ? String(event.over.id) : null;

                if (!targetStageId) {
                  return;
                }

                const currentLead = leads.find((lead) => lead.id === leadId);
                if (!currentLead || currentLead.stageId === targetStageId) {
                  return;
                }

                try {
                  const updated = await leadsApi.moveStage(leadId, targetStageId);
                  await loadLeads();
                  if (selectedLead?.id === updated.id) {
                    setSelectedLead(updated);
                  }
                  toast.success(`Lead movido para ${updated.stage.name}.`);
                } catch (error) {
                  const details = getApiErrorDetails(error) as { missingFields?: string[] } | undefined;
                  if (details?.missingFields?.length) {
                    toast.error("Preencha os campos obrigatorios antes de avancar.");
                  } else {
                    toast.error(getApiErrorMessage(error));
                  }
                }
              }}
            >
              <div className="app-scrollbar flex gap-4 overflow-x-auto pb-2">
                {visibleStages.map((stage) => (
                  <StageColumn
                    key={stage.id}
                    stage={stage}
                    leads={filteredLeads.filter((lead) => lead.stageId === stage.id)}
                    onLeadClick={setSelectedLead}
                  />
                ))}
              </div>
            </DndContext>
          )}
        </Card>
      </div>

      <LeadModal
        lead={selectedLead}
        stages={stages}
        isOpen={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        customFields={customFields}
        campaigns={campaigns}
        members={members}
        onLeadUpdated={(updatedLead) => {
          setLeads((current) => current.map((lead) => (lead.id === updatedLead.id ? updatedLead : lead)));
          setSelectedLead(updatedLead);
        }}
      />
    </section>
  );
};
