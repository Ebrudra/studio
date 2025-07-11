
"use client"

import * as React from "react"
import { useSearchParams } from 'next/navigation'
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"
import Papa from "papaparse"
import { Bar, AreaChart, Area, ComposedChart, Line, LineChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip } from "recharts"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Download, FileText, AlertCircle, Brain, Target, CheckCircle, Zap, Users, Clock, Award, AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table"

import type { Sprint, Team, Ticket, TicketStatus } from "@/types"
import { generateSprintReport } from "@/ai/flows/sprint-report-flow"
import { MarkdownRenderer } from "@/components/report/markdown-renderer"
import { AIInsights } from "@/components/report/ai-insights"
import { platforms as allTeams } from "@/components/dashboard/data"
import { getSprintWithReport, saveReport, getSprints } from "@/actions/sprints"


export default function ReportClientPage() {
  const searchParams = useSearchParams()
  const sprintId = searchParams.get('sprintId')
  const reportRef = React.useRef<HTMLDivElement>(null)

  const [sprint, setSprint] = React.useState<Sprint | null>(null)
  const [allSprints, setAllSprints] = React.useState<Sprint[]>([])
  const [reportContent, setReportContent] = React.useState<string>("")
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string>("")
  const [generatedAt, setGeneratedAt] = React.useState<Date | null>(null)

  React.useEffect(() => {
    // This effect runs only on the client, after the initial render.
    // This avoids hydration mismatch errors.
    setGeneratedAt(new Date());
  }, []);

  const generateReport = React.useCallback(async (currentSprint: Sprint, sprints: Sprint[]) => {
    if (!sprintId) return;
    setIsLoading(true)
    setError("")
    try {
      const result = await generateSprintReport({ sprint: currentSprint, allSprints: sprints })
      const { updatedSprint, reportContent: newReportContent } = await saveReport(currentSprint.id, result.report);
      
      setSprint(updatedSprint);
      setReportContent(newReportContent);
      setGeneratedAt(new Date());

    } catch (e: any) {
      setError(`Failed to generate AI report: ${e.message}`)
    } finally {
      setIsLoading(false)
    }
  }, [sprintId]);

  React.useEffect(() => {
    if (!sprintId) {
      setError("No sprint ID provided.")
      setIsLoading(false)
      return
    }

    const fetchReportData = async () => {
        try {
            const allSprintsData = await getSprints();
            setAllSprints(allSprintsData);

            const { sprint: currentSprint, reportContent: currentReportContent } = await getSprintWithReport(sprintId);

            if (currentSprint) {
                setSprint(currentSprint);
                if (currentReportContent) {
                    setReportContent(currentReportContent);
                    setIsLoading(false);
                } else {
                    await generateReport(currentSprint, allSprintsData);
                }
            } else {
                setError(`Sprint with ID "${sprintId}" not found.`)
                setIsLoading(false)
            }
        } catch (e) {
            setError("Failed to load sprint data.")
            setIsLoading(false)
        }
    }
    
    fetchReportData();
  }, [sprintId, generateReport])

  const reportData = React.useMemo(() => {
    if (!sprint) return null

    // BDC Data Calculation
    const sprintStartDate = sprint.sprintDays[0]?.date
    const initialTickets = sprint.tickets.filter(t => t.isInitialScope);
    const initialScope = initialTickets.filter(t => t.typeScope !== 'Sprint').reduce((acc, t) => acc + t.estimation, 0)
    const initialBuildScope = initialTickets.filter(t => t.typeScope === 'Build').reduce((acc, t) => acc + t.estimation, 0)
    const initialRunScope = initialTickets.filter(t => t.typeScope === 'Run').reduce((acc, t) => acc + t.estimation, 0)
    
    const dailyDelta = new Map<string, { newScope: number; newBuildScope: number; newRunScope: number; loggedHours: number; loggedBuild: number; loggedRun: number }>()
    sprint.sprintDays.forEach(day => {
        dailyDelta.set(day.date, { newScope: 0, newBuildScope: 0, newRunScope: 0, loggedHours: 0, loggedBuild: 0, loggedRun: 0 })
    })

    for (const ticket of sprint.tickets) {
        const isBuild = ticket.typeScope === 'Build';
        const isRun = ticket.typeScope === 'Run';
        
        if (!ticket.isInitialScope && ticket.creationDate) {
            const delta = dailyDelta.get(ticket.creationDate)
            if (delta) {
                if(isBuild || isRun) delta.newScope += ticket.estimation
                if(isBuild) delta.newBuildScope += ticket.estimation
                if(isRun) delta.newRunScope += ticket.estimation
            }
        }

        if (ticket.dailyLogs) {
            for (const log of ticket.dailyLogs) {
                if (allTeams.some(t => t.value === ticket.platform)) {
                    const delta = dailyDelta.get(log.date)
                    if (delta) {
                        if(isBuild || isRun) delta.loggedHours += log.loggedHours
                        if(isBuild) delta.loggedBuild += log.loggedHours
                        if(isRun) delta.loggedRun += log.loggedHours
                    }
                }
            }
        }
    }

    const sprintDurationInDays = sprint.sprintDays.length
    const idealBurnPerDay = sprintDurationInDays > 0 ? initialScope / sprintDurationInDays : 0
    let remainingActual = initialScope;
    let remainingBuild = initialBuildScope;
    let remainingRun = initialRunScope;
    
    const dailyBdcData = sprint.sprintDays.map((dayData, index) => {
        const delta = dailyDelta.get(dayData.date) || { newScope: 0, newBuildScope: 0, newRunScope: 0, loggedHours: 0, loggedBuild: 0, loggedRun: 0 };
        remainingActual += delta.newScope - delta.loggedHours;
        remainingBuild += delta.newBuildScope - delta.loggedBuild;
        remainingRun += delta.newRunScope - delta.loggedRun;
        const idealBurn = parseFloat((initialScope - (index + 1) * idealBurnPerDay).toFixed(2));
        return {
            day: `D${dayData.day}`,
            ideal: idealBurn < 0 ? 0 : idealBurn,
            actual: remainingActual < 0 ? 0 : remainingActual,
            build: remainingBuild < 0 ? 0 : remainingBuild,
            run: remainingRun < 0 ? 0 : remainingRun,
        }
    });

    const burndownData = [
        { day: 'D0', ideal: initialScope, actual: initialScope, build: initialBuildScope, run: initialRunScope },
        ...dailyBdcData
    ];

    // Work Distribution Data
    const workByType: Record<string, number> = { Build: 0, Run: 0, Sprint: 0 }
    sprint.tickets.forEach(ticket => {
        if (ticket.timeLogged > 0) {
            workByType[ticket.typeScope] = (workByType[ticket.typeScope] || 0) + ticket.timeLogged;
        }
    })
    const totalWork = Object.values(workByType).reduce((s, v) => s + v, 0);
    const workDistributionData = Object.entries(workByType).map(([name, value]) => ({
        name,
        value,
        hours: value,
        percent: totalWork > 0 ? (value / totalWork) * 100 : 0,
    }));
    
    // Team Performance Data
    const teamsInSprint = (Object.keys(sprint.teamCapacity || {}) as Team[]).filter(t => t !== 'Out of Scope');
    const teamPerformanceData = teamsInSprint.map(team => {
      const teamTickets = (sprint.tickets || []).filter(t => t.platform === team)
      const capacity = sprint.teamCapacity?.[team];
      const plannedBuild = capacity?.plannedBuild ?? 0;
      const plannedRun = capacity?.plannedRun ?? 0;
      const deliveredBuild = teamTickets.filter(t => t.typeScope === 'Build').reduce((acc, t) => acc + t.timeLogged, 0)
      const deliveredRun = teamTickets.filter(t => t.typeScope === 'Run').reduce((acc, t) => acc + t.timeLogged, 0);
      const totalPlanned = plannedBuild + plannedRun
      const totalDelivered = deliveredBuild + deliveredRun
      const efficiency = totalPlanned > 0 ? (totalDelivered / totalPlanned) * 100 : 0
      const duration = sprint.sprintDays.length || 1;
      const velocity = duration > 0 ? totalDelivered / duration : 0;
      const issues = teamTickets.filter(t => t.status === 'Blocked' || (t.timeLogged > t.estimation && t.estimation > 0)).length
      
      let status = "Inactive"
      if (totalPlanned > 0 || totalDelivered > 0) {
        if (efficiency >= 95) status = "Excellent"
        else if (efficiency >= 80) status = "Good"
        else if (efficiency >= 60) status = "Behind"
        else status = "Critical"
      }
      
      return { team, planned: totalPlanned, completed: totalDelivered, efficiency, velocity, status, issues, highlights: [] } // Highlights are hard to derive
    })

    const teamTotals = teamPerformanceData.reduce((acc, data) => {
        acc.planned += data.planned
        acc.completed += data.completed
        return acc
    }, { planned: 0, completed: 0 });
    
    // Daily Progress Total
    const dailyProgress = sprint.sprintDays.map(dayInfo => {
        const progress: Record<Team, { build: number; run: number; buffer: number }> = {} as any
        allTeams.forEach(t => progress[t.value] = { build: 0, run: 0, buffer: 0 });

        sprint.tickets.forEach(ticket => {
            ticket.dailyLogs?.forEach(log => {
                if (log.date === dayInfo.date) {
                    if (progress[ticket.platform]) {
                      if (ticket.typeScope === 'Build') progress[ticket.platform].build += log.loggedHours;
                      else if (ticket.typeScope === 'Run') progress[ticket.platform].run += log.loggedHours;
                      else if (ticket.typeScope === 'Sprint') progress[ticket.platform].buffer += log.loggedHours;
                    }
                }
            })
        })
        return { day: dayInfo.day, date: dayInfo.date, progress };
    });

    const dailyTotalSummary = dailyProgress.reduce((acc, day) => {
        allTeams.forEach(team => {
            if (day.progress[team.value]) {
                acc.build += day.progress[team.value].build;
                acc.run += day.progress[team.value].run;
                acc.buffer += day.progress[team.value].buffer;
            }
        });
        return acc;
    }, { build: 0, run: 0, buffer: 0, total: 0 });
    const total = dailyTotalSummary.build + dailyTotalSummary.run + dailyTotalSummary.buffer
    dailyTotalSummary.total = total;

    return {
      burndownData,
      workDistributionData,
      teamPerformanceData,
      teamTotals,
      dailyTotalSummary,
    }
  }, [sprint])

  const handleExportPDF = () => {
    if (!reportRef.current) return

    html2canvas(reportRef.current, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const imgHeight = (canvas.height * pdfWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 0
      
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight)
      heightLeft -= pdf.internal.pageSize.getHeight()

      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight)
        heightLeft -= pdf.internal.pageSize.getHeight()
      }
      pdf.save(`sprint-report-${sprint?.name.replace(/ /g, '_')}.pdf`)
    })
  }

  const handleExportCSV = () => {
    if (!sprint?.tickets) return
    
    const csvData = sprint.tickets.map(ticket => ({
      'Platform (Team)': ticket.platform,
      'Ticket ID': ticket.id,
      'Ticket Link': `https://inwidtd.atlassian.net/browse/${ticket.id}`,
      'Time Logged (Total)': ticket.timeLogged,
      'Estimation': ticket.estimation,
    }))

    const csv = Papa.unparse(csvData)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `sprint-tickets-${sprint?.name.replace(/ /g, '_')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (isLoading) {
    return <div className="p-6 bg-background">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="border-b pb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-40" />
              <Skeleton className="h-9 w-32" />
              <Skeleton className="h-9 w-32" />
            </div>
          </div>
        </div>
        <div className="space-y-4 p-6">
          <Skeleton className="h-8 w-1/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="space-y-4 mt-6">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    </div>
  }

  if (error) {
    return (
      <Alert variant="destructive" className="m-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!sprint || !reportData) {
    return <div className="p-6 text-center">Sprint data could not be loaded.</div>;
  }
  
  return (
    <div className="p-6 bg-background">
      <div className="max-w-6xl mx-auto space-y-8" ref={reportRef}>
          <div className="border-b pb-6">
              <div className="flex items-center justify-between mb-4">
              <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                      {sprint ? `Sprint Report: ${sprint.name}` : 'Sprint Report'}
                  </h1>
                  {sprint && (
                      <p className="text-gray-600 mt-1">
                      {new Date(sprint.startDate).toLocaleDateString(undefined, { timeZone: 'UTC' })} - {new Date(sprint.endDate).toLocaleDateString(undefined, { timeZone: 'UTC' })}
                      </p>
                  )}
              </div>
              <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" onClick={() => sprint && allSprints.length && generateReport(sprint, allSprints)} disabled={isLoading || !!error || !sprint}>
                    <Brain className="w-4 h-4 mr-2" />
                    { isLoading ? 'Generating...' : 'Regenerate Analysis' }
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={isLoading || !!error}>
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={isLoading || !!error}>
                  <FileText className="w-4 h-4 mr-2" />
                  Export CSV
                  </Button>
              </div>
              </div>
          </div>
          
          {reportContent && (
            <>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Brain className="w-5 h-5 text-purple-600" />
                            AI Generated Analysis
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <MarkdownRenderer content={reportContent} />
                    </CardContent>
                </Card>

                <AIInsights />
                
                <Card>
                    <CardHeader><CardTitle>Sprint Burndown</CardTitle></CardHeader>
                    <CardContent>
                        <ChartContainer
                            config={{
                                ideal: { label: "Ideal", color: "hsl(var(--muted-foreground))" },
                                actual: { label: "Total", color: "hsl(var(--chart-1))" },
                                build: { label: "Build", color: "hsl(var(--chart-2))" },
                                run: { label: "Run", color: "hsl(var(--chart-3))" },
                            }}
                            className="h-[300px]"
                        >
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={reportData.burndownData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="day" />
                                <YAxis />
                                <RechartsTooltip content={<ChartTooltipContent />} />
                                <Line type="monotone" dataKey="ideal" stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" name="Ideal" dot={false}/>
                                <Line type="monotone" dataKey="actual" stroke="hsl(var(--chart-1))" name="Total" dot={false}/>
                                <Line type="monotone" dataKey="build" stroke="hsl(var(--chart-2))" name="Build" dot={false}/>
                                <Line type="monotone" dataKey="run" stroke="hsl(var(--chart-3))" name="Run" dot={false}/>
                            </LineChart>
                        </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader><CardTitle>Work Distribution by Type</CardTitle></CardHeader>
                        <CardContent>
                            <ChartContainer config={{}} className="h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                    <Pie data={reportData.workDistributionData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} label>
                                        <Cell fill="hsl(var(--chart-1))" />
                                        <Cell fill="hsl(var(--chart-2))" />
                                        <Cell fill="hsl(var(--chart-3))" />
                                    </Pie>
                                    <RechartsTooltip content={<ChartTooltipContent />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Total Daily Progress</CardTitle></CardHeader>
                        <CardContent className="flex items-center justify-center h-[250px]">
                            <div className="text-center p-4 bg-muted/50 rounded-lg w-full">
                                <div className="text-4xl font-bold">{reportData.dailyTotalSummary.total.toFixed(1)}h</div>
                                <div className="text-sm text-muted-foreground mb-4">Total Logged</div>
                                <div className="flex justify-center gap-4 text-sm">
                                    <span>Build: {reportData.dailyTotalSummary.build.toFixed(1)}h</span>
                                    <span>Run: {reportData.dailyTotalSummary.run.toFixed(1)}h</span>
                                    <span>Buffer: {reportData.dailyTotalSummary.buffer.toFixed(1)}h</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader><CardTitle>Team Capacity & Delivery</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>Team</TableHead>
                                <TableHead className="text-right">Planned</TableHead>
                                <TableHead className="text-right">Completed</TableHead>
                                <TableHead className="text-right">Efficiency</TableHead>
                                <TableHead className="w-[200px]">Progress</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reportData.teamPerformanceData.map(data => (
                                <TableRow key={data.team}>
                                    <TableCell className="font-medium">{data.team}</TableCell>
                                    <TableCell className="text-right">{data.planned.toFixed(1)}h</TableCell>
                                    <TableCell className="text-right">{data.completed.toFixed(1)}h</TableCell>
                                    <TableCell className="text-right">{data.efficiency.toFixed(1)}%</TableCell>
                                    <TableCell><Progress value={data.efficiency} /></TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                            <TableFooter>
                                <TableRow className="font-bold bg-muted/50">
                                <TableCell>Totals</TableCell>
                                <TableCell className="text-right">{reportData.teamTotals.planned.toFixed(1)}h</TableCell>
                                <TableCell className="text-right">{reportData.teamTotals.completed.toFixed(1)}h</TableCell>
                                <TableCell colSpan={2} className="text-right">{((reportData.teamTotals.completed / reportData.teamTotals.planned || 0) * 100).toFixed(1)}%</TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </CardContent>
                </Card>
            </>
          )}
          
          <div className="border-t pt-6 text-center text-sm text-gray-500">
            {generatedAt && (
                <p>
                Report generated on {generatedAt.toLocaleDateString()} at {generatedAt.toLocaleTimeString()}
                </p>
            )}
            <p className="mt-1">Sprint Tracking Tool v2.0 with AI Intelligence | Confidential</p>
          </div>
      </div>
    </div>
  )
}
