"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TeamCapacityCards } from "./team-capacity-cards"
import { TeamCapacityList } from "./team-capacity-list"
import type { Sprint } from "@/types"
import { Button } from "@/components/ui/button"
import { LayoutGrid, List } from "lucide-react"

interface TeamCapacityTableProps {
  sprint: Sprint
}

export function TeamCapacityTable({ sprint }: TeamCapacityTableProps) {
  const [viewMode, setViewMode] = React.useState<'card' | 'list'>('card')

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <CardTitle>Team Capacity & Delivery</CardTitle>
            <div className="flex items-center space-x-2">
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
                    size="sm"
                >
                    <LayoutGrid className="mr-2 h-4 w-4" />
                    <span>Grid</span>
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
