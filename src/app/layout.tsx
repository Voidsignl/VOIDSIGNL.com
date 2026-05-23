import type { Metadata, Viewport } from "next"
import "./globals.css"
import { LangProvider } from "@/lib/lang-context"
import { AchievementProvider } from "@/context/AchievementContext"
import { PWAProvider } from "@/components/ui/pwa-provider"

export const metadata: Metadata = {
  title: "VOIDSIGNL — Not for everyone · For those who know",
  description: "Multi-game gaming community platform. Tournaments, rankings, and community.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "VOIDSIGNL",
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: "/icon.svg",
  },
}

export const viewport: Viewport = {
  themeColor: "#0e0e12",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-void text-text antialiased min-h-screen relative">
        {/* Subtle body grain — cyber-premium texture, 0.025 opacity */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-0 opacity-[0.025] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />
        <div className="relative z-10">
          <LangProvider>
            <AchievementProvider>
              {children}
            </AchievementProvider>
          </LangProvider>
        </div>
        <PWAProvider />
      </body>
    </html>
  )
}
