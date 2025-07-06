
"use client"

import { Row } from "@tanstack/react-table"
import { Clock, Edit, MoreHorizontal, Trash2 } from "lucide-react"
import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Ticket } from "@/types"
import { EditTaskDialog } from "./edit-task-dialog"

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
  isSprintCompleted: boolean
  onUpdateTask: (task: Ticket) => void
  onDeleteTask: (taskId: string) => void
  onLogTime: (task: Ticket) => void
}

export function DataTableRowActions<TData>({
  row,
  isSprintCompleted,
  onUpdateTask,
  onDeleteTask,
  onLogTime,
}: DataTableRowActionsProps<TData>) {
  const task = row.original as Ticket
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)

  const handleDelete = () => {
    if(window.confirm(`Are you sure you want to delete task: ${task.id}? This action cannot be undone.`)){
        onDeleteTask(task.id)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onLogTime(task)} disabled={isSprintCompleted}>
            <Clock className="w-4 h-4 mr-2" />
            Log Time
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)} disabled={isSprintCompleted}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDelete} className="text-destructive" disabled={isSprintCompleted}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditTaskDialog
          isOpen={isEditDialogOpen}
          setIsOpen={setIsEditDialogOpen}
          task={task}
          onUpdateTask={onUpdateTask}
      />
    </>
  )
}
