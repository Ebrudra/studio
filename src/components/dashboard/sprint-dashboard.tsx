
"use client";

import * as React from 'react';
import { useMemo } from 'react';
import { getCoreRowModel, getFacetedRowModel, getFacetedUniqueValues, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable, type ColumnFiltersState, type SortingState, type VisibilityState } from '@tanstack/react-table';

import { platforms } from "./data";
import type { Sprint, Ticket, Team, TeamCapacity } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SprintTasksView } from './sprint-tasks-view';
import { SprintCharts } from './sprint-charts';
import { TeamCapacityTable } from './team-capacity-table';
import { TeamDailyProgress, type DailyProgressData } from './team-daily-progress';
import { Button } from '@/components/ui/button';
import { CheckCircle, GitCommitHorizontal, ListTodo, Plus, BarChart3, Zap, Upload, AlertCircle, History, Trash2, Check, Settings, FileArchive, FileText, TrendingUp, TrendingDown, Target, Clock, Users, Rocket, CloudUpload, Undo, Edit } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { columns } from './columns';
import { NewSprintDialog } from './new-sprint-dialog';
import { EditSprintDialog } from './edit-sprint-dialog';
import { AddTaskDialog } from './add-task-dialog';
import { Skeleton } from '../ui/skeleton';
import { LogProgressDialog, type LogProgressData } from './log-progress-dialog';
import { BulkUploadDialog, type BulkTask, type BulkProgressLog } from './bulk-upload-dialog';
import { DataTableToolbar } from './data-table-toolbar';
import { useSprints } from '@/hooks/use-sprints.tsx';

const SprintScopingView = ({
  sprint,
  onFinalizeScope,
  onOpenAddTask,
  onOpenBulkUpload,
  onUndoLastUpload,
  canUndo,
  onUpdateTask,
  onDeleteTask,
  onLogTime,
}: {
  sprint: Sprint;
  onFinalizeScope: () => void;
  onOpenAddTask: () => void;
  onOpenBulkUpload: () => void;
  onUndoLastUpload: () => void;
  canUndo: boolean;
  onUpdateTask: (task: Ticket) => void;
  onDeleteTask: (taskId: string) => void;
  onLogTime: (task: Ticket) => void;
}) => (
    <Card>
      <CardHeader>
        <CardTitle>Define Initial Scope for "{sprint.name}"</CardTitle>
        <CardDescription>
          Add all the initial 'Build' and 'Run' tickets for this sprint. You can add them manually or upload a CSV file.
          'Build' tickets added after finalizing the scope will be marked as 'Out of Scope'.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-end gap-2 mb-4">
          <Button onClick={onUndoLastUpload} variant="outline" disabled={!canUndo}>
            <Undo className="mr-2 h-4 w-4" /> Undo Last Upload
          </Button>
          <Button onClick={onOpenBulkUpload} variant="outline"><Upload className="mr-2 h-4 w-4" /> Bulk Upload Tasks</Button>
          <Button onClick={onOpenAddTask} variant="outline"><Plus className="mr-2 h-4 w-4" /> Add Task Manually</Button>
        </div>
        <SprintTasksView
          columns={columns}
          data={sprint.tickets || []}
          sprint={sprint}
          onUpdateTask={onUpdateTask}
          onDeleteTask={onDeleteTask}
          onLogTime={onLogTime}
        />
        <div className="mt-6 flex justify-end">
          <Button onClick={onFinalizeScope} size="lg">
            <CheckCircle className="mr-2 h-5 w-5" /> Finalize Scope & Start Sprint
          </Button>
        </div>
      </CardContent>
    </Card>
);

