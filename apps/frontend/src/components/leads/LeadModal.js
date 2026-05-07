import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { activityLogsApi } from "../../services/api/activityLogsApi";
import { campaignsApi } from "../../services/api/campaignsApi";
import { getApiErrorMessage } from "../../services/api/client";
import { leadsApi } from "../../services/api/leadsApi";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Input } from "../ui/Input";
import { Modal } from "../ui/Modal";
import { Select } from "../ui/Select";
import { Textarea } from "../ui/Textarea";
export const LeadModal = ({ lead, customFields, campaigns, isOpen, onClose, onLeadUpdated }) => {
    const [messages, setMessages] = useState([]);
    const [logs, setLogs] = useState([]);
    const [selectedCampaignId, setSelectedCampaignId] = useState("");
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({});
    useEffect(() => {
        if (!lead) {
            return;
        }
        setForm({
            name: lead.name,
            email: lead.email ?? "",
            phone: lead.phone ?? "",
            company: lead.company ?? "",
            role: lead.role ?? "",
            leadSource: lead.leadSource ?? "",
            notes: lead.notes ?? "",
            ...Object.fromEntries(lead.customFieldValues.map((item) => [item.customFieldId, item.value ?? ""]))
        });
        setSelectedCampaignId(campaigns[0]?.id ?? "");
        void leadsApi.messages(lead.id).then(setMessages).catch(() => setMessages([]));
        void activityLogsApi.listByLead(lead.id).then(setLogs).catch(() => setLogs([]));
    }, [lead, campaigns]);
    return (_jsx(Modal, { isOpen: isOpen && !!lead, onClose: onClose, title: lead?.name ?? "Lead", description: "Atualize os dados do lead, gere mensagens e acompanhe a trilha de atividade.", children: lead ? (_jsxs("div", { className: "grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]", children: [_jsxs("div", { className: "space-y-6", children: [_jsxs(Card, { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("p", { className: "label", children: "Detalhes" }), _jsx("h4", { className: "mt-2 text-lg font-semibold", children: "Editar informa\u00E7\u00F5es do lead" })] }), _jsx("div", { className: "grid gap-4 md:grid-cols-2", children: [
                                        ["name", "Nome"],
                                        ["company", "Empresa"],
                                        ["email", "Email"],
                                        ["phone", "Telefone"],
                                        ["role", "Cargo"],
                                        ["leadSource", "Origem"]
                                    ].map(([key, label]) => (_jsxs("div", { children: [_jsx("label", { className: "label", children: label }), _jsx(Input, { value: form[key] ?? "", onChange: (event) => setForm((current) => ({ ...current, [key]: event.target.value })) })] }, key))) }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Notas" }), _jsx(Textarea, { value: form.notes ?? "", onChange: (event) => setForm((current) => ({ ...current, notes: event.target.value })) })] }), customFields.length > 0 ? (_jsx("div", { className: "grid gap-4 md:grid-cols-2", children: customFields.map((field) => (_jsxs("div", { children: [_jsx("label", { className: "label", children: field.name }), field.fieldType === "select" ? (_jsxs(Select, { value: form[field.id] ?? "", onChange: (event) => setForm((current) => ({ ...current, [field.id]: event.target.value })), children: [_jsx("option", { value: "", children: "Selecione" }), field.options.map((option) => (_jsx("option", { value: option, children: option }, option)))] })) : (_jsx(Input, { type: field.fieldType === "number" ? "number" : "text", value: form[field.id] ?? "", onChange: (event) => setForm((current) => ({ ...current, [field.id]: event.target.value })) }))] }, field.id))) })) : null, _jsx(Button, { disabled: saving, onClick: async () => {
                                        setSaving(true);
                                        try {
                                            const updatedLead = await leadsApi.update(lead.id, {
                                                name: form.name,
                                                email: form.email,
                                                phone: form.phone,
                                                company: form.company,
                                                role: form.role,
                                                leadSource: form.leadSource,
                                                notes: form.notes,
                                                customFieldValues: customFields.map((field) => ({
                                                    customFieldId: field.id,
                                                    value: form[field.id] ?? ""
                                                }))
                                            });
                                            onLeadUpdated(updatedLead);
                                            toast.success("Lead atualizado.");
                                            const freshLogs = await activityLogsApi.listByLead(lead.id);
                                            setLogs(freshLogs);
                                        }
                                        catch (error) {
                                            toast.error(getApiErrorMessage(error));
                                        }
                                        finally {
                                            setSaving(false);
                                        }
                                    }, children: saving ? "Salvando..." : "Salvar alterações" })] }), _jsxs(Card, { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("p", { className: "label", children: "Hist\u00F3rico" }), _jsx("h4", { className: "mt-2 text-lg font-semibold", children: "Atividade recente" })] }), _jsx("div", { className: "space-y-3", children: logs.length === 0 ? (_jsx("p", { className: "text-sm text-muted", children: "Nenhuma atividade registrada para este lead." })) : (logs.map((item) => (_jsxs("div", { className: "rounded-2xl border border-border/70 bg-white/60 p-4", children: [_jsx("p", { className: "text-sm font-semibold text-foreground", children: item.action }), _jsx("p", { className: "mt-1 text-xs uppercase tracking-[0.16em] text-muted", children: new Date(item.createdAt).toLocaleString("pt-BR") })] }, item.id)))) })] })] }), _jsx("div", { className: "space-y-6", children: _jsxs(Card, { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("p", { className: "label", children: "Mensagens IA" }), _jsx("h4", { className: "mt-2 text-lg font-semibold", children: "Gerar e enviar abordagem" })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Campanha" }), _jsxs(Select, { value: selectedCampaignId, onChange: (event) => setSelectedCampaignId(event.target.value), children: [_jsx("option", { value: "", children: "Selecione uma campanha" }), campaigns.map((campaign) => (_jsx("option", { value: campaign.id, children: campaign.name }, campaign.id)))] })] }), _jsx(Button, { className: "w-full", disabled: !selectedCampaignId, onClick: async () => {
                                    if (!selectedCampaignId) {
                                        return;
                                    }
                                    try {
                                        const generated = await campaignsApi.generateMessages(selectedCampaignId, lead.id);
                                        setMessages((current) => [generated, ...current]);
                                        toast.success("Mensagens geradas com sucesso.");
                                        const freshLogs = await activityLogsApi.listByLead(lead.id);
                                        setLogs(freshLogs);
                                    }
                                    catch (error) {
                                        toast.error(getApiErrorMessage(error));
                                    }
                                }, children: "Gerar 3 mensagens" }), _jsx("div", { className: "space-y-3", children: messages.length === 0 ? (_jsx("p", { className: "text-sm text-muted", children: "Nenhuma mensagem gerada ainda para este lead." })) : (messages.map((message) => (_jsxs("div", { className: "rounded-3xl border border-border/70 bg-white/70 p-4", children: [_jsxs("div", { className: "mb-3 flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-foreground", children: message.provider ? `${message.provider} • ${message.model}` : "Mensagem" }), _jsx("p", { className: "text-xs uppercase tracking-[0.16em] text-muted", children: new Date(message.generatedAt).toLocaleString("pt-BR") })] }), _jsx(Button, { variant: "secondary", size: "sm", onClick: async () => {
                                                        try {
                                                            await leadsApi.sendMessage(lead.id, message.id);
                                                            const refreshedLead = await leadsApi.get(lead.id);
                                                            const refreshedMessages = await leadsApi.messages(lead.id);
                                                            onLeadUpdated(refreshedLead);
                                                            setMessages(refreshedMessages);
                                                            toast.success("Mensagem marcada como enviada.");
                                                        }
                                                        catch (error) {
                                                            toast.error(getApiErrorMessage(error));
                                                        }
                                                    }, children: message.sentAt ? "Enviado" : "Enviar" })] }), _jsx("div", { className: "space-y-3", children: message.messages.map((item, index) => (_jsx("div", { className: "rounded-2xl bg-background/70 p-3", children: _jsx("p", { className: "text-sm leading-6 text-foreground", children: item }) }, `${message.id}-${index}`))) })] }, message.id)))) })] }) })] })) : null }));
};
