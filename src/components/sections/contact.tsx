import { Icons } from "../icons";
import { cn } from "@/lib/utils";
import Ripple from "../magicui/ripple";
import OrbitingIcons, {
  type OrbitingIconsProps,
} from "../magicui/orbiting-icons";

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

          {socials.map((social, i) => (
            <OrbitingIcons
              key={social.name}
              className={cn("border-none bg-transparent", social.className)}
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
    </section>
  );
}

type Socials = {
  name: string;
  icon: any;
  link: string;
  className?: string;
} & OrbitingIconsProps;

const socials: Socials[] = [
  {
    name: "WhatsApp",
    icon: Icons.whatsapp,
    link: "",
    duration: 20,
    delay: 20,
    radius: 80,
    path: true,
    className: "size-[30px]",
  },
  {
    name: "Notion",
    icon: Icons.notion,
    link: "",
    duration: 20,
    delay: 10,
    radius: 80,
    className: "size-[30px]",
  },
  {
    name: "Google Drive",
    icon: Icons.googleDrive,
    link: "",
    duration: 20,
    radius: 190,
    reverse: true,
    className: "size-[50px]",
  },
  {
    name: "GitHub",
    icon: Icons.gitHub,
    link: "",
    duration: 20,
    delay: 20,
    radius: 190,
    reverse: true,
    className: "size-[50px]",
  },
];