export default function SprintDashboard() {
  const {
      sprints,
      selectedSprint,
      selectedSprintId,
      setSelectedSprintId,
      isLoading,
      handleCreateSprint,
      handleUpdateSprint,
      handleDeleteSprint,
      handleAddTask,
      handleUpdateTask,
      handleDeleteTask,
      handleLogProgress,
      handleBulkUploadTasks,
      handleBulkLogProgress,
      handleFinalizeScope,
      handleEditScope,
      handleCompleteSprint,
      handleClearData,
      handleSyncToFirebase,
      undoState,
      handleUndoLastUpload,
      isNewSprintOpen, setIsNewSprintOpen,
      isEditSprintOpen, setIsEditSprintOpen,
      isAddTaskOpen, setIsAddTaskOpen,
      isLogProgressOpen, setIsLogProgressOpen,
      taskToLog, setTaskToLog,
      isBulkUploadOpen, setIsBulkUploadOpen
  } = useSprints();


  const processedSprint = useMemo(() => {
    if (!selectedSprint) return null;

    const tickets = selectedSprint.tickets || [];

    // Recalculate capacities to ensure they are always up-to-date with person days
    const teamCapacity: Record<Team, TeamCapacity> = {} as any;
    if (selectedSprint.teamPersonDays) {
      for (const team of platforms) {
        const personDays = selectedSprint.teamPersonDays[team.value] ?? 0;
        teamCapacity[team.value] = {
          plannedBuild: personDays * 6,
          plannedRun: (personDays * 2) - 8,
        };
      }
    }
    
    const buildCapacity = Object.values(teamCapacity).reduce((acc, team) => acc + team.plannedBuild, 0);
    const runCapacity = Object.values(teamCapacity).reduce((acc, team) => acc + team.plannedRun, 0);
    const totalCapacity = buildCapacity + runCapacity;
    
    const totalScope = tickets.filter(t => t.typeScope === 'Build' || t.typeScope === 'Run').reduce((acc, ticket) => acc + ticket.estimation, 0);
    
    const completedWork = tickets.reduce((acc, ticket) => acc + ticket.timeLogged, 0);

    const remainingWork = totalScope - completedWork;
    const percentageComplete = totalScope > 0 ? (completedWork / totalScope) * 100 : 0;
    const summaryMetrics = { totalScope, completedWork, remainingWork, percentageComplete };

    return { ...selectedSprint, teamCapacity, summaryMetrics, tickets, totalCapacity, buildCapacity, runCapacity };
  }, [selectedSprint]);

  const dailyProgressData = useMemo((): DailyProgressData[] => {
    if (!selectedSprint) return [];

    const sprintTickets = selectedSprint.tickets || [];
    const dataByDate = new Map<string, Record<Team, { build: number; run: number; buffer: number }>>();
    
    for (const ticket of sprintTickets) {
        if (ticket.dailyLogs) {
            for (const log of ticket.dailyLogs) {
                if (!dataByDate.has(log.date)) {
                    dataByDate.set(log.date, platforms.reduce((acc, team) => ({...acc, [team.value]: {build: 0, run: 0, buffer: 0}}), {} as Record<Team, { build: number; run: number, buffer: 0 }>));
                }
                const dayData = dataByDate.get(log.date)!;
                if(dayData[ticket.platform]) {
                    if (ticket.typeScope === 'Build') {
                        dayData[ticket.platform].build += log.loggedHours;
                    } else if (ticket.typeScope === 'Run') {
                        dayData[ticket.platform].run += log.loggedHours;
                    } else if (ticket.typeScope === 'Sprint') {
                        dayData[ticket.platform].buffer += log.loggedHours;
                    }
                }
            }
        }
    }

    return (selectedSprint.sprintDays || []).map(dayInfo => ({
        day: dayInfo.day,
        date: dayInfo.date,
        progress: dataByDate.get(dayInfo.date) || platforms.reduce((acc, team) => ({...acc, [team.value]: {build: 0, run: 0, buffer: 0}}), {} as Record<Team, { build: number; run: number, buffer: 0 }>)
    }));
  }, [selectedSprint]);

  const sprintWarnings = useMemo(() => {
    if (!processedSprint) return [];
    const warnings = [];
    
    if ((processedSprint.totalCapacity ?? 0) > 0 && processedSprint.summaryMetrics.totalScope > (processedSprint.totalCapacity ?? 0)) {
        warnings.push({
            title: "Scope Creep Alert",
            description: `Total scope (${processedSprint.summaryMetrics.totalScope.toFixed(1)}h) exceeds the sprint's capacity (${(processedSprint.totalCapacity || 0).toFixed(1)}h).`
        });
    }

    const runEffort = (processedSprint.tickets || []).filter(t => t.typeScope === 'Run').reduce((acc, t) => acc + t.timeLogged, 0);
    const runCapacity = processedSprint.runCapacity || 0;
    if (runCapacity > 0 && runEffort > runCapacity) {
         warnings.push({
            title: "Run Capacity Exceeded",
            description: `Total time logged on 'Run' activities (${runEffort.toFixed(1)}h) has exceeded the planned 'Run' capacity (${runCapacity.toFixed(1)}h).`
        });
    }

    return warnings;
  }, [processedSprint]);
  
  const metricsData = useMemo(() => {
    if (!processedSprint || !selectedSprint) return null;

    const velocitySprints = sprints
      .filter(s => s.status === 'Completed' || s.id === selectedSprint.id)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .slice(-5);

    const velocityHistory = velocitySprints.map(s => {
      const completedWork = (s.tickets || []).reduce((acc, t) => acc + t.timeLogged, 0);
      const personDays = s.teamPersonDays ? Object.values(s.teamPersonDays).reduce((a, b) => a + b, 0) / (Object.keys(s.teamPersonDays).length || 1) : s.sprintDays?.length || 1;
      return personDays > 0 ? completedWork / personDays : 0;
    });

    const currentVelocity = velocityHistory.length > 0 ? velocityHistory[velocityHistory.length - 1] : 0;
    const previousVelocity = velocityHistory.length > 1 ? velocityHistory[velocityHistory.length - 2] : 0;
    const velocityTrend = currentVelocity >= previousVelocity ? "up" : "down";
    const velocityChange = previousVelocity > 0 ? Math.abs(((currentVelocity - previousVelocity) / previousVelocity) * 100) : 0;

    const capacityData = (Object.keys(processedSprint.teamCapacity || {}) as Team[])
      .map(team => {
        const teamTickets = (processedSprint.tickets || []).filter(t => t.platform === team)
        const capacity = processedSprint.teamCapacity?.[team];
        const plannedBuild = capacity?.plannedBuild ?? 0;
        const plannedRun = capacity?.plannedRun ?? 0;
        const totalDelivered = teamTickets.reduce((acc, t) => acc + t.timeLogged, 0);
        const totalPlanned = plannedBuild + plannedRun
        return { totalPlanned, totalDelivered };
      });
      
    const totals = capacityData.reduce((acc, data) => {
        acc.totalPlanned += data.totalPlanned
        acc.totalDelivered += data.totalDelivered
        return acc
    }, { totalPlanned: 0, totalDelivered: 0 });

    const teamEfficiency = totals.totalPlanned > 0 ? (totals.totalDelivered / totals.totalPlanned) * 100 : 0;

    return {
        currentVelocity,
        velocityTrend,
        velocityChange,
        sprintProgress: processedSprint.summaryMetrics.percentageComplete,
        remainingWork: processedSprint.summaryMetrics.remainingWork,
        teamEfficiency,
    }

  }, [sprints, selectedSprint, processedSprint]);
  
  const handleLogRowAction = (task: Ticket) => {
    setTaskToLog(task);
    setIsLogProgressOpen(true);
  };
  
    // Table state
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])
  
  const sprintDayMap = React.useMemo(() => {
    if (!processedSprint?.sprintDays) return new Map<string, number>();
    return new Map(processedSprint.sprintDays.map((d) => [d.date, d.day]));
  }, [processedSprint?.sprintDays]);
  
  const table = useReactTable({
    data: processedSprint?.tickets || [],
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    meta: {
      onUpdateTask: handleUpdateTask,
      onDeleteTask: handleDeleteTask,
      onLogTime: handleLogRowAction,
      sprint: processedSprint,
      sprintDayMap,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })
  
  if (isLoading) {
    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <Skeleton className="h-12 w-1/3" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
            </div>
            <Skeleton className="h-96 w-full" />
        </div>
    )
  }

  if (!processedSprint || !selectedSprint) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <NewSprintDialog isOpen={isNewSprintOpen} setIsOpen={setIsNewSprintOpen} onCreateSprint={handleCreateSprint} />
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
            <Card className="max-w-2xl p-8 shadow-lg">
                <CardHeader>
                    <div className="mx-auto bg-primary/10 rounded-full p-4 w-fit">
                        <Rocket className="w-10 h-10 text-primary" />
                    </div>
                    <CardTitle className="text-3xl font-bold mt-4">Welcome to SprintPilot</CardTitle>
                    <CardDescription className="text-lg text-muted-foreground mt-2">
                        Your new command center for tracking sprints and managing projects with AI-powered insights.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="mb-6">
                        Get started by creating your first sprint. All your data will be saved locally on your machine.
                    </p>
                    <Button onClick={() => setIsNewSprintOpen(true)} size="lg">
                        <Plus className="mr-2 h-5 w-5" />
                        Start a New Sprint
                    </Button>
                </CardContent>
            </Card>
        </div>
      </div>
    );
  }
  
  const isSprintCompleted = processedSprint.status === 'Completed';

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
       <NewSprintDialog isOpen={isNewSprintOpen} setIsOpen={setIsNewSprintOpen} onCreateSprint={handleCreateSprint} />
       {selectedSprint && <EditSprintDialog isOpen={isEditSprintOpen} setIsOpen={setIsEditSprintOpen} sprint={selectedSprint} onUpdateSprint={(s) => handleUpdateSprint(s)} />}
       <AddTaskDialog isOpen={isAddTaskOpen} setIsOpen={setIsAddTaskOpen} onAddTask={handleAddTask} />
       <LogProgressDialog isOpen={isLogProgressOpen} setIsOpen={setIsLogProgressOpen} sprint={selectedSprint} onLogProgress={handleLogProgress} taskToLog={taskToLog} onClose={() => setTaskToLog(null)} />
       <BulkUploadDialog isOpen={isBulkUploadOpen} setIsOpen={setIsBulkUploadOpen} onBulkUploadTasks={handleBulkUploadTasks} onBulkLogProgress={handleBulkLogProgress} />

      <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-gray-800">Sprint Command Center</h1>
            {processedSprint.status === 'Completed' && <Badge variant="success" className="text-base"><FileArchive className="mr-2 h-4 w-4" />Completed</Badge>}
            {processedSprint.status === 'Active' && <Badge variant="default" className="text-base"><Zap className="mr-2 h-4 w-4" />Active</Badge>}
            {processedSprint.status === 'Scoping' && <Badge variant="secondary" className="text-base"><ListTodo className="mr-2 h-4 w-4" />Scoping</Badge>}
          </div>
          {selectedSprint.lastUpdatedAt &&
            <p className="text-sm text-muted-foreground">
                Data last updated at: {new Date(selectedSprint.lastUpdatedAt).toLocaleString()}
            </p>
          }
        </div>
        <div className="flex items-center gap-2">
            <div className="w-full sm:w-64">
                <Select value={selectedSprintId} onValueChange={setSelectedSprintId}>
                    <SelectTrigger><SelectValue placeholder="Select a sprint" /></SelectTrigger>
                    <SelectContent>
                    {sprints.map((sprint) => (<SelectItem key={sprint.id} value={sprint.id}>{sprint.name}</SelectItem>))}
                    </SelectContent>
                </Select>
            </div>
            <Button onClick={() => setIsNewSprintOpen(true)} variant="outline"><Plus className="mr-2 h-4 w-4" />New Sprint</Button>
            <Button variant="outline" onClick={() => window.open(`/report?sprintId=${selectedSprintId}`, '_blank')} disabled={!selectedSprintId}>
                <FileText className="mr-2 h-4 w-4" />
                View Report
            </Button>
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon"><Settings className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setIsEditSprintOpen(true)} disabled={!selectedSprint}>
                        <Settings className="mr-2 h-4 w-4" /> Edit Sprint Details
                    </DropdownMenuItem>
                     <DropdownMenuItem onClick={handleEditScope} disabled={isSprintCompleted || processedSprint.status === 'Scoping'}>
                        <Edit className="mr-2 h-4 w-4" /> Edit Scope
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleCompleteSprint} disabled={isSprintCompleted}>
                        <Check className="mr-2 h-4 w-4" /> Complete Sprint
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSyncToFirebase} disabled={!selectedSprint || selectedSprint.status !== 'Completed'}>
                        <CloudUpload className="mr-2 h-4 w-4" />
                        {selectedSprint?.isSyncedToFirebase ? "Synced to Cloud" : "Sync to Cloud"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleClearData} className="text-destructive" disabled={isSprintCompleted}>
                        <Trash2 className="mr-2 h-4 w-4" /> Clear Sprint Data
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDeleteSprint} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete Sprint
                    </DropdownMenuItem>
                </DropdownMenuContent>
             </DropdownMenu>
        </div>
      </header>

      {processedSprint.status === 'Scoping' ? (
        <SprintScopingView
            sprint={processedSprint}
            onFinalizeScope={handleFinalizeScope}
            onOpenAddTask={() => setIsAddTaskOpen(true)}
            onOpenBulkUpload={() => setIsBulkUploadOpen(true)}
            onUndoLastUpload={handleUndoLastUpload}
            canUndo={!!undoState}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onLogTime={handleLogRowAction}
        />
      ) : (
      <>
        {sprintWarnings.length > 0 && (
          <div className="space-y-2">
              {sprintWarnings.map((warning, index) => (
                   <Alert key={index} variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>{warning.title}</AlertTitle>
                      <AlertDescription>{warning.description}</AlertDescription>
                  </Alert>
              ))}
          </div>
        )}

        {metricsData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                  <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                      <div>
                          <div className="text-2xl font-bold">{metricsData.currentVelocity.toFixed(1)}</div>
                          <div className="text-xs text-muted-foreground">Current Velocity</div>
                      </div>
                      <div className="flex items-center gap-1">
                          {metricsData.velocityTrend === "up" ? (
                          <TrendingUp className="w-4 h-4 text-success" />
                          ) : (
                          <TrendingDown className="w-4 h-4 text-destructive" />
                          )}
                          <span className={`text-xs ${metricsData.velocityTrend === "up" ? "text-success" : "text-destructive"}`}>
                          {metricsData.velocityChange.toFixed(1)}%
                          </span>
                      </div>
                      </div>
                  </CardContent>
              </Card>

              <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                      <Target className="w-5 h-5 text-primary" />
                      <div>
                      <div className="text-2xl font-bold">{metricsData.sprintProgress.toFixed(1)}%</div>
                      <div className="text-xs text-muted-foreground">Sprint Progress</div>
                      </div>
                  </CardContent>
              </Card>

              <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                      <Clock className="w-5 h-5 text-warning" />
                      <div>
                      <div className="text-2xl font-bold">{metricsData.remainingWork.toFixed(1)}h</div>
                      <div className="text-xs text-muted-foreground">Remaining Work</div>
                      </div>
                  </CardContent>
              </Card>

              <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                      <Users className="w-5 h-5 text-purple-500" />
                      <div>
                      <div className="text-2xl font-bold">{metricsData.teamEfficiency.toFixed(1)}%</div>
                      <div className="text-xs text-muted-foreground">Team Efficiency</div>
                      </div>
                  </CardContent>
              </Card>
          </div>
         )}

          <Tabs defaultValue="tasks" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="tasks">
                      <ListTodo className="mr-2 h-4 w-4" />
                      Tasks
                  </TabsTrigger>
                  <TabsTrigger value="analytics">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Analytics
                  </TabsTrigger>
                  <TabsTrigger value="capacity">
                      <Users className="mr-2 h-4 w-4" />
                      Team Capacity
                  </TabsTrigger>
                  <TabsTrigger value="progress">
                      <GitCommitHorizontal className="mr-2 h-4 w-4" />
                      Daily Progress
                  </TabsTrigger>
              </TabsList>
          
              <TabsContent value="tasks" className="mt-4">
                <Card>
                    <CardHeader>
                       <DataTableToolbar
                            table={table}
                            isSprintCompleted={isSprintCompleted}
                            onOpenAddTask={() => setIsAddTaskOpen(true)}
                            onOpenBulkUpload={() => setIsBulkUploadOpen(true)}
                            onOpenLogProgress={() => {
                                setTaskToLog(null);
                                setIsLogProgressOpen(true);
                            }}
                        />
                    </CardHeader>
                    <CardContent>
                      <SprintTasksView
                          table={table}
                          columns={columns}
                          data={processedSprint.tickets || []}
                          sprint={processedSprint}
                          onUpdateTask={handleUpdateTask}
                          onDeleteTask={handleDeleteTask}
                          onLogTime={handleLogRowAction}
                      />
                    </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics" className="mt-4">
                  <SprintCharts sprint={processedSprint} allSprints={sprints} dailyProgress={dailyProgressData} />
              </TabsContent>

              <TabsContent value="capacity" className="mt-4">
                  <TeamCapacityTable sprint={processedSprint} />
              </TabsContent>
              
              <TabsContent value="progress" className="mt-4">
                  <TeamDailyProgress dailyProgress={dailyProgressData} />
              </TabsContent>
          </Tabs>
      </>
      )}
    </div>
  );
}
