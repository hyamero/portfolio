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
      <Hero />
      <ProjectShowcase {...projects[0]} />
      <OSShowcase />
      <ProjectShowcase {...projects[1]} />
      <DesignShowcase />
      <ProjectShowcase {...projects[2]} />
    </main>
  );
}
