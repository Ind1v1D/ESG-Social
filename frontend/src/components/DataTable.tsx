import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface DataTableProps {
  columns: { key: string; label: string }[];
  data: Record<string, unknown>[];
  filename?: string;
}

export function DataTable({ columns, data, filename = 'export' }: DataTableProps) {
  const { t } = useTranslation();
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const sorted = [...data].sort((a, b) => {
    if (!sortKey) return 0;
    const va = a[sortKey], vb = b[sortKey];
    if (va == null) return 1;
    if (vb == null) return -1;
    const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true });
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const exportCSV = () => {
    const escape = (v: unknown) => {
      if (v == null) return '';
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = columns.map(c => escape(c.label)).join(',');
    const rows = data.map(row => columns.map(c => escape(row[c.key])).join(','));
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${filename}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="card overflow-hidden stagger-child">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)]">
        <span className="text-[12px] font-medium text-[var(--text-muted)]">
          {data.length} {data.length !== 1 ? t('records') : t('record')}
        </span>
        <button onClick={exportCSV} className="btn-secondary text-[11px] py-1 px-2.5">
          {t('export_csv')}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-[var(--border)]">
              {columns.map(c => (
                <th
                  key={c.key}
                  onClick={() => toggleSort(c.key)}
                  className="text-left px-3.5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] cursor-pointer hover:text-[var(--accent)] transition-colors whitespace-nowrap"
                >
                  {c.label}
                  {sortKey === c.key && <span className="badge-animate inline-block ml-0.5">{sortDir === 'asc' ? '▲' : '▼'}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => (
              <tr key={i} className="border-b border-[var(--border)]/50 hover:bg-[var(--bg-hover)] transition-colors table-row-enter" style={{ animationDelay: `${Math.min(i * 25, 200)}ms` }}>
                {columns.map(c => (
                  <td key={c.key} className="px-3.5 py-2 whitespace-nowrap text-[var(--text)]">
                    {row[c.key] != null ? String(row[c.key]) : <span className="text-[var(--text-muted)]">—</span>}
                  </td>
                ))}
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="text-center py-8 text-[var(--text-muted)]">
                  {t('no_data_title')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}