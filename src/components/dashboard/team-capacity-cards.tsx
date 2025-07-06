
"use client"

import * as React from "react"
import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, BarChart2, Target } from "lucide-react"
import type { Sprint, Team } from "@/types"

interface TeamCapacityCardsProps {
  sprint: Sprint
}

type TeamCapacityData = {
    team: Team,
    plannedBuild: number,
    deliveredBuild: number,
    plannedRun: number,
    deliveredRun: number,
    deliveredBuffer: number,
    totalPlanned: number,
    totalDelivered: number,
}

const getStatusBadge = (done: number, plan: number) => {
    if (plan === 0 && done === 0) return <Badge variant="secondary">Inactive</Badge>;
    if (plan === 0 && done > 0) return <Badge variant="success" className="bg-success/10 text-success border-transparent hover:bg-success/20">Bonus</Badge>;
    const percentage = (done / plan) * 100;

    if (percentage >= 100) return <Badge variant="success" className="bg-success/10 text-success border-transparent hover:bg-success/20">On Track</Badge>;
    if (percentage >= 80) return <Badge variant="default" className="bg-primary/10 text-primary border-transparent hover:bg-primary/20">Good</Badge>;
    if (percentage >= 60) return <Badge variant="warning" className="bg-warning/10 text-warning border-transparent hover:bg-warning/20">Behind</Badge>;
    return <Badge variant="destructive" className="bg-destructive/10 text-destructive border-transparent hover:bg-destructive/20">Critical</Badge>;
}

