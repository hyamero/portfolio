import type { Metadata } from "next";

import Contact from "@/components/contact";
import Hero from "@/components/hero";
import Motion from "@/components/motion";
import Work from "@/components/work";
import { jsonLd, structuredData } from "@/lib/structured-data";

export const metadata: Metadata = {
  // The same page also answers on the vercel.app domain; this one is the copy to index.
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData()) }} />
      <Motion>
        <Hero />
        <Work />
        <Contact />
      </Motion>
    </>
  );
}
