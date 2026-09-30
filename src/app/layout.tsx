import "./globals.css";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";

import TransitionLoader from "@/components/transition-loader";
import GridPattern from "@/components/magicui/grid-pattern";
import Contact from "@/components/sections/contact";
import { Footer } from "@/components/sections";
import Navbar from "@/components/navbar";
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
    <html lang="en" className="dark">
      <body className={GeistSans.className}>
        <TransitionLoader />
        <Navbar />

        <GridPattern className="mask-[radial-gradient(ellipse_at_center,white,transparent_80%)]" />
        {children}
        <Contact />
        <Footer />
      </body>
    </html>
  );
}
