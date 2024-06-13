import Image from "next/image";
import { Icons } from "@/components/icons";
import gradientBlob from "/public/img/gradient-blob.jpg";
import globeIcon from "/public/img/icons/globe-icon.png";
import starIcon from "/public/img/icons/star-icon.png";

export default function Hero() {
  return (
    <section id="home" className="relative z-20 border-b">
      <div className="container flex min-h-screen pb-10 pt-40 lg:pt-48">
        {/* <div className="absolute left-0 top-0 z-[-1] h-full w-screen">
          <Image
            src={heroBg}
            alt="Main Background"
            className="h-full w-full object-cover object-center"
            priority
          />
          </div> */}
        <Image
          src={gradientBlob}
          alt="gradient blob"
          className="absolute inset-0 -z-10 bg-[35%_top] bg-no-repeat object-cover sm:bg-[38%_top] md:bg-[40%_top] lg:bg-[44%_top] xl:bg-top forced-colors:hidden"
          fill
          priority
        />

        <div
          className="absolute inset-0 -z-10 bg-top opacity-10 forced-colors:hidden"
          style={{ backgroundImage: `url(/img/noise.png)` }}
        />
        <div className="flex flex-col items-start gap-10 md:gap-14">
          <div className="space-y-4">
            <div className="inline-block">
              <a
                href="https://github.com/omsimos"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-full border border-border px-4 py-1 text-base font-light text-zinc-500 sm:text-lg md:px-6 md:py-2 md:text-xl"
              >
                <p>omsimos</p>
                <Icons.arrowUpRight />
              </a>
            </div>

            <h2 className="text-8xl text-[clamp(2rem,10vw,6rem)] font-medium tracking-[-0.07em]">
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
              className="hover-effect relative flex w-full items-center justify-between gap-2 border-b border-border px-5 pb-3 text-base text-foreground md:text-lg"
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
