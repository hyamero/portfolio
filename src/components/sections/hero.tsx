"use client";

import gsap from "gsap";
import Image from "next/image";
import React, { useRef } from "react";
import { useGSAP } from "@gsap/react";

import heroBg from "/public/img/main-bg.jpg";
import Particles from "../magicui/particles";
import { useUnmountStore } from "@/lib/unmount-store";
import starIcon from "/public/img/icons/star-icon.png";
import globeIcon from "/public/img/icons/globe-icon.png";
import { ArrowUpRight, ArrowUpRightIcon } from "lucide-react";
import AnimatedShinyText from "@/components/magicui/animated-shiny-text";

const _heroText = {
  top: "Crafting ideas into",
  bottom: "digital experiences",
};

const _descriptionText =
  "Joseph Dale Bañares is a Software Engineer and Designer based in the Philippines.";

const heroText = [_heroText.top.split(" "), _heroText.bottom.split(" ")];
const descriptionText = _descriptionText.split(" ");

export default function Hero() {
  const tl = useRef<GSAPTimeline>();
  const setPageOut = useUnmountStore((state) => state.setPageOut);

  useGSAP(() => {
    tl.current = gsap
      .timeline()
      .set("body", { overflow: "hidden" })
      .to(".banner div", {
        yPercent: 100,
        stagger: 0.2,
        ease: "power2.inOut",
        onComplete: () => {
          setPageOut(false);
        },
      })

      .fromTo(
        "#hero-text div span",
        {
          opacity: 0,
          filter: "blur(8px)",
        },
        {
          opacity: 100,
          duration: 2,
          ease: "power4.inOut",
          stagger: 0.1,
          filter: "blur(0px)",
        },
        "<20%",
      )
      .fromTo(
        "#description span",
        {
          opacity: 0,
          filter: "blur(5px)",
        },
        {
          opacity: 100,
          duration: 2,
          ease: "power4.inOut",
          stagger: 0.05,
          filter: "blur(0px)",
        },
        "<",
      )
      .fromTo(
        ".blur-item",
        {
          opacity: 0,
          filter: "blur(8px)",
        },
        {
          opacity: 100,
          ease: "power4.inOut",
          stagger: 0.3,
          filter: "blur(0px)",
        },
        "<25%",
      )
      .to(
        "body",
        {
          overflow: "auto",
        },
        "<50%",
      );
  });

  return (
    <section id="home" className="relative border-b">
      {/* BG Filter */}
      <div className="pointer-events-none absolute left-0 top-0 h-full w-full bg-black/25 mix-blend-overlay" />

      <div className="container flex min-h-screen pt-40 lg:pt-48">
        <div className="absolute left-0 top-0 -z-10 size-full">
          <Image
            src={heroBg}
            alt="Main Background"
            className="object-cover object-center"
            priority
            fill
          />
        </div>

        {/* BG Noise */}
        <div
          className="absolute inset-0 -z-10 bg-top opacity-15 forced-colors:hidden"
          style={{ backgroundImage: `url(/img/noise.png)` }}
        />

        <Particles
          className="absolute inset-0"
          quantity={75}
          ease={80}
          color="#888888"
          refresh
        />

        <div className="relative z-30 flex flex-col items-start gap-10 md:gap-14">
          <div className="space-y-4">
            <a
              href="https://github.com/omsimos"
              target="_blank"
              rel="noopener noreferrer"
              className="blur-item group inline-block rounded-full border border-white/5 bg-neutral-950 text-white opacity-0 transition-all ease-in hover:cursor-pointer hover:bg-neutral-900"
            >
              <AnimatedShinyText className="inline-flex items-center justify-center px-4 py-1 transition ease-out hover:text-neutral-600 hover:duration-300 hover:dark:text-neutral-400">
                <span>✨ Omsimos</span>
                <ArrowUpRightIcon className="ml-1 size-4 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" />
              </AnimatedShinyText>
            </a>

            <h2
              id="hero-text"
              className="text-8xl text-[clamp(2rem,10vw,6rem)] font-medium tracking-[-0.07em]"
            >
              <div className="flex gap-2 sm:gap-4">
                {heroText[0].map((text) => (
                  <span key={text}>{text}</span>
                ))}
              </div>
              <div className="flex gap-2 sm:gap-4">
                {heroText[1].map((text) => (
                  <span key={text}>{text}</span>
                ))}
              </div>
            </h2>
          </div>
          <div className="flex gap-3 md:gap-5">
            <h1
              id="description"
              className="w-5/6 text-xl leading-tight tracking-tight text-[#888888] sm:w-1/2 md:w-2/5 lg:text-2xl"
            >
              {descriptionText.map((text, i) => (
                <React.Fragment key={text + i}>
                  {["Software", "Engineer", "Designer"].includes(text) ? (
                    <span className="font-medium text-foreground">{text} </span>
                  ) : (
                    <span>{text} </span>
                  )}
                </React.Fragment>
              ))}
            </h1>

            <Image
              alt="Star Icon"
              src={starIcon}
              className="blur-item relative bottom-3 hidden h-24 w-24 sm:block"
            />
          </div>

          <div className="blur-item flex flex-col items-center justify-center gap-20 rounded-lg backdrop-blur-sm md:w-1/3 md:pb-10">
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="hover-effect relative flex w-full items-center justify-between gap-2 border-b border-border px-5 pb-3 text-base text-foreground md:text-lg"
            >
              <p>View Resume</p>
              <ArrowUpRight className="stroke-1" />
            </a>

            <Image
              alt="Globe Icon"
              src={globeIcon}
              className="hidden h-48 w-48 md:block"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
