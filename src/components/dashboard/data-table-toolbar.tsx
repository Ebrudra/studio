
"use client"

import { Table } from "@tanstack/react-table"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { DataTableViewOptions } from "./data-table-view-options"

import { statuses, scopes, typeScopes } from "./data"
import { DataTableFacetedFilter } from "./data-table-faceted-filter"

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
                {table.getColumn("status") && (
                <DataTableFacetedFilter
                    column={table.getColumn("status")}
                    title="Status"
                    options={statuses}
                />
                )}
                {table.getColumn("scope") && (
                <DataTableFacetedFilter
                    column={table.getColumn("scope")}
                    title="Scope"
                    options={scopes}
                />
                )}
                {table.getColumn("typeScope") && (
                <DataTableFacetedFilter
                    column={table.getColumn("typeScope")}
                    title="Type Scope"
                    options={typeScopes}
                />
                )}
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
