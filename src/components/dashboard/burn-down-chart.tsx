"use client"

import * as React from "react"
import { useMemo, useState } from "react"
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ReferenceLine, ResponsiveContainer } from "recharts"
import { Sprint, Ticket, Team } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartTooltipContent } from "@/components/ui/chart"

interface BurnDownChartProps {
  sprint: Sprint
}

type ScopeFilter = "Total" | "Build" | "Run"
const ALL_TEAMS = "All Teams"

export function BurnDownChart({ sprint }: BurnDownChartProps) {
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("Total")
  const [teamFilter, setTeamFilter] = useState<Team | "All Teams">(ALL_TEAMS)

  const teamsInSprint = useMemo(() => [ALL_TEAMS, ...Array.from(new Set(sprint.tickets.map(t => t.scope)))], [sprint.tickets])

  const filteredData = useMemo(() => {
    const sprintDurationInDays = sprint.burnDownData.length > 0 ? sprint.burnDownData.length : 10; // Assume 10 working days if no data
    
    let filteredTickets = sprint.tickets
    if (scopeFilter !== "Total") {
      filteredTickets = filteredTickets.filter(t => t.typeScope === scopeFilter)
    }
    if (teamFilter !== ALL_TEAMS) {
      filteredTickets = filteredTickets.filter(t => t.scope === teamFilter)
    }

    const totalScope = filteredTickets.reduce((acc, t) => acc + t.estimation, 0)
    const idealBurnPerDay = totalScope / (sprintDurationInDays - 1)

    // Recalculate actual burndown based on filters
    const dailyCompletion = new Map<string, number>()
    for (const ticket of filteredTickets) {
      if (ticket.status === 'Done') {
        // This is a simplification. In a real scenario, you'd have completion dates for tickets.
        // We'll distribute completed work over the sprint for this mock.
        const completionDay = sprint.burnDownData[Math.floor(Math.random() * (sprint.burnDownData.length -1)) + 1]?.date;
        if(completionDay) {
          dailyCompletion.set(completionDay, (dailyCompletion.get(completionDay) || 0) + ticket.estimation)
        }
      }
    }

    let remainingScope = totalScope
    return sprint.burnDownData.map((dayData, index) => {
      const completedToday = dailyCompletion.get(dayData.date) || 0
      remainingScope -= completedToday
      return {
        name: `Day ${dayData.day}`,
        "Ideal Burn": (totalScope - (index * idealBurnPerDay)).toFixed(2),
        "Actual Burn": remainingScope,
        "Daily Done": completedToday,
        date: new Date(dayData.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }
    })
  }, [sprint, scopeFilter, teamFilter])

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row gap-4 justify-between mb-4">
        <div className="flex items-center space-x-4">
            <RadioGroup defaultValue="Total" onValueChange={(value: ScopeFilter) => setScopeFilter(value)} className="flex items-center">
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Total" id="total" />
                    <Label htmlFor="total">Total</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Build" id="build" />
                    <Label htmlFor="build">Build</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Run" id="run" />
                    <Label htmlFor="run">Run</Label>
                </div>
            </RadioGroup>
        </div>
        <div className="w-full sm:w-48">
          <Select value={teamFilter} onValueChange={(value: Team | "All Teams") => setTeamFilter(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select Team" />
            </SelectTrigger>
            <SelectContent>
              {teamsInSprint.map(team => (
                <SelectItem key={team} value={team}>{team}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={filteredData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} label={{ value: 'Hours Remaining', angle: -90, position: 'insideLeft', fill: 'hsl(var(--foreground))' }} />
            <Tooltip
              content={({ active, payload, label }) => {
                 if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                        <div className="p-2 bg-background border rounded-lg shadow-sm">
                            <p className="font-bold">{label} ({data.date})</p>
                            <p style={{ color: payload[0].color }}>{payload[0].name}: {payload[0].value}h</p>
                            <p style={{ color: payload[1].color }}>{payload[1].name}: {payload[1].value}h</p>
                            <p className="text-muted-foreground">Daily Done: {data['Daily Done']}h</p>
                        </div>
                    );
                }
                return null;
              }}
            />
            <Legend />
            <Line type="monotone" dataKey="Ideal Burn" stroke="hsl(var(--muted-foreground))" strokeWidth={2} strokeDasharray="5 5" dot={false} />
            <Line type="monotone" dataKey="Actual Burn" stroke="hsl(var(--primary))" strokeWidth={2} activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
