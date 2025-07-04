"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { generateSprintReport } from "@/ai/flows/sprint-report-flow"
import type { Sprint } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "../ui/skeleton"

interface GenerateSprintReportDialogProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  sprint: Sprint
}

export function GenerateSprintReportDialog({ isOpen, setIsOpen, sprint }: GenerateSprintReportDialogProps) {
  const [report, setReport] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const { toast } = useToast()

  const handleGenerateReport = async () => {
    setIsLoading(true)
    setReport(null)
    try {
      const result = await generateSprintReport(sprint)
      setReport(result.report)
    } catch (error) {
      console.error("Failed to generate report:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate the sprint report.",
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  React.useEffect(() => {
    if (isOpen) {
      handleGenerateReport();
    }
  }, [isOpen]);


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>AI-Generated Sprint Report</DialogTitle>
          <DialogDescription>
            Here is a summary and analysis of "{sprint.name}".
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-96 w-full rounded-md border p-4">
          {isLoading && (
            <div className="space-y-4">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                 <Skeleton className="h-6 w-1/3 mt-4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                 <Skeleton className="h-6 w-1/3 mt-4" />
                <Skeleton className="h-4 w-full" />
            </div>
          )}
          {report && (
            <article className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: report.replace(/\n/g, '<br />') }} />
          )}
        </ScrollArea>
        <DialogFooter>
          <Button onClick={() => setIsOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
