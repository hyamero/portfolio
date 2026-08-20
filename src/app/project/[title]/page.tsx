import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";

import { projects } from "@/lib/projects";
import { ProjectShowcase } from "@/components/sections";
import ProjectAnimation from "@/components/animations/project";

type Props = {
  params: Promise<{ title: string }>;
};

export function generateStaticParams() {
  return projects.map((project) => ({ title: project.projectTitle }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { title } = await params;
  const project = projects.find((project) => project.projectTitle === title);

  if (!project) return {};

  return {
    title: project.projectTitle,
    description: project.subtitle,
    openGraph: {
      images: [project.image.src],
    },
  };
}

export default async function Project({ params }: Props) {
  const { title } = await params;
  const project = projects.find((project) => project.projectTitle === title);

  if (!project) notFound();

  return (
    <ProjectAnimation>
      <div className="relative z-10 pt-64">
        <h2 className="project-title relative z-30 text-center text-[clamp(1.7rem,7vw,6rem)] leading-[1.1] font-medium tracking-[-0.07em] capitalize">
          <span>Project </span>
          <span>{project.projectTitle}</span>
        </h2>

        <ProjectShowcase {...project} />
        <div className="relative bottom-28 grid place-items-center">
          <Link
            href="/"
            className="hover-effect flex items-center justify-center gap-3 rounded-full px-2 pb-2 text-base text-muted-foreground transition-colors hover:text-foreground md:text-lg"
          >
            <p>Return Home</p>
            <ArrowUpRight />
          </Link>
        </div>
      </div>
    </ProjectAnimation>
  );
}
