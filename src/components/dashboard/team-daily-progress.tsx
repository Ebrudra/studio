"use client"

import * as React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { DailySprintData, Team } from "@/types"
import { teams as allTeams } from "@/lib/data"

interface TeamDailyProgressProps {
  burnDownData: DailySprintData[]
}

export function TeamDailyProgress({ burnDownData }: TeamDailyProgressProps) {
  const activeTeams = React.useMemo(() => {
    const teamSet = new Set<Team>();
    if (burnDownData) {
        burnDownData.forEach(day => {
            Object.keys(day.dailyCompletedByTeam).forEach(team => {
                if (day.dailyCompletedByTeam[team as Team] > 0) {
                teamSet.add(team as Team);
                }
            });
        });
    }
    return allTeams.filter(t => teamSet.has(t));
  }, [burnDownData]);

  if (!burnDownData || burnDownData.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Daily Progress (Build/Run Hours)</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[50px]">Day</TableHead>
              <TableHead className="min-w-[100px]">Date</TableHead>
              {activeTeams.map(team => (
                <TableHead key={team} className="text-center min-w-[120px]">{team}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {burnDownData.map(day => (
              <TableRow key={day.day}>
                <TableCell className="font-medium">{day.day}</TableCell>
                <TableCell>
                  {new Date(day.date).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' })}
                </TableCell>
                {activeTeams.map(team => (
                  <TableCell key={team} className="text-center">
                    <span>
                        {day.dailyBuildByTeam?.[team] || 0}h / {day.dailyRunByTeam?.[team] || 0}h
                    </span>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
