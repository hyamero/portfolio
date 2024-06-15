import { CommandMenu } from "@/components/command-menu";
import { GridHighlight } from "@/components/grid-highlight";
import { projects } from "@/lib/projects";

import {
  Hero,
  Footer,
  OSShowcase,
  DesignShowcase,
  ProjectShowcase,
} from "@/components/sections";

export default function Home() {
  return (
    <main>
      <CommandMenu />
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
