
"use client";

import * as React from 'react';
import { useMemo, useState, useEffect } from 'react';
import { sprints as initialSprints, teams } from '@/lib/data';
import { assigneeConfig } from '@/lib/config';
import type { Sprint, Ticket, DailyLog, TicketStatus, TicketTypeScope, Team, TeamCapacity, SprintDay } from '@/types';
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TaskTable } from './task-table';
import { SprintCharts } from './sprint-charts';
import { TeamCapacityTable } from './team-capacity-table';
import { TeamDailyProgress, type DailyProgressData } from './team-daily-progress';
import { Button } from '@/components/ui/button';
import { CheckCircle, GitCommitHorizontal, ListTodo, Plus, BarChart3, Zap, Upload, AlertCircle, History, Trash2, Check, Settings, FileArchive, FileText, TrendingUp, TrendingDown, Target, Clock, Users } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
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
import { useToast } from '@/hooks/use-toast';
import { InsightBulb } from './insight-bulb';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

export default function SprintDashboard() {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [previousSprints, setPreviousSprints] = useState<Sprint[] | null>(null);
  const [selectedSprintId, setSelectedSprintId] = useState<string | undefined>();
  const [isLoaded, setIsLoaded] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [isNewSprintOpen, setIsNewSprintOpen] = useState(false);
  const [isEditSprintOpen, setIsEditSprintOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isLogProgressOpen, setIsLogProgressOpen] = useState(false);
  const [taskToLog, setTaskToLog] = useState<Ticket | null>(null);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'byDay' | 'byTeam'>('list');


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
        setSprints(initialSprints); // Fallback to initial data on error
    } finally {
        setIsLoaded(true);
    }
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

    // NOTE: This ensures display is always correct, but the underlying data is mutated in handlers
    const tickets = selectedSprint.tickets.map(ticket => 
        (ticket.type === 'Bug' || ticket.type === 'Buffer') ? { ...ticket, estimation: ticket.timeLogged } : ticket
    );

    const buildCapacity = Object.values(selectedSprint.teamCapacity || {}).reduce((acc, team) => acc + team.plannedBuild, 0);
    const runCapacity = Object.values(selectedSprint.teamCapacity || {}).reduce((acc, team) => acc + team.plannedRun, 0);
    const totalCapacity = buildCapacity + runCapacity;

    const bdcTickets = tickets.filter(t => t.typeScope === 'Build' || t.typeScope === 'Run');
    const totalScope = bdcTickets.reduce((acc, ticket) => acc + ticket.estimation, 0);

    const completedWork = tickets
      .filter((ticket) => ticket.status === 'Done')
      .reduce((acc, ticket) => acc + ticket.estimation, 0);

    const remainingWork = totalScope - completedWork;
    const percentageComplete = totalScope > 0 ? (completedWork / totalScope) * 100 : 0;
    const summaryMetrics = { totalScope, completedWork, remainingWork, percentageComplete };

    return { ...selectedSprint, summaryMetrics, tickets, totalCapacity, buildCapacity, runCapacity };
  }, [selectedSprint]);

  const dailyProgressData = useMemo((): DailyProgressData[] => {
    if (!selectedSprint) return [];
    
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

    return (selectedSprint.sprintDays || []).map(dayInfo => ({
        day: dayInfo.day,
        date: dayInfo.date,
        progress: dataByDate.get(dayInfo.date) || teams.reduce((acc, team) => ({...acc, [team]: {build: 0, run: 0, buffer: 0}}), {} as Record<Team, { build: number; run: number; buffer: 0 }>)
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

    const runEffort = processedSprint.tickets.filter(t => t.typeScope === 'Run').reduce((acc, t) => acc + t.timeLogged, 0);
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
      const buildTickets = s.tickets.filter(t => t.typeScope === 'Build');
      const completed = buildTickets.filter(t => t.status === 'Done').reduce((acc, t) => acc + t.estimation, 0);
      const duration = s.sprintDays?.length || 1;
      return duration > 0 ? completed / duration : 0;
    });

    const currentVelocity = velocityHistory.length > 0 ? velocityHistory[velocityHistory.length - 1] : 0;
    const previousVelocity = velocityHistory.length > 1 ? velocityHistory[velocityHistory.length - 2] : 0;
    const velocityTrend = currentVelocity >= previousVelocity ? "up" : "down";
    const velocityChange = previousVelocity > 0 ? Math.abs(((currentVelocity - previousVelocity) / previousVelocity) * 100) : 0;

    const capacityData = (Object.keys(processedSprint.teamCapacity || {}) as Team[])
      .filter(t => t !== 'Out of Scope')
      .map(team => {
        const teamTickets = (processedSprint.tickets || []).filter(t => t.scope === team)
        const capacity = processedSprint.teamCapacity?.[team];
        const plannedBuild = capacity?.plannedBuild ?? 0;
        const plannedRun = capacity?.plannedRun ?? 0;
        const deliveredBuild = teamTickets.filter(t => t.typeScope === 'Build' && t.status === 'Done').reduce((acc, t) => acc + t.estimation, 0)
        const totalPlanned = plannedBuild + plannedRun
        const totalDelivered = deliveredBuild + teamTickets.filter(t => t.typeScope === 'Run').reduce((acc, t) => acc + t.timeLogged, 0);
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

  const updateSprints = (updateFn: (sprints: Sprint[]) => Sprint[]) => {
    setSprints(currentSprints => {
        const newSprints = updateFn(currentSprints);
        return newSprints;
    });
  };

  const handleBulkUpdate = (updateFn: (sprints: Sprint[]) => Sprint[], toastInfo: { title: string, description: string }) => {
    setPreviousSprints(sprints);
    updateSprints(updateFn);
    toast(toastInfo);
  }

  const handleRollback = () => {
    if (previousSprints) {
      setSprints(previousSprints);
      setPreviousSprints(null);
      toast({ title: "Rollback successful", description: "The last data import has been undone." });
    }
  }

  const handleCreateSprint = (newSprintData: Omit<Sprint, 'id' | 'lastUpdatedAt' | 'tickets' | 'generatedReport'>) => {
    const newSprint: Sprint = {
      ...newSprintData,
      id: `sprint-${sprints.length + 1}-${Date.now()}`,
      lastUpdatedAt: new Date().toISOString(),
      tickets: [],
      generatedReport: undefined,
    };
    updateSprints(prevSprints => [...prevSprints, newSprint]);
    setSelectedSprintId(newSprint.id);
  };
  
  const handleUpdateSprint = (updatedSprintData: Sprint) => {
    updateSprints(prevSprints =>
        prevSprints.map(sprint =>
            sprint.id === updatedSprintData.id ? updatedSprintData : sprint
        )
    );
    toast({ title: "Sprint Updated", description: "Sprint details have been saved." });
  };

  const handleAddTask = (newTaskData: Omit<Ticket, "timeLogged">) => {
    const newTask: Ticket = { ...newTaskData, title: newTaskData.title || newTaskData.id, timeLogged: 0, dailyLogs: [], creationDate: new Date().toISOString().split('T')[0] };

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
        
        const finalTask = { ...updatedTask, title: updatedTask.title || updatedTask.id };

        if (finalTask.type === 'Bug' || finalTask.type === 'Buffer') {
          finalTask.estimation = finalTask.timeLogged;
        }

        const newTickets = sprint.tickets.map(t => (t.id === finalTask.id) ? finalTask : t);
        return { ...sprint, tickets: newTickets, lastUpdatedAt: new Date().toISOString() };
      })
    );
  };

  const handleDeleteTask = (taskId: string) => {
    if(window.confirm(`Are you sure you want to delete task: ${taskId}? This action cannot be undone.`)){
        updateSprints(prevSprints =>
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
        toast({ title: "Task Deleted", description: `Task ${taskId} has been removed.` })
    }
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
        
        const dayNumber = parseInt(data.day.replace('D', ''), 10);
        const logDate = sprint.sprintDays.find(d => d.day === dayNumber)?.date;
        if (!logDate) return sprint; // Should not happen if UI is correct

        const newLog: DailyLog = {
          date: logDate,
          loggedHours: data.loggedHours,
        };

        if (isNewTicket) {
          const newTicket: Ticket = {
            id: ticketId,
            title: data.newTicketTitle || data.newTicketId!,
            scope: data.scope,
            type: data.type,
            typeScope: data.typeScope,
            estimation: data.estimation,
            status: data.status,
            dailyLogs: [newLog],
            timeLogged: newLog.loggedHours,
            creationDate: new Date(logDate).toISOString().split('T')[0],
            description: data.description,
            tags: data.tags,
            assignee: assigneeConfig[data.scope],
          };
          if (newTicket.type === 'Bug' || newTicket.type === 'Buffer') {
            newTicket.estimation = newTicket.timeLogged;
          }
          if (newTicket.status === 'Done') {
            newTicket.completionDate = new Date(logDate).toISOString().split('T')[0];
          }
          newTickets.push(newTicket);
        } else if (ticket) {
          const newDailyLogs = [...(ticket.dailyLogs || [])];
          const existingLogIndex = newDailyLogs.findIndex(l => l.date === logDate);

          if (existingLogIndex !== -1) {
            newDailyLogs[existingLogIndex].loggedHours += data.loggedHours;
          } else {
            newDailyLogs.push(newLog);
          }
          
          const timeLogged = newDailyLogs.reduce((acc, log) => acc + log.loggedHours, 0);
          const wasDone = ticket.status === 'Done';
          const isDone = data.status === 'Done';

          let updatedTicket: Ticket = { ...ticket, status: data.status, dailyLogs: newDailyLogs, timeLogged };
          
          if (updatedTicket.type === 'Bug' || updatedTicket.type === 'Buffer') {
            updatedTicket.estimation = timeLogged;
          }

          if (!wasDone && isDone) {
            updatedTicket.completionDate = new Date(logDate).toISOString().split('T')[0];
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
    const updateFn = (prevSprints: Sprint[]) => {
      const sprintToUpdate = prevSprints.find(s => s.id === selectedSprintId);
      if (!sprintToUpdate) return prevSprints;

      const existingTicketIds = new Set(sprintToUpdate.tickets.map(t => t.id));
      const uniqueNewTickets = tasks.filter(t => !existingTicketIds.has(t.id));
      addedCount = uniqueNewTickets.length;

      const newTickets: Ticket[] = uniqueNewTickets.map(task => {
        let typeScope: TicketTypeScope = 'Build';
        if (task.type === 'Bug') typeScope = 'Run';
        else if (task.type === 'Buffer') typeScope = 'Sprint';
        else if (task.scope === 'Out of Scope') typeScope = 'Build';

        const canonicalScope = teams.find(t => t.toLowerCase() === task.scope.toLowerCase()) || 'Out of Scope';
        const estimation = Number(task.estimation) || 0;
        const tags = task.tags ? task.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];

        return {
          id: task.id,
          title: task.title || task.id,
          description: task.description,
          scope: canonicalScope,
          type: task.type,
          estimation: estimation,
          typeScope,
          timeLogged: 0,
          dailyLogs: [],
          status: 'To Do',
          creationDate: new Date().toISOString().split('T')[0],
          assignee: assigneeConfig[canonicalScope],
          tags: tags,
        };
      });

      if (newTickets.length > 0) {
        return prevSprints.map(s => s.id === selectedSprintId ? { ...s, tickets: [...s.tickets, ...newTickets], lastUpdatedAt: new Date().toISOString() } : s);
      }
      return prevSprints;
    };
    handleBulkUpdate(updateFn, { title: "Task Upload Complete", description: `${addedCount} tasks added. ${tasks.length - addedCount} duplicates skipped.` });
  };

  const handleBulkLogProgress = (logs: BulkProgressLog[]) => {
    let processedCount = 0;
    let newTicketsCount = 0;

    const updateFn = (prevSprints: Sprint[]) => {
      const newSprints: Sprint[] = JSON.parse(JSON.stringify(prevSprints));
      const sprintToUpdate = newSprints.find(s => s.id === selectedSprintId);
      if (!sprintToUpdate) return prevSprints;
      
      const dayToDateMap = new Map<number, string>();
      (sprintToUpdate.sprintDays || []).forEach(d => dayToDateMap.set(d.day, d.date));
      
      logs.sort((a, b) => {
          const dayA = parseInt(a.day?.replace('D', '') || '0', 10);
          const dayB = parseInt(b.day?.replace('D', '') || '0', 10);
          return dayA - dayB;
      });

      for (const log of logs) {
        if (!log.ticketId || !log.day || !log.loggedHours || !log.status) continue;
        
        const dayNumber = parseInt(log.day.replace('D', ''), 10);
        if (isNaN(dayNumber)) continue;
        
        const logDate = dayToDateMap.get(dayNumber);
        if (!logDate) continue;

        let ticket = sprintToUpdate.tickets.find((t: Ticket) => t.id === log.ticketId);

        if (!ticket) {
          if (!log.scope || !log.type) continue;
          
          let typeScope: TicketTypeScope = log.typeScope || 'Build';
          if (log.type === 'Bug') typeScope = 'Run';
          else if (log.type === 'Buffer') typeScope = 'Sprint';
          else if (log.type === 'User story') typeScope = 'Build';
          
          const estimation = Number(log.estimation) || ((log.type === 'Bug' || log.type === 'Buffer') ? Number(log.loggedHours) : 0);
          const canonicalScope = teams.find(t => t.toLowerCase() === log.scope!.toLowerCase()) || 'Out of Scope';
          const tags = log.tags ? log.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

          ticket = {
            id: log.ticketId,
            title: log.title || log.ticketId,
            description: log.description,
            scope: canonicalScope,
            type: log.type,
            typeScope: typeScope,
            estimation: estimation,
            status: 'To Do',
            timeLogged: 0,
            dailyLogs: [],
            isOutOfScope: log.scope === 'Out of Scope',
            creationDate: new Date(logDate).toISOString().split('T')[0],
            assignee: assigneeConfig[canonicalScope],
            tags: tags,
          };
          sprintToUpdate.tickets.push(ticket);
          newTicketsCount++;
        }

        if (!ticket.dailyLogs) {
          ticket.dailyLogs = [];
        }

        const newLog: DailyLog = { date: logDate, loggedHours: Number(log.loggedHours) || 0 };
        const existingLogIndex = ticket.dailyLogs.findIndex(l => l.date === logDate);

        if (existingLogIndex > -1) {
          ticket.dailyLogs[existingLogIndex].loggedHours += newLog.loggedHours;
        } else {
          ticket.dailyLogs.push(newLog);
        }

        ticket.status = log.status;
        const wasDone = !!ticket.completionDate;
        const isDone = log.status === 'Done';

        if (!wasDone && isDone) {
          ticket.completionDate = new Date(logDate).toISOString().split('T')[0];
        } else if (wasDone && !isDone) {
          delete ticket.completionDate;
        }

        processedCount++;
      }
      
      sprintToUpdate.tickets.forEach((ticket: Ticket) => {
          if (ticket.dailyLogs) {
              ticket.timeLogged = ticket.dailyLogs.reduce((acc: number, log: DailyLog) => acc + log.loggedHours, 0);
              if (ticket.type === 'Bug' || ticket.type === 'Buffer') {
                  ticket.estimation = ticket.timeLogged;
              }
          }
      });

      sprintToUpdate.lastUpdatedAt = new Date().toISOString();
      return newSprints;
    };
    
    handleBulkUpdate(updateFn, {
      title: "Progress Log Upload Complete",
      description: `${processedCount} logs processed. ${newTicketsCount} new tickets were created.`,
    });
  };
  
  const handleClearData = () => {
    if (window.confirm("Are you sure you want to clear all tickets and logs for this sprint? This action cannot be undone.")) {
      updateSprints(
        prev => prev.map(s => s.id === selectedSprintId ? { ...s, tickets: [], generatedReport: undefined, lastUpdatedAt: new Date().toISOString() } : s)
      );
      toast({ title: "Sprint Data Cleared", description: "All tickets and logs have been removed." });
    }
  };

  const handleCompleteSprint = () => {
    if (window.confirm("Are you sure you want to complete this sprint? You will no longer be able to edit it.")) {
      updateSprints(
        prev => prev.map(s => s.id === selectedSprintId ? { ...s, status: 'Completed', lastUpdatedAt: new Date().toISOString() } : s)
      );
      toast({ title: "Sprint Completed", description: "The sprint has been archived." });
    }
  };

  const handleDeleteSprint = () => {
    if (!selectedSprintId) return;
    if (window.confirm(`Are you sure you want to delete sprint: "${selectedSprint?.name}"? This action cannot be undone.`)) {
      updateSprints(prevSprints => {
          const newSprints = prevSprints.filter(s => s.id !== selectedSprintId);
          if (newSprints.length > 0) {
            const latestSprint = newSprints.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0];
            setSelectedSprintId(latestSprint.id);
          } else {
            setSelectedSprintId(undefined);
          }
          return newSprints;
      });
      toast({ title: "Sprint Deleted", description: "The sprint has been removed." });
    }
  };

  const tableData = useMemo(() => {
    if (!processedSprint) return [];

    if (viewMode === 'list') {
        return processedSprint.tickets;
    }

    if (viewMode === 'byDay') {
        const groupedByDay: { [key: string]: Ticket[] } = {};
        
        processedSprint.tickets.forEach(ticket => {
            ticket.dailyLogs?.forEach(log => {
                if (!groupedByDay[log.date]) {
                    groupedByDay[log.date] = [];
                }
                const ticketForDay = { ...ticket, dayLog: log };
                
                if (!groupedByDay[log.date].some(t => t.id === ticket.id)) {
                    groupedByDay[log.date].push(ticketForDay);
                }
            });
        });

        const flatData: any[] = [];
        const sprintDayMap = new Map((processedSprint.sprintDays || []).map((d) => [d.date, `Day ${d.day}`]));
        const sortedDates = Object.keys(groupedByDay).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

        sortedDates.forEach(date => {
            const dayLabel = sprintDayMap.get(date) || 'Unknown Day';
            flatData.push({ isGroupHeader: true, title: `${dayLabel} (${new Date(date).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' })})` });
            flatData.push(...groupedByDay[date]);
        });
        return flatData;
    }
    
    if (viewMode === 'byTeam') {
        const groupedByTeam: { [key in Team]?: Ticket[] } = {};
        
        processedSprint.tickets.forEach(ticket => {
            if (!groupedByTeam[ticket.scope]) {
                groupedByTeam[ticket.scope] = [];
            }
            groupedByTeam[ticket.scope].push(ticket);
        });
        
        const flatData: any[] = [];
        teams.forEach(team => {
            if (groupedByTeam[team] && groupedByTeam[team]!.length > 0) {
                flatData.push({ isGroupHeader: true, title: team });
                flatData.push(...groupedByTeam[team]!);
            }
        })
        return flatData;
    }

    return [];
  }, [processedSprint, viewMode]);


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
                <Plus className="mr-2 h-4 w-4" />
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
       {selectedSprint && <EditSprintDialog isOpen={isEditSprintOpen} setIsOpen={setIsEditSprintOpen} sprint={selectedSprint} onUpdateSprint={handleUpdateSprint} />}
       <AddTaskDialog isOpen={isAddTaskOpen} setIsOpen={setIsAddTaskOpen} onAddTask={handleAddTask} />
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
                    <DropdownMenuItem onClick={handleCompleteSprint} disabled={isSprintCompleted}>
                        <Check className="mr-2 h-4 w-4" /> Complete Sprint
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
            <TabsTrigger value="tasks">Sprint Tasks</TabsTrigger>
            <TabsTrigger value="charts">Charts & Analytics</TabsTrigger>
            <TabsTrigger value="capacity">Team Capacity</TabsTrigger>
            <TabsTrigger value="progress">Daily Progress</TabsTrigger>
        </TabsList>
        <TabsContent value="tasks" className="mt-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        Sprint Tasks
                        <Badge variant="outline">{processedSprint.tickets.length}</Badge>
                    </CardTitle>

                    <div className="flex items-center gap-2">
                        {previousSprints && <Button onClick={handleRollback} variant="destructive" size="sm"><History className="mr-2 h-4 w-4" /> Rollback</Button>}
                        <Button onClick={() => setIsBulkUploadOpen(true)} variant="outline" size="sm" disabled={isSprintCompleted}>
                            <Upload className="w-4 h-4 mr-2" />
                            Bulk Upload
                        </Button>
                        <Button onClick={() => { setTaskToLog(null); setIsLogProgressOpen(true); }} variant="outline" size="sm" disabled={isSprintCompleted}>
                            <FileText className="w-4 h-4 mr-2" />
                            Log Progress
                        </Button>
                        <Button onClick={() => setIsAddTaskOpen(true)} variant="outline" size="sm" disabled={isSprintCompleted}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Task
                        </Button>
                    </div>
                    </div>
                </CardHeader>
              <CardContent>
                  <TaskTable columns={columns} data={tableData} onUpdateTask={handleUpdateTask} onDeleteTask={handleDeleteTask} onLogTime={handleLogRowAction} sprint={processedSprint} viewMode={viewMode} onViewModeChange={setViewMode} />
              </CardContent>
           </Card>
        </TabsContent>
        <TabsContent value="charts" className="mt-6">
             <SprintCharts sprint={processedSprint} allSprints={sprints} dailyProgress={dailyProgressData} />
        </TabsContent>
        <TabsContent value="capacity" className="mt-6">
            <TeamCapacityTable sprint={processedSprint} />
        </TabsContent>
        <TabsContent value="progress" className="mt-6">
            <TeamDailyProgress dailyProgress={dailyProgressData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
