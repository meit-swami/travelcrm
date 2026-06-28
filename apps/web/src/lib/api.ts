/**
 * Minimal typed API client for the TravelOS API. The browser talks to the API
 * directly (CORS-enabled); the access token is read from the httpOnly session
 * cookie on the server and passed explicitly where needed.
 */
export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export interface ProblemDetails {
  title: string;
  status: number;
  code: string;
  detail?: string;
  errors?: Array<{ field: string; message: string }>;
}

export class ApiError extends Error {
  constructor(public readonly problem: ProblemDetails) {
    super(problem.detail ?? problem.title);
  }
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; fullName: string; tenantId: string; roles: string[] };
}

async function request<T>(path: string, init?: RequestInit & { token?: string }): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set('Content-Type', 'application/json');
  if (init?.token) headers.set('Authorization', `Bearer ${init.token}`);

  const res = await fetch(`${API_BASE}/api/v1${path}`, { ...init, headers, cache: 'no-store' });
  if (!res.ok) {
    let problem: ProblemDetails;
    try {
      problem = (await res.json()) as ProblemDetails;
    } catch {
      problem = { title: res.statusText, status: res.status, code: 'ERROR' };
    }
    throw new ApiError(problem);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  login: (body: { tenantSlug: string; email: string; password: string; totp?: string }) =>
    request<AuthTokens>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  me: (token: string) =>
    request<{
      id: string;
      email: string;
      fullName: string;
      roles: string[];
      permissions: string[];
    }>('/auth/me', { token }),

  logout: (refreshToken: string) =>
    request<{ success: boolean }>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),

  listLeads: (token: string, params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : '';
    return request<{
      data: Array<{
        id: string;
        referenceCode: string;
        name: string;
        phone: string | null;
        destination: string | null;
        stage: string;
        priority: string;
        createdAt: string;
        assignedUser: { id: string; fullName: string } | null;
        source: { id: string; name: string; type: string } | null;
      }>;
      pagination: { nextCursor: string | null; limit: number };
    }>(`/leads${qs}`, { token });
  },

  getLead: (token: string, id: string) =>
    request<Lead>(`/leads/${id}`, { token }),

  leadTimeline: (token: string, id: string) =>
    request<Array<{ id: string; type: string; title: string; body: string | null; createdAt: string }>>(
      `/leads/${id}/timeline`,
      { token },
    ),

  leadQuotations: (token: string, id: string) =>
    request<Array<{ id: string; referenceCode: string; title: string; status: string; totalAmount: string; currency: string }>>(
      `/leads/${id}/quotations`,
      { token },
    ),

  leadNotes: (token: string, id: string) =>
    request<Array<{ id: string; body: string; isPinned: boolean; createdAt: string; author: { fullName: string } | null }>>(
      `/leads/${id}/notes`,
      { token },
    ),

  createLead: (token: string, body: Record<string, unknown>) =>
    request<Lead>('/leads', { method: 'POST', token, body: JSON.stringify(body) }),

  listBookings: (token: string) =>
    request<Array<{ id: string; referenceCode: string; destination: string | null; opsStage: string; totalValue: string; currency: string; lead: { name: string } | null }>>(
      '/bookings',
      { token },
    ),

  listQuotations: (token: string, status?: string) =>
    request<Array<{ id: string; referenceCode: string; title: string; status: string; totalAmount: string; currency: string; createdAt: string; lead: { id: string; name: string } | null }>>(
      `/quotations${status ? `?status=${status}` : ''}`,
      { token },
    ),

  listConversations: (token: string) =>
    request<Array<{ id: string; contactHandle: string; lastMessageAt: string | null; unreadCount: number; lead: { id: string; name: string } | null }>>(
      '/conversations',
      { token },
    ),

  conversationMessages: (token: string, id: string) =>
    request<Array<{ id: string; direction: string; body: string | null; createdAt: string; status: string }>>(
      `/conversations/${id}/messages`,
      { token },
    ),

  // ── Customer portal (OTP-scoped) ──
  portalRequestOtp: (body: { tenantSlug: string; phone: string }) =>
    request<{ sent: boolean }>('/portal/request-otp', { method: 'POST', body: JSON.stringify(body) }),

  portalVerifyOtp: (body: { tenantSlug: string; phone: string; code: string }) =>
    request<{ accessToken: string; identityId: string }>('/portal/verify-otp', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  portalMe: (token: string) =>
    request<{ phone: string; email: string | null; lead: { id: string; name: string; destination: string | null; travelDate: string | null; stage: string } | null }>(
      '/portal/me',
      { token },
    ),

  portalQuotations: (token: string) =>
    request<Array<{ id: string; referenceCode: string; title: string; status: string; totalAmount: string; currency: string; sentAt: string | null }>>(
      '/portal/quotations',
      { token },
    ),

  portalInvoices: (token: string) =>
    request<Array<{ id: string; invoiceNo: string; status: string; total: string; amountPaid: string; currency: string; dueDate: string | null }>>(
      '/portal/invoices',
      { token },
    ),

  portalPayments: (token: string) =>
    request<Array<{ id: string; type: string; amount: string; currency: string; status: string; paidAt: string | null }>>(
      '/portal/payments',
      { token },
    ),

  portalVouchers: (token: string) =>
    request<Array<{ id: string; type: string; referenceCode: string; status: string; generatedAt: string | null }>>(
      '/portal/vouchers',
      { token },
    ),

  portalItinerary: (token: string) =>
    request<Array<{ id: string; title: string; destination: string | null; durationDays: number | null }>>(
      '/portal/itinerary',
      { token },
    ),
};

export interface Lead {
  id: string;
  referenceCode: string;
  name: string;
  email: string | null;
  phone: string | null;
  destination: string | null;
  travelDate: string | null;
  adults: number;
  children: number;
  budgetAmount: string | null;
  budgetCurrency: string;
  stage: string;
  status: string;
  priority: string;
  score: number | null;
  specialRequests: string | null;
  assignedUser?: { id: string; fullName: string; email: string } | null;
  source?: { id: string; name: string; type: string } | null;
}

export const LEAD_STAGES = [
  'new',
  'contacted',
  'interested',
  'quotation_sent',
  'negotiation',
  'follow_up',
  'confirmed',
  'lost',
  'cancelled',
] as const;

export const STAGE_LABELS: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  interested: 'Interested',
  quotation_sent: 'Quotation Sent',
  negotiation: 'Negotiation',
  follow_up: 'Follow Up',
  confirmed: 'Confirmed',
  lost: 'Lost',
  cancelled: 'Cancelled',
};
