import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import { useDeferredValue, useEffect, useState } from "react";
import toast from "react-hot-toast";

import { LeadCreatePanel } from "../components/leads/LeadCreatePanel";
import { LeadModal } from "../components/leads/LeadModal";
import { StageColumn } from "../components/leads/StageColumn";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
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
  const [stages, setStages] = useState<FunnelStage[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [search, setSearch] = useState("");
  const [selectedStageId, setSelectedStageId] = useState("");
  const [selectedAssignedTo, setSelectedAssignedTo] = useState("");
  const deferredSearch = useDeferredValue(search);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const loadWorkspaceData = async () => {
    if (!workspace) {
      return;
    }

    const [stageItems, fieldItems, campaignItems, memberItems] = await Promise.all([
      funnelStagesApi.list(workspace.id),
      customFieldsApi.list(workspace.id),
      campaignsApi.list(workspace.id),
      workspaceApi.listMembers(workspace.id)
    ]);

    setStages(stageItems);
    setCustomFields(fieldItems);
    setCampaigns(campaignItems);
    setMembers(memberItems);
  };

  const loadLeads = async () => {
    if (!workspace) {
      return;
    }

    const leadItems = await leadsApi.list({
      workspaceId: workspace.id,
      stageId: selectedStageId || undefined,
      assignedTo: selectedAssignedTo || undefined,
      search: deferredSearch.trim() || undefined
    });

    setLeads(leadItems);
  };

  useEffect(() => {
    if (!workspace) {
      return;
    }

    setSelectedLead(null);
    setSearch("");
    setSelectedStageId("");
    setSelectedAssignedTo("");
    void loadWorkspaceData().catch((error) => toast.error(getApiErrorMessage(error)));
  }, [workspace]);

  useEffect(() => {
    if (!workspace) {
      return;
    }

    void loadLeads().catch((error) => toast.error(getApiErrorMessage(error)));
  }, [workspace, deferredSearch, selectedStageId, selectedAssignedTo]);

  return (
    <section className="page-shell px-0 py-0">
      <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
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

        <div className="space-y-5">
          <Card className="space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="label">Kanban operacional</p>
                <h1 className="section-title mt-2">Movimente leads entre as etapas</h1>
              </div>
              <Input
                className="mt-0 w-full lg:max-w-xs"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nome ou empresa"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
              <div>
                <label className="label">Filtrar por etapa</label>
                <Select
                  value={selectedStageId}
                  onChange={(event) => setSelectedStageId(event.target.value)}
                >
                  <option value="">Todas as etapas</option>
                  {stages.map((stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="label">Filtrar por responsavel</label>
                <Select
                  value={selectedAssignedTo}
                  onChange={(event) => setSelectedAssignedTo(event.target.value)}
                >
                  <option value="">Todos os membros</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.userId}>
                      {member.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="ghost"
                  className="w-full md:w-auto"
                  onClick={() => {
                    setSearch("");
                    setSelectedStageId("");
                    setSelectedAssignedTo("");
                  }}
                >
                  Limpar filtros
                </Button>
              </div>
            </div>
          </Card>

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
                  toast.error(`Campos obrigatorios: ${details.missingFields.join(", ")}`);
                } else {
                  toast.error(getApiErrorMessage(error));
                }
              }
            }}
          >
            <div className="flex gap-4 overflow-x-auto pb-2">
              {stages.map((stage) => (
                <StageColumn
                  key={stage.id}
                  stage={stage}
                  leads={leads.filter((lead) => lead.stageId === stage.id)}
                  onLeadClick={setSelectedLead}
                />
              ))}
            </div>
          </DndContext>
        </div>
      </div>

      <LeadModal
        lead={selectedLead}
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
