"use client";

import * as React from 'react';
import { useMemo, useState, useEffect } from 'react';
import { sprints as initialSprints } from '@/lib/data';
import type { Sprint, Ticket } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TaskTable } from './task-table';
import { BurnDownChart } from './burn-down-chart';
import { ScopeDistributionChart } from './scope-distribution-chart';
import { DailyCompletionChart } from './daily-completion-chart';
import { TeamCapacityTable } from './team-capacity-table';
import { Button } from '@/components/ui/button';
import { BarChart, CheckCircle, Clock, GitCommitHorizontal, ListTodo, PlusCircle, BotMessageSquare, Users, Zap } from 'lucide-react';
import { columns } from './columns';
import { NewSprintDialog } from './new-sprint-dialog';
import { AddTaskDialog } from './add-task-dialog';
import { GenerateSprintReportDialog } from './generate-sprint-report-dialog';

export default function SprintDashboard() {
  const [sprints, setSprints] = useState<Sprint[]>(initialSprints);
  const [selectedSprintId, setSelectedSprintId] = useState<string>(sprints[0].id);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [isNewSprintOpen, setIsNewSprintOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const selectedSprint = useMemo<Sprint | undefined>(
    () => sprints.find((sprint) => sprint.id === selectedSprintId),
    [sprints, selectedSprintId]
  );
  
  useEffect(() => {
    if (selectedSprint) {
      setLastUpdated(new Date(selectedSprint.lastUpdatedAt));
    }
  }, [selectedSprint]);

  const summaryMetrics = useMemo(() => {
    if (!selectedSprint) return { totalScope: 0, completedWork: 0, remainingWork: 0, percentageComplete: 0 };
    
    const tickets = selectedSprint.tickets.filter(t => t.typeScope !== 'Sprint');
    const totalScope = tickets.reduce((acc, ticket) => acc + ticket.estimation, 0);
    const completedWork = tickets
      .filter((ticket) => ticket.status === 'Done')
      .reduce((acc, ticket) => acc + ticket.estimation, 0);
    const remainingWork = totalScope - completedWork;
    const percentageComplete = totalScope > 0 ? (completedWork / totalScope) * 100 : 0;
    
    return { totalScope, completedWork, remainingWork, percentageComplete };
  }, [selectedSprint]);

  const handleCreateSprint = (newSprintData: Omit<Sprint, 'id' | 'lastUpdatedAt' | 'tickets' | 'burnDownData'>) => {
    const newSprint: Sprint = {
      ...newSprintData,
      id: `sprint-${sprints.length + 1}`,
      lastUpdatedAt: new Date().toISOString(),
      tickets: [],
      burnDownData: [],
    };
    setSprints(prevSprints => [...prevSprints, newSprint]);
    setSelectedSprintId(newSprint.id);
  };

  const handleAddTask = (newTaskData: Omit<Ticket, "timeLogged">) => {
    const newTask: Ticket = { ...newTaskData, timeLogged: 0 };
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
      prevSprints.map(sprint =>
        sprint.id === selectedSprintId
          ? {
              ...sprint,
              tickets: sprint.tickets.map(t => (t.id === updatedTask.id ? updatedTask : t)),
              lastUpdatedAt: new Date().toISOString(),
            }
          : sprint
      )
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

  if (!selectedSprint) {
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
            <div className="text-2xl font-bold">{summaryMetrics.totalScope}h</div>
            <p className="text-xs text-muted-foreground">Initial estimated hours</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Work Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryMetrics.completedWork}h</div>
            <p className="text-xs text-muted-foreground">Of {summaryMetrics.totalScope}h total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Work Remaining</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryMetrics.remainingWork}h</div>
            <p className="text-xs text-muted-foreground">To be completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Percentage Complete</CardTitle>
            <Zap className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryMetrics.percentageComplete.toFixed(1)}%</div>
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
                <BurnDownChart sprint={selectedSprint} />
            </CardContent>
           </Card>
        </div>
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Scope Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                    <ScopeDistributionChart tickets={selectedSprint.tickets} />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Daily Work Completed by Team</CardTitle>
                </CardHeader>
                <CardContent>
                    <DailyCompletionChart sprint={selectedSprint} />
                </CardContent>
            </Card>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
             <TeamCapacityTable sprint={selectedSprint} />
        </div>
        <div className="lg:col-span-2">
           {/* Placeholder for another chart or info */}
        </div>
      </div>

       <Card>
          <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Sprint Tasks</CardTitle>
               <div className="flex items-center gap-2">
                <Button onClick={() => setIsAddTaskOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Task
                </Button>
                <Button onClick={() => setIsReportOpen(true)} variant="outline" disabled={!selectedSprint.tickets.length}>
                    <BotMessageSquare className="mr-2 h-4 w-4" /> Generate Report
                </Button>
            </div>
          </CardHeader>
          <CardContent>
              <TaskTable 
                columns={columns} 
                data={selectedSprint.tickets}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
                />
          </CardContent>
       </Card>

    </div>
  );
}
