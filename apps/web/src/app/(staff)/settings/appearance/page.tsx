'use client';

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { THEMES, THEME_STORAGE_KEY, applyTheme, type ThemeId } from '@/lib/themes';

export default function AppearancePage() {
  const [active, setActive] = useState<ThemeId>('default');

  useEffect(() => {
    try {
      const saved = (localStorage.getItem(THEME_STORAGE_KEY) as ThemeId) || 'default';
      setActive(saved);
    } catch {
      /* ignore */
    }
  }, []);

  function choose(id: ThemeId) {
    setActive(id);
    applyTheme(id);
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Appearance</h1>
      <p className="mb-8 mt-1 text-sm text-muted-foreground">
        Pick a colour palette for your workspace. It recolours buttons, links, highlights and the
        sign-in &amp; portal panels instantly. Your choice is saved on this device.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {THEMES.map((t) => {
          const selected = active === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => choose(t.id)}
              className={`group relative overflow-hidden rounded-xl border bg-card p-4 text-left transition-all hover:shadow-md ${
                selected ? 'border-primary ring-2 ring-primary/40' : 'border-border'
              }`}
            >
              <div
                className="mb-3 h-20 w-full rounded-lg"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${t.swatch[0]}, ${t.swatch[1]}, ${t.swatch[2]})`,
                }}
              />
              <div className="flex items-center justify-between">
                <span className="font-medium">{t.label}</span>
                <span className="flex items-center gap-1">
                  {t.swatch.map((c) => (
                    <span
                      key={c}
                      className="h-3.5 w-3.5 rounded-full ring-1 ring-black/5"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </span>
              </div>
              {selected && (
                <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-primary shadow">
                  <Check className="h-4 w-4" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-10 max-w-xl">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Preview</h2>
        <PreviewCard />
      </div>
    </div>
  );
}

function PreviewCard() {
  return (
    <Card>
      <CardContent className="space-y-4 py-6">
        <div className="theme-gradient flex h-24 items-center justify-center rounded-lg text-lg font-semibold text-white">
          Brand panel
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            Primary button
          </span>
          <span className="accent-soft rounded-md px-4 py-2 text-sm font-medium text-primary">
            Soft chip
          </span>
          <a className="text-sm font-medium text-primary underline-offset-2 hover:underline" href="#">
            A themed link
          </a>
          <span className="theme-gradient-text text-lg font-bold">Gradient text</span>
        </div>
      </CardContent>
    </Card>
  );
}
