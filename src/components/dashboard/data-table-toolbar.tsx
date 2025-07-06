
"use client"

import { Table } from "@tanstack/react-table"
import { Filter, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { DataTableViewOptions } from "./data-table-view-options"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { statuses, scopes, typeScopes } from "./data"

interface DataTableToolbarProps<TData> {
  table: Table<TData>,
  viewMode: 'list' | 'byDay' | 'byTeam'
  onViewModeChange: (mode: 'list' | 'byDay' | 'byTeam') => void
}

export function DataTableToolbar<TData>({
  table,
  viewMode,
  onViewModeChange,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Filter tasks..."
          value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("title")?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {viewMode === 'list' && (
            <>
                <Select
                    value={(table.getColumn("status")?.getFilterValue() as string) ?? "all"}
                    onValueChange={(value) => table.getColumn("status")?.setFilterValue(value === "all" ? null : value)}
                >
                    <SelectTrigger className="w-40 h-8">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        {statuses.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select
                    value={(table.getColumn("scope")?.getFilterValue() as string) ?? "all"}
                    onValueChange={(value) => table.getColumn("scope")?.setFilterValue(value === "all" ? null : value)}
                >
                    <SelectTrigger className="w-40 h-8">
                        <SelectValue placeholder="Scope" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Scopes</SelectItem>
                        {scopes.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                </Select>
                 <Select
                    value={(table.getColumn("typeScope")?.getFilterValue() as string) ?? "all"}
                    onValueChange={(value) => table.getColumn("typeScope")?.setFilterValue(value === "all" ? null : value)}
                >
                    <SelectTrigger className="w-40 h-8">
                        <SelectValue placeholder="Type Scope" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Type Scopes</SelectItem>
                        {typeScopes.map(ts => <SelectItem key={ts.value} value={ts.value}>{ts.label}</SelectItem>)}
                    </SelectContent>
                </Select>
                {isFiltered && (
                <Button
                    variant="ghost"
                    onClick={() => table.resetColumnFilters()}
                    className="h-8 px-2 lg:px-3"
                >
                    Reset
                    <X className="ml-2 h-4 w-4" />
                </Button>
                )}
            </>
        )}
      </div>
       <div className="flex items-center space-x-4">
        <RadioGroup
            value={viewMode}
            onValueChange={(value) => onViewModeChange(value as any)}
            className="flex items-center space-x-1"
        >
            <Label htmlFor="view-list" className="cursor-pointer rounded-md border-2 border-transparent px-2.5 py-1 text-sm font-medium data-[state=checked]:border-primary data-[state=checked]:bg-muted" data-state={viewMode === 'list' ? 'checked' : 'unchecked'}>
                <RadioGroupItem value="list" id="view-list" className="sr-only" />
                List
            </Label>
             <Label htmlFor="view-day" className="cursor-pointer rounded-md border-2 border-transparent px-2.5 py-1 text-sm font-medium data-[state=checked]:border-primary data-[state=checked]:bg-muted" data-state={viewMode === 'byDay' ? 'checked' : 'unchecked'}>
                <RadioGroupItem value="byDay" id="view-day" className="sr-only" />
                Group by Day
            </Label>
             <Label htmlFor="view-team" className="cursor-pointer rounded-md border-2 border-transparent px-2.5 py-1 text-sm font-medium data-[state=checked]:border-primary data-[state=checked]:bg-muted" data-state={viewMode === 'byTeam' ? 'checked' : 'unchecked'}>
                <RadioGroupItem value="byTeam" id="view-team" className="sr-only" />
                Group by Team
            </Label>
        </RadioGroup>

        <DataTableViewOptions table={table} />
      </div>
    </div>
  )
}
