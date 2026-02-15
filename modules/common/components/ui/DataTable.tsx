"use client";

import { useState, useMemo, useCallback, ReactNode } from "react";

import { cn } from "@lib/utils/style";

// Types
type SortDirection = "asc" | "desc" | null;

interface Column<T> {
  id: string;
  header: ReactNode;
  accessor: keyof T | ((row: T) => ReactNode);
  sortable?: boolean;
  width?: string;
  align?: "left" | "center" | "right";
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyField: keyof T;
  // Sorting
  sortable?: boolean;
  defaultSort?: { column: string; direction: SortDirection };
  onSort?: (column: string, direction: SortDirection) => void;
  // Pagination
  pagination?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  // Selection
  selectable?: boolean;
  selectedRows?: Set<string | number>;
  onSelectionChange?: (selected: Set<string | number>) => void;
  // State
  loading?: boolean;
  emptyMessage?: ReactNode;
  // Styling
  striped?: boolean;
  hoverable?: boolean;
  compact?: boolean;
  className?: string;
  // Row actions
  onRowClick?: (row: T) => void;
}

// Pagination component
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  pageSizeOptions: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

function Pagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="border-grey-700 flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-grey-400 flex items-center gap-2 text-sm">
        <span>
          Showing {startItem}-{endItem} of {totalItems}
        </span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="border-grey-700 bg-grey-800 text-grey-300 focus:border-action-500 rounded border px-2 py-1 focus:outline-none"
          aria-label="Rows per page"
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size} rows
            </option>
          ))}
        </select>
      </div>

      <nav className="flex items-center gap-1" aria-label="Pagination">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="text-grey-400 hover:bg-grey-800 rounded p-2 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="First page"
        >
          <i className="gng-chevron-double-left text-sm" aria-hidden="true" />
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="text-grey-400 hover:bg-grey-800 rounded p-2 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Previous page"
        >
          <i className="gng-chevron-left text-sm" aria-hidden="true" />
        </button>

        <div className="flex items-center gap-1 px-2">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum: number;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={cn(
                  "min-w-8 rounded px-2 py-1 text-sm",
                  currentPage === pageNum
                    ? "bg-action-600 text-white"
                    : "text-grey-400 hover:bg-grey-800 hover:text-white"
                )}
                aria-label={`Page ${pageNum}`}
                aria-current={currentPage === pageNum ? "page" : undefined}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="text-grey-400 hover:bg-grey-800 rounded p-2 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Next page"
        >
          <i className="gng-chevron-right text-sm" aria-hidden="true" />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="text-grey-400 hover:bg-grey-800 rounded p-2 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Last page"
        >
          <i className="gng-chevron-double-right text-sm" aria-hidden="true" />
        </button>
      </nav>
    </div>
  );
}

// Checkbox component for selection
function Checkbox({
  checked,
  indeterminate,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      aria-label={ariaLabel}
      onClick={onChange}
      className={cn(
        "flex h-5 w-5 items-center justify-center rounded border-2 transition-colors",
        checked || indeterminate
          ? "border-action-500 bg-action-500 text-white"
          : "border-grey-600 hover:border-grey-400 bg-transparent"
      )}
    >
      {checked && <i className="gng-check text-xs" aria-hidden="true" />}
      {indeterminate && !checked && (
        <span className="h-0.5 w-2 rounded-full bg-white" aria-hidden="true" />
      )}
    </button>
  );
}

