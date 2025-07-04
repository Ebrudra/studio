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
import type { Ticket, TicketStatus, TicketType, TicketTypeScope, Team } from "@/types"

interface AddTaskDialogProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  onAddTask: (task: Omit<Ticket, "timeLogged">) => void
}

const formSchema = z.object({
  id: z.string().regex(/^WIN-\d+$/, "Ticket ID must be in WIN-XXXX format"),
  title: z.string().min(1, "Title is required"),
  scope: z.enum(scopes.map(s => s.value) as [Team, ...Team[]]),
  type: z.enum(ticketTypes.map(t => t.value) as [TicketType, ...TicketType[]]),
  typeScope: z.enum(typeScopes.map(ts => ts.value) as [TicketTypeScope, ...TicketTypeScope[]]),
  estimation: z.coerce.number().min(0, "Estimation must be a positive number"),
  status: z.enum(statuses.map(s => s.value) as [TicketStatus, ...TicketStatus[]]),
})

export function AddTaskDialog({ isOpen, setIsOpen, onAddTask }: AddTaskDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: "WIN-",
      title: "",
      estimation: 0,
      status: "To Do",
    },
  })

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    onAddTask({ ...values, timeLogged: 0 })
    setIsOpen(false)
    form.reset()
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Task to Sprint</DialogTitle>
          <DialogDescription>
            Enter the details for the new task.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="id"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Ticket ID</FormLabel>
                    <FormControl>
                        <Input placeholder="WIN-1234" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                    control={form.control}
                    name="estimation"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Estimation (h)</FormLabel>
                        <FormControl>
                            <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Implement feature X" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="scope"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scope (Team)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
             <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                control={form.control}
                name="typeScope"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type Scope</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select a type scope" /></SelectTrigger>
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
            
            <DialogFooter>
               <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit">Add Task</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
