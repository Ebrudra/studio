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
import { Ticket, Team } from "@/types"
import { Progress } from "@/components/ui/progress"

interface TeamCapacityTableProps {
  tickets: Ticket[]
}

export function TeamCapacityTable({ tickets }: TeamCapacityTableProps) {
  const capacityData = useMemo(() => {
    const teams = Array.from(new Set(tickets.map(t => t.scope)))
    return teams.map(team => {
      const teamTickets = tickets.filter(t => t.scope === team)
      
      const plannedBuild = teamTickets.filter(t => t.typeScope === 'Build').reduce((acc, t) => acc + t.estimation, 0)
      const deliveredBuild = teamTickets.filter(t => t.typeScope === 'Build' && t.status === 'Done').reduce((acc, t) => acc + t.estimation, 0)
      
      const plannedRun = teamTickets.filter(t => t.typeScope === 'Run').reduce((acc, t) => acc + t.estimation, 0)
      const deliveredRun = teamTickets.filter(t => t.typeScope === 'Run' && t.status === 'Done').reduce((acc, t) => acc + t.estimation, 0)
      
      return { team, plannedBuild, deliveredBuild, plannedRun, deliveredRun }
    })
  }, [tickets])

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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
