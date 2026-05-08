import { CalendarCheck2, PhoneOutgoing, Sparkles, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { LeadsByStageChart } from "../components/charts/LeadsByStageChart";
import { LeadsByWeekChart } from "../components/charts/LeadsByWeekChart";
import { Badge } from "../components/ui/Badge";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { Skeleton } from "../components/ui/Skeleton";
import { useActiveWorkspace } from "../hooks/useActiveWorkspace";
import { dashboardApi } from "../services/api/dashboardApi";
import { getApiErrorMessage } from "../services/api/client";
import type { DashboardMetrics } from "../types/models";
import { formatRelativeTime, getInitials } from "../utils/formatters";

const getStageCount = (data: DashboardMetrics | null, matcher: (name: string) => boolean) =>
  data?.leadsByStage.find((stage) => matcher(stage.name.toLowerCase()))?.count ?? 0;

export const DashboardPage = () => {
  const workspace = useActiveWorkspace();
  const [data, setData] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspace) {
      return;
    }

    setLoading(true);
    void dashboardApi
      .get(workspace.id)
      .then(setData)
      .catch((error) => toast.error(getApiErrorMessage(error)))
      .finally(() => setLoading(false));
  }, [workspace]);

  const stats = useMemo(() => {
    const meetings = getStageCount(data, (name) => name.includes("reun"));
    const tryingContact = getStageCount(data, (name) => name.includes("contato"));

    return [
      {
        label: "Total de Leads",
        value: data?.totalLeads ?? 0,
        trend: `${data?.totalCampaigns ?? 0} campanhas no workspace`,
        icon: Users,
        iconClassName: "bg-[var(--accent-soft)] text-primary"
      },
      {
        label: "Reunioes Agendadas",
        value: meetings,
        trend: meetings > 0 ? `${meetings} leads nesta etapa` : "Nenhuma reuniao ainda",
        icon: CalendarCheck2,
        iconClassName: "bg-[var(--success-soft)] text-success"
      },
      {
        label: "Tentando Contato",
        value: tryingContact,
        trend: tryingContact > 0 ? `${tryingContact} leads em prospeccao` : "Fila zerada",
        icon: PhoneOutgoing,
        iconClassName: "bg-[var(--warning-soft)] text-warning"
      },
      {
        label: "Mensagens Geradas",
        value: data?.totalGeneratedMessages ?? 0,
        trend: `${data?.totalSentMessages ?? 0} enviadas ate agora`,
        icon: Sparkles,
        iconClassName: "bg-[var(--accent-soft)] text-primary"
      }
    ];
  }, [data]);

  return (
    <section className="page-shell">
      {loading ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={index}>
                <Skeleton className="h-4 w-28" />
                <Skeleton className="mt-4 h-10 w-20" />
                <Skeleton className="mt-4 h-6 w-40 rounded-full" />
              </Card>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <Skeleton className="h-5 w-40" />
              <Skeleton className="mt-6 h-[300px] w-full rounded-xl" />
            </Card>
            <Card>
              <Skeleton className="h-5 w-40" />
              <Skeleton className="mt-6 h-[300px] w-full rounded-xl" />
            </Card>
          </div>

          <Card>
            <Skeleton className="h-5 w-40" />
            <div className="mt-6 space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          </Card>
        </div>
      ) : data ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <Card key={stat.label} className="animate-float-in">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="mt-2 text-3xl font-bold text-foreground">{stat.value}</p>
                      <Badge variant="secondary" className="mt-3">
                        {stat.trend}
                      </Badge>
                    </div>
                    <div className={`rounded-lg p-3 ${stat.iconClassName}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <div className="mb-5">
                <p className="label">Funil por etapa</p>
                <h2 className="mt-2 text-xl font-semibold text-foreground">Leads por etapa</h2>
              </div>
              <LeadsByStageChart
                data={data.leadsByStage.map((stage) => ({
                  name: stage.name,
                  count: stage.count
                }))}
              />
            </Card>

            <Card>
              <div className="mb-5">
                <p className="label">Ultimas 8 semanas</p>
                <h2 className="mt-2 text-xl font-semibold text-foreground">Leads criados por semana</h2>
              </div>
              <LeadsByWeekChart data={data.leadsCreatedByWeek} />
            </Card>
          </div>

          <Card>
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="label">Atividade recente</p>
                <h2 className="mt-2 text-xl font-semibold text-foreground">Leads mais recentes</h2>
              </div>
              <Badge variant="outline">{data.recentLeads.length} itens</Badge>
            </div>

            {data.recentLeads.length === 0 ? (
              <EmptyState
                icon={Users}
                title="Nenhum lead encontrado"
                description="Assim que o time cadastrar os primeiros contatos, esta tabela passa a mostrar o movimento mais recente."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-2">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      <th className="pb-2 font-semibold">Lead</th>
                      <th className="pb-2 font-semibold">Etapa</th>
                      <th className="pb-2 font-semibold">Responsavel</th>
                      <th className="pb-2 font-semibold">Criado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentLeads.map((lead) => (
                      <tr key={lead.id} className="rounded-xl bg-white shadow-sm">
                        <td className="rounded-l-xl px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground">
                              {getInitials(lead.name)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-foreground">{lead.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {lead.company ?? "Empresa nao informada"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <Badge variant="outline" style={{ borderColor: lead.stage.color, color: lead.stage.color }}>
                            {lead.stage.name}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-sm text-foreground">
                          {lead.assignedUser ? lead.assignedUser.name : "Sem responsavel"}
                        </td>
                        <td className="rounded-r-xl px-4 py-4 text-sm text-muted-foreground">
                          {formatRelativeTime(lead.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={Users}
            title="Sem dados para o dashboard"
            description="Selecione um workspace com leads e campanhas para visualizar as metricas."
          />
        </Card>
      )}
    </section>
  );
};
