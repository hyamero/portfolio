import { Fragment } from "react";

import { Arrow } from "@/components/icons";
import ScrollLink from "@/components/scroll-link";
import { EclipseSky, HorizonSky } from "@/components/sky/fallback";
import { siteConfig } from "@/lib/site";
import { parseStatement } from "@/lib/statement";

/** Board 09's statement; `*…*` marks emphasis, punctuation inside (see parseStatement). */
const STATEMENT =
  "I’m *Dale Bañares,* a *software engineer and designer* based in the Philippines, working mostly with teams across the EU";

export default function Hero() {
  const words = parseStatement(STATEMENT);
  return (
    <section id="home" data-sky-anchor="hero" className="relative overflow-hidden">
      <div className="px-gutter mx-auto flex min-h-[880px] max-w-[1440px] flex-wrap-reverse items-center justify-between gap-x-16 gap-y-10 pt-[120px] pb-20 md:min-h-[960px]">
        <div data-hero-copy data-sky-text="hero" className="relative z-1 max-w-[740px] min-w-0 flex-[1_1_560px]">
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
        <div aria-hidden="true" className="flex min-h-[clamp(320px,40vw,600px)] flex-[1_1_400px] items-center justify-center">
          <div data-sky-anchor="eclipse" className="relative aspect-square w-[clamp(220px,28vw,480px)]">
            <EclipseSky />
          </div>
        </div>
      </div>
      {/* The runway: a screen of sky for the camera move. Without motion there's no move to make. */}
      <div data-runway aria-hidden="true" className="relative h-svh overflow-hidden motion-reduce:hidden">
        <HorizonSky />
      </div>
    </section>
  );
}
