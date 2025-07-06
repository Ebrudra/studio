"use client"

import * as React from "react"
import { Bar, AreaChart, Area, ComposedChart, Line, LineChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { TrendingUp, TrendingDown, Target, Clock, Users, Download, Filter } from "lucide-react"

import type { Sprint, Team } from "@/types"
import type { DailyProgressData } from "./team-daily-progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { teams as allTeams } from "@/lib/data"

interface SprintChartsProps {
  sprint: Sprint
  allSprints: Sprint[]
  dailyProgress: DailyProgressData[]
}

type ScopeFilter = "total" | "build" | "run"

export function SprintCharts({ sprint, allSprints, dailyProgress }: SprintChartsProps) {
  const [selectedTeam, setSelectedTeam] = React.useState<Team | "all-teams">("all-teams")
  const [burndownType, setBurndownType] = React.useState<ScopeFilter>("total")
  const [showProjection, setShowProjection] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState("burndown")
  const today = React.useMemo(() => new Date().toISOString().split('T')[0], [])

  const teamsInSprint = React.useMemo(() => ["all-teams", ...Array.from(new Set(sprint.tickets.map(t => t.scope)))], [sprint.tickets])

  const burndownData = React.useMemo(() => {
    if (!sprint.sprintDays || sprint.sprintDays.length === 0) return []

    const sprintDurationInDays = sprint.sprintDays.length

    let filteredTickets = sprint.tickets
    if (selectedTeam !== "all-teams") {
      filteredTickets = filteredTickets.filter(t => t.scope === selectedTeam)
    }

    const sprintStartDate = sprint.sprintDays[0]?.date
    if (!sprintStartDate) return []

    const calculateScope = (type: 'total' | 'build' | 'run' | 'sprint') => {
        let tickets = filteredTickets.filter(t => !t.creationDate || t.creationDate <= sprintStartDate)
        if (type !== 'total') {
            tickets = tickets.filter(t => t.typeScope.toLowerCase() === type)
        } else {
            tickets = tickets.filter(t => t.typeScope !== 'Sprint')
        }
        return tickets.reduce((acc, t) => acc + t.estimation, 0)
    }

    const initialScope = calculateScope('total')
    const initialBuildScope = calculateScope('build')
    const initialRunScope = calculateScope('run')
    
    const idealBurnPerDay = initialScope / (sprintDurationInDays > 1 ? sprintDurationInDays - 1 : 1)
    const idealBuildBurnPerDay = initialBuildScope / (sprintDurationInDays > 1 ? sprintDurationInDays - 1 : 1)
    const idealRunBurnPerDay = initialRunScope / (sprintDurationInDays > 1 ? sprintDurationInDays - 1 : 1)

    const dailyDelta = new Map<string, { newScope: number; newBuildScope: number; newRunScope: number; loggedHours: number; loggedBuild: number; loggedRun: number }>()
    sprint.sprintDays.forEach(day => {
        dailyDelta.set(day.date, { newScope: 0, newBuildScope: 0, newRunScope: 0, loggedHours: 0, loggedBuild: 0, loggedRun: 0 })
    })

    for (const ticket of filteredTickets) {
        const isBuild = ticket.typeScope === 'Build';
        const isRun = ticket.typeScope === 'Run';
        
        if (ticket.creationDate && ticket.creationDate > sprintStartDate) {
            const delta = dailyDelta.get(ticket.creationDate)
            if (delta) {
                if(isBuild || isRun) delta.newScope += ticket.estimation
                if(isBuild) delta.newBuildScope += ticket.estimation
                if(isRun) delta.newRunScope += ticket.estimation
            }
        }

        if (ticket.dailyLogs) {
            for (const log of ticket.dailyLogs) {
                const delta = dailyDelta.get(log.date)
                if (delta) {
                    if(isBuild || isRun) delta.loggedHours += log.loggedHours
                    if(isBuild) delta.loggedBuild += log.loggedHours
                    if(isRun) delta.loggedRun += log.loggedHours
                }
            }
        }
    }

    let cumulativeLogged = 0
    let cumulativeLoggedBuild = 0
    let cumulativeLoggedRun = 0
    let cumulativeNewScope = 0
    let cumulativeNewBuildScope = 0
    let cumulativeNewRunScope = 0

    const processedData = sprint.sprintDays.map((dayData, index) => {
        const delta = dailyDelta.get(dayData.date) || { newScope: 0, newBuildScope: 0, newRunScope: 0, loggedHours: 0, loggedBuild: 0, loggedRun: 0 }
        
        cumulativeLogged += delta.loggedHours
        cumulativeLoggedBuild += delta.loggedBuild
        cumulativeLoggedRun += delta.loggedRun
        
        if (index > 0) {
            const yesterdayDelta = dailyDelta.get(sprint.sprintDays[index - 1].date)
            cumulativeNewScope += yesterdayDelta?.newScope || 0
            cumulativeNewBuildScope += yesterdayDelta?.newBuildScope || 0
            cumulativeNewRunScope += yesterdayDelta?.newRunScope || 0
        }
        
        const remainingScope = initialScope + cumulativeNewScope - cumulativeLogged
        const remainingBuild = initialBuildScope + cumulativeNewBuildScope - cumulativeLoggedBuild
        const remainingRun = initialRunScope + cumulativeNewRunScope - cumulativeLoggedRun
        
        const idealBurn = parseFloat((initialScope - index * idealBurnPerDay).toFixed(2))

        return {
            day: `Day ${dayData.day}`,
            ideal: idealBurn < 0 ? 0 : idealBurn,
            actual: remainingScope < 0 ? 0 : remainingScope,
            build: remainingBuild < 0 ? 0 : remainingBuild,
            run: remainingRun < 0 ? 0 : remainingRun,
            date: dayData.date
        }
    })

    if (!showProjection) {
        return processedData.filter(d => d.date <= today)
    }
    return processedData
  }, [sprint, selectedTeam, showProjection, today])

  const velocityData = React.useMemo(() => {
    return allSprints
        .filter(s => s.status === 'Completed' || s.id === sprint.id)
        .sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
        .slice(-5) // last 5 sprints
        .map(s => {
            const buildTickets = s.tickets.filter(t => t.typeScope === 'Build');
            const planned = s.buildCapacity || 0;
            const completed = buildTickets.filter(t => t.status === 'Done').reduce((acc, t) => acc + t.estimation, 0);
            const duration = s.sprintDays?.length || 1;
            const velocity = completed / duration;
            return { sprint: s.name.split('(')[0].trim(), planned, completed, velocity: parseFloat(velocity.toFixed(1)) };
        });
  }, [allSprints, sprint.id]);
  
  const teamPerformanceData = React.useMemo(() => {
    return allTeams
        .filter(team => sprint.teamCapacity?.[team as Team] && sprint.teamCapacity[team as Team].plannedBuild > 0)
        .map(team => {
            const teamTickets = sprint.tickets.filter(t => t.scope === team)
            const capacity = sprint.teamCapacity[team as Team]
            
            const planned = capacity.plannedBuild + capacity.plannedRun
            const completed = teamTickets.filter(t=>t.status==='Done').reduce((acc, t) => acc + t.estimation, 0)
            const efficiency = planned > 0 ? (completed / planned) * 100 : 0
            const duration = sprint.sprintDays?.length || 1;
            const velocity = completed / duration;
            
            return { team, planned, completed, efficiency: parseFloat(efficiency.toFixed(1)), velocity: parseFloat(velocity.toFixed(1)) }
        })
  }, [sprint])
  
  const dailyVelocityData = React.useMemo(() => {
    return dailyProgress.map(day => {
        let record: any = { day: `D${day.day}` };
        let total = 0;
        for(const team of allTeams) {
            const progress = day.progress[team];
            if(progress) {
                const teamTotal = progress.build + progress.run + progress.buffer;
                record[team.toLowerCase()] = teamTotal;
                total += teamTotal;
            }
        }
        record.total = total;
        return record;
    }).filter(d => d.total > 0);
  }, [dailyProgress])
  
  const distributionData = React.useMemo(() => {
    const scopeData: Record<string, number> = { Build: 0, Run: 0, Sprint: 0 }
    const workData: Record<string, number> = { Build: 0, Run: 0, Sprint: 0 }
    sprint.tickets.forEach(ticket => {
        scopeData[ticket.typeScope] += ticket.estimation
        workData[ticket.typeScope] += ticket.timeLogged
    })
    
    const totalScope = Object.values(scopeData).reduce((s, v) => s + v, 0)
    const totalWork = Object.values(workData).reduce((s, v) => s + v, 0)
    
    const scopeDistribution = Object.entries(scopeData).map(([name, value]) => ({ name, value, total: totalScope, percent: totalScope > 0 ? (value / totalScope) * 100 : 0 }))
    const workDistribution = Object.entries(workData).map(([name, value]) => ({ name, value, total: totalWork, percent: totalWork > 0 ? (value / totalWork) * 100 : 0 }))
    
    return { scope: scopeDistribution, work: workDistribution, totalScope, totalWork }
  }, [sprint.tickets]);


  const getBurndownKey = () => {
    switch(burndownType) {
        case "build": return "build";
        case "run": return "run";
        default: return "actual";
    }
  }

  const getBurndownName = () => {
    switch(burndownType) {
        case "build": return "Build Work";
        case "run": return "Run Work";
        default: return "Actual Burn";
    }
  }
  
  const COLORS: Record<string, string> = {
    Build: "hsl(var(--chart-1))",
    Run: "hsl(var(--chart-2))",
    Sprint: "hsl(var(--chart-3))",
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-full max-w-md grid-cols-4">
            <TabsTrigger value="burndown">Burndown</TabsTrigger>
            <TabsTrigger value="velocity">Velocity</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
            <Button variant="outline" size="sm" disabled>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <TabsContent value="burndown" className="space-y-4">
          <Card>
            <CardHeader className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Sprint Burndown Chart</CardTitle>
                  <p className="text-sm text-muted-foreground">Track remaining work over sprint duration</p>
                </div>
                <Select value={selectedTeam} onValueChange={(v) => setSelectedTeam(v as any)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-teams">All Teams</SelectItem>
                    {teamsInSprint.filter(t => t !== 'all-teams').map(team => (
                        <SelectItem key={team as string} value={team as string}>{team}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <RadioGroup value={burndownType} onValueChange={(v) => setBurndownType(v as any)} className="flex items-center gap-6">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="total" id="total" />
                    <Label htmlFor="total">Total</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="build" id="build" />
                    <Label htmlFor="build">Build</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="run" id="run" />
                    <Label htmlFor="run">Run</Label>
                  </div>
                </RadioGroup>

                <div className="flex items-center space-x-2">
                  <Checkbox id="projection" checked={showProjection} onCheckedChange={(v) => setShowProjection(!!v)} />
                  <Label htmlFor="projection">Show Projection</Label>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <ChartContainer
                config={{
                  ideal: { label: "Ideal Burn", color: "hsl(var(--muted-foreground))" },
                  actual: { label: "Actual Burn", color: "hsl(var(--primary))" },
                  build: { label: "Build Work", color: "hsl(var(--primary))" },
                  run: { label: "Run Work", color: "hsl(var(--chart-2))" },
                }}
                className="h-[400px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={burndownData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis
                      label={{ value: "Hours Remaining", angle: -90, position: "insideLeft", fill: "hsl(var(--foreground))" }}
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="ideal" stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" strokeWidth={2} name="Ideal Burn" dot={false} />
                    <Line type="monotone" dataKey={getBurndownKey()} stroke={burndownType === 'run' ? "hsl(var(--chart-2))" : "hsl(var(--primary))"} strokeWidth={3} name={getBurndownName()} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="velocity" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sprint Velocity Trend</CardTitle>
                <p className="text-sm text-muted-foreground">Velocity over last 5 sprints</p>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    planned: { label: "Planned", color: "hsl(var(--secondary))" },
                    completed: { label: "Completed", color: "hsl(var(--primary))" },
                    velocity: { label: "Velocity", color: "hsl(var(--success))" },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={velocityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="sprint" fontSize={12} />
                      <YAxis yAxisId="left" fontSize={12} />
                      <YAxis yAxisId="right" orientation="right" fontSize={12} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar yAxisId="left" dataKey="planned" fill="var(--color-planned)" name="Planned" />
                      <Bar yAxisId="left" dataKey="completed" fill="var(--color-completed)" name="Completed" />
                      <Line yAxisId="right" type="monotone" dataKey="velocity" stroke="var(--color-velocity)" strokeWidth={3} name="Velocity" dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Daily Velocity</CardTitle>
                <p className="text-sm text-muted-foreground">Hours completed per day by team</p>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    backend: { label: "Backend", color: "hsl(var(--chart-1))" },
                    ios: { label: "iOS", color: "hsl(var(--chart-2))" },
                    web: { label: "Web", color: "hsl(var(--chart-3))" },
                    android: { label: "Android", color: "hsl(var(--chart-4))" },
                    mobile: { label: "Mobile", color: "hsl(var(--chart-5))" },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyVelocityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" fontSize={12} />
                      <YAxis fontSize={12} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      {allTeams.map(team => (
                          <Area key={team} type="monotone" dataKey={team.toLowerCase()} stackId="1" stroke={`var(--color-${team.toLowerCase()})`} fill={`var(--color-${team.toLowerCase()})`} />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="teams" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Performance Analysis</CardTitle>
              <p className="text-sm text-muted-foreground">Efficiency and velocity by team</p>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  planned: { label: "Planned", color: "hsl(var(--secondary))" },
                  completed: { label: "Completed", color: "hsl(var(--primary))" },
                  efficiency: { label: "Efficiency %", color: "hsl(var(--success))" },
                }}
                className="h-[400px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={teamPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="team" fontSize={12} />
                    <YAxis yAxisId="left" fontSize={12} />
                    <YAxis yAxisId="right" orientation="right" fontSize={12} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar yAxisId="left" dataKey="planned" fill="var(--color-planned)" name="Planned Hours" />
                    <Bar yAxisId="left" dataKey="completed" fill="var(--color-completed)" name="Completed Hours" />
                    <Line yAxisId="right" type="monotone" dataKey="efficiency" stroke="var(--color-efficiency)" strokeWidth={3} name="Efficiency %" dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Scope Distribution</CardTitle>
                <p className="text-sm text-muted-foreground">{distributionData.totalScope.toFixed(1)}h Total Scope</p>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center mb-6">
                  <ChartContainer config={COLORS} className="h-[250px] w-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={distributionData.scope} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {distributionData.scope.map((entry) => ( <Cell key={entry.name} fill={COLORS[entry.name]} /> ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
                <div className="space-y-3">
                  {distributionData.scope.map((item) => (
                    <div key={item.name} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS[item.name] }} />
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{item.value.toFixed(1)}h</div>
                        <div className="text-sm text-muted-foreground">{item.percent.toFixed(1)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Work Distribution</CardTitle>
                <p className="text-sm text-muted-foreground">{distributionData.totalWork.toFixed(1)}h Total Logged</p>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center mb-6">
                   <ChartContainer config={COLORS} className="h-[250px] w-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={distributionData.work} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {distributionData.work.map((entry) => ( <Cell key={entry.name} fill={COLORS[entry.name]} /> ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
                <div className="space-y-3">
                  {distributionData.work.map((item) => (
                    <div key={item.name} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS[item.name] }} />
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{item.value.toFixed(1)}h</div>
                        <div className="text-sm text-muted-foreground">{item.percent.toFixed(1)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
