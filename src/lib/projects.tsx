import { type StaticImageData } from "next/image";
import omsThumb from "/public/img/projects/omsimos-thumb.png";
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
      <h2 className="w-full text-[clamp(1.5rem,3.3vw,3rem)] leading-[1.1] tracking-tighter text-muted-foreground md:w-3/4 [&>span]:font-medium [&>span]:text-foreground">
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
    techs: "React, Typescript, Next.js, Tailwind, and GSAP",
  },
];
