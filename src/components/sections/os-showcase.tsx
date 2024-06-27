import IconCloud from "@/components/magicui/icon-cloud";
import { BentoCard, BentoGrid } from "../magicui/bento-grid";
import { BotMessageSquare, FileTextIcon, Github } from "lucide-react";

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
    background: (
      <div className="size-full">{/* <IconCloud iconSlugs={slugs} /> */}</div>
    ),
  },
  {
    Icon: Github,
    name: "GitHub Statistics",
    description: "Generate personal GitHub Stats with ease.",
    href: "/",
    cta: "Learn more",
    className: "col-span-3 lg:col-span-2",
    background: <div className="size-full"> </div>,
  },
  {
    Icon: BotMessageSquare,
    name: "Chat Assistant",
    description: "AI Chatbot Application with LLM integration.",
    href: "/",
    cta: "Learn more",
    className: "col-span-3 lg:col-span-2",
    background: (
      <div className="size-full">{/* <IconCloud iconSlugs={slugs} /> */}</div>
    ),
  },
  {
    className: "col-span-3 lg:col-span-1",
    background: (
      <div className="absolute -top-5 grid size-full place-items-center px-10">
        <IconCloud iconSlugs={slugs} />
      </div>
    ),
  },
];

export default function OSShowcase() {
  return (
    <section
      id="tools"
      className="container pointer-events-none relative z-10 grid min-h-screen place-items-center gap-40 px-40 py-72"
    >
      <h2 className="mx-auto text-center text-[clamp(1.7rem,7vw,6rem)] font-medium leading-[1.1] tracking-[-0.07em]">
        Building tools for the <br />
        open-source community
      </h2>

      <BentoGrid className="pointer-events-auto">
        {features.map((feature, idx) => (
          <BentoCard key={idx} {...feature} />
        ))}
      </BentoGrid>
    </section>
  );
}
