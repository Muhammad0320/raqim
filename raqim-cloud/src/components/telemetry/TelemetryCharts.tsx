"use client";

import React from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatBytes } from "./ProjectedBill";
import { TelemetryMetric } from "@/actions/telemetry";

interface ChartProps {
  data: TelemetryMetric[];
  disableAnimation?: boolean;
}

// Format the date to something readable e.g. "Jun 18"
function formatDateLabel(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

/**
 * 1. Compute Chart: AreaChart showing CRDT merges.
 * Neon Cyan theme.
 */
export function ComputeChart({ data, disableAnimation = false }: ChartProps) {
  const chartData = React.useMemo(() => {
    return data.map((item) => ({
      ...item,
      label: formatDateLabel(item.date),
      displayValue: item.crdt_merges.toLocaleString(),
    }));
  }, [data]);

  return (
    <div className="w-full h-[300px] bg-zinc-950/40 border border-zinc-900/60 rounded-xl p-5 relative overflow-hidden flex flex-col group hover:border-zinc-800 transition-all duration-300">
      
      {/* Dynamic Cyber Header */}
      <div className="flex justify-between items-center mb-6 z-10">
        <div>
          <h3 className="text-sm font-bold tracking-tight text-white uppercase font-mono">
            Compute // CRDT Merges
          </h3>
          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
            DAILY EDGE REPLICATED GRAPH COMMITS
          </p>
        </div>
        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/20 px-2.5 py-0.5 rounded border border-cyan-900/40 uppercase tracking-widest">
          Active Stream
        </span>
      </div>

      <div className="flex-1 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="crdtGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#00f0ff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#18181b"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#52525b", fontSize: 10, fontFamily: "monospace" }}
              dy={10}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#52525b", fontSize: 10, fontFamily: "monospace" }}
              tickFormatter={(val) => (val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : val.toLocaleString())}
            />
            <Tooltip
              content={<ComputeTooltip />}
              cursor={{ stroke: "#22d3ee", strokeWidth: 1, strokeDasharray: "4 4", opacity: 0.3 }}
            />
            <Area
              type="monotone"
              dataKey="crdt_merges"
              stroke="#00f0ff"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#crdtGlow)"
              isAnimationActive={!disableAnimation}
              animationDuration={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const ComputeTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-zinc-950/90 border border-cyan-500/30 px-3.5 py-2.5 rounded-lg shadow-xl backdrop-blur-md font-mono text-xs">
        <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">{data.date}</p>
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span className="text-cyan-300 font-semibold">{data.displayValue} merges</span>
        </div>
      </div>
    );
  }
  return null;
};

/**
 * 2. Bandwidth Chart: BarChart showing gigabytes routed.
 * Neon Fuchsia/Purple theme.
 */
export function BandwidthChart({ data, disableAnimation = false }: ChartProps) {
  const chartData = React.useMemo(() => {
    return data.map((item) => ({
      ...item,
      label: formatDateLabel(item.date),
      gbValue: Number((item.a2a_bytes / (1024 * 1024 * 1024)).toFixed(2)),
      displayValue: formatBytes(item.a2a_bytes),
    }));
  }, [data]);

  return (
    <div className="w-full h-[300px] bg-zinc-950/40 border border-zinc-900/60 rounded-xl p-5 relative overflow-hidden flex flex-col group hover:border-zinc-800 transition-all duration-300">
      
      {/* Dynamic Cyber Header */}
      <div className="flex justify-between items-center mb-6 z-10">
        <div>
          <h3 className="text-sm font-bold tracking-tight text-white uppercase font-mono">
            Bandwidth // Global A2A
          </h3>
          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
            PEER-TO-PEER ENCRYPTED PACKETS ROUTED
          </p>
        </div>
        <span className="text-[10px] font-mono text-fuchsia-400 bg-fuchsia-950/20 px-2.5 py-0.5 rounded border border-fuchsia-900/40 uppercase tracking-widest">
          Mesh Traffic
        </span>
      </div>

      <div className="flex-1 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#18181b"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#52525b", fontSize: 10, fontFamily: "monospace" }}
              dy={10}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#52525b", fontSize: 10, fontFamily: "monospace" }}
              tickFormatter={(val) => `${val} GB`}
            />
            <Tooltip
              content={<BandwidthTooltip />}
              cursor={{ fill: "rgba(240, 70, 250, 0.04)" }}
            />
            <Bar
              dataKey="gbValue"
              fill="#d946ef"
              radius={[4, 4, 0, 0]}
              isAnimationActive={!disableAnimation}
              animationDuration={1000}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const BandwidthTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-zinc-950/90 border border-fuchsia-500/30 px-3.5 py-2.5 rounded-lg shadow-xl backdrop-blur-md font-mono text-xs">
        <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">{data.date}</p>
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-fuchsia-400" />
          <span className="text-fuchsia-300 font-semibold">{data.displayValue} routed</span>
        </div>
      </div>
    );
  }
  return null;
};

/**
 * 3. Temporal Chart: Step-chart showing reality forks.
 * Neon Amber/Orange theme.
 */
export function TemporalChart({ data, disableAnimation = false }: ChartProps) {
  const chartData = React.useMemo(() => {
    return data.map((item) => ({
      ...item,
      label: formatDateLabel(item.date),
      displayValue: `${item.time_travels} forks`,
    }));
  }, [data]);

  return (
    <div className="w-full h-[300px] bg-zinc-950/40 border border-zinc-900/60 rounded-xl p-5 relative overflow-hidden flex flex-col group hover:border-zinc-800 transition-all duration-300">
      
      {/* Dynamic Cyber Header */}
      <div className="flex justify-between items-center mb-6 z-10">
        <div>
          <h3 className="text-sm font-bold tracking-tight text-white uppercase font-mono">
            Temporal // Time Travels
          </h3>
          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
            CONCURRENT TIME-SLICES & REALITY FORKS
          </p>
        </div>
        <span className="text-[10px] font-mono text-amber-400 bg-amber-950/20 px-2.5 py-0.5 rounded border border-amber-900/40 uppercase tracking-widest">
          Quantum Chrono
        </span>
      </div>

      <div className="flex-1 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#18181b"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#52525b", fontSize: 10, fontFamily: "monospace" }}
              dy={10}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#52525b", fontSize: 10, fontFamily: "monospace" }}
              tickFormatter={(val) => `${val} forks`}
            />
            <Tooltip
              content={<TemporalTooltip />}
              cursor={{ stroke: "#f59e0b", strokeWidth: 1, strokeDasharray: "4 4", opacity: 0.3 }}
            />
            <Line
              type="stepAfter"
              dataKey="time_travels"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ r: 2, stroke: "#f59e0b", strokeWidth: 1, fill: "#09090b" }}
              activeDot={{ r: 4, stroke: "#fbbf24", strokeWidth: 2, fill: "#fbbf24" }}
              isAnimationActive={!disableAnimation}
              animationDuration={1000}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const TemporalTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-zinc-950/90 border border-amber-500/30 px-3.5 py-2.5 rounded-lg shadow-xl backdrop-blur-md font-mono text-xs">
        <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">{data.date}</p>
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-amber-300 font-semibold">{data.displayValue}</span>
        </div>
      </div>
    );
  }
  return null;
};
