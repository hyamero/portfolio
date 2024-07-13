import { projects } from "@/lib/projects";

import {
  Hero,
  OSShowcase,
  DesignShowcase,
  ProjectShowcase,
} from "@/components/sections";
import HeroAnimation from "@/components/animations/hero";
import ScrollTrigAnimation from "@/components/animations/scroll-trigger";

export default function Home() {
  return (
    <main>
      <HeroAnimation>
        <Hero />
      </HeroAnimation>
      <ScrollTrigAnimation>
        <ProjectShowcase {...projects[0]} />
        <OSShowcase />
        <ProjectShowcase {...projects[1]} />
        <DesignShowcase />
        <ProjectShowcase {...projects[2]} />
      </ScrollTrigAnimation>
    </main>
  );
}
