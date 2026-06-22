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

function formatDateLabel(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

/**
 * 1. Compute Chart: AreaChart showing CRDT merges.
 * Sharp Cyan theme.
 */
export function ComputeChart({ data, disableAnimation = true }: ChartProps) {
  const chartData = React.useMemo(() => {
    return data.map((item) => ({
      ...item,
      label: formatDateLabel(item.date),
      displayValue: item.crdt_merges.toLocaleString(),
    }));
  }, [data]);

  return (
    <div className="w-full h-full min-h-[250px] bg-[#09090b] border border-zinc-800 rounded-none p-5 relative overflow-hidden flex flex-col group transition-all duration-300">
      
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
        <span className="text-[10px] font-mono text-[#00E5FF] bg-[#00E5FF]/10 px-2.5 py-0.5 rounded-none border border-[#00E5FF]/20 uppercase tracking-widest">
          Active Stream
        </span>
      </div>

      <div className="flex-1 w-full relative h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="crdtGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#000000" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#27272a"
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
              cursor={{ stroke: "#00E5FF", strokeWidth: 1 } }
            />
            <Area
              type="monotone"
              dataKey="crdt_merges"
              stroke="#00E5FF"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#crdtGlow)"
              isAnimationActive={!disableAnimation}
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
      <div className="bg-[#09090b] border border-zinc-800 px-3.5 py-2.5 rounded-none font-mono text-xs shadow-xl">
        <p className="text-zinc-550 text-[10px] uppercase tracking-wider mb-1">{data.date}</p>
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-none bg-[#00E5FF]" />
          <span className="text-white font-semibold">{data.displayValue} merges</span>
        </div>
      </div>
    );
  }
  return null;
};

/**
 * 2. Bandwidth Chart: BarChart showing gigabytes routed.
 * Sharp Deep Magenta theme.
 */
export function BandwidthChart({ data, disableAnimation = true }: ChartProps) {
  const chartData = React.useMemo(() => {
    return data.map((item) => ({
      ...item,
      label: formatDateLabel(item.date),
      gbValue: Number((item.a2a_bytes / (1024 * 1024 * 1024)).toFixed(2)),
      displayValue: formatBytes(item.a2a_bytes),
    }));
  }, [data]);

  return (
    <div className="w-full h-full min-h-[250px] bg-[#09090b] border border-zinc-800 rounded-none p-5 relative overflow-hidden flex flex-col group transition-all duration-300">
      
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
        <span className="text-[10px] font-mono text-[#38bdf8] bg-[#38bdf8]/10 px-2.5 py-0.5 rounded-none border border-[#38bdf8]/20 uppercase tracking-widest">
          Mesh Traffic
        </span>
      </div>

      <div className="flex-1 w-full relative h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#27272a"
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
              cursor={{ fill: "rgba(56, 189, 248, 0.05)" }}
            />
            <Bar
              dataKey="gbValue"
              fill="#38bdf8"
              radius={0}
              isAnimationActive={!disableAnimation}
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
      <div className="bg-[#09090b] border border-zinc-800 px-3.5 py-2.5 rounded-none font-mono text-xs shadow-xl">
        <p className="text-zinc-550 text-[10px] uppercase tracking-wider mb-1">{data.date}</p>
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-none bg-[#38bdf8]" />
          <span className="text-white font-semibold">{data.displayValue} routed</span>
        </div>
      </div>
    );
  }
  return null;
};

/**
 * 3. Temporal Chart: Step-chart showing reality forks.
 * Stark Orange theme.
 */
export function TemporalChart({ data, disableAnimation = true }: ChartProps) {
  const chartData = React.useMemo(() => {
    return data.map((item) => ({
      ...item,
      label: formatDateLabel(item.date),
      displayValue: `${item.time_travels} forks`,
    }));
  }, [data]);

  return (
    <div className="w-full h-full min-h-[250px] bg-[#09090b] border border-zinc-800 rounded-none p-5 relative overflow-hidden flex flex-col group transition-all duration-300">
      
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
        <span className="text-[10px] font-mono text-[#ea580c] bg-[#ea580c]/10 px-2.5 py-0.5 rounded-none border border-[#ea580c]/20 uppercase tracking-widest">
          Quantum Chrono
        </span>
      </div>

      <div className="flex-1 w-full relative h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#27272a"
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
              cursor={{ stroke: "#ea580c", strokeWidth: 1 }}
            />
            <Line
              type="stepAfter"
              dataKey="time_travels"
              stroke="#ea580c"
              strokeWidth={2}
              dot={{ r: 2, stroke: "#ea580c", strokeWidth: 1, fill: "#09090b", rx: 0 }}
              activeDot={{ r: 4, stroke: "#ea580c", strokeWidth: 2, fill: "#ea580c" }}
              isAnimationActive={!disableAnimation}
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
      <div className="bg-[#09090b] border border-zinc-800 px-3.5 py-2.5 rounded-none font-mono text-xs shadow-xl">
        <p className="text-zinc-550 text-[10px] uppercase tracking-wider mb-1">{data.date}</p>
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-none bg-[#ea580c]" />
          <span className="text-white font-semibold">{data.displayValue}</span>
        </div>
      </div>
    );
  }
  return null;
};
