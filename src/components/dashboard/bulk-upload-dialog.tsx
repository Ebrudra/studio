
"use client"

import * as React from "react"
import Papa from "papaparse"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import type { Team, TicketType, TicketStatus } from "@/types"

export type BulkTask = {
  id: string
  title: string
  scope: Team
  type: TicketType
  estimation: number
}

export type BulkProgressLog = {
  date: string // YYYY-MM-DD
  ticketId: string
  loggedHours: number
  status: TicketStatus
}

interface BulkUploadDialogProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  onBulkUploadTasks: (tasks: BulkTask[]) => void
  onBulkLogProgress: (logs: BulkProgressLog[]) => void
}

export function BulkUploadDialog({
  isOpen,
  setIsOpen,
  onBulkUploadTasks,
  onBulkLogProgress,
}: BulkUploadDialogProps) {
  const { toast } = useToast()
  const [tasksFile, setTasksFile] = React.useState<File | null>(null)
  const [progressFile, setProgressFile] = React.useState<File | null>(null)
  const [isProcessing, setIsProcessing] = React.useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "tasks" | "progress") => {
    if (e.target.files) {
      if (type === "tasks") setTasksFile(e.target.files[0])
      else setProgressFile(e.target.files[0])
    }
  }

  const downloadSampleCSV = (type: "tasks" | "progress") => {
    let csvContent: string
    let fileName: string

    if (type === "tasks") {
      csvContent = "id,title,scope,type,estimation\nWIN-9001,New Feature X,Web,User story,13\nWIN-9002,Fix Critical Bug Y,Backend,Bug,8"
      fileName = "tasks_sample.csv"
    } else {
      csvContent = "date,ticketId,loggedHours,status\n2024-07-25,WIN-9001,4,In Progress\n2024-07-26,WIN-9001,8,Done"
      fileName = "progress_log_sample.csv"
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", fileName)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  
  const processFile = (type: "tasks" | "progress") => {
    const file = type === "tasks" ? tasksFile : progressFile
    if (!file) {
      toast({ variant: "destructive", title: "No file selected", description: "Please select a CSV file to upload." });
      return;
    }

    setIsProcessing(true);
    Papa.parse<BulkTask | BulkProgressLog>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length) {
            toast({ variant: "destructive", title: "Error parsing CSV", description: results.errors[0].message });
        } else if (type === "tasks") {
            onBulkUploadTasks(results.data as BulkTask[]);
        } else {
            onBulkLogProgress(results.data as BulkProgressLog[]);
        }
        setIsProcessing(false);
        setIsOpen(false);
        setTasksFile(null);
        setProgressFile(null);
      },
      error: (error) => {
        toast({ variant: "destructive", title: "Error reading file", description: error.message });
        setIsProcessing(false);
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Bulk Upload Data</DialogTitle>
          <DialogDescription>
            Upload tasks or log progress in bulk using a CSV file.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="tasks" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tasks">Upload Tasks</TabsTrigger>
            <TabsTrigger value="progress">Log Progress</TabsTrigger>
          </TabsList>
          <TabsContent value="tasks" className="space-y-4 pt-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="tasks-file">Upload Sprint Tasks CSV</Label>
              <Input id="tasks-file" type="file" accept=".csv" onChange={(e) => handleFileChange(e, "tasks")} />
            </div>
            <p className="text-xs text-muted-foreground">
              Required columns: `id`, `title`, `scope`, `type`, `estimation`.
            </p>
             <div className="flex justify-between items-center">
                 <Button variant="link" size="sm" className="p-0" onClick={() => downloadSampleCSV("tasks")}>
                    Download Sample CSV
                </Button>
                <Button onClick={() => processFile("tasks")} disabled={!tasksFile || isProcessing}>
                    {isProcessing ? "Processing..." : "Upload Tasks"}
                </Button>
            </div>
          </TabsContent>
          <TabsContent value="progress" className="space-y-4 pt-4">
             <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="progress-file">Upload Progress Log CSV</Label>
              <Input id="progress-file" type="file" accept=".csv" onChange={(e) => handleFileChange(e, "progress")} />
            </div>
            <p className="text-xs text-muted-foreground">
              Required columns: `date`, `ticketId`, `loggedHours`, `status`.
            </p>
            <div className="flex justify-between items-center">
                 <Button variant="link" size="sm" className="p-0" onClick={() => downloadSampleCSV("progress")}>
                    Download Sample CSV
                </Button>
                <Button onClick={() => processFile("progress")} disabled={!progressFile || isProcessing}>
                     {isProcessing ? "Processing..." : "Upload Progress"}
                </Button>
            </div>
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
