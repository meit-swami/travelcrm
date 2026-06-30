'use client';

import { Download } from 'lucide-react';

/**
 * Client-side CSV export — builds a CSV from rows and triggers a download.
 * `rows` is an array of objects; columns are derived from the header order.
 */
export function ExportCsv({
  rows,
  columns,
  filename,
}: {
  rows: Record<string, string | number>[];
  columns: { key: string; label: string }[];
  filename: string;
}) {
  function download() {
    const esc = (v: string | number) => {
      const s = String(v ?? '');
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = columns.map((c) => esc(c.label)).join(',');
    const body = rows.map((r) => columns.map((c) => esc(r[c.key])).join(',')).join('\n');
    const blob = new Blob([`${header}\n${body}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={download}
      disabled={rows.length === 0}
      className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
    >
      <Download className="h-3.5 w-3.5" /> Export CSV
    </button>
  );
}
