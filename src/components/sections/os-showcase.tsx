import { BentoCard, BentoGrid } from "../magicui/bento-grid";
import {
  BlocksIcon,
  BotMessageSquare,
  FileTextIcon,
  Github,
} from "lucide-react";
import { CardsChat } from "./tools/chat";

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
    href: "https://github.com/hyamero/chatbot",
    cta: "View Repository",
    className: "col-span-3 lg:col-span-2",
    background: (
      <div className="absolute inset-7 mx-auto [mask-image:linear-gradient(to_top,transparent_20%,#000_100%)] lg:inset-10">
        <CardsChat />
      </div>
    ),
  },
  {
    Icon: BlocksIcon,
    name: "3D iPhone Config",
    description: "Interactive 3D iPhone configurator using R3F",
    href: "/",
    cta: "Learn more",
    className: "col-span-3 lg:col-span-1",
    background: <div className="size-full"></div>,
  },
];

export default function OSShowcase() {
  return (
    <section id="tools" className="container relative z-10 mx-auto xl:w-5/6">
      <h2 className="mx-auto mb-20 text-center text-[clamp(1.7rem,7vw,5rem)] font-medium leading-[1] tracking-[-0.07em]">
        Building Tools <br /> for the Community
      </h2>

      <BentoGrid>
        {features.map((feature, idx) => (
          <BentoCard key={idx} {...feature} />
        ))}
      </BentoGrid>
    </section>
  );
}
