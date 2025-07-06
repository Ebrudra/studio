
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DataTableColumnHeader } from "./data-table-column-header"
import { DataTableRowActions } from "./data-table-row-actions"
import { Ticket, TicketStatus, TicketTypeScope } from "@/types"
import { statuses } from "./data"
import { cn } from "@/lib/utils"

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
            <div className="flex items-center gap-2 w-[100px]">
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
                <a href={`https://inwidtd.atlassian.net/browse/${row.getValue("id")}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {row.getValue("id")}
                </a>
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
      const status = statuses.find(s => s.value === row.getValue("status"));
      if (!status) return null;

      const statusValue = row.getValue("status") as TicketStatus;

      const variantMap: Record<TicketStatus, "secondary" | "outline"> = {
          "To Do": "secondary",
          "Doing": "outline",
          "Done": "outline",
          "Blocked": "outline",
      };

      const classesMap: Partial<Record<TicketStatus, string>> = {
          "Doing": "bg-primary/10 text-primary border-transparent hover:bg-primary/20",
          "Done": "bg-success/10 text-success border-transparent hover:bg-success/20",
          "Blocked": "bg-destructive/10 text-destructive border-transparent hover:bg-destructive/20",
      };

      return (
        <Badge variant={variantMap[statusValue]} className={cn("w-[110px] flex justify-start", classesMap[statusValue])}>
            {status.icon && <status.icon className="mr-2 h-4 w-4" />}
            <span>{status.label}</span>
        </Badge>
      )
    },
  },
  {
    accessorKey: "scope",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Scope" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex items-center">
          <span>{row.getValue("scope")}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "typeScope",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type Scope" />
    ),
    cell: ({ row }) => {
       const typeScope = row.getValue("typeScope") as TicketTypeScope;
       const isOutOfScope = row.original.isOutOfScope;

       const variantMap: Record<TicketTypeScope, "default" | "warning" | "secondary"> = {
           "Build": "default",
           "Run": "warning",
           "Sprint": "secondary",
       };
       const variant = isOutOfScope ? "destructive" : variantMap[typeScope];
       const label = isOutOfScope ? "Out of Scope" : typeScope;

      return (
        <div className="flex items-center">
          <Badge variant={variant}>
            {label}
          </Badge>
        </div>
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
      const sprint = (table.options.meta as any)?.sprint;
      if (!row.original.dailyLogs?.length || !sprint?.sprintDays) {
        return null;
      }
      
      const sprintDayMap = new Map(sprint.sprintDays.map((d: any) => [d.date, d.day]));

      const loggedDayNumbers = row.original.dailyLogs.map(log => {
        const dayNumber = sprintDayMap.get(log.date);
        return dayNumber ? `D${dayNumber}` : null;
      }).filter(Boolean).join(', ');

      return (
        <div className="flex items-center justify-center">
          <span className="truncate max-w-[100px]">{loggedDayNumbers}</span>
        </div>
      )
    },
    enableSorting: false,
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
       const { onUpdateTask, onDeleteTask, onLogTime, sprint } = table.options.meta as any;
      return <DataTableRowActions row={row} onUpdateTask={onUpdateTask} onDeleteTask={onDeleteTask} onLogTime={onLogTime} isSprintCompleted={sprint.status === 'Completed'}/>
    },
  },
]
