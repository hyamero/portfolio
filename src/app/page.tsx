import { GridHighlight } from "@/components/grid-highlight";
import { Hero, ProjectShowcase } from "@/components/sections";
import { DesignShowcase } from "@/components/sections/design-showcase";
import { OSShowcase } from "@/components/sections/os-showcase";
import { projects } from "@/lib/projects";

export default function Home() {
  return (
    <main>
      <GridHighlight />
      <Hero />
      <ProjectShowcase {...projects[0]} />
      <OSShowcase />
      <ProjectShowcase {...projects[1]} />
      <DesignShowcase />
      <ProjectShowcase {...projects[2]} />
    </main>
  );
}
