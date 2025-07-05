
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
import { AlertTriangle } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

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
    const teamTotals: Record<Team, { build: number; run: number; buffer: number; total: number }> = allTeams.reduce((acc, team) => ({ ...acc, [team]: { build: 0, run: 0, buffer: 0, total: 0 } }), {} as any);
    let grandTotalBuild = 0;
    let grandTotalRun = 0;
    let grandTotalBuffer = 0;
    let grandTotal = 0;

    if (dailyProgress) {
        dailyProgress.forEach(day => {
            allTeams.forEach(team => {
                const { build, run, buffer } = day.progress[team] || { build: 0, run: 0, buffer: 0 };
                teamTotals[team].build += build;
                teamTotals[team].run += run;
                teamTotals[team].buffer += buffer;
                teamTotals[team].total += (build + run + buffer);
            });
        });
    }
    
    grandTotalBuild = Object.values(teamTotals).reduce((sum, totals) => sum + totals.build, 0);
    grandTotalRun = Object.values(teamTotals).reduce((sum, totals) => sum + totals.run, 0);
    grandTotalBuffer = Object.values(teamTotals).reduce((sum, totals) => sum + totals.buffer, 0);
    grandTotal = grandTotalBuild + grandTotalRun + grandTotalBuffer;

    return { teamTotals, grandTotalBuild, grandTotalRun, grandTotalBuffer, grandTotal };
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
                <TableHead key={team} colSpan={4} className="text-center min-w-[300px] border-l">{team}</TableHead>
              ))}
               <TableHead colSpan={4} className="text-center font-bold min-w-[300px] border-l">Daily Totals</TableHead>
            </TableRow>
             <TableRow className="text-xs text-muted-foreground">
                <TableHead className="sticky left-0 bg-background z-10"></TableHead>
                {activeTeams.map(team => (
                    <React.Fragment key={team}>
                        <TableHead className="text-right border-l">Build</TableHead>
                        <TableHead className="text-right">Run</TableHead>
                        <TableHead className="text-right">Buffer</TableHead>
                        <TableHead className="text-right font-bold">Total</TableHead>
                    </React.Fragment>
                ))}
                <TableHead className="text-right border-l font-bold">Build</TableHead>
                <TableHead className="text-right font-bold">Run</TableHead>
                <TableHead className="text-right font-bold">Buffer</TableHead>
                <TableHead className="text-right font-bold">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dailyProgress.map(day => {
                const dailyTotalBuild = activeTeams.reduce((sum, team) => sum + (day.progress[team]?.build || 0), 0);
                const dailyTotalRun = activeTeams.reduce((sum, team) => sum + (day.progress[team]?.run || 0), 0);
                const dailyTotalBuffer = activeTeams.reduce((sum, team) => sum + (day.progress[team]?.buffer || 0), 0);
                const dailyGrandTotal = dailyTotalBuild + dailyTotalRun + dailyTotalBuffer;

                if (dailyGrandTotal === 0) return null;

              return (
                 <TableRow key={day.day}>
                    <TableCell className="font-medium sticky left-0 bg-background z-10">D{day.day}</TableCell>
                    {activeTeams.map(team => {
                        const teamProgress = day.progress[team] || { build: 0, run: 0, buffer: 0 };
                        const teamDailyTotal = teamProgress.build + teamProgress.run + teamProgress.buffer;
                        const showWarning = teamDailyTotal > 0 && teamDailyTotal < 8;
                        return (
                            <React.Fragment key={team}>
                                <TableCell className="text-right border-l">
                                    {teamProgress.build > 0 ? teamProgress.build.toFixed(1) : ""}
                                </TableCell>
                                <TableCell className="text-right">
                                    {teamProgress.run > 0 ? teamProgress.run.toFixed(1) : ""}
                                </TableCell>
                                <TableCell className="text-right">
                                    {teamProgress.buffer > 0 ? teamProgress.buffer.toFixed(1) : ""}
                                </TableCell>
                                <TableCell className="text-right font-bold">
                                    <div className="flex items-center justify-end gap-1">
                                    {showWarning && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Logged hours are less than 8h.</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                    {teamDailyTotal > 0 ? teamDailyTotal.toFixed(1) : ""}
                                    </div>
                                </TableCell>
                            </React.Fragment>
                        );
                    })}
                    <TableCell className="text-right border-l font-bold">{dailyTotalBuild > 0 ? dailyTotalBuild.toFixed(1) : ""}</TableCell>
                    <TableCell className="text-right font-bold">{dailyTotalRun > 0 ? dailyTotalRun.toFixed(1) : ""}</TableCell>
                    <TableCell className="text-right font-bold">{dailyTotalBuffer > 0 ? dailyTotalBuffer.toFixed(1) : ""}</TableCell>
                    <TableCell className="text-right font-bold">{dailyGrandTotal > 0 ? dailyGrandTotal.toFixed(1) : ""}</TableCell>
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
                    <TableCell className="text-right font-bold">
                        {totals.teamTotals[team].total > 0 ? totals.teamTotals[team].total.toFixed(1) : ""}
                    </TableCell>
                </React.Fragment>
              ))}
              <TableCell className="text-right border-l">{totals.grandTotalBuild > 0 ? totals.grandTotalBuild.toFixed(1) : ""}</TableCell>
              <TableCell className="text-right">{totals.grandTotalRun > 0 ? totals.grandTotalRun.toFixed(1) : ""}</TableCell>
              <TableCell className="text-right">{totals.grandTotalBuffer > 0 ? totals.grandTotalBuffer.toFixed(1) : ""}</TableCell>
              <TableCell className="text-right font-bold">{totals.grandTotal > 0 ? totals.grandTotal.toFixed(1) : ""}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  )
}

    