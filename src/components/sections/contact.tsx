import { Icons } from "../icons";
import Ripple from "../magicui/ripple";
import OrbitingIcons from "../magicui/orbiting-icons";

export default function Contact() {
  return (
    <section id="contact" className="container z-10 w-full py-40">
      <div className="relative flex h-[550px] w-full overflow-hidden rounded-lg border bg-background md:shadow-xl">
        <div className="absolute left-0 top-0 size-full">
          <Ripple />
        </div>

        <div className="absolute left-0 top-0 flex size-full flex-col items-center justify-center overflow-hidden rounded-lg border md:shadow-xl">
          <span className="pointer-events-none whitespace-pre-wrap bg-gradient-to-b from-white from-25% to-black to-[130%] bg-clip-text text-center text-7xl font-semibold leading-none text-transparent">
            Contact
          </span>

          {/* Inner Circles */}
          <OrbitingIcons
            className="size-[30px] border-none bg-transparent"
            duration={20}
            delay={20}
            radius={80}
          >
            <Icons.whatsapp />
          </OrbitingIcons>
          <OrbitingIcons
            className="size-[30px] border-none bg-transparent"
            duration={20}
            delay={10}
            radius={80}
            path={true}
          >
            <Icons.notion />
          </OrbitingIcons>

          {/* Outer Circles (reverse) */}
          <OrbitingIcons
            className="size-[50px] border-none bg-transparent"
            radius={190}
            duration={20}
            reverse
          >
            <Icons.googleDrive />
          </OrbitingIcons>
          <OrbitingIcons
            className="size-[50px] border-none bg-transparent"
            radius={190}
            duration={20}
            delay={20}
            reverse
          >
            <Icons.gitHub />
          </OrbitingIcons>
        </div>
      </div>
    </section>
  );
}
