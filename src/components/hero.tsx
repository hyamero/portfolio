import { Arrow } from "@/components/icons";
import ScrollLink from "@/components/scroll-link";
import { HeroSky } from "@/components/sky/fallback";
import { siteConfig } from "@/lib/site";

export default function Hero() {
  return (
    <section
      id="home"
      data-sky-anchor="hero"
      className="relative min-h-[880px] overflow-hidden md:min-h-[960px]"
    >
      <HeroSky />
      <div
        aria-hidden="true"
        className="grid-lines absolute inset-0 z-0 bg-position-[calc(50%+32px)_0] mask-[radial-gradient(ellipse_58%_60%_at_50%_72%,#000_0%,rgb(0_0_0/0.5)_46%,transparent_78%)]"
      />
      <div
        data-hero-copy
        className="px-gutter relative z-1 mx-auto flex max-w-[1440px] flex-col items-center pt-[132px] text-center md:pt-[200px]"
      >
        <h1
          data-rise
          className="text-[clamp(2.75rem,6.1vw,5.5rem)] leading-[1.04] font-normal tracking-[0.01em] text-balance"
        >
          Software engineer <span className="block text-glow">and designer.</span>
        </h1>
        <p
          data-rise
          className="mt-6 max-w-[34em] text-base leading-[1.6] tracking-[0.015em] text-balance text-mute md:mt-[30px] md:text-[clamp(1rem,1.3vw,1.1875rem)]"
        >
          I’m Dale Bañares, based in the Philippines and working mostly with teams across the EU.
        </p>
        <nav
          data-rise
          aria-label="Start here"
          className="mt-[26px] flex flex-wrap justify-center gap-x-8 gap-y-1 text-[15px] font-medium tracking-[0.04em] md:mt-[34px] md:gap-x-10 md:gap-y-2"
        >
          <ScrollLink to="work" className="line-link">
            Selected work <Arrow dir="s" size={16} />
          </ScrollLink>
          <a
            className="line-link"
            href={siteConfig.links.resume}
            target="_blank"
            rel="noopener noreferrer"
          >
            Résumé <Arrow dir="ne" size={15} />
          </a>
        </nav>
      </div>
    </section>
  );
}
