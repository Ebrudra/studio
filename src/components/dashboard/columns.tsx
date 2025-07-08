
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DataTableColumnHeader } from "./data-table-column-header"
import { DataTableRowActions } from "./data-table-row-actions"
import { Ticket, TicketStatus, TicketTypeScope, Sprint } from "@/types"
import { statuses } from "./data"
import { cn } from "@/lib/utils"

const getScopeDisplay = (ticket: Ticket) => {
  switch (ticket.typeScope) {
    case 'Build':
      return 'Task/Build';
    case 'Run':
      return 'Bug/Run';
    case 'Sprint':
      return 'Buffer/Sprint';
    default:
      return '';
  }
}

const getScopeBadgeVariant = (typeScope: TicketTypeScope) => {
  switch (typeScope) {
    case 'Build': return 'build';
    case 'Run': return 'run';
    case 'Sprint': return 'sprint';
  }
}

const getStatusBadgeVariant = (status: TicketStatus) => {
  switch (status) {
    case 'Done': return 'done';
    case 'Doing': return 'doing';
    case 'To Do': return 'todo';
    case 'Blocked': return 'blocked';
  }
}

export const columns: ColumnDef<Ticket>[] = [
  {
    accessorKey: "id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Ticket" />
    ),
    cell: ({ row }) => {
        const ticket = row.original;
        const isOverEstimation = ticket.timeLogged > ticket.estimation && ticket.estimation > 0;
        return (
            <div className="flex items-center gap-2">
                {isOverEstimation && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                               <AlertTriangle className="h-4 w-4 text-amber-500" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Logged time has exceeded estimation.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
                 <Badge variant="outline" className="font-mono">
                    <a href={`https://inwidtd.atlassian.net/browse/${row.getValue("id")}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {row.getValue("id")}
                    </a>
                </Badge>
            </div>
        )
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "title",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Title" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex space-x-2 items-center">
          <span className="max-w-[350px] truncate font-medium">
            {row.getValue("title")}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as TicketStatus;
      if (!status) return null;

      return (
        <Badge variant={getStatusBadgeVariant(status)}>
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: "platform",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Platform" />
    ),
    cell: ({ row }) => {
      return (
         <Badge variant="secondary">
          {row.getValue("platform")}
        </Badge>
      )
    },
  },
   {
    id: "scope",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Scope" />
    ),
    cell: ({ row }) => {
       const ticket = row.original;
       const isOutOfScope = ticket.isOutOfScope;
       
       const label = isOutOfScope ? "Out of Scope" : getScopeDisplay(ticket);
       const variant = isOutOfScope ? "destructive" : getScopeBadgeVariant(ticket.typeScope);

      return (
          <Badge variant={variant}>
            {label}
          </Badge>
      )
    },
  },
   {
    accessorKey: "estimation",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Est. (h)" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex items-center justify-center">
          <span>{row.getValue("estimation")}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "timeLogged",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Logged (h)" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex items-center justify-center">
          <span>{row.getValue("timeLogged")}</span>
        </div>
      )
    },
  },
  {
    id: "loggedDays",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Logged Days" />
    ),
    cell: ({ row, table }) => {
      const task = row.original as Ticket;
      const { sprintDayMap } = table.options.meta as { sprintDayMap: Map<string, number> };

      if (!task.dailyLogs?.length || !sprintDayMap) {
        return null;
      }

      const loggedDays = task.dailyLogs
        .map((log) => sprintDayMap.get(log.date))
        .filter((day): day is number => !!day)
        .sort((a, b) => a - b)
        .map((day) => `D${day}`)
        .join(", ");

      return <span>{loggedDays}</span>;
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
       const { onUpdateTask, onDeleteTask, onLogTime, sprint } = table.options.meta as any;
      return <DataTableRowActions row={row} onUpdateTask={onUpdateTask} onDeleteTask={onDeleteTask} onLogTime={onLogTime} isSprintCompleted={sprint.status === 'Completed'}/>
    },
  },
]
