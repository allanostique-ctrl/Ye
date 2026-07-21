import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Siding Materials Calculator',
  description: 'Local siding materials & labor estimating tool',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
