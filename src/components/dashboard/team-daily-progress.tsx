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
  progress: Record<Team, { build: number; run: number }>;
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
                if (day.progress[team as Team].build > 0 || day.progress[team as Team].run > 0) {
                    teamSet.add(team as Team);
                }
            });
        });
    }
    return allTeams.filter(t => teamSet.has(t));
  }, [dailyProgress]);

  const totals = React.useMemo(() => {
    const teamTotals: Record<Team, { build: number; run: number }> = allTeams.reduce((acc, team) => ({ ...acc, [team]: { build: 0, run: 0 } }), {} as Record<Team, { build: 0, run: 0 }>);
    let grandTotalBuild = 0;
    let grandTotalRun = 0;

    if (dailyProgress) {
        dailyProgress.forEach(day => {
            allTeams.forEach(team => {
                const { build, run } = day.progress[team] || { build: 0, run: 0 };
                teamTotals[team].build += build;
                teamTotals[team].run += run;
            });
        });
    }
    
    grandTotalBuild = Object.values(teamTotals).reduce((sum, totals) => sum + totals.build, 0);
    grandTotalRun = Object.values(teamTotals).reduce((sum, totals) => sum + totals.run, 0);
    
    return { teamTotals, grandTotalBuild, grandTotalRun };
  }, [dailyProgress]);

  if (!dailyProgress || dailyProgress.length === 0 || activeTeams.length === 0) {
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
              <TableHead className="min-w-[50px] sticky left-0 bg-background z-10">Day</TableHead>
              <TableHead className="min-w-[120px]">Date</TableHead>
              {activeTeams.map(team => (
                <TableHead key={team} colSpan={2} className="text-center min-w-[150px] border-l">{team}</TableHead>
              ))}
               <TableHead colSpan={2} className="text-center font-bold min-w-[150px] border-l">Daily Totals</TableHead>
            </TableRow>
             <TableRow className="text-xs text-muted-foreground">
                <TableHead className="sticky left-0 bg-background z-10"></TableHead>
                <TableHead></TableHead>
                {activeTeams.map(team => (
                    <React.Fragment key={team}>
                        <TableHead className="text-right border-l">Build</TableHead>
                        <TableHead className="text-right">Run</TableHead>
                    </React.Fragment>
                ))}
                <TableHead className="text-right border-l font-bold">Build</TableHead>
                <TableHead className="text-right font-bold">Run</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dailyProgress.map(day => {
                const dailyTotalBuild = activeTeams.reduce((sum, team) => sum + (day.progress[team]?.build || 0), 0);
                const dailyTotalRun = activeTeams.reduce((sum, team) => sum + (day.progress[team]?.run || 0), 0);
              
                if (dailyTotalBuild + dailyTotalRun === 0) return null;

              return (
                 <TableRow key={day.day}>
                    <TableCell className="font-medium sticky left-0 bg-background z-10">J{day.day}</TableCell>
                    <TableCell>
                    {new Date(day.date).toLocaleDateString('en-GB', { timeZone: 'UTC', day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-')}
                    </TableCell>
                    {activeTeams.map(team => (
                         <React.Fragment key={team}>
                            <TableCell className="text-right border-l">
                                {day.progress[team]?.build > 0 ? day.progress[team].build : ""}
                            </TableCell>
                             <TableCell className="text-right">
                                {day.progress[team]?.run > 0 ? day.progress[team].run : ""}
                            </TableCell>
                        </React.Fragment>
                    ))}
                    <TableCell className="text-right border-l font-bold">{dailyTotalBuild > 0 ? dailyTotalBuild : ""}</TableCell>
                    <TableCell className="text-right font-bold">{dailyTotalRun > 0 ? dailyTotalRun : ""}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
           <TableFooter>
            <TableRow className="font-bold bg-muted/50">
              <TableCell colSpan={2} className="sticky left-0 bg-muted/50 z-10">Grand Total</TableCell>
              {activeTeams.map(team => (
                <React.Fragment key={team}>
                    <TableCell className="text-right border-l">
                        {totals.teamTotals[team].build > 0 ? totals.teamTotals[team].build : ""}
                    </TableCell>
                     <TableCell className="text-right">
                        {totals.teamTotals[team].run > 0 ? totals.teamTotals[team].run : ""}
                    </TableCell>
                </React.Fragment>
              ))}
              <TableCell className="text-right border-l">{totals.grandTotalBuild > 0 ? totals.grandTotalBuild : ""}</TableCell>
              <TableCell className="text-right">{totals.grandTotalRun > 0 ? totals.grandTotalRun : ""}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  )
}
