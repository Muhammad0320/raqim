import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Raqim OS | Aegis Terminal',
  description: 'Hyper-performant zero-copy Agentic Swarm Daemon GUI',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-surface text-on-surface font-body antialiased selection:bg-primary-container/30 h-screen w-screen overflow-hidden flex flex-col">
        {children}
      </body>
    </html>
  );
}
