import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useDroppable } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { cn } from "../../utils/cn";
const LeadCard = ({ lead, onClick }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: lead.id,
        data: {
            stageId: lead.stageId
        }
    });
    return (_jsxs("button", { type: "button", ref: setNodeRef, style: {
            transform: CSS.Translate.toString(transform)
        }, className: cn("w-full rounded-3xl border border-border bg-white/90 p-4 text-left shadow-sm transition hover:border-foreground/20 hover:shadow-md", isDragging && "opacity-60"), onClick: () => onClick(lead), ...listeners, ...attributes, children: [_jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { children: [_jsx("p", { className: "font-semibold text-foreground", children: lead.name }), _jsx("p", { className: "mt-1 text-sm text-muted", children: lead.company ?? "Empresa não informada" })] }), _jsx(GripVertical, { className: "mt-1 h-4 w-4 text-muted" })] }), _jsxs("div", { className: "mt-4 flex flex-wrap gap-2", children: [lead.role ? _jsx(Badge, { children: lead.role }) : null, lead.leadSource ? _jsx(Badge, { children: lead.leadSource }) : null] })] }));
};
export const StageColumn = ({ stage, leads, onLeadClick }) => {
    const { setNodeRef, isOver } = useDroppable({
        id: stage.id
    });
    return (_jsx("div", { ref: setNodeRef, children: _jsxs(Card, { className: cn("min-h-[520px] min-w-[280px] flex-1 bg-white/60 p-0", isOver && "ring-2 ring-accent/30"), children: [_jsxs("div", { className: "flex items-center justify-between border-b border-border/70 px-5 py-4", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "h-3 w-3 rounded-full", style: { backgroundColor: stage.color }, "aria-hidden": "true" }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-foreground", children: stage.name }), _jsxs("p", { className: "text-xs uppercase tracking-[0.2em] text-muted", children: [leads.length, " lead", leads.length === 1 ? "" : "s"] })] })] }), _jsx(Badge, { children: stage.order })] }), _jsxs("div", { className: "space-y-3 p-4", children: [leads.length === 0 ? (_jsx("div", { className: "rounded-3xl border border-dashed border-border bg-background/70 px-4 py-8 text-center text-sm text-muted", children: "Arraste um lead para esta etapa." })) : null, leads.map((lead) => (_jsx(LeadCard, { lead: lead, onClick: onLeadClick }, lead.id)))] })] }) }));
};
