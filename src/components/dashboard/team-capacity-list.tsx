"use client"

import * as React from "react"
import { useMemo } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import type { Sprint, Team } from "@/types"

interface TeamCapacityListProps {
  sprint: Sprint
}

export function TeamCapacityList({ sprint }: TeamCapacityListProps) {
    const capacityData = useMemo(() => {
        const teamsInSprint = (Object.keys(sprint.teamCapacity || {}) as Team[]).filter(t => t !== 'Out of Scope');

        return teamsInSprint.map(team => {
          const teamTickets = (sprint.tickets || []).filter(t => t.scope === team)
          
          const capacity = sprint.teamCapacity?.[team];
          const plannedBuild = capacity?.plannedBuild ?? 0;
          const plannedRun = capacity?.plannedRun ?? 0;
          
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

    return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team</TableHead>
              <TableHead className="text-right">Build (Delivered/Planned)</TableHead>
              <TableHead className="text-right">Run (Delivered/Planned)</TableHead>
              <TableHead className="text-right">Total Delivered</TableHead>
              <TableHead className="w-[200px]">Progress</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {capacityData
                .filter(team => team.totalPlanned > 0 || team.totalDelivered > 0)
                .map(data => (
              <TableRow key={data.team}>
                <TableCell className="font-medium">{data.team}</TableCell>
                <TableCell className="text-right">{data.deliveredBuild.toFixed(1)}h / {data.plannedBuild.toFixed(1)}h</TableCell>
                <TableCell className="text-right">{data.deliveredRun.toFixed(1)}h / {data.plannedRun.toFixed(1)}h</TableCell>
                <TableCell className="text-right font-bold">{data.totalDelivered.toFixed(1)}h</TableCell>
                <TableCell>
                  <Progress value={data.totalPlanned > 0 ? (data.totalDelivered / data.totalPlanned) * 100 : 0} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
           <TableFooter>
            <TableRow className="font-bold bg-muted/50">
              <TableCell>Totals</TableCell>
              <TableCell className="text-right">{totals.deliveredBuild.toFixed(1)}h / {totals.plannedBuild.toFixed(1)}h</TableCell>
              <TableCell className="text-right">{totals.deliveredRun.toFixed(1)}h / {totals.plannedRun.toFixed(1)}h</TableCell>
              <TableCell className="text-right">{totals.totalDelivered.toFixed(1)}h</TableCell>
              <TableCell>
                <Progress value={totals.totalPlanned > 0 ? (totals.totalDelivered / totals.totalPlanned) * 100 : 0} />
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
    )
}
