import { GridHighlight } from "@/components/grid-highlight";
import { Hero, ProjectShowcase } from "@/components/sections";

export default function Home() {
  return (
    <main>
      <GridHighlight />
      <Hero />
      <ProjectShowcase />
    </main>
  );
}
