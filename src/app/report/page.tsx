
"use client"

import * as React from "react"
import { useSearchParams } from 'next/navigation'
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"
import Papa from "papaparse"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Download, FileText, AlertCircle, Brain } from "lucide-react"

import type { Sprint } from "@/types"
import { generateSprintReport } from "@/ai/flows/sprint-report-flow"
import { MarkdownRenderer } from "@/components/report/markdown-renderer"

export default function ReportPage() {
  const searchParams = useSearchParams()
  const sprintId = searchParams.get('sprintId')
  const reportRef = React.useRef<HTMLDivElement>(null)

  const [sprint, setSprint] = React.useState<Sprint | null>(null)
  const [allSprints, setAllSprints] = React.useState<Sprint[]>([])
  const [reportContent, setReportContent] = React.useState<string>("")
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string>("")

  React.useEffect(() => {
    if (!sprintId) {
      setError("No sprint ID provided.")
      setIsLoading(false)
      return
    }

    try {
      const storedSprints = localStorage.getItem('sprintPilotSprints')
      if (storedSprints) {
        const sprints = JSON.parse(storedSprints) as Sprint[]
        const currentSprint = sprints.find(s => s.id === sprintId)

        if (currentSprint) {
          setSprint(currentSprint)
          setAllSprints(sprints)

          if (currentSprint.generatedReport) {
            setReportContent(currentSprint.generatedReport)
            setIsLoading(false)
          } else {
            generateReport(currentSprint, sprints)
          }
        } else {
          setError(`Sprint with ID "${sprintId}" not found.`)
          setIsLoading(false)
        }
      } else {
        setError("No sprint data found in local storage.")
        setIsLoading(false)
      }
    } catch (e) {
      setError("Failed to load or parse sprint data from local storage.")
      setIsLoading(false)
    }
  }, [sprintId])

  const generateReport = async (currentSprint: Sprint, sprints: Sprint[]) => {
    setIsLoading(true)
    setError("")
    try {
      const result = await generateSprintReport({ sprint: currentSprint, allSprints: sprints })
      setReportContent(result.report)
      
      const updatedSprints = sprints.map(s => 
        s.id === currentSprint.id ? { ...s, generatedReport: result.report } : s
      )
      localStorage.setItem('sprintPilotSprints', JSON.stringify(updatedSprints))

    } catch (e: any) {
      setError(`Failed to generate AI report: ${e.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportPDF = () => {
    if (!reportRef.current) return

    html2canvas(reportRef.current, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const canvasWidth = canvas.width
      const canvasHeight = canvas.height
      const ratio = canvasWidth / canvasHeight
      const imgWidth = pdfWidth - 20 // Add some margin
      const imgHeight = imgWidth / ratio

      let heightLeft = imgHeight
      let position = 10 // Top margin
      
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight)
      heightLeft -= (pdfHeight - 20)

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight)
        heightLeft -= (pdfHeight - 20)
      }
      pdf.save(`sprint-report-${sprint?.name.replace(/ /g, '_')}.pdf`)
    })
  }

  const handleExportCSV = () => {
    if (!sprint?.tickets) return
    
    const csvData = sprint.tickets.map(ticket => ({
      'Scope (Team)': ticket.scope,
      'Ticket ID': ticket.id,
      'Ticket Link': `https://inwidtd.atlassian.net/browse/${ticket.id}`,
      'Time Logged (Total)': ticket.timeLogged,
      'Estimation': ticket.estimation,
      'Status': ticket.status
    }))

    const csv = Papa.unparse(csvData)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `sprint-tickets-${sprint?.name.replace(/ /g, '_')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4 p-6">
          <Skeleton className="h-8 w-1/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="space-y-4 mt-6">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      )
    }

    if (error) {
      return (
         <Alert variant="destructive" className="m-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
      )
    }

    if (sprint && reportContent) {
      return <MarkdownRenderer content={reportContent} />
    }
    
    return <p className="p-6">No report to display.</p>
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 bg-white" ref={reportRef}>
      <div className="border-b pb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
                {sprint ? `Sprint Report: ${sprint.name}` : 'Sprint Report'}
            </h1>
            {sprint && (
                <p className="text-gray-600 mt-1">
                {new Date(sprint.startDate).toLocaleDateString(undefined, { timeZone: 'UTC' })} - {new Date(sprint.endDate).toLocaleDateString(undefined, { timeZone: 'UTC' })}
                </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={isLoading || !!error}>
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={isLoading || !!error}>
              <FileText className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>
      
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-600" />
                AI Generated Analysis
            </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
            {renderContent()}
        </CardContent>
      </Card>
      
      <div className="border-t pt-6 text-center text-sm text-gray-500">
        <p>
          Report generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
        </p>
        <p className="mt-1">Sprint Tracking Tool v2.0 with AI Intelligence | Confidential</p>
      </div>
    </div>
  )
}
