import { requirePortalToken } from '@/lib/portal-session';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';

export default async function PortalItinerary() {
  const token = await requirePortalToken();
  const itineraries = await api.portalItinerary(token).catch(() => []);

  return (
    <div className="space-y-4 p-5">
      <h1 className="text-xl font-semibold">Your itinerary</h1>
      {itineraries.length === 0 && <p className="text-sm text-muted-foreground">No itinerary shared yet.</p>}
      {itineraries.map((it) => (
        <Card key={it.id}>
          <CardContent className="py-4">
            <div className="font-medium">{it.title}</div>
            <div className="text-sm text-muted-foreground">
              {it.destination ?? '—'}{it.durationDays ? ` · ${it.durationDays} days` : ''}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
