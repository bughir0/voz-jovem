"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
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
  "#1d4166",
  "#3c6c9c",
  "#628fb9",
  "#93b3d3",
  "#1c7a58",
  "#9a6b16",
  "#7a5a86",
  "#3f7d8c",
  "#8c4a4a",
  "#61758a",
];

const INK = "#2a4055";
const MUTED = "#8496a8";
const GRID = "#eaeff5";

const tooltipStyle = {
  borderRadius: 10,
  border: "1px solid #dde4ec",
  boxShadow: "0 10px 28px -20px rgba(12,26,43,0.35)",
  fontSize: 13,
  fontWeight: 500,
  color: "#0c1a2b",
};

function EmptyState({ height }: { height: number }) {
  return (
    <div
      className="grid place-items-center rounded-xl border border-dashed border-line-strong text-sm text-ink-400"
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

function shareLabel(
  value: unknown,
  _name: unknown,
  entry: unknown,
): [string, string] {
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
  color = "#3c6c9c",
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
          width={190}
          tickLine={false}
          axisLine={false}
          tick={{ fill: INK, fontSize: 12 }}
          tickFormatter={(value: string) => truncate(value, 28)}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={shareLabel}
          cursor={{ fill: "rgba(60,108,156,0.06)" }}
        />
        <Bar
          dataKey="value"
          radius={[0, 4, 4, 0]}
          barSize={18}
          animationDuration={800}
          label={{
            position: "right",
            fill: MUTED,
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {data.map((item, index) => (
            <Cell
              key={item.name}
              fill={index === 0 ? "#16324e" : color}
              fillOpacity={index === 0 ? 1 : 1 - Math.min(index, 7) * 0.08}
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
      <BarChart data={data} margin={{ top: 24, right: 8, bottom: 4, left: -18 }}>
        <CartesianGrid vertical={false} stroke={GRID} />
        <XAxis
          dataKey="name"
          tickLine={false}
          axisLine={false}
          tick={{ fill: INK, fontSize: 11 }}
          tickFormatter={(value: string) => truncate(value, 14)}
          interval={0}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          tick={{ fill: MUTED, fontSize: 11 }}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={countLabel}
          cursor={{ fill: "rgba(60,108,156,0.06)" }}
        />
        <Bar
          dataKey="value"
          radius={[4, 4, 0, 0]}
          maxBarSize={48}
          animationDuration={800}
          label={{
            position: "top",
            fill: MUTED,
            fontSize: 12,
            fontWeight: 600,
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
          innerRadius="56%"
          outerRadius="80%"
          paddingAngle={2}
          stroke="#ffffff"
          strokeWidth={2}
          animationDuration={800}
        >
          {data.map((item, index) => (
            <Cell key={item.name} fill={PALETTE[index % PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} formatter={nameLabel} />
        <Legend
          verticalAlign="bottom"
          iconType="square"
          iconSize={9}
          formatter={(value: string) => (
            <span style={{ color: INK, fontSize: 12 }}>
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
      <AreaChart data={data} margin={{ top: 10, right: 12, bottom: 0, left: -22 }}>
        <defs>
          <linearGradient id="timelineFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3c6c9c" stopOpacity={0.22} />
            <stop offset="100%" stopColor="#3c6c9c" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={GRID} />
        <XAxis
          dataKey="name"
          tickLine={false}
          axisLine={false}
          tick={{ fill: MUTED, fontSize: 11 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          tick={{ fill: MUTED, fontSize: 11 }}
        />
        <Tooltip contentStyle={tooltipStyle} formatter={countLabel} />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#1d4166"
          strokeWidth={2}
          fill="url(#timelineFill)"
          animationDuration={800}
          dot={{ r: 3, fill: "#1d4166", strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
