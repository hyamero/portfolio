import { Fragment } from "react";

import { Arrow } from "@/components/icons";
import ScrollLink from "@/components/scroll-link";
import { HorizonSky, PlanetSky } from "@/components/sky/fallback";
import { siteConfig } from "@/lib/site";
import { parseStatement } from "@/lib/statement";

/** The hero's statement; `*…*` marks emphasis, punctuation inside (see parseStatement). */
const STATEMENT =
  "I’m *Dale Bañares,* a *software engineer and designer* based in the Philippines, working mostly with teams across the EU";

export default function Hero() {
  const words = parseStatement(STATEMENT);
  return (
    <section id="home" data-sky-anchor="hero" className="relative overflow-hidden">
      {/* Clips the CSS sky's planet at the hero's foot, so it never reaches the runway's horizon. */}
      <div className="relative flex min-h-[880px] flex-col overflow-hidden pt-[120px] md:min-h-[960px]">
        <div
          aria-hidden="true"
          className="grid-lines absolute inset-0 z-0 bg-position-[calc(50%+32px)_0] mask-[radial-gradient(ellipse_58%_60%_at_50%_72%,#000_0%,rgb(0_0_0/0.5)_46%,transparent_78%)]"
        />
        <div className="px-gutter mx-auto w-full max-w-[1440px]">
          <div data-hero-copy data-sky-text="hero" className="relative z-1 max-w-[740px]">
            <h1 className="text-[clamp(1.875rem,3.4vw,3rem)] leading-[1.16] font-normal tracking-[-0.045em] text-pretty text-dim">
              {words.map((word, i) => (
                <Fragment key={i}>
                  {i > 0 && " "}
                  <span data-head-word className={word.emphasis ? "inline-block font-medium text-ink" : "inline-block"}>
                    {word.text}
                    {/* The full stop rides in the last word's box, so it never wraps alone. */}
                    {i === words.length - 1 && (
                      <>
                        <span className="sr-only">.</span>
                        <span aria-hidden="true" className="full-stop" />
                      </>
                    )}
                  </span>
                </Fragment>
              ))}
            </h1>
            <nav data-rise aria-label="Start here" className="mt-8 flex flex-wrap gap-x-9 gap-y-1 text-base tracking-tight">
              <ScrollLink to="work" className="line-link" data-catch-light data-magnet>
                Selected work <Arrow dir="s" size={16} />
              </ScrollLink>
              <a
                className="line-link"
                data-catch-light
                data-magnet
                href={siteConfig.links.resume}
                target="_blank"
                rel="noopener noreferrer"
              >
                Résumé <Arrow dir="ne" size={15} />
              </a>
              <a className="line-link" data-catch-light data-magnet href={siteConfig.links.email}>
                Email <Arrow dir="ne" size={15} />
              </a>
            </nav>
          </div>
        </div>
        {/* The planet rises under the copy, right of the middle: the box is its whole disc, its top the arc's apex. */}
        <div aria-hidden="true" className="relative mt-[clamp(96px,16vh,200px)] min-h-[200px] flex-1">
          <div data-sky-anchor="planet" className="absolute top-0 left-[62%] aspect-square w-[max(128vw,1120px)] -translate-x-1/2">
            <PlanetSky />
          </div>
        </div>
        {/* The CSS planet fades out above the hero's foot, as the reduced-motion live sky's does. */}
        <div aria-hidden="true" className="sky-fallback pointer-events-none absolute inset-x-0 bottom-0 -z-2 h-[200px] bg-linear-to-b from-transparent to-sky" />
      </div>
      {/* The runway: a screen of sky for the camera move. Without motion there's no move to make. */}
      <div data-runway aria-hidden="true" className="relative h-svh overflow-hidden motion-reduce:hidden">
        <HorizonSky />
      </div>
    </section>
  );
}
