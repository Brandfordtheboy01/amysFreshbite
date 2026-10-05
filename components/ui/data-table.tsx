import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ColumnDef<T> {
  header: React.ReactNode;
  accessorKey?: keyof T;
  cell?: (row: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  keyExtractor?: (item: T, index: number) => string | number;
  loading?: boolean;
  emptyMessage?: React.ReactNode;
  className?: string;
  onRowClick?: (item: T) => void;
  pageSize?: number;
  pageSizeOptions?: number[];
  showPagination?: boolean;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor = (_, index) => index,
  loading = false,
  emptyMessage = 'No data available',
  className,
  onRowClick,
  pageSize: initialPageSize = 8,
  pageSizeOptions = [8, 15, 25, 50],
  showPagination = true,
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(initialPageSize);

  // Reset to page 1 whenever underlying data length changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [data.length]);

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedData = React.useMemo(() => {
    if (!showPagination) return data;
    const start = (validCurrentPage - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, showPagination, validCurrentPage, pageSize]);

  return (
    <div className={cn('rounded-xl border border-border bg-card shadow-sm overflow-hidden flex flex-col', className)}>
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow className="hover:bg-transparent border-b">
            {columns.map((col, idx) => (
              <TableHead
                key={idx}
                className={cn('font-semibold text-xs tracking-wider uppercase text-muted-foreground py-3.5', col.headerClassName)}
              >
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: Math.min(5, pageSize) }).map((_, rIdx) => (
              <TableRow key={rIdx}>
                {columns.map((col, cIdx) => (
                  <TableCell key={cIdx} className={col.className}>
                    <div className="h-5 w-full max-w-[140px] bg-muted animate-pulse rounded" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : paginatedData.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-36 text-center text-muted-foreground text-sm"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            paginatedData.map((row, rIdx) => {
              const actualIdx = (validCurrentPage - 1) * pageSize + rIdx;
              return (
                <TableRow
                  key={keyExtractor(row, actualIdx)}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'transition-colors hover:bg-muted/40',
                    onRowClick && 'cursor-pointer'
                  )}
                >
                  {columns.map((col, cIdx) => (
                    <TableCell key={cIdx} className={cn('py-3.5', col.className)}>
                      {col.cell
                        ? col.cell(row, actualIdx)
                        : col.accessorKey
                        ? String(row[col.accessorKey] ?? '')
                        : null}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {/* Pagination Footer */}
      {showPagination && data.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-border bg-muted/20 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <Select
              value={String(pageSize)}
              onValueChange={(val) => {
                setPageSize(Number(val));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-7 w-16 text-xs bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((opt) => (
                  <SelectItem key={opt} value={String(opt)} className="text-xs">
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="hidden sm:inline-block pl-2">
              Showing {(validCurrentPage - 1) * pageSize + 1} to{' '}
              {Math.min(validCurrentPage * pageSize, data.length)} of {data.length} entries
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span className="sm:hidden pr-2">
              Page {validCurrentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 bg-card"
              disabled={validCurrentPage <= 1}
              onClick={() => setCurrentPage(1)}
              title="First Page"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 bg-card"
              disabled={validCurrentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              title="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>

            <span className="hidden sm:inline-block px-3 font-medium text-foreground">
              Page {validCurrentPage} of {totalPages}
            </span>

            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 bg-card"
              disabled={validCurrentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              title="Next Page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 bg-card"
              disabled={validCurrentPage >= totalPages}
              onClick={() => setCurrentPage(totalPages)}
              title="Last Page"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
