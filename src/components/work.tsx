import { Fragment } from "react";

import { Arrow } from "@/components/icons";
import { projects } from "@/lib/projects";
import { parseStatement } from "@/lib/statement";

export default function Work() {
  return (
    <section
      id="work"
      data-sky-anchor="work"
      aria-labelledby="work-title"
      className="relative z-1 px-6 pt-24 pb-[72px] md:px-0 md:pt-[120px] md:pb-24"
    >
      <div className="mx-auto max-w-[1440px] md:px-gutter">
        <h2
          id="work-title"
          className="pb-[26px] text-sm font-normal text-mute md:text-[15px]"
        >
          Selected work
        </h2>
        <ol>
          {projects.map((project) => (
            <li
              key={project.id}
              id={project.id}
              data-project
              className="relative flex scroll-mt-18 flex-wrap gap-x-12 gap-y-7 pt-10 pb-12 md:scroll-mt-24 md:gap-y-9 md:pt-14 md:pb-[72px]"
            >
              <div aria-hidden="true" data-hairline data-catch-light className="hairline absolute inset-x-0 top-0 h-px" />
              <div className="flex flex-[1_1_340px] flex-col items-start gap-5">
                <span className="text-[13px] text-dim tabular-nums">
                  {project.year}
                </span>
                <div className="mt-2 flex items-center gap-[18px]">
                  <h3 className="text-[clamp(2.5rem,4.4vw,4rem)] leading-none font-medium tracking-[-0.06em]">
                    {project.name}
                  </h3>
                  <a
                    className="visit"
                    data-catch-light
                    data-magnet
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Visit ${project.name}`}
                  >
                    <Arrow dir="ne" size={16} />
                  </a>
                </div>
              </div>
              <p
                data-statement
                className="min-w-0 flex-[1.7_1_520px] text-[clamp(1.375rem,2.2vw,2rem)] leading-[1.35] tracking-tighter text-pretty text-dim"
              >
                {parseStatement(project.statement).map((word, i) => (
                  <Fragment key={i}>
                    {i > 0 && " "}
                    <span data-word className={word.emphasis ? "font-medium text-ink" : undefined}>
                      {word.text}
                    </span>
                  </Fragment>
                ))}
              </p>
            </li>
          ))}
        </ol>
        <div aria-hidden="true" data-catch-light className="rule h-px" />
      </div>
    </section>
  );
}
