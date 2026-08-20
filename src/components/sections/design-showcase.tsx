import { cn } from "@/lib/utils";
import Marquee from "../magicui/marquee";
import Image from "next/image";

const projects = [
  { img: "chatti" },
  { img: "port-1" },
  { img: "culture", square: true },
  { img: "devfest" },
  { img: "typography" },
  { img: "oscar" },
  { img: "outlaw" },
  { img: "gdsc", square: true },
  { img: "3d-port" },
  { img: "marbre" },
  { img: "proemial", square: true },
  { img: "masskara" },
  { img: "collect-apis" },
];

const firstRow = projects.slice(0, projects.length / 2);
const secondRow = projects.slice(projects.length / 2);

export default function DesignShowcase() {
  return (
    <section id="design" className="relative z-10 container">
      <h2 className="mx-auto mb-20 text-center text-[clamp(1.7rem,6vw,5rem)] leading-[1.1] font-medium tracking-[-0.07em] text-balance">
        Crafting digital experiences <br /> that leave a lasting impact.
      </h2>
      <div className="relative flex w-full flex-col items-center justify-center overflow-hidden rounded-lg bg-background md:shadow-xl">
        <Marquee
          // pauseOnHover
          className="mask-[linear-gradient(to_top,transparent_10%,#000_100%)] [--duration:20s]"
        >
          {firstRow.map((project) => (
            <DesignCard key={project.img} {...project} />
          ))}
        </Marquee>
        <Marquee
          reverse
          // pauseOnHover
          className="mask-[linear-gradient(to_top,transparent_10%,#000_100%)] [--duration:30s]"
        >
          {secondRow.map((project) => (
            <DesignCard key={project.img} {...project} />
          ))}
        </Marquee>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-linear-to-r from-white dark:from-background"></div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-linear-to-l from-white dark:from-background"></div>
      </div>
    </section>
  );
}

const DesignCard = ({
  img,
  square = false,
}: {
  img: string;
  square?: boolean;
}) => {
  return (
    <div
      className={cn(
        square
          ? "size-[200px] lg:size-[280px]"
          : "h-[200px] w-[282px] lg:h-[280px] lg:w-[394px]",
        "pointer relative overflow-hidden rounded-xl border bg-neutral-950 p-2 lg:p-4",
      )}
    >
      <Image
        alt={`${img} design showcase`}
        src={`/img/projects/design/${img}.jpg`}
        className="h-full w-full rounded-lg object-cover opacity-85"
        width={square ? 200 : 282}
        height={280}
      />
    </div>
  );
};
