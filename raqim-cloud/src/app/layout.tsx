import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Raqim Cloud",
  description: "The Deterministic Swarm OS",
};

import StyledComponentsRegistry from '@/lib/registry';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased scroll-smooth"
    >
      <body className="min-h-full flex flex-col">
        <StyledComponentsRegistry>
          {children}
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
