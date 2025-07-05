"use client"

import * as React from "react"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
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
  onSaveReport: (report: string) => void
}

export function GenerateSprintReportDialog({ isOpen, setIsOpen, sprint, onSaveReport }: GenerateSprintReportDialogProps) {
  const [generatedReport, setGeneratedReport] = React.useState<string | null>(null)
  const [isGenerating, setIsGenerating] = React.useState(false)
  const { toast } = useToast()
  const reportContentRef = React.useRef<HTMLDivElement>(null)
  
  const isReportSaved = !!sprint.generatedReport;
  const displayReport = sprint.generatedReport || generatedReport;

  const handleGenerateReport = async () => {
    setIsGenerating(true)
    setGeneratedReport(null)
    try {
      const result = await generateSprintReport(sprint)
      setGeneratedReport(result.report)
    } catch (error) {
      console.error("Failed to generate report:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate the sprint report.",
      })
    } finally {
      setIsGenerating(false)
    }
  }
  
  React.useEffect(() => {
    // Only generate a new report if the dialog is opened and no report is saved yet.
    if (isOpen && !sprint.generatedReport) {
      handleGenerateReport();
    }
  }, [isOpen, sprint.generatedReport]);

  const handleSave = () => {
      if(generatedReport){
          onSaveReport(generatedReport);
          toast({ title: "Report Saved", description: "The AI-generated report has been saved." });
      }
  }

  const handleDownloadPdf = async () => {
    const content = reportContentRef.current;
    if (!content) {
         toast({ variant: "destructive", title: "Error", description: "Could not find report content to download." });
        return;
    };

    toast({ title: "Generating PDF...", description: "Please wait a moment." });

    try {
        const canvas = await html2canvas(content, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = imgWidth / imgHeight;
        const pdfHeight = pdfWidth / ratio;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${sprint.name.replace(/\s+/g, '_')}-Report.pdf`);

    } catch (error) {
        console.error("Failed to generate PDF:", error);
        toast({ variant: "destructive", title: "PDF Generation Failed", description: "An error occurred while creating the PDF." });
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>AI-Generated Sprint Report</DialogTitle>
          <DialogDescription>
            {sprint.generatedReport ? "Viewing saved report for" : "Here is a summary and analysis of"} "{sprint.name}".
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-96 w-full rounded-md border">
          <div ref={reportContentRef} className="p-4">
            {isGenerating && (
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
            {!isGenerating && displayReport && (
                <article className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: displayReport.replace(/\n/g, '<br />') }} />
            )}
             {!isGenerating && !displayReport && (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                    No report available.
                </div>
            )}
          </div>
        </ScrollArea>
        <DialogFooter className="gap-2 sm:justify-end">
            {!isGenerating && displayReport && (
                 <>
                    {!isReportSaved && generatedReport && (
                        <Button onClick={handleSave}>Save Report</Button>
                    )}
                    <Button variant="outline" onClick={handleDownloadPdf}>Download PDF</Button>
                </>
            )}
            <Button variant="secondary" onClick={() => setIsOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
