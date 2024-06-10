import Image from "next/image";
import { Icons } from "../icons";
import { Button } from "../ui/button";

import atomIcon from "/public/img/icons/atom-icon.png";
import { type Project } from "@/lib/projects";

export default function ProjectShowcase({ ...props }: Project) {
  const { Subtitle, image, description, company, year, role, techs } = props;

  return (
    <section
      id={company}
      className="border-b-none pointer-events-none  relative z-10 pb-14 lg:border-y lg:pb-0"
    >
      <div className="container grid min-h-screen grid-cols-4 items-center pt-40 lg:gap-y-0">
        <div className="col-span-4 col-start-1 row-start-1 h-full w-full rounded-lg py-10 backdrop-blur-sm sm:px-10 lg:border lg:py-24 xl:rounded-br-none">
          <Subtitle />
        </div>

        <div className="col-span-4 col-start-1 row-start-2 my-20 sm:my-0 sm:p-16 lg:col-span-3 lg:p-24">
          <div className="rounded-lg border bg-[#111] bg-opacity-20 p-4 backdrop-blur-sm">
            <Image
              alt={`${company} Showcase`}
              src={image}
              className="w-full rounded-lg shadow-md"
              placeholder="blur"
              priority
            />
          </div>
        </div>

        <div className="col-span-4 row-start-4 flex flex-col items-center justify-center gap-14 rounded-b-lg border-x border-b px-7 py-10 backdrop-blur-sm sm:flex-row md:rounded-none lg:col-start-4 lg:row-start-2 lg:h-full lg:flex-col lg:border-t-0 xl:rounded-br-lg">
          <Image
            alt="Atom Icon"
            src={atomIcon}
            className="mx-auto lg:w-5/6"
            height={200}
            width={200}
          />

          <p className="pointer-events-auto text-center text-lg tracking-tight text-muted-foreground sm:text-xl xl:text-left xl:text-xl 2xl:text-2xl">
            <span className="font-medium text-foreground">Powered by </span>
            {techs}
          </p>
        </div>

        <div className="col-span-4 row-start-3 grid h-full w-full grid-cols-4 overflow-hidden rounded-t-lg border md:grid-cols-5 lg:grid-cols-3 lg:grid-rows-2 lg:rounded-none lg:rounded-tl-lg lg:border-b-0 xl:col-span-3">
          <div className="col-span-4 h-full bg-[#111] md:col-span-2 lg:col-span-1">
            <div className="pointer-events-auto flex h-full flex-col items-start gap-5 px-7 py-10 sm:px-10">
              <p className="text-lg font-medium tracking-tight text-muted-foreground sm:text-xl lg:text-2xl lg:leading-[1.1]">
                <span className="font-semibold capitalize text-foreground">
                  {company}
                </span>{" "}
                {description}
              </p>
              <Button className="flex gap-3 rounded-full px-7">
                <span>Visit</span>
                <Icons.arrowUpRight />
              </Button>
            </div>
            <div className="hidden h-full border-t backdrop-blur-[1.5px] lg:block" />
          </div>

          <div className="col-span-4 bg-[#111] md:col-span-3 md:col-start-3 lg:col-span-2">
            <ul className="pointer-events-auto flex h-full flex-col justify-between border-l text-sm text-muted-foreground md:[&>li:last-child]:border-b-0 [&>li>span]:uppercase [&>li]:flex [&>li]:h-full [&>li]:justify-between [&>li]:border-b [&>li]:px-5 [&>li]:pb-14 [&>li]:pt-4">
              <li>
                <span>Company</span>
                <span className="capitalize">{company}</span>
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
            <div className="hidden h-full border-l border-t backdrop-blur-[1.5px] lg:block" />
          </div>
        </div>
      </div>
    </section>
  );
}
