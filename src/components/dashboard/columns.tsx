"use client"

import { ColumnDef } from "@tanstack/react-table"

import { Badge } from "@/components/ui/badge"

import { DataTableColumnHeader } from "./data-table-column-header"
import { DataTableRowActions } from "./data-table-row-actions"
import { Ticket } from "@/types"
import { statuses } from "./data"


export const columns: ColumnDef<Ticket>[] = [
  {
    accessorKey: "id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Ticket" />
    ),
    cell: ({ row }) => <div className="w-[80px]">
        <a href={`https://inwidtd.atlassian.net/browse/${row.getValue("id")}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            {row.getValue("id")}
        </a>
    </div>,
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
        <div className="flex space-x-2">
          <span className="max-w-[500px] truncate font-medium">
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
      const status = statuses.find(
        (status) => status.value === row.getValue("status")
      )

      if (!status) {
        return null
      }

      return (
        <div className="flex w-[100px] items-center">
          {status.icon && (
            <status.icon className="mr-2 h-4 w-4 text-muted-foreground" />
          )}
          <span>{status.label}</span>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
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
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex items-center">
          <span>{row.getValue("type")}</span>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "typeScope",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type Scope" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex items-center">
          <Badge variant="outline">{row.getValue("typeScope")}</Badge>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
   {
    accessorKey: "estimation",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Estimation (h)" />
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
    id: "actions",
    cell: ({ row, table }) => {
       const { onUpdateTask, onDeleteTask } = table.options.meta as {
        onUpdateTask: (task: Ticket) => void
        onDeleteTask: (taskId: string) => void
      };
      return <DataTableRowActions row={row} onUpdateTask={onUpdateTask} onDeleteTask={onDeleteTask} />
    },
  },
]
