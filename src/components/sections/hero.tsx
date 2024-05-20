import Image from "next/image";
import mainBg from "/public/img/main-bg.png";
import globeIcon from "/public/img/icons/globe-icon.png";
import starIcon from "/public/img/icons/star-icon.png";
import { Icons } from "@/components/icons";

export default function Hero() {
  return (
    <section className="relative">
      <div className="container flex h-screen pb-10 pt-32 md:h-auto lg:pt-56">
        <div className="absolute left-0 top-0 z-[-1] h-full w-screen">
          <Image
            src={mainBg}
            alt="Main Background"
            className="h-full w-full object-cover object-center"
          />
        </div>

        <div className="flex flex-col items-start gap-10 md:gap-14">
          <div className="space-y-4">
            <div className="inline-block">
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-full border border-border px-6 py-2 text-base font-light text-zinc-500 sm:text-lg md:text-xl"
              >
                <p>omsimos</p>
                <Icons.arrowUpRight />
              </a>
            </div>

            <h2 className="text-8xl text-[clamp(3rem,10vw,6rem)] font-medium tracking-[-0.07em]">
              Crafting ideas into <br /> digital experiences
            </h2>
          </div>
          <div className="flex gap-3 md:gap-5">
            <h1 className="w-5/6 text-xl leading-tight tracking-tight text-[#888888] sm:w-1/2 md:w-2/5 lg:text-2xl [&>span]:font-medium [&>span]:text-foreground">
              Joseph Dale Bañares is a <span>Software Engineer</span> and{" "}
              <span> Designer</span> based in the Philippines.
            </h1>

            <Image
              alt="Star Icon"
              src={starIcon}
              className="relative bottom-3 hidden h-24 w-24 sm:block"
            />
          </div>

          <div className="flex flex-col items-center justify-center gap-20 md:w-1/3">
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-between gap-2 border-b border-border px-5 pb-3 text-base text-foreground md:text-lg"
            >
              <p>View Resume</p>
              <Icons.arrowUpRight />
            </a>

            <Image
              alt="Globe Icon"
              src={globeIcon}
              className="hidden h-48 w-48 md:block"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
