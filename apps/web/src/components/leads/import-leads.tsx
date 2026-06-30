'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X, FileDown } from 'lucide-react';
import { clientFetch } from '@/lib/client';
import { Button } from '@/components/ui/button';

// Map flexible CSV headers → lead fields.
const FIELD_ALIASES: Record<string, string> = {
  name: 'name', fullname: 'name', 'full name': 'name', customer: 'name',
  phone: 'phone', mobile: 'phone', contact: 'phone', 'phone number': 'phone',
  email: 'email', 'e-mail': 'email',
  destination: 'destination', place: 'destination', location: 'destination',
  budget: 'budgetAmount', budgetamount: 'budgetAmount', 'budget amount': 'budgetAmount',
  adults: 'adults', pax: 'adults',
  children: 'children', kids: 'children',
  traveldate: 'travelDate', 'travel date': 'travelDate', date: 'travelDate',
  notes: 'specialRequests', requests: 'specialRequests', 'special requests': 'specialRequests',
};

const TEMPLATE = 'name,phone,email,destination,budget,adults,children,travelDate,notes\nJohn Doe,+919812345678,john@example.com,Bali,150000,2,1,2026-09-10,Honeymoon trip\n';

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const splitRow = (row: string): string[] => {
    const out: string[] = [];
    let cur = '', inQ = false;
    for (let i = 0; i < row.length; i++) {
      const c = row[i];
      if (c === '"') {
        if (inQ && row[i + 1] === '"') { cur += '"'; i++; } else inQ = !inQ;
      } else if (c === ',' && !inQ) { out.push(cur); cur = ''; } else cur += c;
    }
    out.push(cur);
    return out.map((s) => s.trim());
  };
  const headers = splitRow(lines[0]).map((h) => FIELD_ALIASES[h.toLowerCase()] ?? '');
  return lines.slice(1).map((line) => {
    const cells = splitRow(line);
    const row: Record<string, string> = {};
    headers.forEach((field, i) => {
      if (field && cells[i]) row[field] = cells[i];
    });
    return row;
  });
}

function toLead(row: Record<string, string>) {
  const num = (v?: string) => (v != null && v !== '' && !Number.isNaN(Number(v)) ? Number(v) : undefined);
  return {
    name: row.name,
    phone: row.phone || undefined,
    email: row.email || undefined,
    destination: row.destination || undefined,
    budgetAmount: num(row.budgetAmount),
    adults: num(row.adults),
    children: num(row.children),
    travelDate: row.travelDate || undefined,
    specialRequests: row.specialRequests || undefined,
  };
}

export function ImportLeads() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ created: number; failed: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const preview = text.trim() ? parseCsv(text) : [];

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setText(await file.text());
  }

  async function runImport() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const leads = preview.map(toLead).filter((l) => l.name);
      if (leads.length === 0) throw new Error('No valid rows (a "name" column is required).');
      const res = await clientFetch('/api/proxy/leads/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads }),
      });
      if (!res.ok) throw new Error('Import failed');
      const data = (await res.json()) as { created: number; failed: number };
      setResult(data);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed');
    } finally {
      setLoading(false);
    }
  }

  const templateHref = `data:text/csv;charset=utf-8,${encodeURIComponent(TEMPLATE)}`;

  return (
    <>
      <Button variant="outline" className="gap-1.5" onClick={() => setOpen(true)}>
        <Upload className="h-4 w-4" /> Import
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Import leads from CSV</h2>
              <button onClick={() => setOpen(false)} className="rounded-md p-1.5 hover:bg-muted"><X className="h-5 w-5" /></button>
            </div>

            <p className="mb-3 text-sm text-muted-foreground">
              Paste CSV or upload a file. Columns: name (required), phone, email, destination, budget,
              adults, children, travelDate, notes.
            </p>

            <div className="mb-3 flex items-center gap-3">
              <label className="cursor-pointer rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted">
                Choose file
                <input type="file" accept=".csv,text/csv" onChange={onFile} className="hidden" />
              </label>
              <a href={templateHref} download="leads-template.csv" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                <FileDown className="h-4 w-4" /> Template
              </a>
            </div>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="name,phone,email,destination,budget,adults..."
              className="h-32 w-full rounded-md border border-input bg-background p-2 font-mono text-xs"
            />

            {preview.length > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                {preview.filter((r) => r.name).length} valid row(s) detected.
              </p>
            )}
            {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
            {result && (
              <p className="mt-2 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                Imported {result.created} lead(s){result.failed ? `, ${result.failed} failed` : ''}.
              </p>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
              <Button onClick={runImport} disabled={loading || preview.length === 0} className="gap-1.5">
                <Upload className="h-4 w-4" />
                {loading ? 'Importing…' : `Import ${preview.filter((r) => r.name).length || ''}`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
