"use client";

import gsap from "gsap";
import Link from "next/link";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";

import { projects } from "@/lib/projects";
import { useParams } from "next/navigation";
import { ProjectShowcase } from "@/components/sections";
import { ArrowUpRight } from "lucide-react";

gsap.registerPlugin(useGSAP);

export default function Project() {
  const params = useParams<{ title: string }>();
  const project = projects.find((project) => project.company === params.title);

  const tl = useRef<GSAPTimeline>();

  useGSAP(() => {
    tl.current = gsap
      .timeline()
      .fromTo(
        ".project-title",
        {
          opacity: 0,
        },
        {
          opacity: 1,
          duration: 1.5,
          delay: 0.3,
          ease: "power4.out",
        },
      )
      .to(
        ".bg-overlay",
        {
          opacity: 0,
          duration: 1,
          ease: "power4.out",
          display: "none",
        },
        "<50%",
      );
  });

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
      <h2 className="project-title pointer-events-auto relative z-30 text-center text-[clamp(1.7rem,7vw,6rem)] font-medium capitalize leading-[1.1] tracking-[-0.07em] opacity-0">
        Project {project.company}
      </h2>

      <div className="bg-overlay fixed left-0 top-0 z-20 h-screen w-screen bg-black" />
      <ProjectShowcase {...project} />
      <div className="mt-20 grid place-items-center">
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover-effect pointer-events-auto flex items-center justify-center gap-3 rounded-full px-2 pb-2 text-base text-muted-foreground backdrop-blur-sm transition-colors hover:text-foreground md:text-lg"
        >
          <p>Return Home</p>
          <ArrowUpRight />
        </Link>
      </div>
    </div>
  );
}
