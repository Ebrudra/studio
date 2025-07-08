
"use client"

import { Table } from "@tanstack/react-table"
import { Filter, X, List, LayoutGrid, Kanban, Group } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTableViewOptions } from "./data-table-view-options"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { statuses, scopes, typeScopes } from "./data"

interface DataTableToolbarProps<TData> {
  table: Table<TData>,
  viewMode: 'list' | 'cards' | 'kanban'
  onViewModeChange: (mode: 'list' | 'cards' | 'kanban') => void
  groupBy: 'status' | 'scope' | 'day' | null
  onGroupByChange: (value: 'status' | 'scope' | 'day' | null) => void
}

export function DataTableToolbar<TData>({
  table,
  viewMode,
  onViewModeChange,
  groupBy,
  onGroupByChange,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0

  const handleGroupByChange = (value: string) => {
    if (value === 'none') {
        onGroupByChange(null);
    } else {
        onGroupByChange(value as 'status' | 'scope' | 'day');
    }
  }

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
            value={groupBy || 'none'}
            onValueChange={handleGroupByChange}
        >
            <SelectTrigger className="w-48 h-8">
                <Group className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Group by" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="none">No Grouping</SelectItem>
                <SelectItem value="status">Group by Status</SelectItem>
                <SelectItem value="scope">Group by Scope</SelectItem>
                <SelectItem value="day">Group by Day Logged</SelectItem>
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
      </div>
       <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
            <Button
                onClick={() => onViewModeChange('list')}
                variant={viewMode === 'list' ? 'default' : 'secondary'}
                size="icon"
                aria-label="List view"
            >
                <List className="h-4 w-4" />
            </Button>
            <Button
                onClick={() => onViewModeChange('cards')}
                variant={viewMode === 'cards' ? 'default' : 'secondary'}
                size="icon"
                aria-label="Cards view"
            >
                <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
                onClick={() => onViewModeChange('kanban')}
                variant={viewMode === 'kanban' ? 'default' : 'secondary'}
                size="icon"
                aria-label="Kanban board"
            >
                <Kanban className="h-4 w-4" />
            </Button>
        </div>

        <DataTableViewOptions table={table} />
      </div>
    </div>
  )
}
