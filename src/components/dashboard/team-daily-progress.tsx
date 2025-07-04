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

interface DailyProgress {
  day: number;
  date: string;
  loggedHours: Record<Team, number>;
}

interface TeamDailyProgressProps {
  dailyProgress: DailyProgress[];
}

export function TeamDailyProgress({ dailyProgress }: TeamDailyProgressProps) {
  const activeTeams = React.useMemo(() => {
    const teamSet = new Set<Team>();
    if (dailyProgress) {
        dailyProgress.forEach(day => {
            Object.keys(day.loggedHours).forEach(team => {
                if (day.loggedHours[team as Team] > 0) {
                    teamSet.add(team as Team);
                }
            });
        });
    }
    // Return a consistent order based on allTeams
    return allTeams.filter(t => teamSet.has(t));
  }, [dailyProgress]);

  const totals = React.useMemo(() => {
    const teamTotals: Record<Team, number> = allTeams.reduce((acc, team) => ({ ...acc, [team]: 0 }), {} as Record<Team, number>);
    let grandTotal = 0;

    if (dailyProgress) {
        dailyProgress.forEach(day => {
            allTeams.forEach(team => {
                const hours = day.loggedHours[team] || 0;
                teamTotals[team] += hours;
            });
        });
    }
    
    grandTotal = Object.values(teamTotals).reduce((sum, hours) => sum + hours, 0);
    
    return { teamTotals, grandTotal };
  }, [dailyProgress]);

  if (!dailyProgress || dailyProgress.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Daily Progress (Logged Hours)</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[50px]">Day</TableHead>
              <TableHead className="min-w-[120px]">Date</TableHead>
              {activeTeams.map(team => (
                <TableHead key={team} className="text-right min-w-[120px]">{team}</TableHead>
              ))}
               <TableHead className="text-right font-bold min-w-[120px]">Grand Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dailyProgress.map(day => {
              const dailyTotal = activeTeams.reduce((sum, team) => sum + (day.loggedHours[team] || 0), 0);
              // Only render rows that have some logged hours
              if (dailyTotal === 0) return null;

              return (
                 <TableRow key={day.day}>
                    <TableCell className="font-medium">J{day.day}</TableCell>
                    <TableCell>
                    {new Date(day.date).toLocaleDateString('en-GB', { timeZone: 'UTC', day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-')}
                    </TableCell>
                    {activeTeams.map(team => (
                    <TableCell key={team} className="text-right">
                        {day.loggedHours[team] > 0 ? day.loggedHours[team] : ""}
                    </TableCell>
                    ))}
                    <TableCell className="text-right font-bold">{dailyTotal > 0 ? dailyTotal : ""}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
           <TableFooter>
            <TableRow className="font-bold bg-muted/50">
              <TableCell colSpan={2}>Grand Total</TableCell>
              {activeTeams.map(team => (
                <TableCell key={team} className="text-right">
                  {totals.teamTotals[team] > 0 ? totals.teamTotals[team] : ""}
                </TableCell>
              ))}
              <TableCell className="text-right">{totals.grandTotal > 0 ? totals.grandTotal : ""}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  )
}
