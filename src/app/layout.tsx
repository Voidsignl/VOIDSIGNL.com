import type { Metadata } from "next"
import "./globals.css"
import { LangProvider } from "@/lib/lang-context"

export const metadata: Metadata = {
  title: "VOIDSIGNL — Not for everyone · For those who know",
  description: "Multi-game gaming community platform. Tournaments, rankings, and community.",
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
      <body className="bg-void text-text antialiased min-h-screen">
        <LangProvider>
          {children}
        </LangProvider>
      </body>
    </html>
  )
}
