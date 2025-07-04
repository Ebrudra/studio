"use client";

import * as React from 'react';
import { useMemo, useState, useEffect } from 'react';
import { sprints as initialSprints, teams } from '@/lib/data';
import type { Sprint, Ticket, DailySprintData, Team, DailyLog } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TaskTable } from './task-table';
import { BurnDownChart } from './burn-down-chart';
import { ScopeDistributionChart } from './scope-distribution-chart';
import { TeamCapacityTable } from './team-capacity-table';
import { TeamDailyProgress } from './team-daily-progress';
import { Button } from '@/components/ui/button';
import { CheckCircle, GitCommitHorizontal, ListTodo, PlusCircle, BotMessageSquare, Zap, NotebookPen } from 'lucide-react';
import { columns } from './columns';
import { NewSprintDialog } from './new-sprint-dialog';
import { AddTaskDialog } from './add-task-dialog';
import { GenerateSprintReportDialog } from './generate-sprint-report-dialog';
import { Skeleton } from '../ui/skeleton';
import { LogProgressDialog, type LogProgressData } from './log-progress-dialog';

export default function SprintDashboard() {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [selectedSprintId, setSelectedSprintId] = useState<string | undefined>();
  const [isLoaded, setIsLoaded] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [isNewSprintOpen, setIsNewSprintOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isLogProgressOpen, setIsLogProgressOpen] = useState(false);

  // Load sprints from localStorage on initial mount
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

  // Save sprints to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem('sprintPilotSprints', JSON.stringify(sprints));
      } catch (error) {
        console.error("Failed to save sprints to localStorage", error);
      }
    }
  }, [sprints, isLoaded]);
  
  // Set selected sprint
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

    // Summary Metrics
    const tickets = selectedSprint.tickets.filter(t => t.typeScope !== 'Sprint');
    const totalScope = tickets.reduce((acc, ticket) => acc + ticket.estimation, 0);
    const completedWork = tickets
      .filter((ticket) => ticket.status === 'Done')
      .reduce((acc, ticket) => acc + ticket.estimation, 0);
    const remainingWork = totalScope - completedWork;
    const percentageComplete = totalScope > 0 ? (completedWork / totalScope) * 100 : 0;
    const summaryMetrics = { totalScope, completedWork, remainingWork, percentageComplete };

    // Dynamic Burn-down Data
    const startDate = new Date(selectedSprint.startDate);
    const endDate = new Date(selectedSprint.endDate);
    const sprintDays: { date: string, day: number }[] = [];
    let currentDate = new Date(startDate);
    let dayCount = 1;

    // Adjust for timezone to prevent date misalignments
    const getLocalDate = (date: Date) => new Date(date.valueOf() + date.getTimezoneOffset() * 60 * 1000);

    while (getLocalDate(currentDate) <= getLocalDate(endDate)) {
        sprintDays.push({ date: currentDate.toISOString().split('T')[0], day: dayCount++ });
        currentDate.setDate(currentDate.getDate() + 1);
    }

    const burnDownScope = selectedSprint.tickets
        .filter(t => t.typeScope !== 'Sprint')
        .reduce((acc, ticket) => acc + ticket.estimation, 0);
    const idealBurnPerDay = sprintDays.length > 1 ? burnDownScope / (sprintDays.length - 1) : burnDownScope;
    
    const dailyCompletions = new Map<string, {
        completed: number,
        dailyCompletedByTeam: Record<Team, number>,
        dailyBuildByTeam: Record<Team, number>,
        dailyRunByTeam: Record<Team, number>
    }>();

    for (const ticket of selectedSprint.tickets) {
        if (ticket.status === 'Done' && ticket.completionDate) {
            const completionDateStr = ticket.completionDate.split('T')[0];
            if (!dailyCompletions.has(completionDateStr)) {
                dailyCompletions.set(completionDateStr, {
                    completed: 0,
                    dailyCompletedByTeam: teams.reduce((acc, team) => ({...acc, [team]: 0}), {} as Record<Team, number>),
                    dailyBuildByTeam: teams.reduce((acc, team) => ({...acc, [team]: 0}), {} as Record<Team, number>),
                    dailyRunByTeam: teams.reduce((acc, team) => ({...acc, [team]: 0}), {} as Record<Team, number>),
                });
            }
            const dayCompletion = dailyCompletions.get(completionDateStr)!;
            dayCompletion.completed += ticket.estimation;
            dayCompletion.dailyCompletedByTeam[ticket.scope] = (dayCompletion.dailyCompletedByTeam[ticket.scope] || 0) + ticket.estimation;
            if(ticket.typeScope === 'Build') {
                dayCompletion.dailyBuildByTeam[ticket.scope] = (dayCompletion.dailyBuildByTeam[ticket.scope] || 0) + ticket.estimation;
            }
            if(ticket.typeScope === 'Run') {
                dayCompletion.dailyRunByTeam[ticket.scope] = (dayCompletion.dailyRunByTeam[ticket.scope] || 0) + ticket.estimation;
            }
        }
    }

    let remainingScopeForBurn = burnDownScope;
    const burnDownData: DailySprintData[] = sprintDays.map((day, index) => {
        const dayCompletion = dailyCompletions.get(day.date) || {
            completed: 0,
            dailyCompletedByTeam: teams.reduce((acc, team) => ({...acc, [team]: 0}), {} as Record<Team, number>),
            dailyBuildByTeam: teams.reduce((acc, team) => ({...acc, [team]: 0}), {} as Record<Team, number>),
            dailyRunByTeam: teams.reduce((acc, team) => ({...acc, [team]: 0}), {} as Record<Team, number>),
        };
        remainingScopeForBurn -= dayCompletion.completed;
        return {
            day: day.day,
            date: day.date,
            ideal: parseFloat((burnDownScope - (index * idealBurnPerDay)).toFixed(2)),
            actual: remainingScopeForBurn < 0 ? 0 : remainingScopeForBurn,
            completed: dayCompletion.completed,
            dailyCompletedByTeam: dayCompletion.dailyCompletedByTeam,
            dailyBuildByTeam: dayCompletion.dailyBuildByTeam,
            dailyRunByTeam: dayCompletion.dailyRunByTeam
        }
    });

    return {
      ...selectedSprint,
      summaryMetrics,
      burnDownData,
    }

  }, [selectedSprint]);

  const handleCreateSprint = (newSprintData: Omit<Sprint, 'id' | 'lastUpdatedAt' | 'tickets' | 'burnDownData'>) => {
    const newSprint: Sprint = {
      ...newSprintData,
      id: `sprint-${sprints.length + 1}-${Date.now()}`,
      lastUpdatedAt: new Date().toISOString(),
      tickets: [],
      burnDownData: [],
    };
    setSprints(prevSprints => [...prevSprints, newSprint]);
    setSelectedSprintId(newSprint.id);
  };

  const handleAddTask = (newTaskData: Omit<Ticket, "timeLogged">) => {
    const newTask: Ticket = { ...newTaskData, timeLogged: 0, dailyLogs: [] };
    setSprints(prevSprints =>
      prevSprints.map(sprint =>
        sprint.id === selectedSprintId
          ? { ...sprint, tickets: [...sprint.tickets, newTask], lastUpdatedAt: new Date().toISOString() }
          : sprint
      )
    );
  };

  const handleUpdateTask = (updatedTask: Ticket) => {
    setSprints(prevSprints =>
      prevSprints.map(sprint => {
        if (sprint.id !== selectedSprintId) return sprint;

        const newTickets = sprint.tickets.map(t => {
          if (t.id === updatedTask.id) {
            const wasDone = t.status === 'Done';
            const isDone = updatedTask.status === 'Done';
            if (!wasDone && isDone) {
              return { ...updatedTask, completionDate: new Date().toISOString() };
            } else if (wasDone && !isDone) {
              const { completionDate, ...rest } = updatedTask;
              return rest;
            }
            return updatedTask;
          }
          return t;
        });
        
        return {
          ...sprint,
          tickets: newTickets,
          lastUpdatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const handleDeleteTask = (taskId: string) => {
     setSprints(prevSprints =>
      prevSprints.map(sprint =>
        sprint.id === selectedSprintId
          ? {
              ...sprint,
              tickets: sprint.tickets.filter(t => t.id !== taskId),
              lastUpdatedAt: new Date().toISOString(),
            }
          : sprint
      )
    );
  };

  const handleLogProgress = (data: LogProgressData) => {
    setSprints(prevSprints =>
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
          };
          if (newTicket.status === 'Done') {
            newTicket.completionDate = new Date(data.date).toISOString();
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

          let updatedTicket = {
            ...ticket,
            status: data.status,
            dailyLogs: newDailyLogs,
            timeLogged: timeLogged,
          };

          if (!wasDone && isDone) {
            updatedTicket.completionDate = new Date(data.date).toISOString();
          } else if (wasDone && !isDone) {
            delete updatedTicket.completionDate;
          }
          
          newTickets = newTickets.map(t => t.id === ticketId ? updatedTicket : t);
        }

        return {
          ...sprint,
          tickets: newTickets,
          lastUpdatedAt: new Date().toISOString(),
        };
      })
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

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
       <NewSprintDialog isOpen={isNewSprintOpen} setIsOpen={setIsNewSprintOpen} onCreateSprint={handleCreateSprint} />
       <AddTaskDialog isOpen={isAddTaskOpen} setIsOpen={setIsAddTaskOpen} onAddTask={handleAddTask} />
       <GenerateSprintReportDialog isOpen={isReportOpen} setIsOpen={setIsReportOpen} sprint={selectedSprint} />
       <LogProgressDialog isOpen={isLogProgressOpen} setIsOpen={setIsLogProgressOpen} sprint={selectedSprint} onLogProgress={handleLogProgress} />

      <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Sprint Command Center</h1>
          <p className="text-sm text-muted-foreground">
            Data last updated at: {lastUpdated ? lastUpdated.toLocaleString() : 'N/A'}
          </p>
        </div>
        <div className="flex items-center gap-2">
            <div className="w-full sm:w-64">
                <Select value={selectedSprintId} onValueChange={setSelectedSprintId}>
                    <SelectTrigger>
                    <SelectValue placeholder="Select a sprint" />
                    </SelectTrigger>
                    <SelectContent>
                    {sprints.map((sprint) => (
                        <SelectItem key={sprint.id} value={sprint.id}>
                        {sprint.name}
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
            </div>
             <Button onClick={() => setIsNewSprintOpen(true)} variant="outline">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Sprint
            </Button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Scope</CardTitle>
            <GitCommitHorizontal className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processedSprint.summaryMetrics.totalScope}h</div>
            <p className="text-xs text-muted-foreground">Initial estimated hours</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Work Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processedSprint.summaryMetrics.completedWork}h</div>
            <p className="text-xs text-muted-foreground">Of {processedSprint.summaryMetrics.totalScope}h total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Work Remaining</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processedSprint.summaryMetrics.remainingWork}h</div>
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

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
           <Card className="h-full">
            <CardHeader>
                <CardTitle>Sprint Burn-down</CardTitle>
            </CardHeader>
            <CardContent>
                <BurnDownChart sprint={processedSprint} />
            </CardContent>
           </Card>
        </div>
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Scope Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                    <ScopeDistributionChart tickets={processedSprint.tickets} />
                </CardContent>
            </Card>
        </div>
      </div>
      
       <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
             <TeamCapacityTable sprint={processedSprint} />
        </div>
         <div className="lg:col-span-2 space-y-6">
            {/* Placeholder */}
        </div>
      </div>

       <TeamDailyProgress burnDownData={processedSprint.burnDownData} />

       <Card>
          <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Sprint Tasks</CardTitle>
               <div className="flex items-center gap-2">
                <Button onClick={() => setIsLogProgressOpen(true)}>
                    <NotebookPen className="mr-2 h-4 w-4" /> Log Progress
                </Button>
                <Button onClick={() => setIsAddTaskOpen(true)} variant="outline">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Task
                </Button>
                <Button onClick={() => setIsReportOpen(true)} variant="outline" disabled={!processedSprint.tickets.length}>
                    <BotMessageSquare className="mr-2 h-4 w-4" /> Generate Report
                </Button>
            </div>
          </CardHeader>
          <CardContent>
              <TaskTable 
                columns={columns} 
                data={processedSprint.tickets}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
                />
          </CardContent>
       </Card>

    </div>
  );
}
