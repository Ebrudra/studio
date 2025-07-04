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
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sprint, Ticket, Team } from "@/types"
import { Progress } from "@/components/ui/progress"

interface TeamCapacityTableProps {
  sprint: Sprint
}

export function TeamCapacityTable({ sprint }: TeamCapacityTableProps) {
  const capacityData = useMemo(() => {
    const teams = Array.from(new Set(sprint.tickets.map(t => t.scope)))
    return teams.map(team => {
      const teamTickets = sprint.tickets.filter(t => t.scope === team)
      
      const plannedBuild = teamTickets.filter(t => t.typeScope === 'Build').reduce((acc, t) => acc + t.estimation, 0)
      const deliveredBuild = teamTickets.filter(t => t.typeScope === 'Build' && t.status === 'Done').reduce((acc, t) => acc + t.estimation, 0)
      
      const plannedRun = teamTickets.filter(t => t.typeScope === 'Run').reduce((acc, t) => acc + t.estimation, 0)
      const deliveredRun = teamTickets.filter(t => t.typeScope === 'Run' && t.status === 'Done').reduce((acc, t) => acc + t.estimation, 0)
      
      const totalPlanned = plannedBuild + plannedRun
      const totalDelivered = deliveredBuild + deliveredRun

      return { team, plannedBuild, deliveredBuild, plannedRun, deliveredRun, totalPlanned, totalDelivered }
    })
  }, [sprint.tickets])

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
    <Card>
      <CardHeader>
        <CardTitle>Team Capacity & Delivery</CardTitle>
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
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span>{`${data.deliveredBuild}h / ${data.plannedBuild}h`}</span>
                    <Progress value={data.plannedBuild > 0 ? (data.deliveredBuild / data.plannedBuild) * 100 : 0} className="w-20" />
                  </div>
                </TableCell>
                <TableCell>
                    <div className="flex items-center gap-2">
                        <span>{`${data.deliveredRun}h / ${data.plannedRun}h`}</span>
                        <Progress value={data.plannedRun > 0 ? (data.deliveredRun / data.plannedRun) * 100 : 0} className="w-20" />
                    </div>
                </TableCell>
                <TableCell>
                    <div className="flex items-center gap-2">
                        <span>{`${data.totalDelivered}h / ${data.totalPlanned}h`}</span>
                        <Progress value={data.totalPlanned > 0 ? (data.totalDelivered / data.totalPlanned) * 100 : 0} className="w-20" />
                    </div>
                </TableCell>
              </TableRow>
            ))}
             <TableRow className="font-bold bg-muted/50">
                <TableCell>Totals</TableCell>
                 <TableCell>
                  <div className="flex items-center gap-2">
                    <span>{`${totals.deliveredBuild}h / ${totals.plannedBuild}h`}</span>
                    <Progress value={totals.plannedBuild > 0 ? (totals.deliveredBuild / totals.plannedBuild) * 100 : 0} className="w-20" />
                  </div>
                </TableCell>
                <TableCell>
                    <div className="flex items-center gap-2">
                        <span>{`${totals.deliveredRun}h / ${totals.plannedRun}h`}</span>
                        <Progress value={totals.plannedRun > 0 ? (totals.deliveredRun / totals.plannedRun) * 100 : 0} className="w-20" />
                    </div>
                </TableCell>
                <TableCell>
                    <div className="flex items-center gap-2">
                        <span>{`${totals.totalDelivered}h / ${totals.totalPlanned}h`}</span>
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
