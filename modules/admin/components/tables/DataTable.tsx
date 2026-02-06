"use client";

import { useState, useMemo } from "react";

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table";

import { cn } from "@lib/utils/style";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T, any>[];
  searchPlaceholder?: string;
  searchKey?: string;
  pageSize?: number;
  isLoading?: boolean;
  onRowClick?: (row: T) => void;
  bulkActions?: Array<{
    label: string;
    icon?: string;
    action: (selectedRows: T[]) => void;
    variant?: "default" | "danger";
  }>;
}

export default function DataTable<T extends { id: string }>({
  data,
  columns,
  searchPlaceholder = "Search...",
  searchKey: _searchKey = "email",
  pageSize = 10,
  isLoading = false,
  onRowClick,
  bulkActions,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowSelection, setRowSelection] = useState({});

  // Add selection column if bulk actions exist
  const tableColumns = useMemo(() => {
    if (!bulkActions?.length) return columns;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const selectionColumn: ColumnDef<T, any> = {
      id: "select",
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={(e) => table.toggleAllPageRowsSelected(e.target.checked)}
          className="border-grey-600 bg-grey-800 text-action-500 focus:ring-action-500 h-4 w-4 rounded"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={(e) => row.toggleSelected(e.target.checked)}
          onClick={(e) => e.stopPropagation()}
          className="border-grey-600 bg-grey-800 text-action-500 focus:ring-action-500 h-4 w-4 rounded"
        />
      ),
      enableSorting: false,
      size: 40,
    };

    return [selectionColumn, ...columns];
  }, [columns, bulkActions]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize },
    },
    enableRowSelection: !!bulkActions?.length,
  });

  const selectedRows = table.getSelectedRowModel().rows.map((r) => r.original);

  return (
    <div className="border-grey-800 bg-grey-900 rounded-xl border">
      {/* Header */}
      <div className="border-grey-800 flex flex-col gap-4 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <i className="gng-search text-grey-500 absolute top-1/2 left-3 -translate-y-1/2" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="border-grey-700 bg-grey-800 placeholder-grey-500 focus:border-action-500 w-full rounded-lg border py-2 pr-4 pl-10 text-sm text-white outline-none sm:max-w-xs"
          />
        </div>

        {/* Bulk Actions */}
        {bulkActions && selectedRows.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-grey-400 text-sm">{selectedRows.length} selected</span>
            {bulkActions.map((action) => (
              <button
                key={action.label}
                onClick={() => action.action(selectedRows)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  action.variant === "danger"
                    ? "bg-danger/20 text-danger hover:bg-danger/30"
                    : "bg-grey-800 text-grey-300 hover:bg-grey-700"
                )}
              >
                {action.icon && <i className={action.icon} />}
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-grey-800 border-b">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={cn(
                      "text-grey-400 px-4 py-3 text-left text-xs font-medium tracking-wider uppercase",
                      header.column.getCanSort() && "cursor-pointer select-none hover:text-white"
                    )}
                    style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-2">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        <span className="text-grey-600">
                          {{
                            asc: "↑",
                            desc: "↓",
                          }[header.column.getIsSorted() as string] ?? "↕"}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-grey-800 border-b">
                  {tableColumns.map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="bg-grey-800 h-4 w-3/4 animate-pulse rounded" />
                    </td>
                  ))}
                </tr>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={tableColumns.length} className="text-grey-500 px-4 py-12 text-center">
                  No results found
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick?.(row.original)}
                  className={cn(
                    "border-grey-800 border-b transition-colors",
                    onRowClick && "hover:bg-grey-800/50 cursor-pointer",
                    row.getIsSelected() && "bg-action-900/30"
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="text-grey-300 px-4 py-3 text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="border-grey-800 flex items-center justify-between border-t px-4 py-3">
        <div className="text-grey-500 text-sm">
          Showing {table.getState().pagination.pageIndex * pageSize + 1} to{" "}
          {Math.min((table.getState().pagination.pageIndex + 1) * pageSize, data.length)} of{" "}
          {data.length}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="border-grey-700 bg-grey-800 text-grey-300 hover:bg-grey-700 rounded-lg border px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-grey-400 text-sm">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="border-grey-700 bg-grey-800 text-grey-300 hover:bg-grey-700 rounded-lg border px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
