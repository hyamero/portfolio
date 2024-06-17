"use client";

import Link from "next/link";
import { projects } from "@/lib/projects";
import { Icons } from "@/components/icons";
import { useParams } from "next/navigation";
import { ProjectShowcase } from "@/components/sections";

export default function Project() {
  const params = useParams<{ title: string }>();

  const project = projects.find((project) => project.company === params.title);

  if (!project) {
    return (
      <div className="container relative z-10 pt-64 lg:pb-0">
        <h2 className="mx-auto text-center text-[clamp(1.7rem,7vw,6rem)] font-medium leading-[1.1] tracking-[-0.07em]">
          Project not found
        </h2>
      </div>
    );
  }

  return (
    <div className="pointer-events-none relative z-10 pt-64 lg:pb-0">
      <div className="pointer-events-auto flex flex-col justify-start">
        <h2 className="text-center text-[clamp(1.7rem,7vw,6rem)] font-medium capitalize leading-[1.1] tracking-[-0.07em]">
          Project {project.company}
        </h2>
      </div>
      <ProjectShowcase {...project} />
      <div className="mt-20 grid place-items-center">
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover-effect pointer-events-auto flex items-center justify-center gap-5 rounded-full px-2 pb-2 text-base text-muted-foreground backdrop-blur-sm transition-colors hover:text-foreground md:text-lg"
        >
          <p>Return Home</p>
          <Icons.arrowUpRight />
        </Link>
      </div>
    </div>
  );
}
