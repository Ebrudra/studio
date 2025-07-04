"use client"

import * as React from "react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { eachDayOfInterval, isSaturday, isSunday } from "date-fns"
import { teams } from "@/lib/data"
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
import { DatePicker } from "../ui/date-picker"
import type { Sprint, Team } from "@/types"

interface NewSprintDialogProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  onCreateSprint: (sprint: Omit<Sprint, 'id' | 'lastUpdatedAt' | 'tickets' | 'burnDownData'>) => void
}

const formSchema = z.object({
  name: z.string().min(1, "Sprint name is required"),
  startDate: z.date({ required_error: "Start date is required" }),
  endDate: z.date({ required_error: "End date is required" }),
  teamCapacity: z.record(z.coerce.number().min(0, "Days must be non-negative").default(0)),
}).refine(data => data.endDate > data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
});


export function NewSprintDialog({ isOpen, setIsOpen, onCreateSprint }: NewSprintDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      teamCapacity: teams.reduce((acc, team) => ({ ...acc, [team]: 0 }), {} as Record<Team, number>),
    },
  })
  
  const { watch, setValue } = form;
  const startDate = watch("startDate");
  const endDate = watch("endDate");

  React.useEffect(() => {
    if (startDate && endDate && endDate >= startDate) {
      const interval = { start: startDate, end: endDate };
      const weekDays = eachDayOfInterval(interval).filter(
        (day) => !isSaturday(day) && !isSunday(day)
      ).length;

      teams.forEach((team) => {
        setValue(`teamCapacity.${team}`, weekDays);
      });
    }
  }, [startDate, endDate, setValue]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    let totalBuildCapacity = 0;
    let totalRunCapacity = 0;

    const teamsWithCapacity = Object.keys(values.teamCapacity).filter(
      (team) => values.teamCapacity[team as Team] > 0
    );

    teamsWithCapacity.forEach(team => {
        const personDays = values.teamCapacity[team as Team];
        const teamBuildHours = personDays * 6; 
        const teamRunHours = (personDays * 2) - 8; // 8h overhead per team's sprint contribution is deducted from run time

        totalBuildCapacity += teamBuildHours > 0 ? teamBuildHours : 0;
        totalRunCapacity += teamRunHours > 0 ? teamRunHours : 0;
    });

    const totalCapacity = totalBuildCapacity + totalRunCapacity;

    onCreateSprint({
      name: values.name,
      startDate: values.startDate.toISOString(),
      endDate: values.endDate.toISOString(),
      teamCapacity: values.teamCapacity,
      totalCapacity,
      buildCapacity: totalBuildCapacity,
      runCapacity: totalRunCapacity,
    })
    setIsOpen(false)
    form.reset()
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Start a New Sprint</DialogTitle>
          <DialogDescription>
            Enter the details for the new sprint and define team capacity.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sprint Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Q3 Sprint 3" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                     <DatePicker date={field.value} setDate={field.onChange} />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                    <DatePicker date={field.value} setDate={field.onChange} />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div>
              <h3 className="mb-2 text-sm font-medium">Team Capacity (in days)</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {teams.map(team => (
                  <FormField
                    key={team}
                    control={form.control}
                    name={`teamCapacity.${team}`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{team}</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit">Create Sprint</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
