
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
import { AlertTriangle, TrendingUp, Clock, LayoutGrid, List, Download, ChevronDown, ChevronUp } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { format } from "date-fns"
import html2canvas from "html2canvas"

export interface DailyProgressData {
  day: number;
  date: string;
  progress: Record<Team, { build: number; run: number; buffer: number }>;
}

interface TeamDailyProgressProps {
  dailyProgress: DailyProgressData[];
}

// Internal component for the List View (Table)
const TeamDailyProgressList = ({ dailyProgress }: TeamDailyProgressProps) => {
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
        return allTeams.filter(t => teamSet.has(t.value));
      }, [dailyProgress]);

      const totals = React.useMemo(() => {
        const teamTotals: Record<string, { build: number; run: number; buffer: number; total: number }> = allTeams.reduce((acc, team) => ({ ...acc, [team.value]: { build: 0, run: 0, buffer: 0, total: 0 } }), {} as any);
        let grandTotalBuild = 0;
        let grandTotalRun = 0;
        let grandTotalBuffer = 0;
        let grandTotal = 0;

        if (dailyProgress) {
            dailyProgress.forEach(day => {
                allTeams.forEach(team => {
                    const { build, run, buffer } = day.progress[team.value] || { build: 0, run: 0, buffer: 0 };
                    teamTotals[team.value].build += build;
                    teamTotals[team.value].run += run;
                    teamTotals[team.value].buffer += buffer;
                    teamTotals[team.value].total += (build + run + buffer);
                });
            });
        }
        
        grandTotalBuild = Object.values(teamTotals).reduce((sum, totals) => sum + totals.build, 0);
        grandTotalRun = Object.values(teamTotals).reduce((sum, totals) => sum + totals.run, 0);
        grandTotalBuffer = Object.values(teamTotals).reduce((sum, totals) => sum + totals.buffer, 0);
        grandTotal = grandTotalBuild + grandTotalRun + grandTotalBuffer;

        return { teamTotals, grandTotalBuild, grandTotalRun, grandTotalBuffer, grandTotal };
    }, [dailyProgress]);
    
    return (
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[50px] sticky left-0 bg-card z-10">Day</TableHead>
              {activeTeams.map(team => (
                <TableHead key={team.value} colSpan={4} className="text-center min-w-[300px] border-l">{team.label}</TableHead>
              ))}
               <TableHead colSpan={4} className="text-center font-bold min-w-[300px] border-l">Daily Totals</TableHead>
            </TableRow>
             <TableRow className="text-xs text-muted-foreground">
                <TableHead className="sticky left-0 bg-card z-10"></TableHead>
                {activeTeams.map(team => (
                    <React.Fragment key={team.value}>
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
                const dailyTotalBuild = activeTeams.reduce((sum, team) => sum + (day.progress[team.value]?.build || 0), 0);
                const dailyTotalRun = activeTeams.reduce((sum, team) => sum + (day.progress[team.value]?.run || 0), 0);
                const dailyTotalBuffer = activeTeams.reduce((sum, team) => sum + (day.progress[team.value]?.buffer || 0), 0);
                const dailyGrandTotal = dailyTotalBuild + dailyTotalRun + dailyTotalBuffer;

                if (dailyGrandTotal === 0) return null;

              return (
                 <TableRow key={day.day}>
                    <TableCell className="font-medium sticky left-0 bg-card z-10">D{day.day}</TableCell>
                    {activeTeams.map(team => {
                        const teamProgress = day.progress[team.value] || { build: 0, run: 0, buffer: 0 };
                        const teamDailyTotal = teamProgress.build + teamProgress.run + teamProgress.buffer;
                        const showWarning = teamDailyTotal > 0 && teamDailyTotal < 8;
                        return (
                            <React.Fragment key={team.value}>
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
                <React.Fragment key={team.value}>
                    <TableCell className="text-right border-l">
                        {totals.teamTotals[team.value].build > 0 ? totals.teamTotals[team.value].build.toFixed(1) : ""}
                    </TableCell>
                     <TableCell className="text-right">
                        {totals.teamTotals[team.value].run > 0 ? totals.teamTotals[team.value].run.toFixed(1) : ""}
                    </TableCell>
                    <TableCell className="text-right">
                        {totals.teamTotals[team.value].buffer > 0 ? totals.teamTotals[team.value].buffer.toFixed(1) : ""}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                        {totals.teamTotals[team.value].total > 0 ? totals.teamTotals[team.value].total.toFixed(1) : ""}
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
      </div>
    )
}

// Internal component for the Grid View
const TeamDailyProgressGrid = ({ dailyProgress }: TeamDailyProgressProps) => {
    const [showDetails, setShowDetails] = React.useState(false);

    const activeTeams = React.useMemo(() => {
        const teamSet = new Set<Team>();
        dailyProgress.forEach(day => {
            Object.keys(day.progress).forEach(team => {
                if (day.progress[team as Team].build > 0 || day.progress[team as Team].run > 0 || day.progress[team as Team].buffer > 0) {
                    teamSet.add(team as Team);
                }
            });
        });
        return allTeams.filter(t => teamSet.has(t.value));
    }, [dailyProgress]);
    
    const totalSummary = React.useMemo(() => {
        const teamTotals: Record<Team, { build: number, run: number, buffer: number, total: number }> = {} as any;
        const dailyTotals = { build: 0, run: 0, buffer: 0, total: 0 };

        allTeams.forEach(team => {
          teamTotals[team.value] = { build: 0, run: 0, buffer: 0, total: 0 };
        });
    
        dailyProgress.forEach(day => {
          allTeams.forEach(team => {
            const p = day.progress[team.value];
            if (p) {
              teamTotals[team.value].build += p.build;
              teamTotals[team.value].run += p.run;
              teamTotals[team.value].buffer += p.buffer;
              teamTotals[team.value].total += (p.build + p.run + p.buffer);
            }
          });
        });
    
        dailyTotals.build = Object.values(teamTotals).reduce((sum, team) => sum + team.build, 0);
        dailyTotals.run = Object.values(teamTotals).reduce((sum, team) => sum + team.run, 0);
        dailyTotals.buffer = Object.values(teamTotals).reduce((sum, team) => sum + team.buffer, 0);
        dailyTotals.total = Object.values(teamTotals).reduce((sum, team) => sum + team.total, 0);
    
        return { teams: teamTotals, dailyTotals };
    }, [dailyProgress]);


    const teamColors: Record<string, { bg: string, border: string, text: string }> = {
        backend: { bg: "bg-blue-100", border: "border-blue-200", text: "text-blue-800" },
        ios: { bg: "bg-purple-100", border: "border-purple-200", text: "text-purple-800" },
        web: { bg: "bg-green-100", border: "border-green-200", text: "text-green-800" },
        android: { bg: "bg-orange-100", border: "border-orange-200", text: "text-orange-800" },
        mobile: { bg: "bg-pink-100", border: "border-pink-200", text: "text-pink-800" },
        "out of scope": { bg: "bg-gray-100", border: "border-gray-200", text: "text-gray-800" },
    }

    const TeamProgressCard = ({ team, teamName, data }: { team: Team, teamName: string; data: { build: number, run: number, buffer: number, total: number, warning: boolean } }) => {
        const teamKey = teamName.toLowerCase();
        const colors = teamColors[teamKey] || teamColors["out of scope"];
        const hasWarning = data.warning
        const totalHours = data.total || 0
    
        return (
          <div className={`p-3 rounded-lg border ${colors.border} ${colors.bg}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${colors.text}`}>{teamName}</span>
                {hasWarning && <AlertTriangle className="w-4 h-4 text-amber-500" />}
              </div>
              <Badge variant="outline" className="text-xs">{totalHours.toFixed(1)}h</Badge>
            </div>
    
            {totalHours > 0 && (
              <div className="space-y-1">
                {data.build > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-xs text-gray-600">Build: {data.build.toFixed(1)}h</span>
                  </div>
                )}
                {data.run > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                    <span className="text-xs text-gray-600">Run: {data.run.toFixed(1)}h</span>
                  </div>
                )}
                {data.buffer > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-xs text-gray-600">Buffer: {data.buffer.toFixed(1)}h</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )
    }

    const DayCard = ({ dayData }: { dayData: DailyProgressData }) => {
        const dailyTotalBuild = activeTeams.reduce((sum, team) => sum + (dayData.progress[team.value]?.build || 0), 0);
        const dailyTotalRun = activeTeams.reduce((sum, team) => sum + (dayData.progress[team.value]?.run || 0), 0);
        const dailyTotalBuffer = activeTeams.reduce((sum, team) => sum + (dayData.progress[team.value]?.buffer || 0), 0);
        const totalHours = dailyTotalBuild + dailyTotalRun + dailyTotalBuffer;

        return (
            <Card className="w-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">D{dayData.day}</CardTitle>
                  <p className="text-sm text-gray-500">{format(new Date(dayData.date), "MMM dd")}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{totalHours.toFixed(1)}h</div>
                  <div className="text-xs text-gray-500">Total logged</div>
                </div>
              </div>
            </CardHeader>
    
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Work Distribution</span>
                </div>
                <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-gray-100">
                  {dailyTotalBuild > 0 && (
                    <div className="bg-blue-500" style={{ width: `${(dailyTotalBuild / totalHours) * 100}%` }} title={`Build: ${dailyTotalBuild.toFixed(1)}h`} />
                  )}
                  {dailyTotalRun > 0 && (
                    <div className="bg-orange-500" style={{ width: `${(dailyTotalRun / totalHours) * 100}%` }} title={`Run: ${dailyTotalRun.toFixed(1)}h`} />
                  )}
                  {dailyTotalBuffer > 0 && (
                    <div className="bg-green-500" style={{ width: `${(dailyTotalBuffer / totalHours) * 100}%` }} title={`Buffer: ${dailyTotalBuffer.toFixed(1)}h`} />
                  )}
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Build: {dailyTotalBuild.toFixed(1)}h</span>
                  <span>Run: {dailyTotalRun.toFixed(1)}h</span>
                  <span>Buffer: {dailyTotalBuffer.toFixed(1)}h</span>
                </div>
              </div>
    
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700">Team Progress</div>
                <div className="grid grid-cols-2 gap-2">
                  {activeTeams.map(team => {
                    const teamProgress = dayData.progress[team.value] || { build: 0, run: 0, buffer: 0 };
                    const teamDailyTotal = teamProgress.build + teamProgress.run + teamProgress.buffer;
                    if (teamDailyTotal === 0) return null;
                    return <TeamProgressCard 
                        key={team.value} 
                        team={team.value} 
                        teamName={team.label} 
                        data={{...teamProgress, total: teamDailyTotal, warning: teamDailyTotal > 0 && teamDailyTotal < 8}} />
                    })}
                </div>
              </div>
            </CardContent>
          </Card>
        )
    }

    const TotalSummaryCard = () => {
        const { teams: teamTotals, dailyTotals } = totalSummary;
        return (
            <Card className="border-2 border-blue-200 bg-blue-50 col-span-1 lg:col-span-2 xl:col-span-3">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg text-blue-800">Total</CardTitle>
                    <p className="text-sm text-blue-600">Sprint Summary</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-800">{dailyTotals.total.toFixed(1)}h</div>
                    <div className="text-xs text-blue-600">Total logged</div>
                  </div>
                </div>
              </CardHeader>
    
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-blue-700">Work Distribution</span>
                  </div>
                  <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-blue-100">
                    <div className="bg-blue-500" style={{ width: `${(dailyTotals.build / dailyTotals.total) * 100}%` }} title={`Build: ${dailyTotals.build.toFixed(1)}h`} />
                    <div className="bg-orange-500" style={{ width: `${(dailyTotals.run / dailyTotals.total) * 100}%` }} title={`Run: ${dailyTotals.run.toFixed(1)}h`} />
                    <div className="bg-green-500" style={{ width: `${(dailyTotals.buffer / dailyTotals.total) * 100}%` }} title={`Buffer: ${dailyTotals.buffer.toFixed(1)}h`} />
                  </div>
                  <div className="flex justify-between text-xs text-blue-600">
                    <span>Build: {dailyTotals.build.toFixed(1)}h</span>
                    <span>Run: {dailyTotals.run.toFixed(1)}h</span>
                    <span>Buffer: {dailyTotals.buffer.toFixed(1)}h</span>
                  </div>
                </div>
    
                <div className="space-y-2">
                  <div className="text-sm font-medium text-blue-700">Team Totals</div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {activeTeams.map(team => {
                         const teamData = teamTotals[team.value];
                         if (!teamData || teamData.total === 0) return null;
                         return <TeamProgressCard key={team.value} team={team.value} teamName={team.label} data={{...teamData, warning: false}}/>
                    })}
                  </div>
                </div>

                <div className="pt-2 border-t">
                    <Button variant="ghost" onClick={() => setShowDetails(!showDetails)} className="w-full">
                        {showDetails ? <ChevronUp className="w-4 h-4 mr-2" /> : <ChevronDown className="w-4 h-4 mr-2" />}
                        {showDetails ? "Hide Daily Details" : "Show Daily Details"}
                    </Button>
                </div>
              </CardContent>
            </Card>
        )
    }

    const activeDays = dailyProgress.filter(day => {
        const total = activeTeams.reduce((sum, team) => sum + (day.progress[team.value]?.build || 0) + (day.progress[team.value]?.run || 0) + (day.progress[team.value]?.buffer || 0), 0);
        return total > 0;
    });

    return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            <TotalSummaryCard />
            {showDetails && activeDays.map((dayData) => (
              <DayCard key={dayData.day} dayData={dayData} />
            ))}
          </div>

          <Card>
            <CardContent className="p-4">
                <div className="flex items-center justify-center gap-6 text-sm">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div><span>Build Hours</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-500"></div><span>Run Hours</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500"></div><span>Buffer Hours</span></div>
                    <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" /><span>Capacity Issues</span></div>
                </div>
            </CardContent>
          </Card>
        </div>
      )
}


export function TeamDailyProgress({ dailyProgress }: TeamDailyProgressProps) {
  const [viewMode, setViewMode] = React.useState<'list' | 'grid'>('list');
  const exportRef = React.useRef<HTMLDivElement>(null);
  
  const hasProgress = dailyProgress && dailyProgress.some(d => {
    return Object.values(d.progress).some(p => p.build > 0 || p.run > 0 || p.buffer > 0);
  });
  
  const handleExport = () => {
    if (exportRef.current) {
        html2canvas(exportRef.current, { scale: 2 }).then(canvas => {
            const link = document.createElement('a');
            link.download = 'daily-progress.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    }
  };

  if (!hasProgress) {
      return null;
  }

  return (
    <Card ref={exportRef}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Team Daily Progress</CardTitle>
            <p className="text-sm text-muted-foreground">
              {viewMode === 'grid' 
                  ? "Build/Run/Buffer hours breakdown by day and team." 
                  : "A table view of daily logged hours per team."}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export
            </Button>
            <Button
                onClick={() => setViewMode('list')}
                variant={viewMode === 'list' ? 'default' : 'secondary'}
                size="icon"
            >
                <List className="h-4 w-4" />
                <span className="sr-only">List View</span>
            </Button>
            <Button
                onClick={() => setViewMode('grid')}
                variant={viewMode === 'grid' ? 'default' : 'secondary'}
                size="icon"
            >
                <LayoutGrid className="h-4 w-4" />
                <span className="sr-only">Grid View</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === 'grid' ? <TeamDailyProgressGrid dailyProgress={dailyProgress} /> : <TeamDailyProgressList dailyProgress={dailyProgress} />}
      </CardContent>
    </Card>
  )
}
