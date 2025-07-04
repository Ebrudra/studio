"use client"

import * as React from "react"
import { useMemo } from "react"
import { Pie, PieChart, ResponsiveContainer, Cell, Tooltip, Legend } from "recharts"
import { Ticket, TicketTypeScope } from "@/types"

const COLORS: Record<TicketTypeScope, string> = {
    Build: "hsl(var(--chart-1))",
    Run: "hsl(var(--chart-2))",
    Sprint: "hsl(var(--chart-3))",
}

interface WorkDistributionChartProps {
  tickets: Ticket[]
}

export function WorkDistributionChart({ tickets }: WorkDistributionChartProps) {
  const data = useMemo(() => {
    const scopeData: { [key in TicketTypeScope]?: number } = {}
    
    tickets.forEach(ticket => {
      if (scopeData[ticket.typeScope]) {
        scopeData[ticket.typeScope]! += ticket.timeLogged
      } else {
        scopeData[ticket.typeScope] = ticket.timeLogged
      }
    })

    return (Object.entries(scopeData) as [TicketTypeScope, number][])
        .map(([name, value]) => ({ name, value }))
        .filter(item => item.value > 0);
  }, [tickets])
  
  const totalLogged = useMemo(() => data.reduce((acc, item) => acc + item.value, 0), [data]);

  if (totalLogged === 0) {
      return (
          <div className="h-[250px] w-full flex items-center justify-center text-muted-foreground">
              No time has been logged yet.
          </div>
      )
  }

  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const percent = totalLogged > 0 ? ((payload[0].value as number / totalLogged) * 100).toFixed(1) : 0;
                return (
                  <div className="p-2 bg-background border rounded-lg shadow-sm">
                    <p className="font-bold">{`${payload[0].name}: ${payload[0].value}h (${percent}%)`}</p>
                  </div>
                )
              }
              return null
            }}
          />
          <Legend />
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                const RADIAN = Math.PI / 180;
                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                const y = cy + radius * Math.sin(-midAngle * RADIAN);

                if (percent < 0.05) return null; // Don't render label if too small

                return (
                    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12}>
                    {`${(percent * 100).toFixed(0)}%`}
                    </text>
                );
            }}
            outerRadius={80}
            innerRadius={40}
            paddingAngle={5}
            dataKey="value"
            nameKey="name"
          >
            {data.map((entry) => (
              <Cell key={`cell-${entry.name}`} fill={COLORS[entry.name as TicketTypeScope]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
