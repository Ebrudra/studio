
"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TeamCapacityCards } from "./team-capacity-cards"
import { TeamCapacityList } from "./team-capacity-list"
import type { Sprint } from "@/types"
import { Button } from "@/components/ui/button"
import { LayoutGrid, List, Download } from "lucide-react"
import html2canvas from "html2canvas"

interface TeamCapacityTableProps {
  sprint: Sprint
}

export function TeamCapacityTable({ sprint }: TeamCapacityTableProps) {
  const [viewMode, setViewMode] = React.useState<'card' | 'list'>('card')
  const exportRef = React.useRef<HTMLDivElement>(null);

  if (!sprint || !sprint.teamCapacity || !sprint.tickets) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Platform Capacity & Delivery</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Not enough data to display capacity.</p>
            </CardContent>
        </Card>
    )
  }
  
  const handleExport = () => {
    if (exportRef.current) {
        html2canvas(exportRef.current, { scale: 2 }).then(canvas => {
            const link = document.createElement('a');
            link.download = `team-capacity-${sprint.name.replace(/ /g, '_')}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    }
  };

  return (
    <Card ref={exportRef}>
      <CardHeader>
        <div className="flex items-center justify-between">
            <CardTitle>Platform Capacity & Delivery</CardTitle>
            <div className="flex items-center space-x-2">
                 <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button
                    onClick={() => setViewMode('list')}
                    variant={viewMode === 'list' ? 'default' : 'secondary'}
                    size="icon"
                >
                    <List className="h-4 w-4" />
                    <span className="sr-only">List</span>
                </Button>
                <Button
                    onClick={() => setViewMode('card')}
                    variant={viewMode === 'card' ? 'default' : 'secondary'}
                    size="icon"
                >
                    <LayoutGrid className="h-4 w-4" />
                    <span className="sr-only">Grid</span>
                </Button>
            </div>
        </div>
        <p className="text-sm text-muted-foreground">
            {viewMode === 'card' 
                ? "A grid view of individual team performance and capacity utilization." 
                : "A table view of team delivery vs planned capacity."}
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        {viewMode === 'card' ? <TeamCapacityCards sprint={sprint} /> : <TeamCapacityList sprint={sprint} />}
      </CardContent>
    </Card>
  )
}
