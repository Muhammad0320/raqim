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
      <body>
        <div className="hq-layout">
          {children}
        </div>
      </body>
    </html>
  );
}
