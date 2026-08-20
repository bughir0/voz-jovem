"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Slice } from "@/lib/stats";

export const PALETTE = [
  "#7350f0",
  "#f0479f",
  "#35d6b0",
  "#ffb43d",
  "#5b34d6",
  "#ff7ac6",
  "#20b6d8",
  "#8f76fb",
  "#e8567a",
  "#4bc46b",
];

const tooltipStyle = {
  borderRadius: 14,
  border: "1px solid #e6e0ff",
  boxShadow: "0 18px 40px -20px rgba(20,16,42,0.35)",
  fontSize: 13,
  fontWeight: 600,
  color: "#14102a",
};

function EmptyState({ height }: { height: number }) {
  return (
    <div
      className="grid place-items-center rounded-2xl border border-dashed border-brand-200 text-sm font-semibold text-ink-300"
      style={{ height }}
    >
      Sem dados para exibir ainda
    </div>
  );
}

function truncate(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

// Os formatadores recebem `unknown` porque o Recharts tipa o valor da tooltip
// como possivelmente indefinido.
function countLabel(value: unknown): [string, string] {
  return [`${Number(value)}`, "Respostas"];
}

function shareLabel(value: unknown, _name: unknown, entry: unknown): [string, string] {
  const count = Number(value);
  const percent = (entry as { payload?: Slice } | undefined)?.payload?.percent;
  return [
    `${count} resposta${count === 1 ? "" : "s"} (${Math.round(percent ?? 0)}%)`,
    "Total",
  ];
}

function nameLabel(value: unknown, name: unknown): [string, string] {
  return [`${Number(value)}`, String(name)];
}

export function HorizontalBars({
  data,
  height = 420,
  color = "#7350f0",
}: {
  data: Slice[];
  height?: number;
  color?: string;
}) {
  if (data.length === 0) return <EmptyState height={height} />;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 38, bottom: 4, left: 8 }}
      >
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          width={210}
          tickLine={false}
          axisLine={false}
          tick={{ fill: "#3b3560", fontSize: 12, fontWeight: 600 }}
          tickFormatter={(value: string) => truncate(value, 30)}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={shareLabel}
          cursor={{ fill: "rgba(115,80,240,0.06)" }}
        />
        <Bar
          dataKey="value"
          radius={[0, 10, 10, 0]}
          barSize={20}
          animationDuration={900}
          label={{
            position: "right",
            fill: "#6b6590",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {data.map((item, index) => (
            <Cell
              key={item.name}
              fill={index === 0 ? "#f0479f" : color}
              fillOpacity={1 - Math.min(index, 8) * 0.07}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function VerticalBars({
  data,
  height = 260,
}: {
  data: Slice[];
  height?: number;
}) {
  if (data.length === 0) return <EmptyState height={height} />;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        margin={{ top: 24, right: 8, bottom: 4, left: -18 }}
      >
        <XAxis
          dataKey="name"
          tickLine={false}
          axisLine={false}
          tick={{ fill: "#3b3560", fontSize: 11, fontWeight: 600 }}
          tickFormatter={(value: string) => truncate(value, 14)}
          interval={0}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          tick={{ fill: "#a8a3c4", fontSize: 11 }}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={countLabel}
          cursor={{ fill: "rgba(115,80,240,0.06)" }}
        />
        <Bar
          dataKey="value"
          radius={[10, 10, 4, 4]}
          maxBarSize={54}
          animationDuration={900}
          label={{
            position: "top",
            fill: "#6b6590",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {data.map((item, index) => (
            <Cell key={item.name} fill={PALETTE[index % PALETTE.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function Donut({
  data,
  height = 260,
}: {
  data: Slice[];
  height?: number;
}) {
  if (data.length === 0) return <EmptyState height={height} />;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius="52%"
          outerRadius="80%"
          paddingAngle={3}
          stroke="none"
          animationDuration={900}
        >
          {data.map((item, index) => (
            <Cell key={item.name} fill={PALETTE[index % PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} formatter={nameLabel} />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          iconSize={9}
          formatter={(value: string) => (
            <span style={{ color: "#3b3560", fontSize: 12, fontWeight: 600 }}>
              {truncate(value, 26)}
            </span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function Timeline({
  data,
  height = 220,
}: {
  data: { name: string; value: number }[];
  height?: number;
}) {
  if (data.length === 0) return <EmptyState height={height} />;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart
        data={data}
        margin={{ top: 10, right: 12, bottom: 0, left: -22 }}
      >
        <defs>
          <linearGradient id="timelineFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7350f0" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#7350f0" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="name"
          tickLine={false}
          axisLine={false}
          tick={{ fill: "#a8a3c4", fontSize: 11, fontWeight: 600 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          tick={{ fill: "#a8a3c4", fontSize: 11 }}
        />
        <Tooltip contentStyle={tooltipStyle} formatter={countLabel} />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#7350f0"
          strokeWidth={3}
          fill="url(#timelineFill)"
          animationDuration={900}
          dot={{ r: 4, fill: "#7350f0", strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
