
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
import { Textarea } from "@/components/ui/textarea"
import { platforms, ticketTypes, typeScopes, statuses } from "./data"
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
  platform: z.enum(platforms.map(p => p.value) as [Team, ...Team[]], { required_error: "Platform is required" }),
  ticketId: z.string({ required_error: "Ticket is required" }),
  newTicketId: z.string().optional(),
  newTicketTitle: z.string().optional(),
  newTicketDescription: z.string().optional(),
  newTicketTags: z.string().optional(),
  type: z.enum(ticketTypes.map(t => t.value) as [TicketType, ...TicketType[]]),
  typeScope: z.enum(typeScopes.map(ts => ts.value) as [TicketTypeScope, ...TicketTypeScope[]]),
  day: z.string({ required_error: "Day is required" }),
  estimation: z.coerce.number(),
  loggedHours: z.coerce.number().min(0.1, "Logged hours must be greater than 0"),
  status: z.enum(statuses.map(s => s.value) as [TicketStatus, ...TicketTypeStatus[]]),
}).refine(data => {
    if (data.ticketId === 'new-ticket') {
        return !!data.newTicketId && data.newTicketId.length > 0;
    }
    return true;
}, {
    message: "New Ticket ID is required.",
    path: ["newTicketId"],
});

const defaultLogProgressValues: Partial<LogProgressData> = {
    newTicketId: "",
    newTicketTitle: "",
    newTicketDescription: "",
    newTicketTags: "",
    estimation: 0,
    loggedHours: 0,
    type: "Task",
    typeScope: "Build",
    status: "To Do",
};

// Helper function to find the canonical team name from the platforms list
const findCanonicalTeam = (teamName: string | undefined): Team | undefined => {
    if (!teamName) return undefined;
    const team = platforms.find(s => s.value.toLowerCase() === teamName.toLowerCase());
    return team ? team.value : undefined;
};


export function LogProgressDialog({ isOpen, setIsOpen, sprint, onLogProgress, taskToLog, onClose }: LogProgressDialogProps) {
  const form = useForm<LogProgressData>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultLogProgressValues
  })

  const { watch, setValue, reset, control, formState: { touchedFields } } = form

  const selectedPlatform = watch("platform")
  const selectedTicketId = watch("ticketId")
  const selectedType = watch("type")
  const loggedHours = watch("loggedHours")
  const isNewTicket = selectedTicketId === 'new-ticket'

  const sprintDays = React.useMemo(() => {
    if (!sprint.sprintDays) return [];
    
    return sprint.sprintDays.map((dayInfo) => {
        const dateWithTimezone = new Date(dayInfo.date);
        dateWithTimezone.setMinutes(dateWithTimezone.getMinutes() + dateWithTimezone.getTimezoneOffset());
        return {
            value: `D${dayInfo.day}`,
            label: `D${dayInfo.day} (${dateWithTimezone.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`,
        }
    });
  }, [sprint.sprintDays]);

  const filteredTickets = React.useMemo(() => {
    if (!selectedPlatform) return []
    const canonicalPlatform = findCanonicalTeam(selectedPlatform);
    return sprint.tickets.filter(t => findCanonicalTeam(t.platform) === canonicalPlatform)
  }, [sprint.tickets, selectedPlatform])

  React.useEffect(() => {
    if (isOpen) {
        if (taskToLog) {
            reset({
                ...defaultLogProgressValues,
                platform: findCanonicalTeam(taskToLog.platform),
                ticketId: taskToLog.id,
                type: taskToLog.type,
                typeScope: taskToLog.typeScope,
                estimation: taskToLog.estimation,
                status: taskToLog.status,
            });
        } else {
            reset(defaultLogProgressValues);
        }
    }
  }, [isOpen, taskToLog, reset]);

  React.useEffect(() => {
    if (selectedTicketId && selectedTicketId !== 'new-ticket') {
      const ticket = sprint.tickets.find(t => t.id === selectedTicketId)
      if (ticket) {
        // When selecting an existing ticket, we don't want to change the type/scope,
        // so we just update the form state.
        setValue("type", ticket.type, { shouldValidate: true })
        setValue("typeScope", ticket.typeScope, { shouldValidate: true })
        setValue("estimation", ticket.estimation, { shouldValidate: true })
        setValue("status", ticket.status, { shouldValidate: true })
      }
    } else if (isNewTicket) {
        // When creating a new ticket, reset to defaults.
        setValue("type", "Task")
        setValue("typeScope", "Build")
        setValue("estimation", 0)
        setValue("status", "To Do")
    }
  }, [selectedTicketId, sprint.tickets, setValue, isNewTicket])
  
   React.useEffect(() => {
    if (isNewTicket && !touchedFields.estimation) {
      if (selectedType === 'Bug' || selectedType === 'Buffer') {
        setValue('estimation', Number(loggedHours) || 0, { shouldValidate: true })
      }
    }
  }, [isNewTicket, selectedType, loggedHours, setValue, touchedFields]);

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
    const dataToLog = {
        ...values,
        title: values.newTicketTitle || values.newTicketId,
        description: values.newTicketDescription,
        tags: values.newTicketTags ? values.newTicketTags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
    };
    onLogProgress(dataToLog as any) // Type assertion to match LogProgressData including parsed tags
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
                    name="platform"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Platform (Team)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={!!taskToLog}>
                        <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select a platform" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {platforms.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
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
                        <Select onValueChange={field.onChange} value={field.value} disabled={!selectedPlatform || !!taskToLog}>
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
                 <>
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
                    <FormField
                        control={control}
                        name="newTicketDescription"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl><Textarea placeholder="Detailed description of the new ticket..." {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={control}
                        name="newTicketTags"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tags</FormLabel>
                                <FormControl><Input placeholder="bug, critical, frontend" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                 </>
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
                    name="day"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Day</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
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
                            <FormControl><Input type="number" step="0.5" {...field} /></FormControl>
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
                            <FormControl><Input type="number" step="0.5" {...field} disabled={!isNewTicket} /></FormControl>
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
