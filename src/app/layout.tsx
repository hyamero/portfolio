import "./globals.css";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";

import TransitionLoader from "@/components/transition-loader";
import GridPattern from "@/components/magicui/grid-pattern";
import { Toaster } from "@/components/ui/sonner";
import { Footer } from "@/components/sections";
import Navbar from "@/components/navbar";

export const metadata: Metadata = {
  title: "Dale Bañares — Software Engineer and Designer",
  description:
    "Joseph Dale Bañares is a Software Engineer and Designer based in the Philippines.",
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

        <GridPattern className="[mask-image:radial-gradient(ellipse_at_center,white,transparent_80%)]" />

        {children}
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}
