"use client"

import * as React from "react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { scopes, ticketTypes, typeScopes, statuses } from "./data"
import type { Sprint, Ticket, TicketStatus, TicketType, TicketTypeScope, Team } from "@/types"

export type LogProgressData = z.infer<typeof formSchema>;

interface LogProgressDialogProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  sprint: Sprint
  onLogProgress: (data: LogProgressData) => void
  taskToLog?: Ticket | null
  onClose: () => void
}

const formSchema = z.object({
  scope: z.enum(scopes.map(s => s.value) as [Team, ...Team[]], { required_error: "Scope is required" }),
  ticketId: z.string({ required_error: "Ticket is required" }),
  newTicketId: z.string().optional(),
  newTicketTitle: z.string().optional(),
  type: z.enum(ticketTypes.map(t => t.value) as [TicketType, ...TicketType[]]),
  typeScope: z.enum(typeScopes.map(ts => ts.value) as [TicketTypeScope, ...TicketTypeScope[]]),
  date: z.string({ required_error: "Day is required" }),
  estimation: z.coerce.number(),
  loggedHours: z.coerce.number().min(0.1, "Logged hours must be greater than 0"),
  status: z.enum(statuses.map(s => s.value) as [TicketStatus, ...TicketStatus[]]),
}).refine(data => {
    if (data.ticketId === 'new-ticket') {
        return !!data.newTicketId && !!data.newTicketTitle;
    }
    return true;
}, {
    message: "New Ticket ID and Title are required",
    path: ["newTicketTitle"],
});


export function LogProgressDialog({ isOpen, setIsOpen, sprint, onLogProgress, taskToLog, onClose }: LogProgressDialogProps) {
  const form = useForm<LogProgressData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      loggedHours: 0,
    },
  })

  const { watch, setValue, reset, control } = form

  const selectedScope = watch("scope")
  const selectedTicketId = watch("ticketId")
  const selectedType = watch("type")
  const loggedHours = watch("loggedHours")
  const isNewTicket = selectedTicketId === 'new-ticket'

  const sprintDays = React.useMemo(() => {
    if (!sprint.startDate || !sprint.endDate) return []
    const days = []
    let currentDate = new Date(sprint.startDate)
    const endDate = new Date(sprint.endDate)
    let dayCount = 1
     const getLocalDate = (date: Date) => new Date(date.valueOf() + date.getTimezoneOffset() * 60 * 1000);

    while (getLocalDate(currentDate) <= getLocalDate(endDate)) {
      const dateString = currentDate.toISOString().split('T')[0]
      days.push({
        value: dateString,
        label: `Day ${dayCount} (${new Date(dateString).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' })})`,
      })
      currentDate.setDate(currentDate.getDate() + 1)
      dayCount++
    }
    return days
  }, [sprint.startDate, sprint.endDate])

  const filteredTickets = React.useMemo(() => {
    if (!selectedScope) return []
    return sprint.tickets.filter(t => t.scope === selectedScope)
  }, [sprint.tickets, selectedScope])

  React.useEffect(() => {
    if (taskToLog) {
        setValue("scope", taskToLog.scope);
        setValue("ticketId", taskToLog.id);
        setValue("type", taskToLog.type);
        setValue("typeScope", taskToLog.typeScope);
        setValue("estimation", taskToLog.estimation);
        setValue("status", taskToLog.status);
    } else {
        reset();
    }
  }, [taskToLog, setValue, reset])

  React.useEffect(() => {
    if (selectedTicketId && selectedTicketId !== 'new-ticket') {
      const ticket = sprint.tickets.find(t => t.id === selectedTicketId)
      if (ticket) {
        setValue("type", ticket.type)
        setValue("typeScope", ticket.typeScope)
        setValue("estimation", ticket.estimation)
        setValue("status", ticket.status)
      }
    } else {
        setValue("type", ticketTypes[0].value)
        setValue("typeScope", typeScopes[0].value)
        setValue("estimation", 0)
        setValue("status", statuses[0].value)
    }
  }, [selectedTicketId, sprint.tickets, setValue])
  
   React.useEffect(() => {
    if (isNewTicket) {
      if (selectedType === 'Bug' || selectedType === 'Buffer') {
        setValue('estimation', loggedHours)
      }
    }
  }, [isNewTicket, selectedType, loggedHours, setValue])

  React.useEffect(() => {
    if (selectedType === 'Bug') {
        setValue('typeScope', 'Run');
    } else if (selectedType === 'Buffer') {
        setValue('typeScope', 'Sprint');
    } else if (selectedType === 'User story' || selectedType === 'Task') {
        setValue('typeScope', 'Build');
    }
  }, [selectedType, setValue]);

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  }

  const onSubmit = (values: LogProgressData) => {
    onLogProgress(values)
    handleClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Log Daily Progress</DialogTitle>
          <DialogDescription>
            Log time spent on a ticket for a specific day in the sprint.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={control}
                    name="scope"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Scope (Team)</FormLabel>
                        <Select onValueChange={(v) => { field.onChange(v); setValue("ticketId", ""); }} value={field.value} disabled={!!taskToLog}>
                        <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select a team" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {scopes.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={control}
                    name="ticketId"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Ticket</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={!selectedScope || !!taskToLog}>
                        <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select a ticket" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="new-ticket">-- Add New Ticket --</SelectItem>
                            {filteredTickets.map(t => <SelectItem key={t.id} value={t.id}>{t.id}: {t.title}</SelectItem>)}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
            
            {isNewTicket && (
                 <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={control}
                        name="newTicketId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>New Ticket ID</FormLabel>
                                <FormControl><Input placeholder="WIN-5555" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={control}
                        name="newTicketTitle"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>New Ticket Title</FormLabel>
                                <FormControl><Input placeholder="Fix critical issue" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                 </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={control}
                    name="type"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={!isNewTicket}>
                        <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select a type" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {ticketTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={control}
                    name="typeScope"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Type Scope</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={!isNewTicket}>
                        <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select type scope" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {typeScopes.map(ts => <SelectItem key={ts.value} value={ts.value}>{ts.label}</SelectItem>)}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
            
             <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={control}
                    name="date"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Day</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select a day" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {sprintDays.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={control}
                    name="loggedHours"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Time Logged (h)</FormLabel>
                            <FormControl><Input type="number" {...field} /></FormControl>
                             <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                 <FormField
                    control={control}
                    name="estimation"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Estimation (h)</FormLabel>
                            <FormControl><Input type="number" {...field} disabled={!isNewTicket} /></FormControl>
                             <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={control}
                    name="status"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select a status" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {statuses.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
            
            <DialogFooter>
               <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
              <Button type="submit">Log Progress</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
