import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/lib/providers";
import { canvasDark, canvasLight } from "@/styles/tokens/canvas";
import "./globals.css";

const sans = Geist({
  subsets: ["latin"],
  variable: "--font-body",
});

const mono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "PersonaLearn",
  description:
    "AI-powered co-pilot for Kenyan CBC educators — lesson planning, resources, and student feedback.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "PersonaLearn",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: canvasLight },
    { media: "(prefers-color-scheme: dark)", color: canvasDark },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sans.variable} ${mono.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
