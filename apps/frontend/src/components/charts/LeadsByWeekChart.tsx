import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

type LeadsByWeekChartProps = {
  data: Array<{
    weekLabel: string;
    count: number;
  }>;
};

export const LeadsByWeekChart = ({ data }: LeadsByWeekChartProps) => (
  <ResponsiveContainer width="100%" height={300}>
    <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
      <defs>
        <linearGradient id="primaryGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#1818EB" stopOpacity={0.32} />
          <stop offset="95%" stopColor="#1818EB" stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
      <XAxis dataKey="weekLabel" tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} />
      <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} />
      <Tooltip
        contentStyle={{
          borderRadius: 14,
          border: "1px solid #E2E8F0",
          boxShadow: "0 14px 34px rgba(15, 23, 42, 0.08)"
        }}
      />
      <Area type="monotone" dataKey="count" stroke="#1818EB" fill="url(#primaryGradient)" strokeWidth={2.5} />
    </AreaChart>
  </ResponsiveContainer>
);
