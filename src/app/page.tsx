import Contact from "@/components/contact";
import Hero from "@/components/hero";
import Work from "@/components/work";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <Hero />
      <Work />
      <Contact />
    </main>
  );
}
