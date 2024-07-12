import { projects } from "@/lib/projects";

import {
  Hero,
  OSShowcase,
  DesignShowcase,
  ProjectShowcase,
} from "@/components/sections";
import HeroAnimation from "@/components/animations/hero";

export default function Home() {
  return (
    <main>
      <HeroAnimation>
        <Hero />
      </HeroAnimation>
      <ProjectShowcase {...projects[0]} />
      <OSShowcase />
      <ProjectShowcase {...projects[1]} />
      <DesignShowcase />
      <ProjectShowcase {...projects[2]} />
    </main>
  );
}
