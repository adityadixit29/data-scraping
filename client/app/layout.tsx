import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Job Importer – Import History',
  description: 'View import history and trigger job feed imports',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
