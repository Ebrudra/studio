
"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { TeamCapacityCards } from "./team-capacity-cards"
import { TeamCapacityList } from "./team-capacity-list"
import type { Sprint } from "@/types"

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
            <RadioGroup
                defaultValue="card"
                onValueChange={(value: 'card' | 'list') => setViewMode(value)}
                className="flex items-center space-x-1"
            >
                <Label htmlFor="view-card" className="cursor-pointer rounded-md border-2 border-transparent px-2.5 py-1 text-sm font-medium data-[state=checked]:border-primary data-[state=checked]:bg-muted" data-state={viewMode === 'card' ? 'checked' : 'unchecked'}>
                    <RadioGroupItem value="card" id="view-card" className="sr-only" />
                    Cards
                </Label>
                <Label htmlFor="view-list" className="cursor-pointer rounded-md border-2 border-transparent px-2.5 py-1 text-sm font-medium data-[state=checked]:border-primary data-[state=checked]:bg-muted" data-state={viewMode === 'list' ? 'checked' : 'unchecked'}>
                    <RadioGroupItem value="list" id="view-list" className="sr-only" />
                    List
                </Label>
            </RadioGroup>
        </div>
        <p className="text-sm text-muted-foreground">
            {viewMode === 'card' 
                ? "Individual team performance and capacity utilization." 
                : "A table view of team delivery vs planned capacity."}
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        {viewMode === 'card' ? <TeamCapacityCards sprint={sprint} /> : <TeamCapacityList sprint={sprint} />}
      </CardContent>
    </Card>
  )
}
