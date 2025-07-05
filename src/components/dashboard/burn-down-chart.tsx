
"use client"

import * as React from "react"
import { useMemo, useState } from "react"
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"
import type { Sprint, Team } from "@/types"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

interface BurnDownChartProps {
  sprint: Sprint
}

type ScopeFilter = "Total" | "Build" | "Run"
const ALL_TEAMS = "All Teams"

export function BurnDownChart({ sprint }: BurnDownChartProps) {
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("Total")
  const [teamFilter, setTeamFilter] = useState<Team | "All Teams">(ALL_TEAMS)
  const [showFullProjection, setShowFullProjection] = useState(false)
  
  const today = useMemo(() => new Date().toISOString().split('T')[0], [])

  const teamsInSprint = useMemo(() => [ALL_TEAMS, ...Array.from(new Set(sprint.tickets.map(t => t.scope)))], [sprint.tickets])

  const chartData = useMemo(() => {
    if (!sprint.sprintDays || sprint.sprintDays.length === 0) return [];

    const sprintDurationInDays = sprint.sprintDays.length;

    let filteredTickets = sprint.tickets
    if (teamFilter !== ALL_TEAMS) {
      filteredTickets = filteredTickets.filter(t => t.scope === teamFilter)
    }
     if (scopeFilter !== "Total") {
      filteredTickets = filteredTickets.filter(t => t.typeScope === scopeFilter)
    } else {
      // Exclude sprint buffers from total
      filteredTickets = filteredTickets.filter(t => t.typeScope !== 'Sprint')
    }

    const sprintStartDate = sprint.sprintDays[0]?.date;
    if (!sprintStartDate) return [];

    const initialScope = filteredTickets
        .filter(t => !t.creationDate || t.creationDate <= sprintStartDate)
        .reduce((acc, t) => acc + t.estimation, 0);

    const idealBurnPerDay = initialScope / (sprintDurationInDays > 1 ? sprintDurationInDays - 1 : 1);

    const dailyDelta = new Map<string, { newScope: number; loggedHours: number }>();
    sprint.sprintDays.forEach(day => {
        dailyDelta.set(day.date, { newScope: 0, loggedHours: 0 });
    });
    
    for (const ticket of filteredTickets) {
        if (ticket.creationDate && ticket.creationDate > sprintStartDate) {
            const delta = dailyDelta.get(ticket.creationDate);
            if (delta) {
                delta.newScope += ticket.estimation;
            }
        }

        if (ticket.dailyLogs) {
            for (const log of ticket.dailyLogs) {
                const delta = dailyDelta.get(log.date);
                if (delta) {
                    delta.loggedHours += log.loggedHours;
                }
            }
        }
    }

    let cumulativeLogged = 0;
    let cumulativeNewScope = 0;
    const processedData = sprint.sprintDays.map((dayData, index) => {
        const delta = dailyDelta.get(dayData.date) || { newScope: 0, loggedHours: 0 };
        cumulativeLogged += delta.loggedHours;
        
        // New scope is added to the total on the day it's created.
        if (index > 0) {
            const scopeAddedYesterday = dailyDelta.get(sprint.sprintDays[index-1].date)?.newScope || 0;
            cumulativeNewScope += scopeAddedYesterday;
        }

        const remainingScope = initialScope + cumulativeNewScope - cumulativeLogged;
        const idealBurn = parseFloat((initialScope - (index * idealBurnPerDay)).toFixed(2));

        return {
            name: `Day ${dayData.day}`,
            "Ideal Burn": idealBurn < 0 ? 0 : idealBurn,
            "Actual Burn": remainingScope < 0 ? 0 : remainingScope,
            date: dayData.date
        };
    });
    
    if (!showFullProjection) {
        return processedData.filter(d => d.date <= today)
    }
    return processedData

  }, [sprint, scopeFilter, teamFilter, showFullProjection, today])

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row gap-4 justify-between mb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <RadioGroup defaultValue="Total" value={scopeFilter} onValueChange={(value: ScopeFilter) => setScopeFilter(value)} className="flex items-center">
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
            <div className="flex items-center space-x-2">
                <Checkbox id="show-projection" checked={showFullProjection} onCheckedChange={(checked) => setShowFullProjection(!!checked)} />
                <Label htmlFor="show-projection" className="text-sm">Show Full Projection</Label>
            </div>
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
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 'dataMax']} label={{ value: 'Hours Remaining', angle: -90, position: 'insideLeft', fill: 'hsl(var(--foreground))' }} />
            <Tooltip
              content={({ active, payload, label }) => {
                 if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const displayDate = new Date(data.date).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' });
                    return (
                        <div className="p-2 bg-background border rounded-lg shadow-sm">
                            <p className="font-bold">{label} ({displayDate})</p>
                            <p style={{ color: payload[1].color }}>{payload[1].name}: {Number(payload[1].value).toFixed(2)}h</p>
                             <p style={{ color: payload[0].color }}>{payload[0].name}: {Number(payload[0].value).toFixed(2)}h</p>
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
