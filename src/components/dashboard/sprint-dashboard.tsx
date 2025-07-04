"use client";

import * as React from 'react';
import { useMemo, useState, useEffect } from 'react';
import { sprints } from '@/lib/data';
import type { Sprint, Ticket } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TaskTable } from './task-table';
import { BurnDownChart } from './burn-down-chart';
import { ScopeDistributionChart } from './scope-distribution-chart';
import { DailyCompletionChart } from './daily-completion-chart';
import { TeamCapacityTable } from './team-capacity-table';
import { BarChart, CheckCircle, Clock, GitCommitHorizontal, ListTodo, Users, Zap } from 'lucide-react';
import { columns } from './columns';

export default function SprintDashboard() {
  const [selectedSprintId, setSelectedSprintId] = useState<string>(sprints[0].id);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const selectedSprint = useMemo<Sprint | undefined>(
    () => sprints.find((sprint) => sprint.id === selectedSprintId),
    [selectedSprintId]
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

  if (!selectedSprint) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Sprint Command Center</h1>
          <p className="text-sm text-muted-foreground">
            Data last updated at: {lastUpdated ? lastUpdated.toLocaleString() : 'N/A'}
          </p>
        </div>
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
             <TeamCapacityTable tickets={selectedSprint.tickets} />
        </div>
        <div className="lg:col-span-2">
           {/* Placeholder for another chart or info */}
        </div>
      </div>

       <Card>
          <CardHeader>
              <CardTitle>Sprint Tasks</CardTitle>
          </CardHeader>
          <CardContent>
              <TaskTable columns={columns} data={selectedSprint.tickets} />
          </CardContent>
       </Card>

    </div>
  );
}
