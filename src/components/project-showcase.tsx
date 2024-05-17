import Image from "next/image";
import omsThumb from "/public/img/project/omsimos-thumb.png";
import atomIcon from "/public/img/icon/atom-icon.png";
import { Icons } from "./icons";

export default function ProjectShowcase() {
  return (
    <section className="grid-row-3 container grid min-h-screen grid-cols-4 items-center gap-y-20 py-40">
      <h2 className="col-span-3 text-5xl tracking-tighter text-muted-foreground [&>span]:font-medium [&>span]:text-foreground">
        I specialize in crafting <span>high-quality</span> websites using{" "}
        <span>cutting-edge</span> technologies, seamlessly blending creative
        design with <span>top-tier</span> performance.
      </h2>

      <div className="col-span-3 p-24">
        <Image alt="OMSIMOS Thumbnail" src={omsThumb} className="w-full" />
      </div>

      <div className="col-start-4 items-center">
        <Image alt="Atom Icon" src={atomIcon} />

        <p className="text-2xl tracking-tight text-muted-foreground">
          <span className="font-medium text-foreground">Powered by React</span>,
          Typescript, Next.js, Tailwind, and GSAP.
        </p>
      </div>
    </section>
  );
}
