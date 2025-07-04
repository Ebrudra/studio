"use client"

import { Row } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"
import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Ticket } from "@/types"
import { EditTaskDialog } from "./edit-task-dialog"

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
  onUpdateTask: (task: Ticket) => void
  onDeleteTask: (taskId: string) => void
}

export function DataTableRowActions<TData>({
  row,
  onUpdateTask,
  onDeleteTask,
}: DataTableRowActionsProps<TData>) {
  const task = row.original as Ticket
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)

  return (
    <>
      <EditTaskDialog
        isOpen={isEditDialogOpen}
        setIsOpen={setIsEditDialogOpen}
        task={task}
        onUpdateTask={onUpdateTask}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onDeleteTask(task.id)}>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
