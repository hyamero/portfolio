import Link from "next/link";

import NotFound from "@/app/not-found";
import { projects } from "@/lib/projects";
import { ArrowUpRight } from "lucide-react";
import { ProjectShowcase } from "@/components/sections";
import ProjectAnimation from "@/components/animations/project";

export async function generateMetadata({
  params,
}: {
  params: { title: string };
}) {
  const project = projects.find(
    (project) => project.projectTitle === params.title,
  );

  if (!project) {
    return {
      notFound: true,
    };
  }

  return {
    title: project.projectTitle,
    description: project.subtitle,
    image: project.image,
  };
}

export default function Project({ params }: { params: { title: string } }) {
  const project = projects.find(
    (project) => project.projectTitle === params.title,
  );

  if (!project) return <NotFound />;

  return (
    <ProjectAnimation>
      <div className="relative z-10 pt-64">
        <h2 className="project-title relative z-30 text-center text-[clamp(1.7rem,7vw,6rem)] font-medium capitalize leading-[1.1] tracking-[-0.07em]">
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
