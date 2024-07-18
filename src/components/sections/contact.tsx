import { Icons } from "../icons";
import { cn } from "@/lib/utils";
import Ripple from "../magicui/ripple";
import OrbitingIcons, {
  type OrbitingIconsProps,
} from "../magicui/orbiting-icons";

export default function Contact() {
  return (
    <section
      id="contact"
      className="container z-10 my-40 w-full overflow-hidden border-y sm:overflow-auto sm:border-y-0"
    >
      <div className="bg-bg-neutral-950 sm:rounded-lg sm:border sm:p-4">
        <div className="relative flex h-[550px] w-full rounded-lg bg-background sm:overflow-hidden md:shadow-xl">
          <div className="absolute left-0 top-0 size-full">
            <Ripple />
          </div>

          <div className="absolute left-0 top-0 flex size-full flex-col items-center justify-center rounded-lg  md:shadow-xl">
            <span className="pointer-events-none whitespace-pre-wrap bg-gradient-to-b from-white from-25% to-black to-[130%] bg-clip-text text-center text-6xl font-semibold leading-none text-transparent lg:text-7xl">
              Contact
            </span>

            {socials.map((social) => (
              <OrbitingIcons
                href={social.href}
                key={social.name}
                className={cn(
                  "cursor-pointer border-none bg-transparent",
                  social.className,
                )}
                duration={social.duration}
                delay={social.delay}
                radius={social.radius}
                reverse={social.reverse}
                path={social.path}
              >
                <social.icon />
              </OrbitingIcons>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

type Socials = {
  name: string;
  icon: any;
  className?: string;
} & OrbitingIconsProps;

const socials: Socials[] = [
  {
    name: "Gmail",
    icon: Icons.gmail,
    href: "mailto:daleban.dev@gmail.com",
    duration: 20,
    delay: 20,
    radius: 80,
    path: true,
    className: "size-[35px]",
  },
  {
    name: "Discord",
    icon: Icons.discord,
    href: "",
    duration: 20,
    delay: 10,
    radius: 80,
    className: "size-[35px]",
  },
  {
    name: "LinkedIn",
    icon: Icons.linkedIn,
    href: "https://linkedin.com/in/hyamero",
    duration: 20,
    radius: 190,
    reverse: true,
    className: "size-[50px]",
  },
  {
    name: "GitHub",
    icon: Icons.gitHub,
    href: "https://github.com/hyamero",
    duration: 20,
    delay: 20,
    radius: 190,
    reverse: true,
    className: "size-[50px]",
  },
];
