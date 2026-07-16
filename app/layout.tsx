import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { site } from "@/lib/site";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: {
    default: `${site.teamName} — ${site.tagline}`,
    template: `%s · ${site.teamName}`,
  },
  description: `${site.teamName} team hub: calendar, news, snack schedule and more for players and families.`,
};

export const viewport: Viewport = {
  themeColor: "#1B4D7E",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
