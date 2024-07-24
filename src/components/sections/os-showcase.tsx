import {
  Github,
  BlocksIcon,
  FileTextIcon,
  BotMessageSquare,
} from "lucide-react";
import { CardsChat } from "./tools/chat";
import { CertGen } from "./tools/certgen";
import { GhStatsForm } from "./tools/gh-stats";
import { BentoCard, BentoGrid } from "../magicui/bento-grid";

const features = [
  {
    Icon: FileTextIcon,
    name: "Certificate Generator",
    description:
      "Effortlessly create and distribute e-certificates for events.",
    className: "col-span-3 lg:col-span-1",
    href: "https://github.com/hyamero/certificate-generator",
    cta: "Learn more",
    background: (
      <div className="absolute inset-7 duration-300 ease-in-out [mask-image:linear-gradient(to_top,transparent_20%,#000_100%)] hover:scale-105 lg:left-10 lg:top-10 lg:w-[450px]">
        <CertGen />
      </div>
    ),
  },
  {
    Icon: Github,
    name: "GitHub Statistics",
    description: "Generate personal GitHub Stats with ease.",
    href: "https://github-stats.omsimos.com/",
    cta: "Visit Website",
    className: "col-span-3 lg:col-span-2",
    background: (
      <div className="absolute inset-7 mx-auto duration-300 ease-in-out [mask-image:linear-gradient(to_top,transparent_20%,#000_100%)] hover:scale-105 lg:inset-10">
        <GhStatsForm />
      </div>
    ),
  },
  {
    Icon: BotMessageSquare,
    name: "Chat Assistant",
    description: "AI Chatbot Application with LLM integration.",
    href: "https://github.com/hyamero/chatbot",
    cta: "View Repository",
    className: "col-span-3 lg:col-span-2",
    background: (
      <div className="absolute inset-7 mx-auto duration-300 ease-in-out [mask-image:linear-gradient(to_top,transparent_20%,#000_100%)] hover:scale-105 lg:inset-10">
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
