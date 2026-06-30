// Colour-palette catalogue for the Appearance settings. Each entry maps to a
// [data-theme="…"] block in globals.css. `swatch` holds the three brand
// gradient stops (as hex) purely for the picker preview.

export type ThemeId = 'default' | 'emerald' | 'violet' | 'rose' | 'amber' | 'ocean';

export interface ThemeOption {
  id: ThemeId;
  label: string;
  swatch: [string, string, string];
}

export const THEMES: ThemeOption[] = [
  { id: 'default', label: 'Indigo', swatch: ['#4f46e5', '#2563eb', '#0ea5e9'] },
  { id: 'emerald', label: 'Emerald', swatch: ['#059669', '#0d9488', '#22c55e'] },
  { id: 'violet', label: 'Violet', swatch: ['#7c3aed', '#9333ea', '#d946ef'] },
  { id: 'rose', label: 'Rose', swatch: ['#e11d48', '#db2777', '#ef4444'] },
  { id: 'amber', label: 'Amber', swatch: ['#f59e0b', '#f97316', '#fb7185'] },
  { id: 'ocean', label: 'Ocean', swatch: ['#0891b2', '#0284c7', '#2563eb'] },
];

export const THEME_STORAGE_KEY = 'travelos-theme';

/** Apply a palette immediately and persist the choice (client-side only). */
export function applyTheme(id: ThemeId): void {
  if (typeof document === 'undefined') return;
  if (id === 'default') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', id);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
}
