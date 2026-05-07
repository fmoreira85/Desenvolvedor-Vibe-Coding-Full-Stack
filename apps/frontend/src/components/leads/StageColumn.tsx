import { useDroppable } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import type { FunnelStage, Lead } from "../../types/models";
import { cn } from "../../utils/cn";

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
      style={{
        transform: CSS.Translate.toString(transform)
      }}
      className={cn(
        "w-full rounded-3xl border border-border bg-white/90 p-4 text-left shadow-sm transition hover:border-foreground/20 hover:shadow-md",
        isDragging && "opacity-60"
      )}
      onClick={() => onClick(lead)}
      {...listeners}
      {...attributes}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-foreground">{lead.name}</p>
          <p className="mt-1 text-sm text-muted">{lead.company ?? "Empresa não informada"}</p>
        </div>
        <GripVertical className="mt-1 h-4 w-4 text-muted" />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {lead.role ? <Badge>{lead.role}</Badge> : null}
        {lead.leadSource ? <Badge>{lead.leadSource}</Badge> : null}
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
    <div ref={setNodeRef}>
      <Card
        className={cn(
          "min-h-[520px] min-w-[280px] flex-1 bg-white/60 p-0",
          isOver && "ring-2 ring-accent/30"
        )}
      >
        <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
          <div className="flex items-center gap-3">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: stage.color }}
              aria-hidden="true"
            />
            <div>
              <h3 className="font-semibold text-foreground">{stage.name}</h3>
              <p className="text-xs uppercase tracking-[0.2em] text-muted">
                {leads.length} lead{leads.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
          <Badge>{stage.order}</Badge>
        </div>

        <div className="space-y-3 p-4">
          {leads.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-background/70 px-4 py-8 text-center text-sm text-muted">
              Arraste um lead para esta etapa.
            </div>
          ) : null}

          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onClick={onLeadClick} />
          ))}
        </div>
      </Card>
    </div>
  );
};
