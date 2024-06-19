import React from "react";
import { type StaticImageData } from "next/image";
import omsThumb from "/public/img/projects/omsimos.jpg";
import umaminThumb from "/public/img/projects/umamin.jpg";
import foliageThumb from "/public/img/projects/foliage.jpg";

export type Project = {
  Subtitle: () => React.JSX.Element;
  image: StaticImageData;
  description: string;
  company: string;
  year: number;
  role: string;
  techs: string;
  url: string;
  shineColor: string[];
};

const SubtitleWrapper = ({ children }: { children: React.ReactNode }) => (
  <h2 className="pointer-events-auto w-full  2xl:w-4/5 [&>span]:font-medium [&>span]:text-foreground">
    {children}
  </h2>
);

export const projects: Project[] = [
  {
    company: "omsimos",
    description: "is a community driven open source developer collective",
    Subtitle: () => (
      <SubtitleWrapper>
        I specialize in crafting <span>high-quality</span> websites using{" "}
        <span>cutting-edge</span> technologies, seamlessly blending creative
        design with <span>top-tier</span> performance.
      </SubtitleWrapper>
    ),
    image: omsThumb,
    year: 2023,
    role: "UI/UX Design, Front-End Engineer",
    techs: "React, Typescript, Next.js, Tailwind, and GSAP.",
    url: "https://omsimos.com",
    shineColor: ["#28af66", "#15422c"],
  },
  {
    company: "umamin",
    description: "is an open-source platform for anonymous messages.",
    Subtitle: () => (
      <SubtitleWrapper>
        Reached over <span>2.5 million unique users</span> and generated{" "}
        <span>14 million+ page visits</span>. Attained over 700K users in less
        than a week during the initial launch.
      </SubtitleWrapper>
    ),
    image: umaminThumb,
    year: 2023,
    role: "UI/UX Design, Front-End Engineer",
    techs: "React, Typescript, Next.js, Tailwind, Drizzle, and GraphQL.",
    url: "https://umamin.link",
    shineColor: ["#f51aa6", "#4f0835"],
  },
  {
    company: "foliage",
    description:
      "is an experimental e-commerce website design for luxurious plants.",
    Subtitle: () => (
      <SubtitleWrapper>
        Excels in crafting <span>clean</span> and{" "}
        <span>interactive websites</span>, seamlessly blending minimalist design
        with <span>modern technology</span> for exceptional user experiences.
      </SubtitleWrapper>
    ),
    image: foliageThumb,
    year: 2023,
    role: "UI/UX Design, Front-End Engineer",
    techs: "React, Typescript, Next.js, Tailwind, and GSAP.",
    url: "https://foliage.omsimos.com",
    shineColor: ["#656a74", "#273245"],
  },
];
