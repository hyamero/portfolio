import Image from "next/image";
import omsThumb from "/public/img/project/omsimos-thumb.png";
import atomIcon from "/public/img/icon/atom-icon.png";
import { Icons } from "./icons";
import { Button } from "./ui/button";

export default function ProjectShowcase() {
  return (
    <section className="container">
      <div className="grid min-h-screen grid-cols-4 items-center border-x pt-40">
        <div className="col-span-4 h-full w-full border px-10 py-24">
          <h2 className=" w-3/4 text-5xl tracking-tighter text-muted-foreground [&>span]:font-medium [&>span]:text-foreground">
            I specialize in crafting <span>high-quality</span> websites using{" "}
            <span>cutting-edge</span> technologies, seamlessly blending creative
            design with <span>top-tier</span> performance.
          </h2>
        </div>

        <div className="col-span-3 p-24">
          <Image alt="OMSIMOS Thumbnail" src={omsThumb} className="w-full" />
        </div>

        <div className="col-start-4 flex h-full flex-col items-center justify-center border-x px-5">
          <Image alt="Atom Icon" src={atomIcon} className="scale-75" />

          <p className="text-2xl tracking-tight text-muted-foreground">
            <span className="font-medium text-foreground">
              Powered by React
            </span>
            , Typescript, Next.js, Tailwind, and GSAP.
          </p>
        </div>

        <div className="col-span-4 grid h-full w-full grid-cols-4 grid-rows-2 border-t">
          <div className="h-full">
            <div className="flex h-full flex-col items-start gap-5 p-5">
              <p className="text-2xl font-medium tracking-tight text-muted-foreground">
                <span className="font-semibold text-foreground">Omsimos</span>{" "}
                is a community driven open source developer collective.
              </p>
              <Button className="flex gap-3 rounded-full px-7">
                <span>Visit</span>
                <Icons.arrowUpRight />
              </Button>
            </div>
            <div className="h-full border" />
          </div>

          <div className="col-span-2 col-start-2">
            <ul className="flex h-full flex-col justify-between border-x text-sm text-muted-foreground [&>li:last-child]:border-b-0 [&>li>span]:uppercase [&>li]:flex [&>li]:h-full [&>li]:justify-between [&>li]:border-b [&>li]:px-5 [&>li]:pb-14 [&>li]:pt-4">
              <li>
                <span className="">Company</span>
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
            <div className="h-full border" />
          </div>
        </div>
      </div>
    </section>
  );
}
