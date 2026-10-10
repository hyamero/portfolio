import "lenis/dist/lenis.css";
import "./globals.css";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";

import EdgeLight from "@/components/edge-light";
import SiteHeader from "@/components/site-header";
import SmoothScroll from "@/components/smooth-scroll";
import Sky from "@/components/sky/sky";
import { SkyGrain, SkyStars } from "@/components/sky/fallback";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    locale: "en_US",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  twitter: {
    title: siteConfig.name,
    card: "summary_large_image",
    description: siteConfig.description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // The script below changes data-sky before hydration.
    <html lang="en" data-sky="css" className={GeistSans.variable} suppressHydrationWarning>
      <head>
        {/* Before first paint, so a slow hydration can't let the CSS planet's dawn start while the live
            sky may still take over (sky polish spec §6). */}
        <script dangerouslySetInnerHTML={{ __html: 'if("gpu"in navigator)document.documentElement.dataset.sky="pending"' }} />
      </head>
      <body className="flex min-h-svh flex-col overflow-x-clip font-sans">
        {/* Without scripts nothing would fade the page-in up. */}
        <noscript>
          <style>{"[data-rise],[data-head-word]{opacity:1!important}"}</style>
        </noscript>
        <SkyStars />
        <SkyGrain />
        <Sky />
        <SmoothScroll />
        <EdgeLight />
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
