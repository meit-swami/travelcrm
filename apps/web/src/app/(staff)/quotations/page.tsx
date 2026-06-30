import Link from 'next/link';
import { Download } from 'lucide-react';
import { getAccessToken } from '@/lib/session';
import { api } from '@/lib/api';
import { appUrl } from '@/lib/client';
import { Card } from '@/components/ui/card';

const fmtMoney = (amt: string, cur = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(Number(amt));

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  sent: 'bg-amber-100 text-amber-700',
  viewed: 'bg-cyan-100 text-cyan-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  expired: 'bg-gray-100 text-gray-500',
};

export default async function QuotationsPage() {
  const token = await getAccessToken();
  const quotes = token ? await api.listQuotations(token).catch(() => []) : [];

  return (
    <div className="p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Quotations</h1>
        <p className="text-sm text-muted-foreground">{quotes.length} quotation(s)</p>
      </header>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Ref</th>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Total</th>
              <th className="px-4 py-3 font-medium text-right">PDF</th>
            </tr>
          </thead>
          <tbody>
            {quotes.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No quotations yet.</td></tr>
            )}
            {quotes.map((q) => (
              <tr key={q.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3 font-mono text-xs">{q.referenceCode}</td>
                <td className="px-4 py-3 font-medium">{q.title}</td>
                <td className="px-4 py-3">
                  {q.lead ? <Link href={`/leads/${q.lead.id}`} className="text-primary hover:underline">{q.lead.name}</Link> : '—'}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[q.status] ?? 'bg-gray-100'}`}>{q.status}</span>
                </td>
                <td className="px-4 py-3 text-right font-semibold">{fmtMoney(q.totalAmount, q.currency)}</td>
                <td className="px-4 py-3 text-right">
                  <a
                    href={appUrl(`/api/doc/quotation/${q.id}`)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    title="Download quotation PDF"
                  >
                    <Download className="h-3.5 w-3.5" /> PDF
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
