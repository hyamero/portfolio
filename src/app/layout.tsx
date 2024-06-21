import "./globals.css";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";

import Navbar from "@/components/navbar";
import { Footer } from "@/components/sections";
import { Toaster } from "@/components/ui/sonner";
import { CommandMenu } from "@/components/command-menu";

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
        <Navbar />
        <CommandMenu />
        {children}
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}
