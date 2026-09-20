import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Toaster } from "sonner";

import "./globals.css";

export const metadata: Metadata = {
  title: "Fleet Note Triage",
  description: "Capture, triage, and track fleet issues.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-950 antialiased">
        {children}
        <Toaster closeButton position="bottom-center" richColors />
      </body>
    </html>
  );
}
