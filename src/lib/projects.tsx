import { type StaticImageData } from "next/image";
import omsThumb from "/public/img/projects/omsimos.jpg";
import umaminThumb from "/public/img/projects/umamin.jpg";
import foliageThumb from "/public/img/projects/foliage.jpg";

export type Project = {
  subtitle: string;
  image: StaticImageData;
  description: string;
  projectTitle: string;
  year: number;
  role: string;
  techs: string;
  url: string;
  // shineColor: string[];
};

export const projects: Project[] = [
  {
    projectTitle: "omsimos",
    description: "is a community driven open source developer collective",
    subtitle:
      "I specialize in crafting high-quality websites using cutting-edge technologies, seamlessly blending creative design with top-tier performance.",
    image: omsThumb,
    year: 2023,
    role: "Front-End & Design Engineer",
    techs: "React, Typescript, Next.js, Tailwind, and GSAP.",
    url: "https://omsimos.com",
    // shineColor: ["#28af66", "#15422c"],
  },
  {
    projectTitle: "umamin",
    description: "is an open-source platform for anonymous messages.",
    subtitle:
      "Reached over 2.5 million unique users and generated 14 million+ page visits. Attained 700K users in less than a week during the initial launch.",
    image: umaminThumb,
    year: 2023,
    role: "Front-End Engineer, UI/UX Design",
    techs: "React, Typescript, Next.js, Tailwind, Drizzle, and GraphQL.",
    url: "https://umamin.link",
    // shineColor: ["#f51aa6", "#4f0835"],
  },
  {
    projectTitle: "foliage",
    description:
      "is an experimental e-commerce website design for luxurious plants.",
    subtitle:
      "Excels in crafting clean and interactive websites, seamlessly blending minimalist design with modern technology for exceptional user experiences.",
    image: foliageThumb,
    year: 2023,
    role: "UI/UX Design, Front-End Engineer",
    techs: "React, Typescript, Next.js, Tailwind, and GSAP.",
    url: "https://foliage.omsimos.com",
    // shineColor: ["#656a74", "#273245"],
  },
];
