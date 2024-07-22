import { cn } from "@/lib/utils";
import Marquee from "../magicui/marquee";

const projects = [
  {
    img: "",
    url: "",
    square: false,
  },
  {
    img: "",
    url: "",
    square: true,
  },
  {
    img: "",
    url: "",
    square: false,
  },
  {
    img: "",
    url: "",
    square: false,
  },
  {
    img: "",
    url: "",
    square: true,
  },
  {
    img: "",
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
      <div className="relative flex w-full flex-col items-center justify-center overflow-hidden  rounded-lg bg-background md:shadow-xl">
        <Marquee pauseOnHover className="[--duration:20s]">
          {firstRow.map((project) => (
            <ReviewCard key={project.url} {...project} />
          ))}
        </Marquee>
        <Marquee reverse pauseOnHover className="[--duration:20s]">
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
  img: string;
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
      <div className="size-full rounded-lg bg-neutral-800" />
    </div>
  );
};
