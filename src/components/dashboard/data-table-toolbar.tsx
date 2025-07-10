
"use client"

import * as React from "react"
import { Table } from "@tanstack/react-table"
import { Filter, X, Group } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTableViewOptions } from "./data-table-view-options"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { statuses, platforms } from "./data"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { AnimatePresence, motion } from "framer-motion"

interface DataTableToolbarProps<TData> {
  table: Table<TData>,
  viewMode: 'list' | 'cards' | 'kanban'
  onViewModeChange: (mode: 'list' | 'cards' | 'kanban') => void
  groupBy: 'status' | 'platform' | 'day' | null
  onGroupByChange: (value: 'status' | 'platform' | 'day' | null) => void
  showInitialScopeOnly: boolean
  onShowInitialScopeOnlyChange: (value: boolean) => void
}

export function DataTableToolbar<TData>({
  table,
  viewMode,
  onViewModeChange,
  groupBy,
  onGroupByChange,
  showInitialScopeOnly,
  onShowInitialScopeOnlyChange,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0
  const [filtersVisible, setFiltersVisible] = React.useState(false)

  const handleGroupByChange = (value: string) => {
    if (value === 'none') {
        onGroupByChange(null);
    } else {
        onGroupByChange(value as 'status' | 'platform' | 'day');
    }
  }

  return (
    <div className="flex flex-col gap-4">
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
           <Button variant="outline" size="sm" className="h-8" onClick={() => setFiltersVisible(!filtersVisible)}>
                <Filter className="mr-2 h-4 w-4" />
                Filters
            </Button>
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
        <DataTableViewOptions table={table} viewMode={viewMode} onViewModeChange={onViewModeChange} />
      </div>

       <AnimatePresence>
        {filtersVisible && (
            <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
            >
                <div className="flex items-center space-x-2 pb-2">
                     <Select
                        value={(table.getColumn("status")?.getFilterValue() as string) ?? "all"}
                        onValueChange={(value) => table.getColumn("status")?.setFilterValue(value === "all" ? null : value)}
                    >
                        <SelectTrigger className="w-40 h-8">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            {statuses.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select
                        value={(table.getColumn("platform")?.getFilterValue() as string) ?? "all"}
                        onValueChange={(value) => table.getColumn("platform")?.setFilterValue(value === "all" ? null : value)}
                    >
                        <SelectTrigger className="w-40 h-8">
                            <SelectValue placeholder="Platform" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Platforms</SelectItem>
                            {platforms.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
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
                            <SelectItem value="platform">Group by Platform</SelectItem>
                            <SelectItem value="day">Group by Day Logged</SelectItem>
                        </SelectContent>
                    </Select>
                    <div className="flex items-center space-x-2">
                    <Switch
                        id="initial-scope"
                        checked={showInitialScopeOnly}
                        onCheckedChange={onShowInitialScopeOnlyChange}
                    />
                    <Label htmlFor="initial-scope">Initial Scope Only</Label>
                    </div>
                </div>
            </motion.div>
        )}
       </AnimatePresence>
    </div>
  )
}
