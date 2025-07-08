
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
import { statuses, scopes } from "./data"
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
  const [groupBy, setGroupBy] = React.useState<'status' | 'scope' | 'day' | null>(null);

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
  
  const groupedData = React.useMemo(() => {
    if (!groupBy) return null;

    let grouped: Record<string, Row<TData>[]> = {};

    if (groupBy === 'day') {
        const dayMap = new Map(sprint.sprintDays.map(d => [d.date, `D${d.day} - ${new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`]));
        const unloggedRows = new Set(filteredRows);

        filteredRows.forEach(row => {
            if (row.original.dailyLogs?.length) {
                row.original.dailyLogs.forEach(log => {
                    const dayKey = dayMap.get(log.date);
                    if (dayKey) {
                        if (!grouped[dayKey]) grouped[dayKey] = [];
                        if (!grouped[dayKey].find(r => r.id === row.id)) {
                            grouped[dayKey].push(row);
                        }
                        unloggedRows.delete(row);
                    }
                });
            }
        });

        if (unloggedRows.size > 0) {
            grouped["Unlogged"] = Array.from(unloggedRows);
        }
        
        // Sort day keys
        const sortedKeys = Object.keys(grouped).sort((a, b) => {
            if (a === 'Unlogged') return 1;
            if (b === 'Unlogged') return -1;
            return parseInt(a.slice(1)) - parseInt(b.slice(1));
        });
        
        const sortedGrouped: Record<string, Row<TData>[]> = {};
        sortedKeys.forEach(key => {
            sortedGrouped[key] = grouped[key];
        });
        grouped = sortedGrouped;

    } else {
        const groupKeys = (groupBy === 'status' ? statuses.map(s => s.value) : scopes.map(s => s.value));
        groupKeys.forEach(key => { grouped[key] = []; });
        
        filteredRows.forEach(row => {
            const groupKey = row.original[groupBy as 'status' | 'scope'];
            if (!grouped[groupKey]) grouped[groupKey] = [];
            grouped[groupKey].push(row);
        });
    }

    return Object.fromEntries(Object.entries(grouped).filter(([, rows]) => rows.length > 0));
  }, [filteredRows, groupBy, sprint.sprintDays]);
  
  const renderContent = () => {
    const dataToRender = groupedData ? Object.entries(groupedData) : [['all', filteredRows]];
    const isGrouped = !!groupedData;

    switch(viewMode) {
      case 'kanban':
        const kanbanColumns = isGrouped ? dataToRender : Object.entries(
            filteredRows.reduce((acc, row) => {
                const status = row.original.status;
                if (!acc[status]) acc[status] = [];
                acc[status].push(row);
                return acc;
            }, {} as Record<string, Row<TData>[]>)
        );
        const orderedKanbanColumns = statuses.map(s => {
            const found = kanbanColumns.find(([key]) => key === s.value);
            return found ? found : [s.value, []];
        }).filter(([,tasks]) => tasks.length > 0);

        return (
          <div className="flex gap-6 overflow-x-auto pb-4 -mx-6 px-6">
            {(isGrouped ? kanbanColumns : orderedKanbanColumns).map(([groupKey, rows]) => (
              <div key={groupKey} className="flex-1 min-w-80">
                <div className="bg-muted/50 rounded-lg p-4 h-full">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{groupKey}</h3>
                        <Badge variant="secondary" className="text-xs">{rows.length}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {rows.reduce((sum, row) => sum + (row.original as Ticket).estimation, 0)}h
                    </div>
                  </div>
                  <div className="space-y-3">
                    {rows.map(row => (
                      <TaskCard 
                        key={row.id} 
                        task={row.original as Ticket} 
                        sprint={sprint}
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
          <div className="space-y-6">
            {dataToRender.map(([groupKey, rows]) => (
                <div key={groupKey}>
                    {isGrouped && <h3 className="text-lg font-semibold mb-3">{groupKey}</h3>}
                     <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                        {rows.map(row => (
                        <TaskCard 
                            key={row.id} 
                            task={row.original as Ticket}
                            sprint={sprint}
                            onUpdateTask={onUpdateTask}
                            onDeleteTask={onDeleteTask}
                            onLogTime={onLogTime}
                            isSprintCompleted={sprint.status === 'Completed'}
                        />
                        ))}
                    </div>
                </div>
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
                  {isGrouped ? (
                     dataToRender.map(([groupKey, rows]) => (
                        <React.Fragment key={groupKey}>
                            <TableRow className="bg-muted/50 hover:bg-muted/50">
                                <TableCell colSpan={columns.length} className="font-semibold text-base">
                                    {groupKey}
                                </TableCell>
                            </TableRow>
                             {rows.map((row) => (
                                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                                    {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </React.Fragment>
                     ))
                  ) : (
                    filteredRows.length ? (
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
                  )
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
      <DataTableToolbar 
        table={table} 
        viewMode={viewMode} 
        onViewModeChange={setViewMode}
        groupBy={groupBy}
        onGroupByChange={setGroupBy}
      />
      {renderContent()}
    </div>
  )
}
