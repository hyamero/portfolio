import Image from "next/image";
import mainBg from "/public/img/main-bg.png";
import globeIcon from "/public/img/icon/globe-icon.png";
import starIcon from "/public/img/icon/star-icon.png";
import { Icons } from "@/components/icons";

export default function Home() {
  return (
    <main className="min-h-screen">
      <section className="relative">
        <div className="container flex pb-10 pt-56">
          <div className="absolute left-0 top-0 z-[-1] h-full w-screen">
            <Image
              src={mainBg}
              alt="Main Background"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="flex flex-col items-start gap-14">
            <div className="space-y-4">
              <div className="inline-block">
                <a
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-full border border-border px-6 py-2 text-xl font-light text-zinc-500"
                >
                  <p>omsimos</p>
                  <Icons.arrowUpRight />
                </a>
              </div>

              <h2 className="text-8xl font-medium tracking-[-0.07em]">
                Crafting ideas into <br /> digital experiences
              </h2>
            </div>
            <div className="flex gap-5">
              <h1 className="w-2/5 text-2xl leading-tight tracking-tight text-[#888888] [&>span]:font-medium [&>span]:text-foreground">
                Joseph Dale Bañares is a <span>Software Engineer</span> and{" "}
                <span> Designer</span> based in the Philippines.
              </h1>

              <Image
                alt="Star Icon"
                src={starIcon}
                className="relative bottom-3 h-24 w-24"
              />
            </div>

            <div className="flex w-1/3 flex-col items-center justify-center gap-20">
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-between border-b border-border px-5 pb-3 text-lg text-foreground"
              >
                <p>View Resume</p>
                <Icons.arrowUpRight />
              </a>

              <Image alt="Globe Icon" src={globeIcon} className="h-48 w-48" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
