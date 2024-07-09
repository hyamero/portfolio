"use client";

import gsap from "gsap";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { useUnmountStore } from "@/lib/unmount-store";
import { useRouter } from "next/navigation";

gsap.registerPlugin(useGSAP);

export default function Loader() {
  const { push } = useRouter();
  const tl = useRef<GSAPTimeline>();
  const bannerRef = useRef<HTMLDivElement>(null);

  const href = useUnmountStore((state) => state.href);
  const pageOut = useUnmountStore((state) => state.pageOut);
  const unmount = useUnmountStore((state) => state.unmount);

  //   const setUnmount = useUnmountStore((state) => state.setUnmount);
  const setPageOut = useUnmountStore((state) => state.setPageOut);

  useGSAP(
    () => {
      if (!unmount) {
        if (!pageOut) {
          tl.current = gsap
            .timeline()
            .set("body", { overflow: "hidden" })
            .to(".banner div", {
              yPercent: 0,
            })
            .to(".banner div", {
              yPercent: 100,
              stagger: 0.2,
              ease: "power2.inOut",
            })
            .to("body", {
              overflow: "auto",
              //   onComplete: () => {
              //     setUnmount(true);
              //   },
            });
        } else {
          tl.current?.reverse().eventCallback("onReverseComplete", () => {
            push(href);
            setPageOut(false);
            console.log(href);
          });
        }
      } else return;
    },
    { dependencies: [pageOut] },
  );
  return (
    <div>
      {!unmount && (
        <div
          ref={bannerRef}
          className="banner [&>*]:fixed [&>*]:top-0 [&>*]:z-50 [&>*]:min-h-screen [&>*]:w-1/4 [&>*]:bg-[#111]"
        >
          <div className="left-0" />
          <div className="left-1/4" />
          <div className="left-2/4" />
          <div className="left-3/4" />
        </div>
      )}
    </div>
  );
}
