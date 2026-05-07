import { closestCenter, DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { useDeferredValue, useEffect, useState } from "react";
import toast from "react-hot-toast";

import { LeadCreatePanel } from "../components/leads/LeadCreatePanel";
import { LeadModal } from "../components/leads/LeadModal";
import { StageColumn } from "../components/leads/StageColumn";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { useActiveWorkspace } from "../hooks/useActiveWorkspace";
import { campaignsApi } from "../services/api/campaignsApi";
import { getApiErrorDetails, getApiErrorMessage } from "../services/api/client";
import { customFieldsApi } from "../services/api/customFieldsApi";
import { funnelStagesApi } from "../services/api/funnelStagesApi";
import { leadsApi } from "../services/api/leadsApi";
import type { Campaign, CustomField, FunnelStage, Lead } from "../types/models";

export const LeadsPage = () => {
  const workspace = useActiveWorkspace();
  const [stages, setStages] = useState<FunnelStage[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const reload = async () => {
    if (!workspace) {
      return;
    }

    const [stageItems, leadItems, fieldItems, campaignItems] = await Promise.all([
      funnelStagesApi.list(workspace.id),
      leadsApi.list(workspace.id),
      customFieldsApi.list(workspace.id),
      campaignsApi.list(workspace.id)
    ]);

    setStages(stageItems);
    setLeads(leadItems);
    setCustomFields(fieldItems);
    setCampaigns(campaignItems);
  };

  useEffect(() => {
    if (!workspace) {
      return;
    }

    void reload().catch((error) => toast.error(getApiErrorMessage(error)));
  }, [workspace]);

  const visibleLeads = leads.filter((lead) => {
    const haystack = `${lead.name} ${lead.company ?? ""}`.toLowerCase();
    return haystack.includes(deferredSearch.toLowerCase());
  });

  return (
    <section className="page-shell px-0 py-0">
      <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <LeadCreatePanel
          stages={stages}
          customFields={customFields}
          onCreate={async (input) => {
            try {
              await leadsApi.create({
                workspaceId: workspace?.id,
                ...input
              });
              await reload();
              toast.success("Lead criado com sucesso.");
            } catch (error) {
              toast.error(getApiErrorMessage(error));
            }
          }}
        />

        <div className="space-y-5">
          <Card className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
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
                setLeads((current) => current.map((lead) => (lead.id === updated.id ? updated : lead)));
                if (selectedLead?.id === updated.id) {
                  setSelectedLead(updated);
                }
                toast.success(`Lead movido para ${updated.stage.name}.`);
              } catch (error) {
                const details = getApiErrorDetails(error) as { missingFields?: string[] } | undefined;
                if (details?.missingFields?.length) {
                  toast.error(`Campos obrigatórios: ${details.missingFields.join(", ")}`);
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
                  leads={visibleLeads.filter((lead) => lead.stageId === stage.id)}
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
        onLeadUpdated={(updatedLead) => {
          setLeads((current) => current.map((lead) => (lead.id === updatedLead.id ? updatedLead : lead)));
          setSelectedLead(updatedLead);
        }}
      />
    </section>
  );
};
