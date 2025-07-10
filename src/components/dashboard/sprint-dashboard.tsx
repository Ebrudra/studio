
"use client";

import * as React from 'react';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { platforms as platformTeams } from "./data";
import { assigneeConfig } from '@/lib/config';
import type { Sprint, Ticket, DailyLog, TicketStatus, TicketTypeScope, Team, TeamCapacity, SprintDay } from '@/types';
import { format } from "date-fns";
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
import { useToast } from '@/hooks/use-toast';
import { getSprints, addSprint, updateSprint, deleteSprint, syncSprint } from '@/actions/sprints';
import { ToastAction } from '../ui/toast';

const SprintScopingView = ({
  sprint,
  onFinalizeScope,
  onOpenAddTask,
  onOpenBulkUpload,
  onUndoLastUpload,
  canUndo,
  ...taskViewProps
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
          Add all the initial 'Build' tickets for this sprint. You can add them manually or upload a CSV file.
          Any 'Build' tickets added after finalizing the scope will be marked as 'Out of Scope'.
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
          {...taskViewProps}
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
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [selectedSprintId, setSelectedSprintId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  const [isNewSprintOpen, setIsNewSprintOpen] = useState(false);
  const [isEditSprintOpen, setIsEditSprintOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isLogProgressOpen, setIsLogProgressOpen] = useState(false);
  const [taskToLog, setTaskToLog] = useState<Ticket | null>(null);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [undoState, setUndoState] = useState<{ tickets: Ticket[] } | null>(null);

  const { toast } = useToast();
  
  const fetchSprints = useCallback(async (sprintToSelectId?: string) => {
    setIsLoading(true);
    try {
        const sprintsFromFs = await getSprints();
        setSprints(sprintsFromFs);

        if (sprintToSelectId) {
            setSelectedSprintId(sprintToSelectId);
        } else if (sprintsFromFs.length > 0 && !selectedSprintId) {
            setSelectedSprintId(sprintsFromFs[0].id);
        } else if (sprintsFromFs.length === 0) {
            setSelectedSprintId(undefined);
        }
    } catch (err) {
        console.error("Failed to fetch sprints:", err);
        toast({ variant: "destructive", title: "Error", description: "Could not load sprints." });
    } finally {
        setIsLoading(false);
    }
  }, [selectedSprintId, toast]);

  useEffect(() => {
    fetchSprints();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const selectedSprint = useMemo<Sprint | undefined>(
    () => sprints.find((sprint) => sprint.id === selectedSprintId),
    [sprints, selectedSprintId]
  );
  
  const processedSprint = useMemo(() => {
    if (!selectedSprint) return null;

    const tickets = selectedSprint.tickets || [];

    // Recalculate capacities to ensure they are always up-to-date with person days
    const teamCapacity: Record<Team, TeamCapacity> = {} as any;
    if (selectedSprint.teamPersonDays) {
      for (const team of platformTeams) {
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
                    dataByDate.set(log.date, platformTeams.reduce((acc, team) => ({...acc, [team.value]: {build: 0, run: 0, buffer: 0}}), {} as Record<Team, { build: number; run: number, buffer: 0 }>));
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
        progress: dataByDate.get(dayInfo.date) || platformTeams.reduce((acc, team) => ({...acc, [team.value]: {build: 0, run: 0, buffer: 0}}), {} as Record<Team, { build: number; run: number, buffer: 0 }>)
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
      const buildTickets = (s.tickets || []).filter(t => t.typeScope === 'Build');
      const completed = buildTickets.reduce((acc, t) => acc + t.timeLogged, 0);
      const duration = s.teamPersonDays ? Object.values(s.teamPersonDays).reduce((a, b) => a + b, 0) / Object.keys(s.teamPersonDays).length : s.sprintDays?.length || 1;
      return duration > 0 ? completed / duration : 0;
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
  
  const handleCreateSprint = async (newSprintData: Omit<Sprint, 'id' | 'lastUpdatedAt'>) => {
    try {
        const newSprint = await addSprint(newSprintData);
        await fetchSprints(newSprint.id);
        toast({ title: "Sprint Created", description: `Sprint "${newSprint.name}" has been successfully created.` });
    } catch (error) {
       toast({ variant: "destructive", title: "Error", description: "Failed to create new sprint." });
       console.error("Error creating sprint:", error);
    }
  };
  
  const handleUpdateSprint = async (updatedSprintData: Partial<Omit<Sprint, 'id'>>, showToast = true) => {
    if (!selectedSprintId) return;
    try {
        const updatedSprint = await updateSprint(selectedSprintId, updatedSprintData);
        setSprints(s => s.map(sp => sp.id === selectedSprintId ? updatedSprint : sp));
        if (showToast) {
            toast({ title: "Sprint Updated", description: "Sprint details have been saved." });
        }
    } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Failed to update sprint." });
        console.error("Error updating sprint:", error);
    }
  };

  const handleAddTask = async (newTaskData: Omit<Ticket, "timeLogged">) => {
    if (!selectedSprint) return;
    const isOutOfScope = selectedSprint.status === 'Active' && newTaskData.typeScope === 'Build';
    const newTask: Ticket = {
      ...newTaskData,
      title: newTaskData.title || newTaskData.id,
      timeLogged: 0,
      dailyLogs: [],
      creationDate: new Date().toISOString().split('T')[0],
      isOutOfScope,
    };
    setUndoState(null); // Invalidate undo state on manual change
    await handleUpdateSprint({ tickets: [...(selectedSprint.tickets || []), newTask] });
  };

  const handleUpdateTask = async (updatedTask: Ticket) => {
    if (!selectedSprint) return;
    const finalTask = { ...updatedTask, title: updatedTask.title || updatedTask.id };
    if (finalTask.type === 'Bug' || finalTask.type === 'Buffer') {
      finalTask.estimation = finalTask.timeLogged;
    }
    const newTickets = (selectedSprint.tickets || []).map(t => (t.id === finalTask.id) ? finalTask : t);
    setUndoState(null); // Invalidate undo state on manual change
    await handleUpdateSprint({ tickets: newTickets });
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!selectedSprint) return;
    const newTickets = (selectedSprint.tickets || []).filter(t => t.id !== taskId);
    setUndoState(null); // Invalidate undo state on manual change
    await handleUpdateSprint({ tickets: newTickets });
    toast({ title: "Task Deleted", description: `Task ${taskId} has been removed.` })
  };
  
  const handleLogRowAction = (task: Ticket) => {
    setTaskToLog(task);
    setIsLogProgressOpen(true);
  };

  const handleLogProgress = async (data: LogProgressData) => {
    if (!selectedSprint) return;

    let newTickets = JSON.parse(JSON.stringify(selectedSprint.tickets || []));
    const isNewTicket = data.ticketId === 'new-ticket';
    const ticketId = isNewTicket ? data.newTicketId! : data.ticketId!;
    let ticket = newTickets.find((t: Ticket) => t.id === ticketId);
    
    const dayNumber = parseInt(data.day.replace('D', ''), 10);
    const logDate = selectedSprint.sprintDays.find(d => d.day === dayNumber)?.date;
    if (!logDate) return;

    const newLog: DailyLog = {
      date: logDate,
      loggedHours: data.loggedHours,
    };

    if (isNewTicket) {
      const isOutOfScope = selectedSprint.status === 'Active' && data.typeScope === 'Build';
      const newTicketToAdd: Ticket = {
        id: ticketId,
        title: data.newTicketTitle || data.newTicketId!,
        platform: data.platform,
        type: data.type,
        typeScope: data.typeScope,
        estimation: data.estimation,
        status: data.status,
        dailyLogs: [newLog],
        timeLogged: newLog.loggedHours,
        creationDate: new Date(logDate).toISOString().split('T')[0],
        description: data.newTicketDescription,
        tags: data.newTicketTags ? data.newTicketTags.split(',').map(t => t.trim()) : [],
        assignee: assigneeConfig[data.platform],
        isOutOfScope,
      };
      if (newTicketToAdd.type === 'Bug' || newTicketToAdd.type === 'Buffer') {
        newTicketToAdd.estimation = newTicketToAdd.timeLogged;
      }
      if (newTicketToAdd.status === 'Done') {
        newTicketToAdd.completionDate = new Date(logDate).toISOString().split('T')[0];
      }
      newTickets.push(newTicketToAdd);
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

      ticket.status = data.status;
      ticket.dailyLogs = newDailyLogs;
      ticket.timeLogged = timeLogged;
      
      if (ticket.type === 'Bug' || ticket.type === 'Buffer') {
        ticket.estimation = timeLogged;
      }

      if (!wasDone && isDone) {
        ticket.completionDate = new Date(logDate).toISOString().split('T')[0];
      } else if (wasDone && !isDone) {
        delete ticket.completionDate;
      }
    }
    setUndoState(null); // Invalidate undo state on manual change
    await handleUpdateSprint({ tickets: newTickets });
  };
  
  const handleBulkUpload = (uploadFn: (data: any[]) => void, originalTickets: Ticket[]) => (data: any[]) => {
    setUndoState({ tickets: originalTickets });
    uploadFn(data);
    toast({
      title: "Bulk Upload Successful",
      description: "Data has been imported. You can undo this action.",
      action: <ToastAction altText="Undo" onClick={handleUndoLastUpload}>Undo</ToastAction>,
    });
  };
  
  const handleBulkUploadTasks = async (tasks: BulkTask[]) => {
    if (!selectedSprint) return;
    
    const existingTicketIds = new Set((selectedSprint.tickets || []).map(t => t.id));
    const uniqueNewTickets = tasks.filter(t => !existingTicketIds.has(t.id));
    const addedCount = uniqueNewTickets.length;
    
    const newTickets: Ticket[] = uniqueNewTickets.map(task => {
        let typeScope: TicketTypeScope = 'Build';
        if (task.type === 'Bug') typeScope = 'Run';
        else if (task.type === 'Buffer') typeScope = 'Sprint';

        const isOutOfScope = selectedSprint.status === 'Active' && typeScope === 'Build';
        const canonicalPlatform = platformTeams.find(t => t.value.toLowerCase() === task.platform.toLowerCase())?.value || 'Web';
        const estimation = Number(task.estimation) || 0;
        const tags = task.tags ? task.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];

        return {
          id: task.id,
          title: task.title || task.id,
          description: task.description,
          platform: canonicalPlatform,
          type: task.type,
          estimation: estimation,
          typeScope,
          timeLogged: 0,
          dailyLogs: [],
          status: 'To Do',
          creationDate: new Date().toISOString().split('T')[0],
          assignee: assigneeConfig[canonicalPlatform],
          tags: tags,
          isOutOfScope,
        };
      });

    if (newTickets.length > 0) {
      await handleUpdateSprint({ tickets: [...(selectedSprint.tickets || []), ...newTickets]}, false);
    }
  };

  const handleBulkLogProgress = async (logs: BulkProgressLog[]) => {
    if (!selectedSprint) return;
    
    let processedCount = 0;
    let newTicketsCount = 0;
    
    let newTickets = JSON.parse(JSON.stringify(selectedSprint.tickets || []));
    const dayToDateMap = new Map<number, string>();
    (selectedSprint.sprintDays || []).forEach(d => dayToDateMap.set(d.day, d.date));
      
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

      let ticket = newTickets.find((t: Ticket) => t.id === log.ticketId);

      if (!ticket) {
        if (!log.platform || !log.type) continue;
        
        let typeScope: TicketTypeScope = log.typeScope || 'Build';
        if (log.type === 'Bug') typeScope = 'Run';
        else if (log.type === 'Buffer') typeScope = 'Sprint';
        else if (log.type === 'User story') typeScope = 'Build';
        
        const isOutOfScope = selectedSprint.status === 'Active' && typeScope === 'Build';
        const estimation = Number(log.estimation) || ((log.type === 'Bug' || log.type === 'Buffer') ? Number(log.loggedHours) : 0);
        const canonicalPlatform = platformTeams.find(t => t.value.toLowerCase() === log.platform!.toLowerCase())?.value || 'Web';
        const tags = log.tags ? log.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

        ticket = {
          id: log.ticketId,
          title: log.title || log.ticketId,
          description: log.description,
          platform: canonicalPlatform,
          type: log.type,
          typeScope: typeScope,
          estimation: estimation,
          status: 'To Do',
          timeLogged: 0,
          dailyLogs: [],
          isOutOfScope,
          creationDate: new Date(logDate).toISOString().split('T')[0],
          assignee: assigneeConfig[canonicalPlatform],
          tags: tags,
        };
        newTickets.push(ticket);
        newTicketsCount++;
      }

      if (!ticket.dailyLogs) {
        ticket.dailyLogs = [];
      }

      const newLog: DailyLog = { date: logDate, loggedHours: Number(log.loggedHours) || 0 };
      const existingLogIndex = ticket.dailyLogs.findIndex((l: DailyLog) => l.date === logDate);

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
    
    newTickets.forEach((ticket: Ticket) => {
        if (ticket.dailyLogs) {
            ticket.timeLogged = ticket.dailyLogs.reduce((acc: number, log: DailyLog) => acc + log.loggedHours, 0);
            if (ticket.type === 'Bug' || ticket.type === 'Buffer') {
                ticket.estimation = ticket.timeLogged;
            }
        }
    });

    await handleUpdateSprint({ tickets: newTickets }, false);
  };

  const handleUndoLastUpload = async () => {
    if (!undoState) return;
    await handleUpdateSprint({ tickets: undoState.tickets }, false);
    toast({ title: "Undo Successful", description: "Reverted to the state before the last upload." });
    setUndoState(null);
  };
  
  const handleClearData = async () => {
    if (window.confirm("Are you sure you want to clear all tickets and logs for this sprint? This action cannot be undone.")) {
      await handleUpdateSprint({ tickets: [], reportFilePaths: [], isSyncedToFirebase: false });
      toast({ title: "Sprint Data Cleared", description: "All tickets and logs have been removed." });
    }
  };

  const handleCompleteSprint = async () => {
    if (window.confirm("Are you sure you want to complete this sprint? You will no longer be able to edit it.")) {
      await handleUpdateSprint({ status: 'Completed' });
      toast({ title: "Sprint Completed", description: "The sprint has been archived." });
    }
  };

  const handleDeleteSprint = async () => {
    if (!selectedSprintId || !selectedSprint) return;
    if (window.confirm(`Are you sure you want to delete sprint: "${selectedSprint?.name}"? This action cannot be undone.`)) {
      await deleteSprint(selectedSprintId);
      setSelectedSprintId(undefined); // Reset selection
      await fetchSprints();
    }
  };

  const handleFinalizeScope = async () => {
    if (window.confirm("Are you sure you want to finalize the scope? You won't be able to add more 'Build' tickets to the initial scope after this.")) {
      if (!selectedSprint) return;
      setUndoState(null); // Invalidate undo state on finalizing
      // Create a snapshot of the current tickets and mark them as initial scope
      const ticketsWithInitialScope = (selectedSprint.tickets || []).map(ticket => ({
        ...ticket,
        isInitialScope: true,
      }));

      await handleUpdateSprint({
        status: 'Active',
        tickets: ticketsWithInitialScope,
      });

      toast({ title: "Sprint Scope Finalized", description: "The sprint is now active." });
    }
  };

  const handleEditScope = async () => {
     if (window.confirm("This will revert the sprint to the 'Scoping' phase, allowing you to change which tasks are part of the initial scope. Continue?")) {
        await handleUpdateSprint({ status: 'Scoping' });
        toast({ title: "Sprint reverted to Scoping", description: "You can now edit the initial scope." });
    }
  };

   const handleSyncToFirebase = async () => {
    if (!selectedSprintId) return;
    try {
        const syncedSprint = await syncSprint(selectedSprintId);
        await fetchSprints(selectedSprintId);
        toast({ title: "Sprint Synced", description: "Sprint has been backed up to Firebase." });
    } catch (error) {
        console.error("Failed to sync sprint:", error);
        toast({ variant: "destructive", title: "Sync Failed", description: "Could not sync sprint to Firebase." });
    }
  };

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
       <BulkUploadDialog isOpen={isBulkUploadOpen} setIsOpen={setIsBulkUploadOpen} onBulkUploadTasks={handleBulkUpload(handleBulkUploadTasks, selectedSprint.tickets || [])} onBulkLogProgress={handleBulkUpload(handleBulkLogProgress, selectedSprint.tickets || [])} />

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
                          <div className="flex items-center justify-between">
                              <CardTitle className="flex items-center gap-2">
                                  Sprint Tasks
                                  <Badge variant="outline">{(processedSprint.tickets || []).length}</Badge>
                              </CardTitle>

                              <div className="flex items-center gap-2">
                                  <Button onClick={() => { setUndoState({ tickets: selectedSprint.tickets || [] }); setIsBulkUploadOpen(true); }} variant="outline" size="sm" disabled={isSprintCompleted}>
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
                          <SprintTasksView columns={columns} data={processedSprint.tickets || []} onUpdateTask={handleUpdateTask} onDeleteTask={(taskId) => { if (window.confirm(`Are you sure you want to delete task: ${taskId}? This action cannot be undone.`)) { handleDeleteTask(taskId); } }} onLogTime={handleLogRowAction} sprint={processedSprint} />
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
