// Shared, print-friendly HTML for customer documents (quotations, invoices).
// Tolerant to line-item shape: accepts {description|label, quantity|qty,
// unitPrice|rate, amount}. Rendered to PDF by PdfService (HTML fallback).

export interface DocumentInput {
  docType: string; // e.g. 'Quotation', 'Invoice'
  ref: string;
  title?: string;
  party?: { name?: string; phone?: string | null; email?: string | null };
  destination?: string | null;
  lineItems: Array<Record<string, unknown>>;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  amountPaid?: number;
  currency: string;
  meta?: Array<{ label: string; value: string }>;
  notes?: string | null;
}

const esc = (s: unknown): string =>
  String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  );

const money = (n: number, cur: string): string =>
  `${cur} ${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function renderDocumentHtml(input: DocumentInput): string {
  const rows = input.lineItems
    .map((raw) => {
      const description = raw.description ?? raw.label ?? 'Item';
      const quantity = Number(raw.quantity ?? raw.qty ?? 1);
      const unitPrice = Number(raw.unitPrice ?? raw.rate ?? 0);
      const amount = Number(raw.amount ?? quantity * unitPrice);
      return `<tr><td>${esc(description)}</td><td class="r">${quantity}</td><td class="r">${money(unitPrice, input.currency)}</td><td class="r">${money(amount, input.currency)}</td></tr>`;
    })
    .join('');

  const metaRows = (input.meta ?? [])
    .map((m) => `<div><span class="muted">${esc(m.label)}</span><br><b>${esc(m.value)}</b></div>`)
    .join('');

  const balance = input.amountPaid != null ? input.total - input.amountPaid : null;

  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(input.docType)} ${esc(input.ref)}</title>
<style>
  *{box-sizing:border-box}
  body{font-family:-apple-system,system-ui,Segoe UI,Roboto,sans-serif;color:#0f172a;margin:0;padding:40px;font-size:13px;line-height:1.5}
  .bar{height:8px;border-radius:6px;background:linear-gradient(135deg,#4f46e5,#2563eb,#0ea5e9);margin-bottom:24px}
  .top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px}
  .brand{font-size:20px;font-weight:800}
  .brand small{display:block;font-weight:400;color:#64748b;font-size:12px}
  h1{font-size:22px;margin:0 0 4px}
  .muted{color:#64748b;font-size:12px}
  .grid{display:flex;gap:32px;flex-wrap:wrap;margin:20px 0 8px}
  table{width:100%;border-collapse:collapse;margin-top:16px}
  th{text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:#64748b;border-bottom:2px solid #e2e8f0;padding:8px 6px}
  td{padding:9px 6px;border-bottom:1px solid #eef2f7}
  .r{text-align:right}
  .totals{margin-top:16px;margin-left:auto;width:280px}
  .totals div{display:flex;justify-content:space-between;padding:5px 0}
  .totals .grand{border-top:2px solid #0f172a;margin-top:6px;padding-top:10px;font-size:16px;font-weight:800}
  .notes{margin-top:28px;padding:14px 16px;background:#f8fafc;border-radius:8px;color:#334155}
  .foot{margin-top:36px;text-align:center;color:#94a3b8;font-size:11px}
</style></head>
<body>
  <div class="bar"></div>
  <div class="top">
    <div class="brand">TravelOS&nbsp;AI<small>Tour &amp; Travel CRM</small></div>
    <div style="text-align:right">
      <h1>${esc(input.docType)}</h1>
      <div class="muted">Ref: <b>${esc(input.ref)}</b></div>
    </div>
  </div>

  <div class="grid">
    ${input.party ? `<div><span class="muted">Bill to</span><br><b>${esc(input.party.name)}</b><br><span class="muted">${esc(input.party.phone ?? '')} ${esc(input.party.email ?? '')}</span></div>` : ''}
    ${input.destination ? `<div><span class="muted">Destination</span><br><b>${esc(input.destination)}</b></div>` : ''}
    ${metaRows}
  </div>

  ${input.title ? `<h3 style="margin:18px 0 0">${esc(input.title)}</h3>` : ''}

  <table>
    <thead><tr><th>Description</th><th class="r">Qty</th><th class="r">Unit</th><th class="r">Amount</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="4" class="muted">No line items.</td></tr>'}</tbody>
  </table>

  <div class="totals">
    <div><span class="muted">Subtotal</span><span>${money(input.subtotal, input.currency)}</span></div>
    ${input.discount ? `<div><span class="muted">Discount</span><span>- ${money(input.discount, input.currency)}</span></div>` : ''}
    ${input.tax ? `<div><span class="muted">Tax</span><span>${money(input.tax, input.currency)}</span></div>` : ''}
    <div class="grand"><span>Total</span><span>${money(input.total, input.currency)}</span></div>
    ${input.amountPaid != null ? `<div><span class="muted">Paid</span><span>${money(input.amountPaid, input.currency)}</span></div>` : ''}
    ${balance != null ? `<div><span class="muted">Balance due</span><span><b>${money(balance, input.currency)}</b></span></div>` : ''}
  </div>

  ${input.notes ? `<div class="notes">${esc(input.notes)}</div>` : ''}
  <div class="foot">Generated by TravelOS AI · This is a system-generated document.</div>
</body></html>`;
}
