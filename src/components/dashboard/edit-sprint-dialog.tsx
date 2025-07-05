
"use client"

import * as React from "react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import { eachDayOfInterval, isSaturday, isSunday, format } from "date-fns"
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
import { ScrollArea } from "../ui/scroll-area"
import type { Sprint, Team, TeamCapacity, SprintDay } from "@/types"
import { useToast } from "@/hooks/use-toast"

interface EditSprintDialogProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  sprint: Sprint;
  onUpdateSprint: (sprint: Sprint) => void
}

const formSchema = z.object({
  name: z.string().min(1, "Sprint name is required"),
  startDate: z.date({ required_error: "Start date is required" }),
  endDate: z.date({ required_error: "End date is required" }),
  sprintDays: z.array(z.object({
    day: z.number(),
    date: z.date({ required_error: "Date is required" }),
  })),
  teamPersonDays: z.record(z.coerce.number().min(0, "Days must be non-negative").default(0)),
}).refine(data => data.endDate >= data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
});


export function EditSprintDialog({ isOpen, setIsOpen, sprint, onUpdateSprint }: EditSprintDialogProps) {
  
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: sprint.name,
      startDate: new Date(sprint.startDate),
      endDate: new Date(sprint.endDate),
      sprintDays: sprint.sprintDays.map(d => ({ ...d, date: new Date(d.date) })),
      teamPersonDays: {},
    },
  });
  
  const { control, watch, setValue, reset } = form;
  const { fields, replace } = useFieldArray({ control, name: "sprintDays" });
  
  const startDate = watch("startDate");
  const endDate = watch("endDate");

  React.useEffect(() => {
    if (sprint) {
       const personDays: Record<string, number> = {};
       const sprintWorkDays = sprint.sprintDays?.length || 0;
       for (const team of teams) {
            const buildCapacity = sprint.teamCapacity?.[team]?.plannedBuild ?? 0;
            // Calculate person-days based on build capacity, default to sprint duration if no capacity is set.
            personDays[team] = buildCapacity > 0 ? buildCapacity / 6 : sprintWorkDays;
        }

      reset({
        name: sprint.name,
        startDate: new Date(sprint.startDate),
        endDate: new Date(sprint.endDate),
        sprintDays: sprint.sprintDays.map(d => ({ ...d, date: new Date(d.date) })),
        teamPersonDays: personDays,
      });
    }
  }, [sprint, reset]);

  React.useEffect(() => {
    if (startDate && endDate && endDate >= startDate) {
      const interval = { start: startDate, end: endDate };
      const workingDays = eachDayOfInterval(interval).filter(
        (day) => !isSaturday(day) && !isSunday(day)
      );
      
      const newSprintDays = workingDays.map((day, index) => ({
          day: index + 1,
          date: day,
      }))
      replace(newSprintDays);

      teams.forEach((team) => {
        setValue(`teamPersonDays.${team}`, workingDays.length, { shouldValidate: true });
      });
    }
  }, [startDate, endDate, setValue, replace]);

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
    
    const formattedSprintDays = values.sprintDays.map(d => ({
        ...d,
        date: format(d.date, 'yyyy-MM-dd')
    }))

    onUpdateSprint({
      ...sprint,
      name: values.name,
      startDate: values.startDate.toISOString(),
      endDate: values.endDate.toISOString(),
      sprintDays: formattedSprintDays,
      teamCapacity: teamCapacity,
      totalCapacity: totalBuild + totalRun,
      buildCapacity: totalBuild,
      runCapacity: totalRun,
      lastUpdatedAt: new Date().toISOString(),
    });
    setIsOpen(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Edit Sprint Details</DialogTitle>
          <DialogDescription>
            Update the details for "{sprint.name}". Weekends are automatically excluded from day counts.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <FormField
                    control={control}
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
                        control={control}
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
                        control={control}
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
                                control={control}
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
                </div>

                <div>
                    <h3 className="mb-2 text-sm font-medium">Sprint Working Days</h3>
                     <ScrollArea className="h-72 w-full rounded-md border p-4">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                            {fields.map((field, index) => (
                                <FormField
                                    key={field.id}
                                    control={control}
                                    name={`sprintDays.${index}.date`}
                                    render={({ field }) => (
                                    <FormItem className="flex items-center gap-2">
                                        <FormLabel className="w-12 mt-2">Day {index + 1}</FormLabel>
                                        <FormControl>
                                            <DatePicker date={field.value} setDate={field.onChange} />
                                        </FormControl>
                                    </FormItem>
                                    )}
                                />
                            ))}
                        </div>
                     </ScrollArea>
                </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit">Update Sprint</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
