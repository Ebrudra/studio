
"use client"

import * as React from "react"
import { useMemo, useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sprint, Team, TeamCapacity } from "@/types"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { InsightBulb } from "./insight-bulb"

interface TeamCapacityTableProps {
  sprint: Sprint
  isSprintCompleted: boolean
  onUpdateTeamCapacity: (team: Team, capacity: TeamCapacity) => void
}

export function TeamCapacityTable({ sprint, isSprintCompleted, onUpdateTeamCapacity }: TeamCapacityTableProps) {
  const [editingValues, setEditingValues] = useState<Record<string, { build: string; run: string }>>({});

  const capacityData = useMemo(() => {
    const teamsInSprint = Object.keys(sprint.teamCapacity) as Team[];

    return teamsInSprint.map(team => {
      const teamTickets = sprint.tickets.filter(t => t.scope === team)
      
      const plannedBuild = sprint.teamCapacity[team]?.plannedBuild ?? 0;
      const plannedRun = sprint.teamCapacity[team]?.plannedRun ?? 0;
      
      const deliveredBuild = teamTickets.filter(t => t.typeScope === 'Build' && t.status === 'Done').reduce((acc, t) => acc + t.estimation, 0)
      const deliveredRun = teamTickets.filter(t => t.typeScope === 'Run').reduce((acc, t) => acc + t.timeLogged, 0);
      
      const totalPlanned = plannedBuild + plannedRun
      const totalDelivered = deliveredBuild + deliveredRun

      return { team, plannedBuild, deliveredBuild, plannedRun, deliveredRun, totalPlanned, totalDelivered }
    })
  }, [sprint])

  const totals = useMemo(() => {
    return capacityData.reduce((acc, data) => {
        acc.plannedBuild += data.plannedBuild
        acc.deliveredBuild += data.deliveredBuild
        acc.plannedRun += data.plannedRun
        acc.deliveredRun += data.deliveredRun
        acc.totalPlanned += data.totalPlanned
        acc.totalDelivered += data.totalDelivered
        return acc
    }, { plannedBuild: 0, deliveredBuild: 0, plannedRun: 0, deliveredRun: 0, totalPlanned: 0, totalDelivered: 0 })
  }, [capacityData])
  
  const handleInputChange = (team: Team, type: 'build' | 'run', value: string) => {
    setEditingValues(prev => ({
        ...prev,
        [team]: {
            ...prev[team],
            [type]: value,
        }
    }));
  };

  const handleUpdate = (team: Team, type: 'build' | 'run') => {
    const originalCapacity = sprint.teamCapacity[team];
    const editingTeamValues = editingValues[team];
    if (!editingTeamValues) return;

    const newValue = parseFloat(editingTeamValues[type]);
    if (isNaN(newValue)) {
        // Reset to original if input is invalid
        setEditingValues(prev => ({ ...prev, [team]: { ...prev[team], [type]: originalCapacity[type === 'build' ? 'plannedBuild' : 'plannedRun'].toString() } }));
        return;
    }

    const newCapacity: TeamCapacity = {
        plannedBuild: type === 'build' ? newValue : originalCapacity.plannedBuild,
        plannedRun: type === 'run' ? newValue : originalCapacity.plannedRun,
    };
    onUpdateTeamCapacity(team, newCapacity);
  };
  
  const renderCell = (data: any, type: 'build' | 'run') => {
    const planned = type === 'build' ? data.plannedBuild : data.plannedRun;
    const delivered = type === 'build' ? data.deliveredBuild : data.deliveredRun;
    
    return (
       <div className="flex items-center gap-2">
            <span>{`${delivered.toFixed(1)}h /`}</span>
             <Input
                type="number"
                value={editingValues[data.team]?.[type] ?? planned.toFixed(1)}
                onChange={(e) => handleInputChange(data.team, type, e.target.value)}
                onBlur={() => handleUpdate(data.team, type)}
                onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                className="w-20 h-8 p-1 text-center"
                disabled={isSprintCompleted}
             />
             <span>h</span>
            <Progress value={planned > 0 ? (delivered / planned) * 100 : 0} className="w-20" />
        </div>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
            <CardTitle>Team Capacity & Delivery</CardTitle>
            <InsightBulb insight="This table shows the planned vs. delivered work for each team. You can edit the 'Plan' values directly to adjust capacity during the sprint." />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team</TableHead>
              <TableHead>Build (Done/Plan)</TableHead>
              <TableHead>Run (Done/Plan)</TableHead>
              <TableHead>Total (Done/Plan)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {capacityData.map(data => (
              <TableRow key={data.team}>
                <TableCell className="font-medium">{data.team}</TableCell>
                <TableCell>{renderCell(data, 'build')}</TableCell>
                <TableCell>{renderCell(data, 'run')}</TableCell>
                <TableCell>
                    <div className="flex items-center gap-2">
                        <span>{`${data.totalDelivered.toFixed(1)}h / ${data.totalPlanned.toFixed(1)}h`}</span>
                        <Progress value={data.totalPlanned > 0 ? (data.totalDelivered / data.totalPlanned) * 100 : 0} className="w-20" />
                    </div>
                </TableCell>
              </TableRow>
            ))}
             <TableRow className="font-bold bg-muted/50">
                <TableCell>Totals</TableCell>
                 <TableCell>
                  <div className="flex items-center gap-2">
                    <span>{`${totals.deliveredBuild.toFixed(1)}h / ${totals.plannedBuild.toFixed(1)}h`}</span>
                    <Progress value={totals.plannedBuild > 0 ? (totals.deliveredBuild / totals.plannedBuild) * 100 : 0} className="w-20" />
                  </div>
                </TableCell>
                <TableCell>
                    <div className="flex items-center gap-2">
                        <span>{`${totals.deliveredRun.toFixed(1)}h / ${totals.plannedRun.toFixed(1)}h`}</span>
                        <Progress value={totals.plannedRun > 0 ? (totals.deliveredRun / totals.plannedRun) * 100 : 0} className="w-20" />
                    </div>
                </TableCell>
                <TableCell>
                    <div className="flex items-center gap-2">
                        <span>{`${totals.totalDelivered.toFixed(1)}h / ${totals.totalPlanned.toFixed(1)}h`}</span>
                        <Progress value={totals.totalPlanned > 0 ? (totals.totalDelivered / totals.totalPlanned) * 100 : 0} className="w-20" />
                    </div>
                </TableCell>
              </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

    