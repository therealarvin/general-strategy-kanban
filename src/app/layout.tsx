import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "General Strategy — Command Center",
  description: "Internal kanban board and vault for General Strategy",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-canvas text-ink dark:bg-dark dark:text-canvas font-sans">
        {children}
      </body>
    </html>
  );
}
