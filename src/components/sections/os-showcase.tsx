import { BentoCard, BentoGrid } from "../magicui/bento-grid";
import {
  BlocksIcon,
  BotMessageSquare,
  FileTextIcon,
  Github,
} from "lucide-react";

const slugs = [
  "typescript",
  "javascript",
  "react",
  "html5",
  "css3",
  "nodedotjs",
  "nextdotjs",
  "prisma",
  "postgresql",
  "firebase",
  "vercel",
  "docker",
  "git",
  "github",
  "visualstudiocode",
  "figma",
  "drizzle",
  "trpc",
  "supabase",
  "tailwindcss",
];

const features = [
  {
    Icon: FileTextIcon,
    name: "Certificate Generator",
    description:
      "Effortlessly create and distribute e-certificates for events.",
    className: "col-span-3 lg:col-span-1",
    href: "/",
    cta: "Learn more",
    background: <div className="size-full"></div>,
  },
  {
    Icon: Github,
    name: "GitHub Statistics",
    description: "Generate personal GitHub Stats with ease.",
    href: "/",
    cta: "Learn more",
    className: "col-span-3 lg:col-span-2",
    background: <div className="size-full"></div>,
  },
  {
    Icon: BotMessageSquare,
    name: "Chat Assistant",
    description: "AI Chatbot Application with LLM integration.",
    href: "/",
    cta: "Learn more",
    className: "col-span-3 lg:col-span-2",
    background: <div className="size-full"></div>,
  },
  {
    Icon: BlocksIcon,
    name: "3D Portfolio",
    description: "Interactive 3D Portfolio using R3F",
    href: "/",
    cta: "Learn more",
    className: "col-span-3 lg:col-span-1",
    background: <div className="size-full"></div>,
  },
];

export default function OSShowcase() {
  return (
    <section
      id="tools"
      className="container relative z-10 mx-auto grid min-h-screen place-items-center gap-40 py-72 lg:w-3/4"
    >
      <h2 className="mx-auto text-center text-[clamp(1.7rem,7vw,6rem)] font-medium leading-[1.1] tracking-[-0.07em]">
        Building tools for the <br />
        open-source community
      </h2>

      <BentoGrid>
        {features.map((feature, idx) => (
          <BentoCard key={idx} {...feature} />
        ))}
      </BentoGrid>
    </section>
  );
}
