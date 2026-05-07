import { BarChart3, CheckCircle2, MessagesSquare, Target } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { Card } from "../components/ui/Card";
import { useActiveWorkspace } from "../hooks/useActiveWorkspace";
import { dashboardApi } from "../services/api/dashboardApi";
import { getApiErrorMessage } from "../services/api/client";
import type { DashboardMetrics } from "../types/models";

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

  const stats = data
    ? [
        { label: "Leads", value: data.totalLeads, icon: Target },
        { label: "Campanhas", value: data.totalCampaigns, icon: BarChart3 },
        { label: "Mensagens geradas", value: data.totalGeneratedMessages, icon: MessagesSquare },
        { label: "Mensagens enviadas", value: data.totalSentMessages, icon: CheckCircle2 }
      ]
    : [];

  return (
    <section className="page-shell px-0 py-0">
      <div className="space-y-6">
        <div>
          <p className="label">Panorama do workspace</p>
          <h1 className="section-title mt-2">Métricas em tempo real do funil</h1>
          <p className="section-copy mt-2">
            {workspace?.name} • acompanhe volume por etapa, mensagens produzidas e tração comercial.
          </p>
        </div>

        {loading ? (
          <Card>
            <p className="text-sm text-muted">Carregando dashboard...</p>
          </Card>
        ) : data ? (
          <>
            <div className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
              {stats.map((stat) => {
                const Icon = stat.icon;

                return (
                  <Card key={stat.label} className="flex items-center justify-between gap-4">
                    <div>
                      <p className="label">{stat.label}</p>
                      <p className="mt-3 font-display text-4xl font-semibold">{stat.value}</p>
                    </div>
                    <div className="rounded-3xl bg-foreground p-3 text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                  </Card>
                );
              })}
            </div>

            <Card className="space-y-4">
              <div>
                <p className="label">Etapas do funil</p>
                <h2 className="mt-2 text-xl font-semibold">Distribuição de leads</h2>
              </div>

              <div className="space-y-4">
                {data.leadsByStage.map((stage) => (
                  <div key={stage.stageId} className="space-y-2">
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <div className="flex items-center gap-3">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: stage.color }}
                        />
                        <span className="font-medium text-foreground">{stage.name}</span>
                      </div>
                      <span className="text-muted">{stage.count} lead(s)</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-background/80">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.max(8, data.totalLeads ? (stage.count / data.totalLeads) * 100 : 8)}%`,
                          backgroundColor: stage.color
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </>
        ) : null}
      </div>
    </section>
  );
};
