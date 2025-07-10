
"use client"

import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu"
import { MoreHorizontal, List, LayoutGrid, Kanban } from "lucide-react"
import { Table } from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"

interface DataTableViewOptionsProps<TData> {
  table: Table<TData>
  viewMode: 'list' | 'cards' | 'kanban'
  onViewModeChange: (mode: 'list' | 'cards' | 'kanban') => void
}

export function DataTableViewOptions<TData>({
  table,
  viewMode,
  onViewModeChange,
}: DataTableViewOptionsProps<TData>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto h-8 flex"
        >
          <MoreHorizontal className="mr-2 h-4 w-4" />
          View
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[150px]">
        <DropdownMenuLabel>View Mode</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={viewMode} onValueChange={(value) => onViewModeChange(value as any)}>
            <DropdownMenuRadioItem value="list">
                <List className="mr-2 h-4 w-4" />
                List
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="cards">
                <LayoutGrid className="mr-2 h-4 w-4" />
                Cards
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="kanban">
                <Kanban className="mr-2 h-4 w-4" />
                Kanban
            </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table
          .getAllColumns()
          .filter(
            (column) =>
              typeof column.accessorFn !== "undefined" && column.getCanHide()
          )
          .map((column) => {
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="capitalize"
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {column.id}
              </DropdownMenuCheckboxItem>
            )
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
