import "./globals.css";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";

import TransitionLoader from "@/components/transition-loader";
import GridPattern from "@/components/magicui/grid-pattern";
import Contact from "@/components/sections/contact";
import { Toaster } from "@/components/ui/sonner";
import { Footer } from "@/components/sections";
import Navbar from "@/components/navbar";

export const metadata: Metadata = {
  title: {
    default: "Dale Bañares",
    template: "%s | Dale Bañares",
  },
  description: "Software Engineer and Designer based in the Philippines.",
  openGraph: {
    title: "Dale Bañares",
    description: "Software Engineer and Designer based in the Philippines",
    url: "https://dale.omsimos.com",
    siteName: "Dale Bañares",
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
    title: "Dale Bañares",
    card: "summary_large_image",
    description: "Software Engineer and Designer based in the Philippines",
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
        <Toaster />
        <Navbar />

        <GridPattern className="[mask-image:radial-gradient(ellipse_at_center,white,transparent_80%)]" />
        {children}
        <Contact />
        <Footer />
      </body>
    </html>
  );
}
