
"use client";

import * as React from 'react';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { getSprints, addSprint, updateSprint, deleteSprint, syncSprint } from '@/actions/sprints';
import type { Sprint, Ticket, TicketTypeScope } from '@/types';
import { platforms as platformTeams } from "@/components/dashboard/data";
import { assigneeConfig } from '@/lib/config';
import type { LogProgressData } from '@/components/dashboard/log-progress-dialog';
import type { BulkTask, BulkProgressLog } from '@/components/dashboard/bulk-upload-dialog';

export function useSprints() {
    const [sprints, setSprints] = React.useState<Sprint[]>([]);
    const [selectedSprintId, setSelectedSprintId] = React.useState<string | undefined>();
    const [isLoading, setIsLoading] = React.useState(true);
    const [undoState, setUndoState] = React.useState<{ tickets: Ticket[] } | null>(null);

    // Dialog states
    const [isNewSprintOpen, setIsNewSprintOpen] = React.useState(false);
    const [isEditSprintOpen, setIsEditSprintOpen] = React.useState(false);
    const [isAddTaskOpen, setIsAddTaskOpen] = React.useState(false);
    const [isLogProgressOpen, setIsLogProgressOpen] = React.useState(false);
    const [taskToLog, setTaskToLog] = React.useState<Ticket | null>(null);
    const [isBulkUploadOpen, setIsBulkUploadOpen] = React.useState(false);

    const { toast } = useToast();

    const fetchSprints = React.useCallback(async (sprintToSelectId?: string) => {
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

    React.useEffect(() => {
        fetchSprints();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const selectedSprint = React.useMemo<Sprint | undefined>(
        () => sprints.find((sprint) => sprint.id === selectedSprintId),
        [sprints, selectedSprintId]
    );

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
        setUndoState(null);
        await handleUpdateSprint({ tickets: [...(selectedSprint.tickets || []), newTask] });
    };

    const handleUpdateTask = async (updatedTask: Ticket) => {
        if (!selectedSprint) return;
        const finalTask = { ...updatedTask, title: updatedTask.title || updatedTask.id };
        if (finalTask.type === 'Bug' || finalTask.type === 'Buffer') {
            finalTask.estimation = finalTask.timeLogged;
        }
        const newTickets = (selectedSprint.tickets || []).map(t => (t.id === finalTask.id) ? finalTask : t);
        setUndoState(null);
        await handleUpdateSprint({ tickets: newTickets });
    };

    const handleDeleteTask = async (taskId: string) => {
        if (!selectedSprint) return;
        const newTickets = (selectedSprint.tickets || []).filter(t => t.id !== taskId);
        setUndoState(null);
        await handleUpdateSprint({ tickets: newTickets });
        toast({ title: "Task Deleted", description: `Task ${taskId} has been removed.` });
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

        const newLog = { date: logDate, loggedHours: data.loggedHours };

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
        setUndoState(null);
        await handleUpdateSprint({ tickets: newTickets });
    };

    const handleUndoLastUpload = async () => {
        if (!undoState) return;
        await handleUpdateSprint({ tickets: undoState.tickets }, false);
        toast({ title: "Undo Successful", description: "Reverted to the state before the last upload." });
        setUndoState(null);
    };

    const bulkUploadWrapper = (uploadFn: (data: any[]) => void) => (data: any[]) => {
        setUndoState({ tickets: selectedSprint?.tickets || [] });
        uploadFn(data);
        toast({
            title: "Bulk Upload Successful",
            description: "Data has been imported. You can undo this action.",
            action: <ToastAction altText="Undo" onClick={handleUndoLastUpload}>Undo</ToastAction>,
        });
    };

    const handleBulkUploadTasks = bulkUploadWrapper(async (tasks: BulkTask[]) => {
        if (!selectedSprint) return;
        const existingTicketIds = new Set((selectedSprint.tickets || []).map(t => t.id));
        const uniqueNewTickets = tasks.filter(t => !existingTicketIds.has(t.id));
        
        const newTickets: Ticket[] = uniqueNewTickets.map(task => {
            let typeScope: TicketTypeScope = 'Build';
            if (task.type === 'Bug') typeScope = 'Run';
            else if (task.type === 'Buffer') typeScope = 'Sprint';
            const isOutOfScope = selectedSprint.status === 'Active' && typeScope === 'Build';
            const canonicalPlatform = platformTeams.find(t => t.value.toLowerCase() === task.platform.toLowerCase())?.value || 'Web';
            const estimation = Number(task.estimation) || 0;
            const tags = task.tags ? task.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];
            return {
                id: task.id, title: task.title || task.id, description: task.description, platform: canonicalPlatform,
                type: task.type, estimation, typeScope, timeLogged: 0, dailyLogs: [], status: 'To Do',
                creationDate: new Date().toISOString().split('T')[0], assignee: assigneeConfig[canonicalPlatform], tags, isOutOfScope,
            };
        });
        if (newTickets.length > 0) {
            await handleUpdateSprint({ tickets: [...(selectedSprint.tickets || []), ...newTickets] }, false);
        }
    });

    const handleBulkLogProgress = bulkUploadWrapper(async (logs: BulkProgressLog[]) => {
        if (!selectedSprint) return;
        let newTickets = JSON.parse(JSON.stringify(selectedSprint.tickets || []));
        const dayToDateMap = new Map<number, string>();
        (selectedSprint.sprintDays || []).forEach(d => dayToDateMap.set(d.day, d.date));
        logs.sort((a, b) => parseInt(a.day?.replace('D', '') || '0', 10) - parseInt(b.day?.replace('D', '') || '0', 10));

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
                if (log.type === 'Bug') typeScope = 'Run'; else if (log.type === 'Buffer') typeScope = 'Sprint'; else if (log.type === 'User story') typeScope = 'Build';
                const isOutOfScope = selectedSprint.status === 'Active' && typeScope === 'Build';
                const estimation = Number(log.estimation) || ((log.type === 'Bug' || log.type === 'Buffer') ? Number(log.loggedHours) : 0);
                const canonicalPlatform = platformTeams.find(t => t.value.toLowerCase() === log.platform!.toLowerCase())?.value || 'Web';
                const tags = log.tags ? log.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
                ticket = {
                    id: log.ticketId, title: log.title || log.ticketId, description: log.description, platform: canonicalPlatform, type: log.type, typeScope,
                    estimation, status: 'To Do', timeLogged: 0, dailyLogs: [], isOutOfScope, creationDate: new Date(logDate).toISOString().split('T')[0],
                    assignee: assigneeConfig[canonicalPlatform], tags,
                };
                newTickets.push(ticket);
            }

            if (!ticket.dailyLogs) ticket.dailyLogs = [];
            const newLog = { date: logDate, loggedHours: Number(log.loggedHours) || 0 };
            const existingLogIndex = ticket.dailyLogs.findIndex((l: any) => l.date === logDate);
            if (existingLogIndex > -1) ticket.dailyLogs[existingLogIndex].loggedHours += newLog.loggedHours;
            else ticket.dailyLogs.push(newLog);

            ticket.status = log.status;
            const wasDone = !!ticket.completionDate;
            const isDone = log.status === 'Done';
            if (!wasDone && isDone) ticket.completionDate = new Date(logDate).toISOString().split('T')[0];
            else if (wasDone && !isDone) delete ticket.completionDate;
        }
        
        newTickets.forEach((ticket: Ticket) => {
            if (ticket.dailyLogs) {
                ticket.timeLogged = ticket.dailyLogs.reduce((acc: number, log: any) => acc + log.loggedHours, 0);
                if (ticket.type === 'Bug' || ticket.type === 'Buffer') ticket.estimation = ticket.timeLogged;
            }
        });
        await handleUpdateSprint({ tickets: newTickets }, false);
    });

    const handleFinalizeScope = async () => {
        if (!selectedSprint) return;
        if (window.confirm("Are you sure you want to finalize the scope? You won't be able to add more 'Build' tickets to the initial scope after this.")) {
            setUndoState(null);
            const ticketsWithInitialScope = (selectedSprint.tickets || []).map(ticket => ({ ...ticket, isInitialScope: true }));
            await handleUpdateSprint({ status: 'Active', tickets: ticketsWithInitialScope });
            toast({ title: "Sprint Scope Finalized", description: "The sprint is now active." });
        }
    };

    const handleEditScope = async () => {
        if (window.confirm("This will revert the sprint to the 'Scoping' phase, allowing you to change which tasks are part of the initial scope. Continue?")) {
            await handleUpdateSprint({ status: 'Scoping' });
            toast({ title: "Sprint reverted to Scoping", description: "You can now edit the initial scope." });
        }
    };

    const handleCompleteSprint = async () => {
        if (window.confirm("Are you sure you want to complete this sprint? You will no longer be able to edit it.")) {
            await handleUpdateSprint({ status: 'Completed' });
            toast({ title: "Sprint Completed", description: "The sprint has been archived." });
        }
    };

    const handleClearData = async () => {
        if (window.confirm("Are you sure you want to clear all tickets and logs for this sprint? This action cannot be undone.")) {
            await handleUpdateSprint({ tickets: [], reportFilePaths: [], isSyncedToFirebase: false });
            toast({ title: "Sprint Data Cleared", description: "All tickets and logs have been removed." });
        }
    };

    const handleDeleteSprint = async () => {
        if (!selectedSprintId || !selectedSprint) return;
        if (window.confirm(`Are you sure you want to delete sprint: "${selectedSprint?.name}"? This action cannot be undone.`)) {
            await deleteSprint(selectedSprintId);
            await fetchSprints(); // Refetch to update list and selection
        }
    };

    const handleSyncToFirebase = async () => {
        if (!selectedSprintId) return;
        try {
            await syncSprint(selectedSprintId);
            await fetchSprints(selectedSprintId);
            toast({ title: "Sprint Synced", description: "Sprint has been backed up to Firebase." });
        } catch (error) {
            console.error("Failed to sync sprint:", error);
            toast({ variant: "destructive", title: "Sync Failed", description: "Could not sync sprint to Firebase." });
        }
    };

    return {
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
        handleDeleteSprint,
        handleSyncToFirebase,
        undoState,
        handleUndoLastUpload,
        // Dialogs
        isNewSprintOpen, setIsNewSprintOpen,
        isEditSprintOpen, setIsEditSprintOpen,
        isAddTaskOpen, setIsAddTaskOpen,
        isLogProgressOpen, setIsLogProgressOpen,
        taskToLog, setTaskToLog,
        isBulkUploadOpen, setIsBulkUploadOpen,
    };
}
