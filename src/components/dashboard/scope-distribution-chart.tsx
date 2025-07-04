"use client"

import * as React from "react"
import { useMemo } from "react"
import { Pie, PieChart, ResponsiveContainer, Cell, Tooltip } from "recharts"
import { Ticket } from "@/types"

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))"]

interface ScopeDistributionChartProps {
  tickets: Ticket[]
}

export function ScopeDistributionChart({ tickets }: ScopeDistributionChartProps) {
  const data = useMemo(() => {
    const scopeData: { [key: string]: number } = {}
    tickets.forEach(ticket => {
      if (scopeData[ticket.typeScope]) {
        scopeData[ticket.typeScope] += ticket.estimation
      } else {
        scopeData[ticket.typeScope] = ticket.estimation
      }
    })

    return Object.entries(scopeData).map(([name, value]) => ({ name, value }))
  }, [tickets])
  
  const totalScope = useMemo(() => data.reduce((acc, item) => acc + item.value, 0), [data]);

  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const percent = totalScope > 0 ? ((payload[0].value as number / totalScope) * 100).toFixed(1) : 0;
                return (
                  <div className="p-2 bg-background border rounded-lg shadow-sm">
                    <p className="font-bold">{`${payload[0].name}: ${payload[0].value}h (${percent}%)`}</p>
                  </div>
                )
              }
              return null
            }}
          />
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

                return (
                    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                    {`${(percent * 100).toFixed(0)}%`}
                    </text>
                );
            }}
            outerRadius={80}
            innerRadius={40}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
