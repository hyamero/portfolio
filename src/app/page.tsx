import Image from "next/image";
import mainBg from "/public/img/main-bg.png";

export default function Home() {
  return (
    <main className="container flex min-h-screen pt-56">
      <div className="absolute left-0 top-0 z-[-1] h-screen w-screen">
        <Image
          src={mainBg}
          alt="Main Background"
          className="h-full w-full object-cover"
        />
      </div>

      <div className="flex flex-col items-start gap-7">
        <a
          href=""
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block rounded-full border border-border px-6 py-2 text-xl font-light text-muted-foreground/75"
        >
          omsimos
        </a>
        <h2 className="text-8xl font-medium tracking-[-0.07em]">
          Crafting ideas into <br /> digital experiences
        </h2>
        <h1 className="w-1/2 text-xl leading-tight tracking-tight text-[#888888] [&>span]:font-medium [&>span]:text-[#D0D0D0]">
          Joseph Dale Bañares is a <span>Software Engineer</span> and{" "}
          <span> Designer</span> based in the Philippines.
        </h1>
      </div>
    </main>
  );
}
