import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

import { GridHighlight } from "@/components/grid-highlight";
import { CommandMenu } from "@/components/command-menu";
import SmoothScroll from "@/components/smooth-scroll";
import { Toaster } from "@/components/ui/sonner";
import Navbar from "@/components/navbar";
import { Footer } from "@/components/sections";

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
    <html lang="en">
      <body className={GeistSans.className}>
        <Navbar />
        <CommandMenu />
        <GridHighlight />
        <SmoothScroll>{children}</SmoothScroll>
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}
