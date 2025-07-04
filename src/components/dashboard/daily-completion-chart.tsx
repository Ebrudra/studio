"use client"

import * as React from "react"
import { useMemo } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Sprint, Team } from "@/types"

const TEAM_COLORS: Record<Team, string> = {
  "Backend": "hsl(var(--chart-1))",
  "Web": "hsl(var(--chart-2))",
  "iOS": "hsl(var(--chart-3))",
  "Android": "hsl(var(--chart-4))",
  "Mobile": "hsl(var(--chart-5))",
}

interface DailyCompletionChartProps {
  sprint: Sprint
}

export function DailyCompletionChart({ sprint }: DailyCompletionChartProps) {
  const chartData = useMemo(() => {
    return sprint.burnDownData.map(dayData => ({
      name: `Day ${dayData.day}`,
      ...dayData.dailyCompletedByTeam,
    }))
  }, [sprint])

  const teams = useMemo(() => {
    const teamSet = new Set<Team>()
    sprint.tickets.forEach(ticket => teamSet.add(ticket.scope))
    return Array.from(teamSet)
  }, [sprint.tickets])

  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="p-2 bg-background border rounded-lg shadow-sm">
                    <p className="font-bold">{label}</p>
                    {payload.map(item => (
                       <p key={item.dataKey} style={{ color: item.color }}>{item.name}: {item.value}h</p>
                    ))}
                  </div>
                )
              }
              return null
            }}
          />
          <Legend wrapperStyle={{fontSize: "12px"}}/>
          {teams.map(team => (
            <Bar key={team} dataKey={team} stackId="a" fill={TEAM_COLORS[team]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