const TeamCard = ({ teamData }: { teamData: TeamCapacityData }) => {
    const buildPercentage = teamData.plannedBuild > 0 ? (teamData.deliveredBuild / teamData.plannedBuild) * 100 : 0;
    const runPercentage = teamData.plannedRun > 0 ? (teamData.deliveredRun / teamData.plannedRun) * 100 : 0;
    const totalPercentage = teamData.totalPlanned > 0 ? (teamData.totalDelivered / teamData.totalPlanned) * 100 : 0;
    const isOverCapacity = teamData.deliveredRun > teamData.plannedRun && teamData.plannedRun > 0;

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{teamData.team}</CardTitle>
                    {isOverCapacity && <AlertCircle className="w-4 h-4 text-warning" />}
                    </div>
                    {getStatusBadge(teamData.totalDelivered, teamData.totalPlanned)}
                </div>
            </CardHeader>
            <CardContent className="space-y-4 flex-grow">
                 {/* Overall Progress */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="font-medium">Overall Progress</span>
                        <span className="text-muted-foreground">
                            {teamData.totalDelivered.toFixed(1)}h / {teamData.totalPlanned.toFixed(1)}h
                        </span>
                    </div>
                    <Progress value={totalPercentage} className="h-3" />
                    <div className="text-xs text-muted-foreground text-right">{totalPercentage.toFixed(1)}% complete</div>
                </div>

                {/* Build Progress */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-primary"></div>
                            <span>Build</span>
                        </div>
                        <span className="text-muted-foreground">
                            {teamData.deliveredBuild.toFixed(1)}h / {teamData.plannedBuild.toFixed(1)}h
                        </span>
                    </div>
                    <Progress value={buildPercentage} className="h-2" indicatorClassName="bg-primary" />
                </div>

                {/* Run Progress */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-warning"></div>
                            <span>Run</span>
                             {isOverCapacity && (
                                <Badge variant="outline" className="text-xs border-amber-500 text-amber-500">
                                    Over capacity
                                </Badge>
                            )}
                        </div>
                        <span className="text-muted-foreground">
                            {teamData.deliveredRun.toFixed(1)}h / {teamData.plannedRun.toFixed(1)}h
                        </span>
                    </div>
                    <Progress value={runPercentage} className="h-2" indicatorClassName="bg-warning" />
                </div>

                {/* Buffer */}
                {teamData.deliveredBuffer > 0 && (
                    <div className="space-y-2 pt-1">
                        <div className="flex justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-success"></div>
                                <span>Buffer Delivered</span>
                            </div>
                            <span className="text-muted-foreground">{teamData.deliveredBuffer.toFixed(1)}h</span>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export function TeamCapacityCards({ sprint }: TeamCapacityCardsProps) {
  const capacityData = useMemo(() => {
    const teamsInSprint = (Object.keys(sprint.teamCapacity || {}) as Team[]).filter(t => t !== 'Out of Scope');

    return teamsInSprint.map(team => {
      const teamTickets = sprint.tickets.filter(t => t.scope === team)
      
      const plannedBuild = sprint.teamCapacity[team]?.plannedBuild ?? 0;
      const plannedRun = sprint.teamCapacity[team]?.plannedRun ?? 0;
      
      const deliveredBuild = teamTickets.filter(t => t.typeScope === 'Build' && t.status === 'Done').reduce((acc, t) => acc + t.estimation, 0)
      const deliveredRun = teamTickets.filter(t => t.typeScope === 'Run').reduce((acc, t) => acc + t.timeLogged, 0);
      const deliveredBuffer = teamTickets.filter(t => t.typeScope === 'Sprint').reduce((acc, t) => acc + t.timeLogged, 0);
      
      const totalPlanned = plannedBuild + plannedRun
      const totalDelivered = deliveredBuild + deliveredRun

      return { team, plannedBuild, deliveredBuild, plannedRun, deliveredRun, deliveredBuffer, totalPlanned, totalDelivered }
    })
  }, [sprint])

  const totals = useMemo(() => {
    return capacityData.reduce((acc, data) => {
        acc.plannedBuild += data.plannedBuild
        acc.deliveredBuild += data.deliveredBuild
        acc.plannedRun += data.plannedRun
        acc.deliveredRun += data.deliveredRun
        acc.deliveredBuffer += data.deliveredBuffer
        acc.totalPlanned += data.totalPlanned
        acc.totalDelivered += data.totalDelivered
        return acc
    }, { plannedBuild: 0, deliveredBuild: 0, plannedRun: 0, deliveredRun: 0, deliveredBuffer: 0, totalPlanned: 0, totalDelivered: 0 })
  }, [capacityData])

  const totalProgressPercentage = totals.totalPlanned > 0 ? (totals.totalDelivered / totals.totalPlanned) * 100 : 0;
  const buildProgressPercentage = totals.plannedBuild > 0 ? (totals.deliveredBuild / totals.plannedBuild) * 100 : 0;
  const runProgressPercentage = totals.plannedRun > 0 ? (totals.deliveredRun / totals.plannedRun) * 100 : 0;

  return (
     <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                    <Target className="w-5 h-5 text-primary" />
                    <div>
                        <div className="text-2xl font-bold">{totals.totalDelivered.toFixed(1)}h</div>
                        <div className="text-xs text-muted-foreground">Total Delivered</div>
                    </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-success" />
                    <div>
                        <div className="text-2xl font-bold">{totals.totalPlanned.toFixed(1)}h</div>
                        <div className="text-xs text-muted-foreground">Total Capacity</div>
                    </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                    <BarChart2 className="w-5 h-5 text-primary" />
                    <div>
                        <div className="text-2xl font-bold">{totalProgressPercentage.toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">Overall Progress</div>
                    </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-warning" />
                    <div>
                        <div className="text-2xl font-bold">{totals.deliveredBuffer.toFixed(1)}h</div>
                        <div className="text-xs text-muted-foreground">Buffer Delivered</div>
                    </div>
                    </div>
                </CardContent>
            </Card>
        </div>
        
        {/* Team Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {capacityData
                .filter((team) => team.totalPlanned > 0 || team.totalDelivered > 0 || team.deliveredBuffer > 0)
                .map((team) => (
                <TeamCard key={team.team} teamData={team} />
            ))}
        </div>

        {/* Overall Summary */}
        <Card>
            <CardHeader>
            <CardTitle>Sprint Summary</CardTitle>
            </CardHeader>
            <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="font-medium">Build Work</span>
                        <span>
                        {totals.deliveredBuild.toFixed(1)}h / {totals.plannedBuild.toFixed(1)}h
                        </span>
                    </div>
                    <Progress value={buildProgressPercentage} className="h-3" />
                    <div className="text-xs text-muted-foreground">
                        {buildProgressPercentage.toFixed(1)}% complete
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="font-medium">Run Work</span>
                        <span>
                        {totals.deliveredRun.toFixed(1)}h / {totals.plannedRun.toFixed(1)}h
                        </span>
                    </div>
                    <Progress value={runProgressPercentage} className="h-3" indicatorClassName="bg-warning" />
                    <div className="text-xs text-muted-foreground">
                        {runProgressPercentage.toFixed(1)}% complete
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="font-medium">Total Progress</span>
                        <span>
                        {totals.totalDelivered.toFixed(1)}h / {totals.totalPlanned.toFixed(1)}h
                        </span>
                    </div>
                    <Progress value={totalProgressPercentage} className="h-3" indicatorClassName="bg-success" />
                    <div className="text-xs text-muted-foreground">
                        {totalProgressPercentage.toFixed(1)}% complete
                    </div>
                </div>
            </div>
            </CardContent>
        </Card>
    </div>
  )
}
