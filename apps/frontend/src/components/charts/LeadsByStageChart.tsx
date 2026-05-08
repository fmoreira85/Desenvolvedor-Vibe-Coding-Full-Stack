import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

type LeadsByStageChartProps = {
  data: Array<{
    name: string;
    count: number;
  }>;
};

export const LeadsByStageChart = ({ data }: LeadsByStageChartProps) => (
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, bottom: 4, left: 12 }}>
      <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" horizontal={false} />
      <XAxis type="number" tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} />
      <YAxis
        type="category"
        dataKey="name"
        width={130}
        tick={{ fontSize: 12, fill: "#64748B" }}
        axisLine={false}
        tickLine={false}
      />
      <Tooltip
        cursor={{ fill: "rgba(24,24,235,0.04)" }}
        contentStyle={{
          borderRadius: 14,
          border: "1px solid #E2E8F0",
          boxShadow: "0 14px 34px rgba(15, 23, 42, 0.08)"
        }}
      />
      <Bar dataKey="count" fill="#1818EB" radius={[0, 8, 8, 0]} />
    </BarChart>
  </ResponsiveContainer>
);
