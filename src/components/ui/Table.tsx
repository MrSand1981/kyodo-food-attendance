// src/components/ui/Table.tsx
import { type ReactNode, type HTMLAttributes, forwardRef } from '\''react'\'';
import { clsx } from '\''clsx'\'';
import { twMerge } from '\''tailwind-merge'\'';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T, index: number) => ReactNode;
  className?: string;
  headerClassName?: string;
  width?: string;
  align?: '\''left'\'' | '\''center'\'' | '\''right'\'';
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  emptyMessage?: string;
  emptyIcon?: ReactNode;
  striped?: boolean;
  hoverable?: boolean;
  compact?: boolean;
  className?: string;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  loadingRows?: number;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = '\''Không có dữ liệu\'',
  emptyIcon,
  striped = true,
  hoverable = true,
  compact = false,
  className,
  onRowClick,
  loading = false,
  loadingRows = 5
}: TableProps<T>) {
  const alignClasses = {
    left: '\''text-left\'',
    center: '\''text-center\'',
    right: '\''text-right\''
  };

  const padding = compact ? '\''px-3 py-2\'' : '\''px-4 py-3\'';

  if (loading) {
    return (
      <div className={twMerge('\'table-container scrollbar-thin\'', className)}>
        <table className="\'table w-full\'">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={twMerge(
                    '\''font-bold uppercase text-xs tracking-wider bg-neutral-50 border-b border-neutral-200 text-neutral-600\'',
                    alignClasses[col.align || '\''left'\''],
                    padding,
                    col.headerClassName
                  )}
                  style={{ width: col.width }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: loadingRows }).map((_, i) => (
              <tr key={i} className="\'animate-pulse\'">
                {columns.map((col) => (
                  <td key={col.key} className={twMerge('\'border-b border-neutral-100\'', padding, alignClasses[col.align || '\''left'\''])}>
                    <div className="\'h-4 bg-neutral-200 rounded w-3/4\'" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={twMerge('\'table-container scrollbar-thin\'', className)}>
        <div className="\'flex flex-col items-center justify-center py-12 px-4 text-center\'">
          {emptyIcon && <div className="\'text-neutral-300 mb-3\'" >{emptyIcon}</div>}
          <p className="\'text-neutral-500 text-sm font-medium\'">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={twMerge('\'table-container scrollbar-thin\'', className)}>
      <table className="\'table w-full\'" role="grid">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={twMerge(
                  '\''font-bold uppercase text-xs tracking-wider bg-neutral-50 border-b border-neutral-200 text-neutral-600\'',
                  alignClasses[col.align || '\''left'\''],
                  padding,
                  col.headerClassName
                )}
                style={{ width: col.width }}
                scope="col"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={keyExtractor(row)}
              className={twMerge(
                '\''transition-colors\'',
                striped && rowIndex % 2 === 1 && '\''bg-neutral-50/50\'',
                hoverable && '\''hover:bg-neutral-50\'',
                onRowClick && '\''cursor-pointer\''
              )}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={twMerge(
                    '\''border-b border-neutral-100 text-sm text-neutral-800\'',
                    alignClasses[col.align || '\''left'\''],
                    padding,
                    col.className
                  )}
                >
                  {col.render ? col.render(row, rowIndex) : String((row as Record<string, unknown>)[col.key] ?? '\'\')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Simple Table wrapper for backward compatibility
export interface SimpleTableProps extends HTMLAttributes<HTMLTableElement> {
  children: ReactNode;
}

export const SimpleTable = forwardRef<HTMLTableElement, SimpleTableProps>(
  ({ className, children, ...props }, ref) => (
    <div className="\'table-container scrollbar-thin\'">
      <table ref={ref} className={twMerge('\'table w-full\'', className)} {...props}>
        {children}
      </table>
    </div>
  )
);

SimpleTable.displayName = '\'SimpleTable\'';

export const TableHeader = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, children, ...props }, ref) => (
    <thead ref={ref} className={twMerge('\'[&_tr]:border-b [&_tr]:border-neutral-200\'', className)} {...props}>
      {children}
    </thead>
  )
);

TableHeader.displayName = '\'TableHeader\'';

export const TableBody = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, children, ...props }, ref) => (
    <tbody ref={ref} className={twMerge('\'[&_tr:last-child]:border-0\'', className)} {...props}>
      {children}
    </tbody>
  )
);

TableBody.displayName = '\'TableBody\'';

export const TableRow = forwardRef<HTMLTableRowElement, HTMLAttributes<HTMLTableRowElement>>(
  ({ className, children, ...props }, ref) => (
    <tr ref={ref} className={twMerge('\'border-b border-neutral-100 transition-colors hover:bg-neutral-50\'', className)} {...props}>
      {children}
    </tr>
  )
);

TableRow.displayName = '\'TableRow\'';

export const TableHead = forwardRef<HTMLTableCellElement, HTMLAttributes<HTMLTableCellElement> & { align?: '\''left'\'' | '\''center'\'' | '\''right'\'' }>(
  ({ className, children, align = '\''left'\'', ...props }, ref) => (
    <th
      ref={ref}
      scope="col"
      className={twMerge(
        '\''px-4 py-3 font-bold uppercase text-xs tracking-wider bg-neutral-50 text-neutral-600\'',
        align === '\''center'\'' && '\''text-center\'',
        align === '\''right'\'' && '\''text-right\'',
        className
      )}
      {...props}
    >
      {children}
    </th>
  )
);

TableHead.displayName = '\'TableHead\'';

export const TableCell = forwardRef<HTMLTableCellElement, HTMLAttributes<HTMLTableCellElement> & { align?: '\''left'\'' | '\''center'\'' | '\''right'\'' }>(
  ({ className, children, align = '\''left'\'', ...props }, ref) => (
    <td
      ref={ref}
      className={twMerge(
        '\''px-4 py-3 text-sm text-neutral-800 border-b border-neutral-100\'',
        align === '\''center'\'' && '\''text-center\'',
        align === '\''right'\'' && '\''text-right\'',
        className
      )}
      {...props}
    >
      {children}
    </td>
  )
);

TableCell.displayName = '\'TableCell\'';
