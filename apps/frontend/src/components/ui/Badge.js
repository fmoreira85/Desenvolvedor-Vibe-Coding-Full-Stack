import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from "../../utils/cn";
export const Badge = ({ children, className, ...props }) => (_jsx("span", { className: cn("inline-flex items-center rounded-full border border-border bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted", className), ...props, children: children }));
