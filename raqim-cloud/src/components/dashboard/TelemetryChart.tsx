"use client";

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface TelemetryPoint {
  day: string;
  daily_a2a: number;
}

interface TelemetryChartProps {
  data: TelemetryPoint[];
}

export function TelemetryChart({ data }: TelemetryChartProps) {
  
  // Format data for chart
  const formattedData = data.map(item => ({
    name: new Date(item.day).toLocaleDateString('en-US', { weekday: 'short' }),
    bytes: item.daily_a2a,
    formatted: (item.daily_a2a / (1024 * 1024)).toFixed(2) + ' MB'
  })).reverse(); // Assuming SQL returns DESC, we want oldest to newest left to right

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-zinc-950/50 rounded-xl border border-zinc-800">
        <p className="text-zinc-500 text-sm font-mono">NO TELEMETRY DATA</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formattedData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorBytes" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#52525b', fontSize: 12, fontFamily: 'monospace' }} 
            dy={10}
          />
          <YAxis hide domain={['dataMin - 10000000', 'dataMax + 10000000']} />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#27272a', strokeWidth: 1, strokeDasharray: '4 4' }} />
          <Area 
            type="monotone" 
            dataKey="bytes" 
            stroke="#06b6d4" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorBytes)" 
            animationDuration={1500}
            isAnimationActive={true}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900 border border-zinc-700 p-3 rounded-lg shadow-xl backdrop-blur-md">
        <p className="text-zinc-400 text-xs font-mono mb-1 uppercase tracking-wider">{label}</p>
        <p className="text-cyan-400 font-mono font-medium">
          {payload[0].payload.formatted}
        </p>
      </div>
    );
  }
  return null;
};
