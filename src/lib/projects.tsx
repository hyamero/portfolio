import { type StaticImageData } from "next/image";
import omsThumb from "/public/img/projects/omsimos-thumb.png";
import umaminLogo from "/public/img/projects/umamin-logo.png";
import React from "react";

export type Project = {
  Subtitle: () => React.JSX.Element;
  image: StaticImageData;
  description: string;
  company: string;
  year: number;
  role: string;
  techs: string;
};

export const projects: Project[] = [
  {
    Subtitle: () => (
      <h2 className="w-full text-[clamp(1.5rem,3.3vw,3rem)] leading-[1.1] tracking-tighter text-muted-foreground lg:w-3/4 [&>span]:font-medium [&>span]:text-foreground">
        I specialize in crafting <span>high-quality</span> websites using{" "}
        <span>cutting-edge</span> technologies, seamlessly blending creative
        design with <span>top-tier</span> performance.
      </h2>
    ),
    image: omsThumb,
    description: "is a community driven open source developer collective",
    company: "Omsimos",
    year: 2023,
    role: "UI/UX Design, Front-End Engineer",
    techs: "React, Typescript, Next.js, Tailwind, and GSAP.",
  },
  {
    Subtitle: () => (
      <h2 className="w-full text-[clamp(1.5rem,3.3vw,3rem)] leading-[1.1] tracking-tighter text-muted-foreground md:w-3/4 [&>span]:font-medium [&>span]:text-foreground">
        Reached over <span>2.5 million unique users</span> and generated{" "}
        <span>14 million+ page visits</span>. Attained over 700K users in less
        than a week during the initial launch.
      </h2>
    ),
    image: umaminLogo,
    description: "is an open-source platform for anonymous messages.",
    company: "Umamin",
    year: 2023,
    role: "UI/UX Design, Front-End Engineer",
    techs: "React, Typescript, Next.js, Tailwind, Drizzle, and tRPC.",
  },
];
