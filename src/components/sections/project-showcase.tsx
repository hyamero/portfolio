import Image from "next/image";
import { Icons } from "../icons";
import { Button } from "../ui/button";

import atomIcon from "/public/img/icons/atom-icon.png";
import { type Project } from "@/lib/projects";

export default function ProjectShowcase({ ...props }: Project) {
  const { Subtitle, image, description, company, year, role, techs } = props;

  return (
    <section className="pointer-events-none relative z-10 border-y pb-14 lg:pb-0">
      <div className="container grid min-h-screen grid-cols-4 items-center gap-y-20 border-x pt-40 sm:gap-y-10 lg:gap-y-0">
        <div className="col-span-4 col-start-1 row-start-1 h-full w-full border-y px-0 py-10 backdrop-blur-sm lg:py-24 2xl:px-10">
          <Subtitle />
        </div>

        <div className="col-span-4 col-start-1 row-start-2 backdrop-blur-[1.5px] sm:p-16 lg:col-span-3 lg:p-24">
          <Image
            alt="OMSIMOS Thumbnail"
            src={image}
            className="w-full"
            placeholder="blur"
            priority
          />
        </div>

        <div className="col-span-4 row-start-4 flex flex-col items-center justify-center gap-14 px-5 backdrop-blur-sm sm:flex-row lg:col-start-4 lg:row-start-2 lg:h-full lg:flex-col lg:border-l">
          <Image
            alt="Atom Icon"
            src={atomIcon}
            className="mx-auto lg:w-5/6"
            height={200}
            width={200}
          />

          <p className="text-center text-xl tracking-tight text-muted-foreground xl:text-xl 2xl:text-left 2xl:text-2xl">
            <span className="font-medium text-foreground">Powered by </span>
            {techs}
          </p>
        </div>

        <div className="col-span-4 row-start-3 grid h-full w-full grid-cols-4 overflow-hidden rounded-lg border-t md:grid-cols-5 lg:grid-cols-3 lg:grid-rows-2 xl:col-span-3 xl:rounded-none">
          <div className="col-span-4 h-full bg-[#111] md:col-span-2 lg:col-span-1">
            <div className="flex h-full flex-col items-start gap-5 p-10">
              <p className="text-lg font-medium tracking-tight text-muted-foreground md:text-xl lg:text-2xl lg:leading-[1.1]">
                <span className="font-semibold text-foreground">{company}</span>{" "}
                {description}
              </p>
              <Button className="pointer-events-auto flex gap-3 rounded-full px-7">
                <span>Visit</span>
                <Icons.arrowUpRight />
              </Button>
            </div>
            <div className="hidden h-full border-t backdrop-blur-[1.5px] lg:block" />
          </div>

          <div className="col-span-4 border-t bg-[#111] md:col-span-3 md:col-start-3 md:border-t-0 lg:col-span-2">
            <ul className="flex h-full flex-col justify-between border-x text-sm text-muted-foreground md:[&>li:last-child]:border-b-0 [&>li>span]:uppercase [&>li]:flex [&>li]:h-full [&>li]:justify-between [&>li]:border-b [&>li]:px-5 [&>li]:pb-14 [&>li]:pt-4">
              <li>
                <span>Company</span>
                <span>{company}</span>
              </li>
              <li>
                <span>Year</span>
                <span>{year}</span>
              </li>
              <li>
                <span>Role</span>
                <span>{role}</span>
              </li>
            </ul>
            <div className="hidden h-full border border-b-0 backdrop-blur-[1.5px] lg:block" />
          </div>
        </div>
      </div>
    </section>
  );
}
