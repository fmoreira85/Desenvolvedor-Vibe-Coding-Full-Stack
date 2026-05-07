import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Textarea } from "../ui/Textarea";
export const LeadCreatePanel = ({ stages, customFields, onCreate }) => {
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        company: "",
        role: "",
        leadSource: "",
        notes: "",
        stageId: stages[0]?.id ?? ""
    });
    const [customValues, setCustomValues] = useState({});
    return (_jsxs(Card, { className: "h-fit", children: [_jsxs("div", { className: "mb-4", children: [_jsx("p", { className: "label", children: "Novo lead" }), _jsx("h3", { className: "mt-2 font-display text-2xl font-semibold", children: "Adicionar ao funil" })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "label", children: "Nome" }), _jsx(Input, { value: form.name, onChange: (event) => setForm({ ...form, name: event.target.value }) })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Empresa" }), _jsx(Input, { value: form.company, onChange: (event) => setForm({ ...form, company: event.target.value }) })] }), _jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [_jsxs("div", { children: [_jsx("label", { className: "label", children: "Email" }), _jsx(Input, { type: "email", value: form.email, onChange: (event) => setForm({ ...form, email: event.target.value }) })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Telefone" }), _jsx(Input, { value: form.phone, onChange: (event) => setForm({ ...form, phone: event.target.value }) })] })] }), _jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [_jsxs("div", { children: [_jsx("label", { className: "label", children: "Cargo" }), _jsx(Input, { value: form.role, onChange: (event) => setForm({ ...form, role: event.target.value }) })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Origem" }), _jsx(Input, { value: form.leadSource, onChange: (event) => setForm({ ...form, leadSource: event.target.value }) })] })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Etapa inicial" }), _jsx(Select, { value: form.stageId, onChange: (event) => setForm({ ...form, stageId: event.target.value }), children: stages.map((stage) => (_jsx("option", { value: stage.id, children: stage.name }, stage.id))) })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Notas" }), _jsx(Textarea, { value: form.notes, onChange: (event) => setForm({ ...form, notes: event.target.value }) })] }), customFields.length > 0 ? (_jsxs("div", { className: "space-y-4 rounded-3xl border border-border/70 bg-background/60 p-4", children: [_jsx("h4", { className: "text-sm font-semibold text-foreground", children: "Campos personalizados" }), customFields.map((field) => (_jsxs("div", { children: [_jsx("label", { className: "label", children: field.name }), field.fieldType === "select" ? (_jsxs(Select, { value: customValues[field.id] ?? "", onChange: (event) => setCustomValues((current) => ({ ...current, [field.id]: event.target.value })), children: [_jsx("option", { value: "", children: "Selecione" }), field.options.map((option) => (_jsx("option", { value: option, children: option }, option)))] })) : (_jsx(Input, { type: field.fieldType === "number" ? "number" : "text", value: customValues[field.id] ?? "", onChange: (event) => setCustomValues((current) => ({ ...current, [field.id]: event.target.value })) }))] }, field.id)))] })) : null, _jsx(Button, { className: "w-full", disabled: submitting, onClick: async () => {
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
                                    stageId: stages[0]?.id ?? ""
                                });
                                setCustomValues({});
                            }
                            finally {
                                setSubmitting(false);
                            }
                        }, children: submitting ? "Criando lead..." : "Criar lead" })] })] }));
};
