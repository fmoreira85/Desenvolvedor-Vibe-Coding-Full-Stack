import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Building2, GripVertical, Sparkles } from "lucide-react";

import type { FunnelStage, Lead } from "../../types/models";
import { cn } from "../../utils/cn";
import { getInitials } from "../../utils/formatters";
import { Badge } from "../ui/Badge";
import { EmptyState } from "../ui/EmptyState";

type LeadCardProps = {
  lead: Lead;
  onClick: (lead: Lead) => void;
};

const LeadCard = ({ lead, onClick }: LeadCardProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    data: {
      stageId: lead.stageId
    }
  });

  return (
    <button
      type="button"
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn(
        "mb-2 w-full cursor-grab rounded-lg border border-border bg-card p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing",
        isDragging && "opacity-60"
      )}
      onClick={() => onClick(lead)}
      {...listeners}
      {...attributes}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium leading-tight text-foreground">{lead.name}</p>
          <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <Building2 className="h-3 w-3" />
            {lead.company ?? "Empresa nao informada"}
          </p>
        </div>
        <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      </div>

      <div className="mt-3">
        <Badge variant="outline">{lead.leadSource ?? "Sem origem"}</Badge>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-foreground">
          {getInitials(lead.assignedUser?.name ?? lead.name)}
        </div>
        {lead.generatedMessagesCount > 0 ? (
          <Sparkles className="h-4 w-4 text-violet-500" />
        ) : null}
      </div>
    </button>
  );
};

type StageColumnProps = {
  stage: FunnelStage;
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
};

export const StageColumn = ({ stage, leads, onLeadClick }: StageColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[calc(100vh-200px)] w-72 shrink-0 rounded-xl border border-border bg-muted p-3",
        isOver && "border-2 border-dashed border-primary bg-[var(--accent-soft)]"
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
            <h3 className="truncate text-sm font-semibold text-foreground">{stage.name}</h3>
          </div>
        </div>
        <Badge variant="secondary">{leads.length}</Badge>
      </div>

      {leads.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Esta etapa esta vazia"
          description="Adicione ou arraste um lead para continuar o fluxo."
          className="rounded-lg border border-dashed border-border bg-white/70 py-10"
        />
      ) : (
        <div className="app-scrollbar overflow-y-auto">
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onClick={onLeadClick} />
          ))}
        </div>
      )}
    </div>
  );
};
