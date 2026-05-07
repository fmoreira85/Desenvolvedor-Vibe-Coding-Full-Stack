import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { X } from "lucide-react";
export const Modal = ({ isOpen, title, description, onClose, children }) => {
    if (!isOpen) {
        return null;
    }
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-foreground/55 px-4 py-6 backdrop-blur-sm", children: _jsxs("div", { className: "panel w-full max-w-4xl overflow-hidden", children: [_jsxs("div", { className: "flex items-start justify-between border-b border-border/80 px-6 py-5", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-display text-2xl font-semibold", children: title }), description ? _jsx("p", { className: "mt-2 text-sm text-muted", children: description }) : null] }), _jsx("button", { type: "button", onClick: onClose, className: "rounded-2xl border border-border bg-white/80 p-2 text-muted transition hover:text-foreground", children: _jsx(X, { className: "h-4 w-4" }) })] }), _jsx("div", { className: "max-h-[80vh] overflow-y-auto px-6 py-5", children: children })] }) }));
};
