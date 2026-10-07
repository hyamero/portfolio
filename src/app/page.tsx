import Contact from "@/components/contact";
import Hero from "@/components/hero";
import Motion from "@/components/motion";
import Work from "@/components/work";

export default function Home() {
  return (
    <Motion>
      <Hero />
      <Work />
      <Contact />
    </Motion>
  );
}
