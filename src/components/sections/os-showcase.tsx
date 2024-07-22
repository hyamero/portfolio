import { BentoCard, BentoGrid } from "../magicui/bento-grid";
import {
  BlocksIcon,
  BotMessageSquare,
  FileTextIcon,
  Github,
} from "lucide-react";

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
    <section id="tools" className="container relative z-10 mx-auto xl:w-5/6">
      <h2 className="mx-auto mb-20 text-center text-[clamp(1.7rem,7vw,5rem)] font-medium leading-[1.1] tracking-[-0.07em]">
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
