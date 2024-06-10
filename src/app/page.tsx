import { GridHighlight } from "@/components/grid-highlight";
import {
  Hero,
  OSShowcase,
  ProjectShowcase,
  DesignShowcase,
  Footer,
} from "@/components/sections";
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
      <Footer />
    </main>
  );
}
