
"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash2, Clock, User, Target, AlertTriangle, Calendar } from "lucide-react"
import type { Sprint, Ticket } from "@/types"
import { statuses, platforms } from "./data"
import { EditTaskDialog } from "./edit-task-dialog"

interface TaskCardProps {
    task: Ticket
    sprint: Sprint
    isSprintCompleted: boolean
    onUpdateTask: (task: Ticket) => void
    onDeleteTask: (taskId: string) => void
    onLogTime: (task: Ticket) => void
}

export function TaskCard({ task, sprint, isSprintCompleted, onUpdateTask, onDeleteTask, onLogTime }: TaskCardProps) {
    const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
    const statusInfo = statuses.find(s => s.value === task.status)
    const platformInfo = platforms.find(s => s.value === task.platform)
    const progress = task.estimation > 0 ? (task.timeLogged / task.estimation) * 100 : (task.timeLogged > 0 ? 100 : 0)
    const isOverEstimation = task.timeLogged > task.estimation && task.estimation > 0

    const sprintDayMap = React.useMemo(() => {
        const map = new Map<string, number>();
        sprint.sprintDays.forEach(d => map.set(d.date, d.day));
        return map;
    }, [sprint.sprintDays]);
    
    const loggedDays = React.useMemo(() => {
        if (!task.dailyLogs || !sprintDayMap) return "";
        return task.dailyLogs
            .map(log => sprintDayMap.get(log.date))
            .filter(Boolean)
            .map(day => `D${day}`)
            .join(', ');
    }, [task.dailyLogs, sprintDayMap]);

    const handleDelete = () => {
        if(window.confirm(`Are you sure you want to delete task: ${task.id}? This action cannot be undone.`)){
            onDeleteTask(task.id)
        }
    }

    return (
        <>
            <Card className="hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                        <a href={`https://inwidtd.atlassian.net/browse/${task.id}`} target="_blank" rel="noopener noreferrer" className="text-sm font-mono text-primary hover:underline cursor-pointer">
                            {task.id}
                        </a>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                    <MoreHorizontal className="w-4 h-4" />
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
                    </div>
                    
                    <div>
                        <h3 className="font-semibold text-card-foreground mb-1 line-clamp-2">{task.title}</h3>
                        {task.description && <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>}
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium text-foreground">{progress.toFixed(0)}%</span>
                        </div>
                        <Progress value={progress} className="h-1.5" />
                    </div>
                    
                    {task.tags && task.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {task.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs px-2 py-0.5">
                            {tag}
                        </Badge>
                        ))}
                    </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-2 border-t text-xs">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <User className="w-3.5 h-3.5" />
                            <div className="flex items-center gap-1.5">
                                <Avatar className="w-5 h-5">
                                    <AvatarFallback className="text-xs">
                                        {task.assignee?.split('.').map(n => n[0]).join('') || 'NA'}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="text-xs">{task.assignee || 'Unassigned'}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            {statusInfo?.icon && <statusInfo.icon className="w-3.5 h-3.5" />}
                            <span>{task.status}</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Target className="w-3.5 h-3.5" />
                            <span>{platformInfo?.label || task.platform}</span>
                        </div>
                         <div className="flex items-center gap-2 text-muted-foreground">
                            {loggedDays && (
                                <>
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>{loggedDays}</span>
                                </>
                            )}
                         </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            {isOverEstimation && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
                            <Clock className="w-3.5 h-3.5" />
                            <span>{task.timeLogged.toFixed(1)}h / {task.estimation.toFixed(1)}h</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <EditTaskDialog
                isOpen={isEditDialogOpen}
                setIsOpen={setIsEditDialogOpen}
                task={task}
                onUpdateTask={onUpdateTask}
            />
        </>
    )
}