// Loading skeleton
function TableSkeleton({ columns, rows }: { columns: number; rows: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <td key={colIndex} className="px-4 py-3">
              <div className="bg-grey-700 h-4 animate-pulse rounded" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  keyField,
  sortable = true,
  defaultSort,
  onSort,
  pagination = true,
  pageSize: initialPageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  selectable = false,
  selectedRows: controlledSelectedRows,
  onSelectionChange,
  loading = false,
  emptyMessage = "No data available",
  striped = true,
  hoverable = true,
  compact = false,
  className,
  onRowClick,
}: DataTableProps<T>) {
  // Sorting state
  const [sortColumn, setSortColumn] = useState<string | null>(defaultSort?.column || null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(defaultSort?.direction || null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Selection state
  const [internalSelectedRows, setInternalSelectedRows] = useState<Set<string | number>>(new Set());
  const selectedRows = controlledSelectedRows ?? internalSelectedRows;

  // Handle sorting
  const handleSort = useCallback(
    (columnId: string) => {
      let newDirection: SortDirection;
      if (sortColumn !== columnId) {
        newDirection = "asc";
      } else if (sortDirection === "asc") {
        newDirection = "desc";
      } else if (sortDirection === "desc") {
        newDirection = null;
      } else {
        newDirection = "asc";
      }

      setSortColumn(newDirection ? columnId : null);
      setSortDirection(newDirection);
      onSort?.(columnId, newDirection);
    },
    [sortColumn, sortDirection, onSort]
  );

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return data;

    const column = columns.find((c) => c.id === sortColumn);
    if (!column) return data;

    return [...data].sort((a, b) => {
      const aValue =
        typeof column.accessor === "function" ? column.accessor(a) : a[column.accessor];
      const bValue =
        typeof column.accessor === "function" ? column.accessor(b) : b[column.accessor];

      // Handle null/undefined
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortDirection === "asc" ? 1 : -1;
      if (bValue == null) return sortDirection === "asc" ? -1 : 1;

      // Compare values
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [data, columns, sortColumn, sortDirection]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, pagination, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  // Handle page changes
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  // Handle selection
  const handleSelectAll = useCallback(() => {
    const allKeys = paginatedData.map((row) => row[keyField] as string | number);
    const allSelected = allKeys.every((key) => selectedRows.has(key));

    const newSelection = new Set(selectedRows);
    if (allSelected) {
      allKeys.forEach((key) => newSelection.delete(key));
    } else {
      allKeys.forEach((key) => newSelection.add(key));
    }

    if (controlledSelectedRows === undefined) {
      setInternalSelectedRows(newSelection);
    }
    onSelectionChange?.(newSelection);
  }, [paginatedData, keyField, selectedRows, controlledSelectedRows, onSelectionChange]);

  const handleSelectRow = useCallback(
    (rowKey: string | number) => {
      const newSelection = new Set(selectedRows);
      if (newSelection.has(rowKey)) {
        newSelection.delete(rowKey);
      } else {
        newSelection.add(rowKey);
      }

      if (controlledSelectedRows === undefined) {
        setInternalSelectedRows(newSelection);
      }
      onSelectionChange?.(newSelection);
    },
    [selectedRows, controlledSelectedRows, onSelectionChange]
  );

  // Calculate selection state for header
  const visibleRowKeys = paginatedData.map((row) => row[keyField] as string | number);
  const selectedCount = visibleRowKeys.filter((key) => selectedRows.has(key)).length;
  const isAllSelected = selectedCount === visibleRowKeys.length && visibleRowKeys.length > 0;
  const isPartialSelected = selectedCount > 0 && selectedCount < visibleRowKeys.length;

  // Get cell value
  const getCellValue = (row: T, column: Column<T>): ReactNode => {
    if (typeof column.accessor === "function") {
      return column.accessor(row);
    }
    return row[column.accessor] as ReactNode;
  };

  // Get aria-sort value for a column
  const getAriaSort = (column: Column<T>): "ascending" | "descending" | undefined => {
    if (!sortable || column.sortable === false || sortColumn !== column.id) {
      return undefined;
    }
    return sortDirection === "asc" ? "ascending" : "descending";
  };

  return (
    <div className={cn("border-grey-700 bg-grey-900 overflow-hidden rounded-lg border", className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-grey-700 bg-grey-800/50 border-b">
            <tr>
              {selectable && (
                <th scope="col" className="w-12 px-4 py-3">
                  <Checkbox
                    checked={isAllSelected}
                    indeterminate={isPartialSelected}
                    onChange={handleSelectAll}
                    ariaLabel={isAllSelected ? "Deselect all rows" : "Select all rows"}
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.id}
                  scope="col"
                  aria-sort={getAriaSort(column)}
                  className={cn(
                    "text-grey-200 px-4 text-left text-sm font-semibold",
                    compact ? "py-2" : "py-3",
                    column.align === "center" && "text-center",
                    column.align === "right" && "text-right",
                    column.width,
                    column.className
                  )}
                  style={column.width ? { width: column.width } : undefined}
                >
                  {sortable && column.sortable !== false ? (
                    <button
                      onClick={() => handleSort(column.id)}
                      className="group inline-flex items-center gap-2 hover:text-white"
                    >
                      {column.header}
                      <span className="text-grey-500 flex flex-col">
                        <i
                          className={cn(
                            "gng-chevron-up -mb-1 text-[10px]",
                            sortColumn === column.id && sortDirection === "asc" && "text-action-500"
                          )}
                          aria-hidden="true"
                        />
                        <i
                          className={cn(
                            "gng-chevron-down text-[10px]",
                            sortColumn === column.id &&
                              sortDirection === "desc" &&
                              "text-action-500"
                          )}
                          aria-hidden="true"
                        />
                      </span>
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-grey-800 divide-y">
            {loading ? (
              <TableSkeleton columns={columns.length + (selectable ? 1 : 0)} rows={pageSize} />
            ) : paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="text-grey-400 px-4 py-12 text-center"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, index) => {
                const rowKey = row[keyField] as string | number;
                const isSelected = selectedRows.has(rowKey);

                return (
                  <tr
                    key={rowKey}
                    onClick={() => onRowClick?.(row)}
                    className={cn(
                      "transition-colors",
                      striped && index % 2 === 1 && "bg-grey-800/30",
                      hoverable && "hover:bg-grey-800/50",
                      isSelected && "bg-action-500/10",
                      onRowClick && "cursor-pointer"
                    )}
                  >
                    {selectable && (
                      <td className="w-12 px-4 py-3">
                        <Checkbox
                          checked={isSelected}
                          onChange={() => handleSelectRow(rowKey)}
                          ariaLabel={`Select row ${rowKey}`}
                        />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td
                        key={column.id}
                        className={cn(
                          "text-grey-300 px-4 text-sm",
                          compact ? "py-2" : "py-3",
                          column.align === "center" && "text-center",
                          column.align === "right" && "text-right",
                          column.className
                        )}
                      >
                        {getCellValue(row, column)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pagination && sortedData.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={sortedData.length}
          pageSizeOptions={pageSizeOptions}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      )}
    </div>
  );
}
