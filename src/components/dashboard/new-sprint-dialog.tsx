
"use client"

import * as React from "react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { eachDayOfInterval, isSaturday, isSunday, addDays, nextWednesday, previousTuesday, format } from "date-fns"
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
import type { Sprint, Team, TeamCapacity, SprintDay } from "@/types"
import { useToast } from "@/hooks/use-toast"

interface NewSprintDialogProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  onCreateSprint: (sprint: Omit<Sprint, 'id' | 'lastUpdatedAt'>) => void
}

const formSchema = z.object({
  name: z.string().min(1, "Sprint name is required"),
  startDate: z.date({ required_error: "Start date is required" }),
  endDate: z.date({ required_error: "End date is required" }),
  teamPersonDays: z.record(z.coerce.number().min(0, "Days must be non-negative").default(0)),
}).refine(data => data.endDate >= data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
});


export function NewSprintDialog({ isOpen, setIsOpen, onCreateSprint }: NewSprintDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      startDate: undefined,
      endDate: undefined,
      teamPersonDays: teams.reduce((acc, team) => ({ ...acc, [team]: 0 }), {} as Record<Team, number>),
    },
  })
  
  const { watch, setValue, trigger } = form;
  const startDate = watch("startDate");
  const endDate = watch("endDate");
  const { toast } = useToast();

  React.useEffect(() => {
    if(!isOpen) {
        form.reset();
        return;
    };
    
    if(!startDate && !endDate) {
        const today = new Date();
        const nextWed = nextWednesday(today);
        const followingTue = previousTuesday(addDays(nextWed, 14));
        setValue("startDate", nextWed);
        setValue("endDate", followingTue);
    }
  }, [isOpen, startDate, endDate, setValue, form]);


  React.useEffect(() => {
    if (startDate && endDate && endDate >= startDate) {
      const interval = { start: startDate, end: endDate };
      const weekDays = eachDayOfInterval(interval).filter(
        (day) => !isSaturday(day) && !isSunday(day)
      ).length;

      teams.forEach((team) => {
        setValue(`teamPersonDays.${team}`, weekDays, { shouldValidate: true });
      });
    }
  }, [startDate, endDate, setValue, trigger]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const teamCapacity: Record<Team, TeamCapacity> = {} as Record<Team, TeamCapacity>;
    let hasInvalidCapacity = false;

    teams.forEach(team => {
      const personDays = values.teamPersonDays[team as Team];
      const plannedBuild = personDays * 6;
      const plannedRun = (personDays * 2) - 8; 

      if (plannedRun < 0) {
        toast({
            variant: "destructive",
            title: `Invalid Capacity for ${team}`,
            description: `Run capacity for ${team} is negative (${plannedRun}h). Please adjust person-days.`
        });
        hasInvalidCapacity = true;
      }

      teamCapacity[team as Team] = { plannedBuild, plannedRun };
    });
    
    if (hasInvalidCapacity) {
        return;
    }
    
    const totalBuild = Object.values(teamCapacity).reduce((acc, val) => acc + val.plannedBuild, 0);
    const totalRun = Object.values(teamCapacity).reduce((acc, val) => acc + val.plannedRun, 0);
    
    const sprintDays: SprintDay[] = [];
    if (values.startDate && values.endDate && values.endDate >= values.startDate) {
        const interval = { start: values.startDate, end: values.endDate };
        const workingDays = eachDayOfInterval(interval).filter(
            day => !isSaturday(day) && !isSunday(day)
        );
        workingDays.forEach((date, index) => {
            sprintDays.push({ day: index + 1, date: format(date, 'yyyy-MM-dd') });
        });
    }

    onCreateSprint({
      name: values.name,
      startDate: values.startDate.toISOString(),
      endDate: values.endDate.toISOString(),
      sprintDays,
      status: 'Scoping',
      teamCapacity: teamCapacity,
      totalCapacity: totalBuild + totalRun,
      buildCapacity: totalBuild,
      runCapacity: totalRun,
      tickets: [],
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
            Enter the details for the new sprint and define team capacity. Weekends are automatically excluded from day counts.
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
              <h3 className="mb-2 text-sm font-medium">Team Person-Days</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {teams.map(team => (
                  <FormField
                    key={team}
                    control={form.control}
                    name={`teamPersonDays.${team}`}
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
