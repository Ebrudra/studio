
"use client";

import * as React from 'react';
import { useMemo, useState, useEffect } from 'react';
import { sprints as initialSprints, teams } from '@/lib/data';
import type { Sprint, Ticket, DailySprintData, Team, DailyLog, TicketStatus, TicketTypeScope } from '@/types';
import { eachDayOfInterval, isSaturday, isSunday } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TaskTable } from './task-table';
import { BurnDownChart } from './burn-down-chart';
import { ScopeDistributionChart } from './scope-distribution-chart';
import { WorkDistributionChart } from './work-distribution-chart';
import { TeamCapacityTable } from './team-capacity-table';
import { TeamDailyProgress, type DailyProgressData } from './team-daily-progress';
import { Button } from '@/components/ui/button';
import { CheckCircle, GitCommitHorizontal, ListTodo, PlusCircle, BotMessageSquare, Zap, NotebookPen, Upload, AlertCircle, History, Trash2, Check, Settings, FileArchive } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { columns } from './columns';
import { NewSprintDialog } from './new-sprint-dialog';
import { AddTaskDialog } from './add-task-dialog';
import { GenerateSprintReportDialog } from './generate-sprint-report-dialog';
import { Skeleton } from '../ui/skeleton';
import { LogProgressDialog, type LogProgressData } from './log-progress-dialog';
import { BulkUploadDialog, type BulkTask, type BulkProgressLog } from './bulk-upload-dialog';
import { useToast } from '@/hooks/use-toast';

