import Image from "next/image";
import { Icons } from "../icons";
import { Button } from "../ui/button";

import atomIcon from "/public/img/icons/atom-icon.png";
import omsThumb from "/public/img/projects/omsimos-thumb.png";

export default function ProjectShowcase() {
  return (
    <section className="border-y bg-gradient-to-b from-black to-[#111] pb-10">
      <div className="container grid min-h-screen grid-cols-4 items-center gap-y-20 border-x pt-40 sm:gap-y-10 lg:gap-y-0">
        <div className="col-span-4 col-start-1 row-start-1 h-full w-full border-y px-0 py-10 lg:py-24 2xl:px-10">
          <h2 className="w-full text-[clamp(1.5rem,3.3vw,3rem)] leading-[1.1] tracking-tighter text-muted-foreground md:w-3/4 [&>span]:font-medium [&>span]:text-foreground">
            I specialize in crafting <span>high-quality</span> websites using{" "}
            <span>cutting-edge</span> technologies, seamlessly blending creative
            design with <span>top-tier</span> performance.
          </h2>
        </div>

        <div className="col-span-4 col-start-1 row-start-2 sm:p-16 lg:col-span-3 lg:p-24">
          <Image
            alt="OMSIMOS Thumbnail"
            src={omsThumb}
            className="w-full"
            placeholder="blur"
          />
        </div>

        <div className="col-span-4 row-start-4 flex flex-col items-center justify-center gap-14 px-5 sm:flex-row lg:col-start-4 lg:row-start-2 lg:h-full lg:flex-col lg:border-l">
          <Image
            alt="Atom Icon"
            src={atomIcon}
            className="mx-auto lg:w-5/6"
            height={200}
            width={200}
          />

          <p className="text-center text-xl tracking-tight text-muted-foreground xl:text-xl 2xl:text-left 2xl:text-2xl">
            <span className="font-medium text-foreground">
              Powered by React
            </span>
            , Typescript, Next.js, Tailwind, and GSAP.
          </p>
        </div>

        <div className="col-span-4 row-start-3 grid h-full w-full grid-cols-4 overflow-hidden rounded-lg border-t md:grid-cols-5 lg:grid-cols-3 lg:grid-rows-2 xl:col-span-3 xl:rounded-none">
          <div className="col-span-4 h-full bg-[#111] md:col-span-2 lg:col-span-1">
            <div className="flex h-full flex-col items-start gap-5 p-10">
              <p className="text-lg font-medium tracking-tight text-muted-foreground md:text-xl lg:text-2xl lg:leading-[1.1]">
                <span className="font-semibold text-foreground">Omsimos</span>{" "}
                is a community driven open source developer collective.
              </p>
              <Button className="flex gap-3 rounded-full px-7">
                <span>Visit</span>
                <Icons.arrowUpRight />
              </Button>
            </div>
            <div className="hidden h-full border-t lg:block" />
          </div>

          <div className="col-span-4 border-t bg-[#111] md:col-span-3 md:col-start-3 md:border-t-0 lg:col-span-2">
            <ul className="flex h-full flex-col justify-between border-x text-sm text-muted-foreground md:[&>li:last-child]:border-b-0 [&>li>span]:uppercase [&>li]:flex [&>li]:h-full [&>li]:justify-between [&>li]:border-b [&>li]:px-5 [&>li]:pb-14 [&>li]:pt-4">
              <li>
                <span>Company</span>
                <span>Omsimos</span>
              </li>
              <li>
                <span>Year</span>
                <span>2023</span>
              </li>
              <li>
                <span>Role</span>
                <span>UI/UX Design, Front-End Engineer</span>
              </li>
            </ul>
            <div className="hidden h-full border border-b-0 lg:block" />
          </div>
        </div>
      </div>
    </section>
  );
}
