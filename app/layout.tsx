import type { Metadata, Viewport } from "next";
import { Inter, Nunito } from "next/font/google";
import { site } from "@/lib/site";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
// Rounded, friendly display face for headings — fits a kids' team.
const nunito = Nunito({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-display",
});

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
    <html lang="en" className={`${inter.variable} ${nunito.variable}`}>
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
