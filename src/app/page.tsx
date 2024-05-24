import { GridHighlight } from "@/components/grid-highlight";
import { Hero, ProjectShowcase } from "@/components/sections";
import { projects } from "@/lib/projects";

export default function Home() {
  return (
    <main>
      <GridHighlight />
      <Hero />
      <ProjectShowcase {...projects[0]} />
    </main>
  );
}