export default function SprintDashboard() {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [previousSprints, setPreviousSprints] = useState<Sprint[] | null>(null);
  const [selectedSprintId, setSelectedSprintId] = useState<string | undefined>();
  const [isLoaded, setIsLoaded] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [isNewSprintOpen, setIsNewSprintOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isLogProgressOpen, setIsLogProgressOpen] = useState(false);
  const [taskToLog, setTaskToLog] = useState<Ticket | null>(null);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedSprints = localStorage.getItem('sprintPilotSprints');
      if (storedSprints) {
        setSprints(JSON.parse(storedSprints));
      } else {
        setSprints(initialSprints);
      }
    } catch (error) {
      console.error("Failed to load sprints from localStorage", error);
      setSprints(initialSprints);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem('sprintPilotSprints', JSON.stringify(sprints));
      } catch (error) {
        console.error("Failed to save sprints to localStorage", error);
      }
    }
  }, [sprints, isLoaded]);
  
  useEffect(() => {
    if (isLoaded && !selectedSprintId && sprints.length > 0) {
      const latestSprint = sprints.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0];
      setSelectedSprintId(latestSprint.id);
    }
  }, [sprints, isLoaded, selectedSprintId]);

  const selectedSprint = useMemo<Sprint | undefined>(
    () => sprints.find((sprint) => sprint.id === selectedSprintId),
    [sprints, selectedSprintId]
  );
  
  useEffect(() => {
    if (selectedSprint) {
      setLastUpdated(new Date(selectedSprint.lastUpdatedAt));
    }
  }, [selectedSprint]);

  const processedSprint = useMemo(() => {
    if (!selectedSprint) return null;

    // Ensure bug estimations are always equal to their logged time
    const tickets = selectedSprint.tickets.map(ticket => 
        (ticket.type === 'Bug' || ticket.type === 'Buffer') ? { ...ticket, estimation: ticket.timeLogged } : ticket
    );

    const bdcTickets = tickets.filter(t => t.typeScope === 'Build' || t.typeScope === 'Run');
    const totalScope = bdcTickets.reduce((acc, ticket) => acc + ticket.estimation, 0);

    const completedWork = tickets
      .filter((ticket) => ticket.status === 'Done')
      .reduce((acc, ticket) => acc + ticket.estimation, 0);

    const remainingWork = totalScope - completedWork;
    const percentageComplete = totalScope > 0 ? (completedWork / totalScope) * 100 : 0;
    const summaryMetrics = { totalScope, completedWork, remainingWork, percentageComplete };

    const startDate = new Date(selectedSprint.startDate);
    const endDate = new Date(selectedSprint.endDate);
    const sprintDays: { date: string, day: number }[] = [];
    if (startDate && endDate && endDate >= startDate) {
        const interval = { start: startDate, end: endDate };
        const workingDays = eachDayOfInterval(interval).filter(
            day => !isSaturday(day) && !isSunday(day)
        );
        workingDays.forEach((date, index) => {
            sprintDays.push({ date: date.toISOString().split('T')[0], day: index + 1 });
        });
    }
    
    const idealBurnPerDay = totalScope / (sprintDays.length > 1 ? sprintDays.length - 1 : 1);
    
    let cumulativeScope = 0;
    const scopeByDay = new Map<string, number>();
    sprintDays.forEach(day => {
        const newScopeToday = bdcTickets.filter(t => t.creationDate === day.date).reduce((acc, t) => acc + t.estimation, 0);
        cumulativeScope += newScopeToday;
        scopeByDay.set(day.date, cumulativeScope);
    });
    
    let remainingScope = totalScope;
    const burnDownData: DailySprintData[] = sprintDays.map((dayData, index) => {
      const completedToday = bdcTickets
        .filter(t => t.completionDate === dayData.date)
        .reduce((acc, t) => acc + t.estimation, 0);

      remainingScope -= completedToday;
      
      return {
        day: dayData.day,
        date: dayData.date,
        ideal: parseFloat((totalScope - (index * idealBurnPerDay)).toFixed(2)),
        actual: remainingScope < 0 ? 0 : remainingScope,
        completed: 0,
        dailyCompletedByTeam: {} as Record<Team, number>,
        dailyBuildByTeam: {} as Record<Team, number>,
        dailyRunByTeam: {} as Record<Team, number>,
      }
    });

    return { ...selectedSprint, summaryMetrics, burnDownData, tickets };
  }, [selectedSprint]);

  const dailyProgressData = useMemo((): DailyProgressData[] => {
    if (!selectedSprint) return [];

    const sprintDays: { date: string; day: number }[] = [];
    const startDate = new Date(selectedSprint.startDate);
    const endDate = new Date(selectedSprint.endDate);
    if (startDate && endDate && endDate >= startDate) {
        const interval = { start: startDate, end: endDate };
        const workingDays = eachDayOfInterval(interval).filter(
            day => !isSaturday(day) && !isSunday(day)
        );
        workingDays.forEach((date, index) => {
            sprintDays.push({ date: date.toISOString().split('T')[0], day: index + 1 });
        });
    }
    
    const dataByDate = new Map<string, Record<Team, { build: number; run: number; buffer: number }>>();
    
    for (const ticket of selectedSprint.tickets) {
        if (ticket.dailyLogs) {
            for (const log of ticket.dailyLogs) {
                if (!dataByDate.has(log.date)) {
                    dataByDate.set(log.date, teams.reduce((acc, team) => ({...acc, [team]: {build: 0, run: 0, buffer: 0}}), {} as Record<Team, { build: number; run: number, buffer: number }>));
                }
                const dayData = dataByDate.get(log.date)!;
                if(dayData[ticket.scope]) {
                    if (ticket.typeScope === 'Build') {
                        dayData[ticket.scope].build += log.loggedHours;
                    } else if (ticket.typeScope === 'Run') {
                        dayData[ticket.scope].run += log.loggedHours;
                    } else if (ticket.typeScope === 'Sprint') {
                        dayData[ticket.scope].buffer += log.loggedHours;
                    }
                }
            }
        }
    }

    return sprintDays.map(dayInfo => ({
        day: dayInfo.day,
        date: dayInfo.date,
        progress: dataByDate.get(dayInfo.date) || teams.reduce((acc, team) => ({...acc, [team]: {build: 0, run: 0, buffer: 0}}), {} as Record<Team, { build: number; run: number; buffer: 0 }>)
    }));
  }, [selectedSprint]);

  const sprintWarnings = useMemo(() => {
    if (!processedSprint) return [];
    const warnings = [];
    const today = new Date().toISOString().split('T')[0];
    
    if (processedSprint.summaryMetrics.totalScope > (processedSprint.totalCapacity || 0)) {
        warnings.push({
            title: "Scope Creep Alert",
            description: `Total scope (${processedSprint.summaryMetrics.totalScope.toFixed(1)}h) exceeds the sprint's capacity (${(processedSprint.totalCapacity || 0).toFixed(1)}h).`
        });
    }

    const runEffort = processedSprint.tickets.filter(t => t.typeScope === 'Run').reduce((acc, t) => acc + t.timeLogged, 0);
    const runCapacity = processedSprint.runCapacity || 0;
    if (runCapacity > 0 && runEffort > runCapacity) {
         warnings.push({
            title: "Run Capacity Exceeded",
            description: `Total time logged on 'Run' activities (${runEffort.toFixed(1)}h) has exceeded the planned 'Run' capacity (${runCapacity.toFixed(1)}h).`
        });
    }

    const dayDataForToday = processedSprint.burnDownData.find(d => d.date === today);
    if(dayDataForToday && dayDataForToday.actual > dayDataForToday.ideal) {
        warnings.push({
            title: "Behind Schedule",
            description: "The actual burn is higher than the ideal burn. The team is behind schedule."
        })
    }

    return warnings;
  }, [processedSprint]);
  
  const updateSprints = (updateFn: (sprints: Sprint[]) => Sprint[], toastInfo?: { title: string, description: string }) => {
    setSprints(currentSprints => {
        const newSprints = updateFn(currentSprints);
        if (toastInfo) {
            toast(toastInfo);
        }
        return newSprints;
    });
  };

  const handleBulkUpdate = (updateFn: (sprints: Sprint[]) => Sprint[], toastInfo: { title: string, description: string }) => {
    setPreviousSprints(sprints);
    updateSprints(updateFn, toastInfo);
  }

  const handleRollback = () => {
    if (previousSprints) {
      setSprints(previousSprints);
      setPreviousSprints(null);
      toast({ title: "Rollback successful", description: "The last data import has been undone." });
    }
  }

  const handleCreateSprint = (newSprintData: Omit<Sprint, 'id' | 'lastUpdatedAt' | 'tickets' | 'burnDownData' | 'generatedReport'>) => {
    const newSprint: Sprint = {
      ...newSprintData,
      id: `sprint-${sprints.length + 1}-${Date.now()}`,
      lastUpdatedAt: new Date().toISOString(),
      tickets: [],
      burnDownData: [],
    };
    updateSprints(prevSprints => [...prevSprints, newSprint]);
    setSelectedSprintId(newSprint.id);
  };

  const handleAddTask = (newTaskData: Omit<Ticket, "timeLogged">) => {
    const newTask: Ticket = { ...newTaskData, timeLogged: 0, dailyLogs: [], creationDate: new Date().toISOString().split('T')[0] };
    updateSprints(prevSprints =>
      prevSprints.map(sprint =>
        sprint.id === selectedSprintId
          ? { ...sprint, tickets: [...sprint.tickets, newTask], lastUpdatedAt: new Date().toISOString() }
          : sprint
      )
    );
  };

  const handleUpdateTask = (updatedTask: Ticket) => {
    updateSprints(prevSprints =>
      prevSprints.map(sprint => {
        if (sprint.id !== selectedSprintId) return sprint;
        const newTickets = sprint.tickets.map(t => (t.id === updatedTask.id) ? updatedTask : t);
        return { ...sprint, tickets: newTickets, lastUpdatedAt: new Date().toISOString() };
      })
    );
  };

  const handleDeleteTask = (taskId: string) => {
      updateSprints(prevSprints =>
        prevSprints.map(sprint =>
          sprint.id === selectedSprintId
            ? {
                ...sprint,
                tickets: sprint.tickets.filter(t => t.id !== taskId),
                lastUpdatedAt: new Date().toISOString(),
              }
            : sprint
        ), { title: "Task Deleted", description: `Task ${taskId} has been removed.` }
      );
  };
  
  const handleLogRowAction = (task: Ticket) => {
    setTaskToLog(task);
    setIsLogProgressOpen(true);
  };

  const handleLogProgress = (data: LogProgressData) => {
    updateSprints(prevSprints =>
      prevSprints.map(sprint => {
        if (sprint.id !== selectedSprintId) return sprint;

        let newTickets = [...sprint.tickets];
        const isNewTicket = data.ticketId === 'new-ticket';
        const ticketId = isNewTicket ? data.newTicketId! : data.ticketId!;
        let ticket = newTickets.find(t => t.id === ticketId);

        const newLog: DailyLog = {
          date: data.date,
          loggedHours: data.loggedHours,
        };

        if (isNewTicket) {
          const newTicket: Ticket = {
            id: ticketId,
            title: data.newTicketTitle!,
            scope: data.scope,
            type: data.type,
            typeScope: data.typeScope,
            estimation: data.estimation,
            status: data.status,
            dailyLogs: [newLog],
            timeLogged: newLog.loggedHours,
            creationDate: new Date(data.date).toISOString().split('T')[0],
          };
          if (newTicket.status === 'Done') {
            newTicket.completionDate = new Date(data.date).toISOString().split('T')[0];
          }
          newTickets.push(newTicket);
        } else if (ticket) {
          const newDailyLogs = [...(ticket.dailyLogs || [])];
          const existingLogIndex = newDailyLogs.findIndex(l => l.date === data.date);

          if (existingLogIndex !== -1) {
            newDailyLogs[existingLogIndex].loggedHours += data.loggedHours;
          } else {
            newDailyLogs.push(newLog);
          }
          
          const timeLogged = newDailyLogs.reduce((acc, log) => acc + log.loggedHours, 0);
          const wasDone = ticket.status === 'Done';
          const isDone = data.status === 'Done';

          let updatedTicket: Ticket = { ...ticket, status: data.status, dailyLogs: newDailyLogs, timeLogged };

          if (!wasDone && isDone) {
            updatedTicket.completionDate = new Date(data.date).toISOString().split('T')[0];
          } else if (wasDone && !isDone) {
            delete updatedTicket.completionDate;
          }
          
          newTickets = newTickets.map(t => t.id === ticketId ? updatedTicket : t);
        }

        return { ...sprint, tickets: newTickets, lastUpdatedAt: new Date().toISOString() };
      })
    );
  };
  
  const handleBulkUploadTasks = (tasks: BulkTask[]) => {
    let addedCount = 0;
    handleBulkUpdate(prevSprints => {
      const sprintToUpdate = prevSprints.find(s => s.id === selectedSprintId);
      if (!sprintToUpdate) return prevSprints;

      const existingTicketIds = new Set(sprintToUpdate.tickets.map(t => t.id));
      const uniqueNewTickets = tasks.filter(t => !existingTicketIds.has(t.id));
      addedCount = uniqueNewTickets.length;

      const newTickets: Ticket[] = uniqueNewTickets.map(task => {
        let typeScope: TicketTypeScope = 'Build';
        if (task.type === 'Bug') typeScope = 'Run';
        else if (task.type === 'Buffer') typeScope = 'Sprint';
        return {
          ...task,
          estimation: Number(task.estimation) || 0,
          typeScope,
          timeLogged: 0,
          dailyLogs: [],
          status: 'To Do',
          creationDate: new Date().toISOString().split('T')[0],
        };
      });

      if (newTickets.length > 0) {
        return prevSprints.map(s => s.id === selectedSprintId ? { ...s, tickets: [...s.tickets, ...newTickets], lastUpdatedAt: new Date().toISOString() } : s);
      }
      return prevSprints;
    }, { title: "Task Upload Complete", description: `${addedCount} tasks added. ${tasks.length - addedCount} duplicates skipped.` });
  };

  const handleBulkLogProgress = (logs: BulkProgressLog[]) => {
    let processedCount = 0;
    let newTicketsCount = 0;

    logs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    handleBulkUpdate(prevSprints => {
        return prevSprints.map(sprint => {
            if (sprint.id !== selectedSprintId) return sprint;

            const ticketsMap = new Map(sprint.tickets.map(t => [t.id, { ...t, dailyLogs: [...(t.dailyLogs || [])] }]));

            for (const log of logs) {
                if (!log.ticketId || !log.date || !log.loggedHours || !log.status) continue;
                
                let ticket = ticketsMap.get(log.ticketId);

                if (!ticket) {
                    if (!log.title || !log.scope || !log.type) continue;
                    
                    let typeScope: TicketTypeScope = log.typeScope || 'Build';
                    if (log.type === 'Bug') typeScope = 'Run';
                    else if (log.type === 'Buffer') typeScope = 'Sprint';
                    
                    const estimation = Number(log.estimation) || ( (log.type === 'Bug' || log.type === 'Buffer') ? Number(log.loggedHours) : 0);

                    ticket = {
                        id: log.ticketId,
                        title: log.title,
                        scope: log.scope,
                        type: log.type,
                        typeScope: typeScope,
                        estimation: estimation,
                        status: log.status,
                        timeLogged: 0,
                        dailyLogs: [],
                        isOutOfScope: log.type === 'User story',
                        creationDate: new Date(log.date).toISOString().split('T')[0],
                    };
                    newTicketsCount++;
                }

                const newLog: DailyLog = { date: log.date, loggedHours: Number(log.loggedHours) || 0 };
                const existingLogIndex = ticket.dailyLogs.findIndex(l => l.date === log.date);

                if (existingLogIndex !== -1) {
                    ticket.dailyLogs[existingLogIndex].loggedHours += newLog.loggedHours;
                } else {
                    ticket.dailyLogs.push(newLog);
                }
                
                ticket.dailyLogs.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

                ticket.status = log.status; // status is based on latest log for that ticket
                ticket.timeLogged = ticket.dailyLogs.reduce((acc, l) => acc + l.loggedHours, 0);

                const wasDone = !!ticket.completionDate;
                const isDone = log.status === 'Done';
                if (!wasDone && isDone) ticket.completionDate = new Date(log.date).toISOString().split('T')[0];
                else if (wasDone && !isDone) delete ticket.completionDate;
                
                ticketsMap.set(log.ticketId, ticket);
                processedCount++;
            }

            return { ...sprint, tickets: Array.from(ticketsMap.values()), lastUpdatedAt: new Date().toISOString() };
        });
    }, {
        title: "Progress Log Upload Complete",
        description: `${processedCount} logs processed. ${newTicketsCount} new tickets were created.`,
    });
  };
  
  const handleClearData = () => {
    if (window.confirm("Are you sure you want to clear all tickets and logs for this sprint? This action cannot be undone.")) {
      updateSprints(
        prev => prev.map(s => s.id === selectedSprintId ? { ...s, tickets: [], generatedReport: undefined, lastUpdatedAt: new Date().toISOString() } : s),
        { title: "Sprint Data Cleared", description: "All tickets and logs have been removed." }
      );
    }
  };

  const handleCompleteSprint = () => {
    if (window.confirm("Are you sure you want to complete this sprint? You will no longer be able to edit it.")) {
      updateSprints(
        prev => prev.map(s => s.id === selectedSprintId ? { ...s, status: 'Completed', lastUpdatedAt: new Date().toISOString() } : s),
        { title: "Sprint Completed", description: "The sprint has been archived." }
      );
    }
  };
  
  const handleSaveReport = (report: string) => {
      updateSprints(
          prev => prev.map(s => s.id === selectedSprintId ? { ...s, generatedReport: report, lastUpdatedAt: new Date().toISOString() } : s)
      );
  };


  if (!isLoaded) {
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
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 flex flex-col items-center justify-center h-screen">
            <p className="text-muted-foreground mb-4">No sprint selected or available.</p>
            <Button onClick={() => setIsNewSprintOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Start a New Sprint
            </Button>
            <NewSprintDialog isOpen={isNewSprintOpen} setIsOpen={setIsNewSprintOpen} onCreateSprint={handleCreateSprint} />
        </div>
    );
  }
  
  const isSprintCompleted = processedSprint.status === 'Completed';

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
       <NewSprintDialog isOpen={isNewSprintOpen} setIsOpen={setIsNewSprintOpen} onCreateSprint={handleCreateSprint} />
       <AddTaskDialog isOpen={isAddTaskOpen} setIsOpen={setIsAddTaskOpen} onAddTask={handleAddTask} />
       <GenerateSprintReportDialog isOpen={isReportOpen} setIsOpen={setIsReportOpen} sprint={selectedSprint} onSaveReport={handleSaveReport} />
       <LogProgressDialog isOpen={isLogProgressOpen} setIsOpen={setIsLogProgressOpen} sprint={selectedSprint} onLogProgress={handleLogProgress} taskToLog={taskToLog} onClose={() => setTaskToLog(null)} />
       <BulkUploadDialog isOpen={isBulkUploadOpen} setIsOpen={setIsBulkUploadOpen} onBulkUploadTasks={handleBulkUploadTasks} onBulkLogProgress={handleBulkLogProgress} />

      <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-gray-800">Sprint Command Center</h1>
            {isSprintCompleted && <Badge variant="success" className="text-base"><FileArchive className="mr-2 h-4 w-4" />Completed</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">
            Data last updated at: {lastUpdated ? lastUpdated.toLocaleString() : 'N/A'}
          </p>
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
             <Button onClick={() => setIsNewSprintOpen(true)} variant="outline"><PlusCircle className="mr-2 h-4 w-4" />New Sprint</Button>
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon"><Settings className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleCompleteSprint} disabled={isSprintCompleted}>
                        <Check className="mr-2 h-4 w-4" /> Complete Sprint
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleClearData} className="text-destructive" disabled={isSprintCompleted}>
                        <Trash2 className="mr-2 h-4 w-4" /> Clear Sprint Data
                    </DropdownMenuItem>
                </DropdownMenuContent>
             </DropdownMenu>
        </div>
      </header>
      
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

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Scope</CardTitle>
            <GitCommitHorizontal className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processedSprint.summaryMetrics.totalScope.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">Of {(processedSprint.totalCapacity || 0).toFixed(1)}h capacity</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Work Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processedSprint.summaryMetrics.completedWork.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">Of {processedSprint.summaryMetrics.totalScope.toFixed(1)}h total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Work Remaining</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processedSprint.summaryMetrics.remainingWork.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">To be completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Percentage Complete</CardTitle>
            <Zap className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processedSprint.summaryMetrics.percentageComplete.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Sprint progress</p>
          </CardContent>
        </Card>
      </section>

      <Card>
          <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Sprint Tasks</CardTitle>
               <div className="flex items-center gap-2">
                {previousSprints && <Button onClick={handleRollback} variant="destructive"><History className="mr-2 h-4 w-4" /> Rollback Import</Button>}
                <Button onClick={() => setIsBulkUploadOpen(true)} variant="outline" disabled={isSprintCompleted}><Upload className="mr-2 h-4 w-4" /> Bulk Upload</Button>
                <Button onClick={() => { setTaskToLog(null); setIsLogProgressOpen(true); }} disabled={isSprintCompleted}><NotebookPen className="mr-2 h-4 w-4" /> Log Progress</Button>
                <Button onClick={() => setIsAddTaskOpen(true)} variant="outline" disabled={isSprintCompleted}><PlusCircle className="mr-2 h-4 w-4" /> Add Task</Button>
                <Button onClick={() => setIsReportOpen(true)} variant="outline" disabled={!processedSprint.tickets.length}><BotMessageSquare className="mr-2 h-4 w-4" /> {selectedSprint.generatedReport ? "View Report" : "Generate Report"}</Button>
            </div>
          </CardHeader>
          <CardContent>
              <TaskTable columns={columns} data={processedSprint.tickets} onUpdateTask={handleUpdateTask} onDeleteTask={handleDeleteTask} onLogTime={handleLogRowAction} sprint={processedSprint} />
          </CardContent>
       </Card>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
           <Card className="h-full">
            <CardHeader><CardTitle>Sprint Burn-down</CardTitle></CardHeader>
            <CardContent><BurnDownChart sprint={processedSprint} /></CardContent>
           </Card>
        </div>
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader><CardTitle>Scope Distribution (by Estimation)</CardTitle></CardHeader>
                <CardContent><ScopeDistributionChart tickets={processedSprint.tickets} /></CardContent>
            </Card>
             <Card>
                <CardHeader><CardTitle>Work Distribution (by Logged Hours)</CardTitle></CardHeader>
                <CardContent><WorkDistributionChart tickets={processedSprint.tickets} /></CardContent>
            </Card>
        </div>
      </div>
      
       <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
             <TeamCapacityTable sprint={processedSprint} />
        </div>
         <div className="lg:col-span-2 space-y-6"></div>
      </div>

       <TeamDailyProgress dailyProgress={dailyProgressData} />

    </div>
  );
}
