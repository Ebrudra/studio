
"use client"

import * as React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Team } from "@/types"
import { teams as allTeams } from "@/lib/data"

export interface DailyProgressData {
  day: number;
  date: string;
  progress: Record<Team, { build: number; run: number; buffer: number }>;
}

interface TeamDailyProgressProps {
  dailyProgress: DailyProgressData[];
}

export function TeamDailyProgress({ dailyProgress }: TeamDailyProgressProps) {
  const activeTeams = React.useMemo(() => {
    const teamSet = new Set<Team>();
    if (dailyProgress) {
        dailyProgress.forEach(day => {
            Object.keys(day.progress).forEach(team => {
                if (day.progress[team as Team].build > 0 || day.progress[team as Team].run > 0 || day.progress[team as Team].buffer > 0) {
                    teamSet.add(team as Team);
                }
            });
        });
    }
    return allTeams.filter(t => teamSet.has(t));
  }, [dailyProgress]);

  const totals = React.useMemo(() => {
    const teamTotals: Record<Team, { build: number; run: number; buffer: number }> = allTeams.reduce((acc, team) => ({ ...acc, [team]: { build: 0, run: 0, buffer: 0 } }), {} as Record<Team, { build: 0, run: 0, buffer: 0 }>);
    let grandTotalBuild = 0;
    let grandTotalRun = 0;
    let grandTotalBuffer = 0;

    if (dailyProgress) {
        dailyProgress.forEach(day => {
            allTeams.forEach(team => {
                const { build, run, buffer } = day.progress[team] || { build: 0, run: 0, buffer: 0 };
                teamTotals[team].build += build;
                teamTotals[team].run += run;
                teamTotals[team].buffer += buffer;
            });
        });
    }
    
    grandTotalBuild = Object.values(teamTotals).reduce((sum, totals) => sum + totals.build, 0);
    grandTotalRun = Object.values(teamTotals).reduce((sum, totals) => sum + totals.run, 0);
    grandTotalBuffer = Object.values(teamTotals).reduce((sum, totals) => sum + totals.buffer, 0);

    return { teamTotals, grandTotalBuild, grandTotalRun, grandTotalBuffer };
  }, [dailyProgress]);

  if (!dailyProgress || dailyProgress.length === 0 || activeTeams.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Daily Progress (Build/Run/Buffer Hours)</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[50px] sticky left-0 bg-background z-10">Day</TableHead>
              {activeTeams.map(team => (
                <TableHead key={team} colSpan={3} className="text-center min-w-[225px] border-l">{team}</TableHead>
              ))}
               <TableHead colSpan={3} className="text-center font-bold min-w-[225px] border-l">Daily Totals</TableHead>
            </TableRow>
             <TableRow className="text-xs text-muted-foreground">
                <TableHead className="sticky left-0 bg-background z-10"></TableHead>
                {activeTeams.map(team => (
                    <React.Fragment key={team}>
                        <TableHead className="text-right border-l">Build</TableHead>
                        <TableHead className="text-right">Run</TableHead>
                        <TableHead className="text-right">Buffer</TableHead>
                    </React.Fragment>
                ))}
                <TableHead className="text-right border-l font-bold">Build</TableHead>
                <TableHead className="text-right font-bold">Run</TableHead>
                <TableHead className="text-right font-bold">Buffer</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dailyProgress.map(day => {
                const dailyTotalBuild = activeTeams.reduce((sum, team) => sum + (day.progress[team]?.build || 0), 0);
                const dailyTotalRun = activeTeams.reduce((sum, team) => sum + (day.progress[team]?.run || 0), 0);
                const dailyTotalBuffer = activeTeams.reduce((sum, team) => sum + (day.progress[team]?.buffer || 0), 0);
              
                if (dailyTotalBuild + dailyTotalRun + dailyTotalBuffer === 0) return null;

              return (
                 <TableRow key={day.day}>
                    <TableCell className="font-medium sticky left-0 bg-background z-10">D{day.day}</TableCell>
                    {activeTeams.map(team => (
                         <React.Fragment key={team}>
                            <TableCell className="text-right border-l">
                                {day.progress[team]?.build > 0 ? day.progress[team].build.toFixed(1) : ""}
                            </TableCell>
                             <TableCell className="text-right">
                                {day.progress[team]?.run > 0 ? day.progress[team].run.toFixed(1) : ""}
                            </TableCell>
                             <TableCell className="text-right">
                                {day.progress[team]?.buffer > 0 ? day.progress[team].buffer.toFixed(1) : ""}
                            </TableCell>
                        </React.Fragment>
                    ))}
                    <TableCell className="text-right border-l font-bold">{dailyTotalBuild > 0 ? dailyTotalBuild.toFixed(1) : ""}</TableCell>
                    <TableCell className="text-right font-bold">{dailyTotalRun > 0 ? dailyTotalRun.toFixed(1) : ""}</TableCell>
                    <TableCell className="text-right font-bold">{dailyTotalBuffer > 0 ? dailyTotalBuffer.toFixed(1) : ""}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
           <TableFooter>
            <TableRow className="font-bold bg-muted/50">
              <TableCell className="sticky left-0 bg-muted/50 z-10">Grand Total</TableCell>
              {activeTeams.map(team => (
                <React.Fragment key={team}>
                    <TableCell className="text-right border-l">
                        {totals.teamTotals[team].build > 0 ? totals.teamTotals[team].build.toFixed(1) : ""}
                    </TableCell>
                     <TableCell className="text-right">
                        {totals.teamTotals[team].run > 0 ? totals.teamTotals[team].run.toFixed(1) : ""}
                    </TableCell>
                    <TableCell className="text-right">
                        {totals.teamTotals[team].buffer > 0 ? totals.teamTotals[team].buffer.toFixed(1) : ""}
                    </TableCell>
                </React.Fragment>
              ))}
              <TableCell className="text-right border-l">{totals.grandTotalBuild > 0 ? totals.grandTotalBuild.toFixed(1) : ""}</TableCell>
              <TableCell className="text-right">{totals.grandTotalRun > 0 ? totals.grandTotalRun.toFixed(1) : ""}</TableCell>
              <TableCell className="text-right">{totals.grandTotalBuffer > 0 ? totals.grandTotalBuffer.toFixed(1) : ""}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  )
}
