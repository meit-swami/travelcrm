'use client';

import { Zap } from 'lucide-react';

/**
 * Small "fill with random sample data" button for input forms — speeds up
 * manual testing. Pass an `onFill` that applies the generated values.
 */
export function FillTestData({ onFill, className }: { onFill: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onFill}
      className={`inline-flex items-center gap-1.5 rounded-md border border-dashed border-primary/40 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/5 ${className ?? ''}`}
      title="Fill this form with random sample data"
    >
      <Zap className="h-3.5 w-3.5" /> Fill test data
    </button>
  );
}
