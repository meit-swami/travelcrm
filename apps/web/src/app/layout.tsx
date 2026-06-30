import type { Metadata } from 'next';
import './globals.css';
import { ThemeInit } from '@/components/theme-init';

export const metadata: Metadata = {
  title: 'TravelOS AI',
  description: 'AI-powered Tour & Travel CRM',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeInit />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
