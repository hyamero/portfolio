import React from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

import { Icons } from "../icons";
import { type Project } from "@/lib/projects";
import { ArrowUpRightIcon } from "lucide-react";
import atomIcon from "/public/img/icons/atom-icon.png";
import AnimatedShinyText from "../magicui/animated-shiny-text";
import ringStar from "/public/img/rings-bg.svg";

export default function ProjectShowcase({ ...props }: Project) {
  const {
    url,
    year,
    role,
    techs,
    image,
    projectTitle,
    subtitle,
    // shineColor,
    description,
  } = props;

  const _subtitle = subtitle.split(" ");

  const _keywordsHighlight = {
    omsimos: "high-quality cutting-edge top-tier".split(" "),
    umamin: "2.5 million unique users 14 million+ page visits 700K".split(" "),
    foliage: "clean interactive websites, modern technology".split(" "),
  };

  const keywordsHighlight = Object.values(_keywordsHighlight).flat();

  return (
    <section
      id={projectTitle}
      className={cn(
        projectTitle,
        "project-wrapper border-b-none relative z-10 overflow-hidden pb-14 lg:border-b lg:pb-0",
      )}
    >
      <div className="absolute -bottom-[45%] -right-[45%] -z-10 hidden size-full xl:block">
        <Image
          alt="Stars"
          src={ringStar}
          fill
          className=" scale-[2.5] opacity-75 md:scale-[2] lg:scale-125 2xl:scale-100"
        />
      </div>

      <div className="container grid min-h-screen grid-cols-4 items-center pt-40 lg:gap-y-0">
        <div className="lg:leading-right col-span-4 col-start-1 row-start-1 h-full w-full text-pretty rounded-lg text-[clamp(1.3rem,3.3vw,3rem)] leading-[1.3] tracking-tighter text-muted-foreground backdrop-blur-[2px] sm:px-10 sm:py-10 md:leading-[1.2] lg:border lg:bg-neutral-950/20 lg:py-24 xl:text-balance xl:rounded-br-none">
          <h2
            className={cn(
              `project-subtitle-${projectTitle} project-subtitle`,
              "w-full 2xl:w-4/5",
            )}
          >
            {_subtitle.map((text, i) => (
              <React.Fragment key={text + i}>
                {keywordsHighlight.includes(text) ? (
                  <span className="font-medium text-foreground">{text} </span>
                ) : (
                  <span>{text} </span>
                )}
              </React.Fragment>
            ))}
          </h2>
        </div>

        <div className="relative -z-10 col-span-4 col-start-1 row-start-2 my-16 sm:px-12 lg:col-span-3 lg:my-0 lg:p-12 2xl:p-24">
          <div className="rounded-lg bg-gradient-to-bl from-neutral-800 to-border p-px">
            <div className="rounded-lg bg-neutral-950 p-2 md:p-4">
              <Image
                alt={`${projectTitle} Showcase`}
                src={image}
                className={cn(
                  `thumbnail-${projectTitle}`,
                  "w-full rounded-lg shadow-md",
                )}
                placeholder="blur"
                priority
              />
            </div>
          </div>

          <Icons.stars
            className={cn(
              `stars-${projectTitle}`,
              "absolute -left-52 -top-40 -z-[11] opacity-70 xl:-left-10",
            )}
          />

          {/* <Icons.stars
            className={cn(
              `stars-${projectTitle}`,
              "absolute -left-52 bottom-20 -z-[11] opacity-70 xl:-left-10",
            )}
          /> */}
        </div>

        <div className="col-span-4 row-start-4 flex flex-col items-center justify-center gap-14 rounded-b-lg border-x border-b bg-neutral-950 px-10 py-10 sm:flex-row md:rounded-none lg:col-start-4 lg:row-start-2 lg:h-full lg:flex-col lg:border-t-0 lg:px-7 lg:py-0 xl:rounded-br-lg">
          <Image
            alt="Atom Icon"
            src={atomIcon}
            className="mx-auto lg:w-5/6"
            height={200}
            width={200}
          />

          <p className="text-balance text-center text-lg leading-[1.3] tracking-tight text-muted-foreground sm:text-xl md:leading-[1.2] lg:text-base lg:leading-[1.15] xl:text-lg xl:leading-[1.15] 2xl:text-xl">
            <span className="font-medium text-foreground">Powered by </span>
            {techs}
          </p>
        </div>

        <div className="col-span-4 row-start-3 grid h-full w-full grid-cols-4 overflow-hidden rounded-t-lg border md:grid-cols-5 lg:grid-cols-3 lg:grid-rows-2 lg:rounded-none lg:rounded-tl-lg lg:border-b-0 xl:col-span-3">
          <div className="col-span-4 h-full bg-[#111] md:col-span-2 lg:col-span-1">
            <div className="flex h-full flex-col items-start gap-7 px-7 py-10 sm:px-10">
              <p className="text-lg font-medium leading-[1.3] tracking-tight text-muted-foreground sm:text-xl md:leading-[1.2] 2xl:text-2xl 2xl:leading-[1.1]">
                <span className="font-semibold capitalize text-foreground">
                  {projectTitle}
                </span>{" "}
                {description}
              </p>
              <Link
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-block rounded-full border border-white/5 bg-neutral-200 text-white transition-all ease-in hover:cursor-pointer hover:bg-neutral-300"
              >
                <AnimatedShinyText className="inline-flex items-center justify-center px-4 py-1 font-medium tracking-tight">
                  <span>Visit</span>
                  <ArrowUpRightIcon className="ml-1 size-4 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" />
                </AnimatedShinyText>
              </Link>
            </div>
            <div className="hidden h-full border-t lg:block" />
          </div>

          <div className="col-span-4 bg-[#111] md:col-span-3 md:col-start-3 lg:col-span-2">
            <ul className="flex h-full flex-col justify-between border-l text-sm text-muted-foreground md:[&>li:last-child]:border-b-0 [&>li>span]:uppercase [&>li]:flex [&>li]:h-full [&>li]:justify-between [&>li]:border-b [&>li]:px-5 [&>li]:pb-14 [&>li]:pt-4">
              <li>
                <span>Company</span>
                <span className="capitalize">{projectTitle}</span>
              </li>
              <li>
                <span>Year</span>
                <span>{year}</span>
              </li>
              <li className="gap-10">
                <span>Role</span>
                <span className="text-right">{role}</span>
              </li>
            </ul>
            <div className="hidden h-full border-l border-t backdrop-blur-sm lg:block" />
          </div>
        </div>
      </div>
    </section>
  );
}
