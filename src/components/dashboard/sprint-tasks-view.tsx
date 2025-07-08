
"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  Row,
} from "@tanstack/react-table"
import { statuses } from "./data"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

import { DataTablePagination } from "./data-table-pagination"
import { DataTableToolbar } from "./data-table-toolbar"
import { TaskCard } from "./task-card"
import type { Sprint, Ticket } from "@/types"

interface SprintTasksViewProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  sprint: Sprint
  onUpdateTask: (task: Ticket) => void
  onDeleteTask: (taskId: string) => void
  onLogTime: (task: Ticket) => void
}

export function SprintTasksView<TData extends Ticket, TValue>({
  columns,
  data,
  sprint,
  onUpdateTask,
  onDeleteTask,
  onLogTime,
}: SprintTasksViewProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [viewMode, setViewMode] = React.useState<'list' | 'cards' | 'kanban'>('list');

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    meta: {
      onUpdateTask,
      onDeleteTask,
      onLogTime,
      sprint,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })
  
  const filteredRows = table.getRowModel().rows;
  
  const kanbanData = React.useMemo(() => {
    const grouped: Record<string, Row<TData>[]> = {
        "To Do": [],
        "Doing": [],
        "Done": [],
        "Blocked": [],
    };
    filteredRows.forEach(row => {
        const status = row.original.status;
        if(grouped[status]) {
            grouped[status].push(row);
        }
    });
    return grouped;
  }, [filteredRows]);
  

  const renderContent = () => {
    switch(viewMode) {
      case 'kanban':
        return (
          <div className="flex gap-6 overflow-x-auto pb-4 -mx-6 px-6">
            {statuses.map(status => (
              <div key={status.value} className="flex-1 min-w-80">
                <div className="bg-muted/50 rounded-lg p-4 h-full">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        {status.icon && <status.icon className="w-4 h-4" />}
                        <h3 className="font-semibold">{status.label}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {kanbanData[status.value]?.length || 0}
                        </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {kanbanData[status.value]?.reduce((sum, row) => sum + row.original.estimation, 0) || 0}h
                    </div>
                  </div>
                  <div className="space-y-3">
                    {kanbanData[status.value]?.map(row => (
                      <TaskCard 
                        key={row.id} 
                        task={row.original} 
                        onUpdateTask={onUpdateTask}
                        onDeleteTask={onDeleteTask}
                        onLogTime={onLogTime}
                        isSprintCompleted={sprint.status === 'Completed'}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      case 'cards':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredRows.map(row => (
              <TaskCard 
                key={row.id} 
                task={row.original}
                onUpdateTask={onUpdateTask}
                onDeleteTask={onDeleteTask}
                onLogTime={onLogTime}
                isSprintCompleted={sprint.status === 'Completed'}
              />
            ))}
          </div>
        )
      case 'list':
      default:
        return (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id} colSpan={header.colSpan}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {filteredRows.length ? (
                    filteredRows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                      >
                        No results.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <DataTablePagination table={table} />
          </>
        )
    }
  }

  return (
    <div className="space-y-4">
      <DataTableToolbar table={table} viewMode={viewMode} onViewModeChange={setViewMode} />
      {renderContent()}
    </div>
  )
}
