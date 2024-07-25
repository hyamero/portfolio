import { cn } from "@/lib/utils";
import Marquee from "../magicui/marquee";
import Image from "next/image";
import { type StaticImageData } from "next/image";

import chatti from "/public/img/projects/design/chatti.jpg";
import gdsc from "/public/img/projects/design/gdsc.jpg";
import outlaw from "/public/img/projects/design/outlaw.jpg";
import culture from "/public/img/projects/design/culture.jpg";
import port3d from "/public/img/projects/design/3d-port.jpg";
import collectApis from "/public/img/projects/design/collect-apis.jpg";
import proemial from "/public/img/projects/design/proemial.jpg";

const projects = [
  {
    img: chatti,
    url: "",
    square: false,
  },
  {
    img: culture,
    url: "",
    square: true,
  },
  {
    img: outlaw,
    url: "",
    square: false,
  },
  {
    img: gdsc,
    url: "",
    square: true,
  },
  {
    img: port3d,
    url: "",
    square: false,
  },
  {
    img: proemial,
    url: "",
    square: true,
  },
  {
    img: collectApis,
    url: "",
    square: false,
  },
];

const firstRow = projects.slice(0, projects.length / 2);
const secondRow = projects.slice(projects.length / 2);

export default function DesignShowcase() {
  return (
    <section id="design" className="container relative z-10">
      <h2 className="mx-auto mb-20 text-balance text-center text-[clamp(1.7rem,6vw,5rem)] font-medium leading-[1.1] tracking-[-0.07em]">
        Crafting digital experiences <br /> that leave a lasting impact.
      </h2>
      <div className="relative flex w-full flex-col items-center justify-center overflow-hidden rounded-lg bg-background md:shadow-xl">
        <Marquee
          pauseOnHover
          className="[--duration:20s] [mask-image:linear-gradient(to_top,transparent_10%,#000_100%)]"
        >
          {firstRow.map((project) => (
            <ReviewCard key={project.url} {...project} />
          ))}
        </Marquee>
        <Marquee
          reverse
          pauseOnHover
          className="[--duration:20s] [mask-image:linear-gradient(to_top,transparent_10%,#000_100%)]"
        >
          {secondRow.map((project) => (
            <ReviewCard key={project.url} {...project} />
          ))}
        </Marquee>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-white dark:from-background"></div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-white dark:from-background"></div>
      </div>
    </section>
  );
}

const ReviewCard = ({
  img,
  url,
  square,
}: {
  img: StaticImageData;
  url: string;
  square: boolean;
}) => {
  return (
    <div
      className={cn(
        square
          ? "size-[200px] lg:size-[280px]"
          : "h-[200px] w-[282px] lg:h-[280px] lg:w-[394px]",
        "relative cursor-pointer overflow-hidden rounded-xl border bg-neutral-950 p-2 lg:p-4",
      )}
    >
      <Image
        alt="Culture"
        src={img}
        className="h-full w-full rounded-lg object-cover"
      />
      {/* <div className="size-full rounded-lg [box-shadow:0_0_40px_-20px_#ffffff1f_inset]" /> */}
    </div>
  );
};
