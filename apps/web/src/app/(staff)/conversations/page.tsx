import Link from 'next/link';
import { getAccessToken } from '@/lib/session';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';

export default async function ConversationsPage() {
  const token = await getAccessToken();
  const conversations = token ? await api.listConversations(token).catch(() => []) : [];

  return (
    <div className="p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Conversations</h1>
        <p className="text-sm text-muted-foreground">WhatsApp inbox — {conversations.length} thread(s)</p>
      </header>
      <Card className="divide-y divide-border">
        {conversations.length === 0 && (
          <div className="p-10 text-center text-sm text-muted-foreground">
            No conversations yet. Inbound WhatsApp messages appear here (configure a WhatsApp source + webhook).
          </div>
        )}
        {conversations.map((c) => (
          <div key={c.id} className="flex items-center justify-between p-4 hover:bg-muted/30">
            <div>
              <div className="font-medium">
                {c.lead ? <Link href={`/leads/${c.lead.id}`} className="hover:underline">{c.lead.name}</Link> : c.contactHandle}
              </div>
              <div className="text-xs text-muted-foreground">{c.contactHandle}</div>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {c.unreadCount > 0 && (
                <span className="rounded-full bg-primary px-2 py-0.5 font-medium text-primary-foreground">{c.unreadCount}</span>
              )}
              {c.lastMessageAt && <span>{new Date(c.lastMessageAt).toLocaleString()}</span>}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
