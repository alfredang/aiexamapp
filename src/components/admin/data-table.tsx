import type { ReactNode } from 'react';

export type Column<T> = {
  key: string;
  header: ReactNode;
  cell: (row: T, index: number) => ReactNode;
  className?: string;
  headerClassName?: string;
  align?: 'left' | 'right' | 'center';
};

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  empty = 'No results.',
  dense = true
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  empty?: ReactNode;
  dense?: boolean;
}) {
  const rowPad = dense ? 'py-1.5' : 'py-2.5';
  return (
    <div className="card overflow-x-auto p-0">
      <table className="w-max min-w-full text-[13px]">
        <thead className="border-b border-slate-200 bg-slate-50/50 text-left text-[10px] uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/40">
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                className={`px-3 py-2 font-medium ${alignClass(c.align)} ${c.headerClassName ?? ''}`}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="px-3 py-6 text-center text-[12px] text-slate-500"
              >
                {empty}
              </td>
            </tr>
          )}
          {rows.map((r, i) => (
            <tr
              key={rowKey(r, i)}
              className="transition hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
            >
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={`px-3 ${rowPad} align-middle ${alignClass(c.align)} ${c.className ?? ''}`}
                >
                  {c.cell(r, i)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function alignClass(a?: 'left' | 'right' | 'center'): string {
  if (a === 'right') return 'text-right';
  if (a === 'center') return 'text-center';
  return 'text-left';
}
