
"use client"

import { Row } from "@tanstack/react-table"
import { Clock, Pencil, Trash2 } from "lucide-react"
import * as React from "react"
import { Button } from "@/components/ui/button"
import type { Ticket } from "@/types"
import { EditTaskDialog } from "./edit-task-dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

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
    <TooltipProvider delayDuration={100}>
        <div className="flex items-center space-x-1">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => onLogTime(task)} disabled={isSprintCompleted}>
                        <Clock className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Log Time</p>
                </TooltipContent>
            </Tooltip>
             <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => setIsEditDialogOpen(true)} disabled={isSprintCompleted}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Edit Task</p>
                </TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={handleDelete} className="text-destructive hover:text-destructive" disabled={isSprintCompleted}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Delete Task</p>
                </TooltipContent>
            </Tooltip>

            <EditTaskDialog
                isOpen={isEditDialogOpen}
                setIsOpen={setIsEditDialogOpen}
                task={task}
                onUpdateTask={onUpdateTask}
            />
        </div>
    </TooltipProvider>
  )
}

    