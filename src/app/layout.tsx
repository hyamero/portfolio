import "lenis/dist/lenis.css";
import "./globals.css";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";

import EdgeLight from "@/components/edge-light";
import SiteHeader from "@/components/site-header";
import SmoothScroll from "@/components/smooth-scroll";
import Sky from "@/components/sky/sky";
import { SkyGrain } from "@/components/sky/fallback";
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
    <html lang="en" data-sky="css" className={GeistSans.variable}>
      <body className="flex min-h-svh flex-col overflow-x-clip font-sans">
        {/* Without scripts nothing would fade the page-in up. */}
        <noscript>
          <style>{"[data-rise]{opacity:1!important}"}</style>
        </noscript>
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
