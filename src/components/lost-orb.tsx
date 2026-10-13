"use client";

import gsap from "gsap";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { dodge, driftRegion, flightMs, homePath, pathPoint, sway, TIRED, type Point, type Region } from "@/lib/drift";
import { flight, onTick, startFlight } from "@/lib/flight";
import { clamp } from "@/lib/sky-math";

// The wordmark's orb, which the lost one shrinks to on its way home.
const HOME_SIZE = 13;
// It shies away this many times, then lets itself be caught.
const DODGES = 2;

/**
 * The 404's orb: it has drifted off the wordmark and sways in the open sky, shying away from the first
 * cursors that close in. Caught, it flies home into the wordmark and the page goes home. Without
 * scripts, or before they load, it's a plain link home.
 */
export default function LostOrb() {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const orbRef = useRef<HTMLAnchorElement>(null);
  const trailRef = useRef<HTMLCanvasElement>(null);
  const catchRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    const orb = orbRef.current;
    const body = orb?.firstElementChild;
    const trail = trailRef.current;
    const ctx = trail?.getContext("2d");
    if (!root || !orb || !(body instanceof HTMLElement) || !trail || !ctx) return;

    // The CSS placed it; from here the drift moves it, around an anchor that dodges hop.
    const start = orb.getBoundingClientRect();
    const anchor: Point = { x: start.left + start.width / 2, y: start.top + start.height / 2 };
    // `amount` brings the sway in from rest; `reach` drops to TIRED once it gives up dodging.
    const swaying = { amount: 0, reach: 1 };
    let pos = { ...anchor };
    let width = 0;
    let height = 0;
    let size = 0;
    let region: Region = { x0: anchor.x, x1: anchor.x, y0: anchor.y, y1: anchor.y };
    let state: "drift" | "flying" | "home" = "drift";
    let dodges = 0;
    let calmUntil = 0;
    let born = Number.NaN;
    let flightTween: gsap.core.Tween | null = null;
    let homeTimer = 0;

    const layout = () => {
      width = innerWidth;
      height = innerHeight;
      size = orb.offsetWidth;
      // The copy and the header are measured, so the orb never sways over either.
      const copy = document.querySelector("[data-lost-copy]")?.getBoundingClientRect();
      const header = document.querySelector("header")?.getBoundingClientRect();
      region = driftRegion(width, height, size / 2, copy ?? { left: 0, top: height, right: 0, bottom: height }, header?.bottom ?? 0);
      anchor.x = clamp(anchor.x, region.x0, region.x1);
      anchor.y = clamp(anchor.y, region.y0, region.y1);
      const dpr = Math.min(2, devicePixelRatio || 1);
      trail.width = Math.round(width * dpr);
      trail.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const place = (p: Point, scale = 1) => {
      orb.style.transform = `translate3d(${(p.x - size / 2).toFixed(1)}px, ${(p.y - size / 2).toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
    };

    const tick = (now: number) => {
      if (state !== "drift") return;
      if (Number.isNaN(born)) born = now;
      const { pointer, reduced } = flight;
      if (pointer.active && !reduced && dodges < DODGES && now >= calmUntil) {
        const to = dodge(anchor, pos, pointer, size / 2, region, 150 + Math.random() * 50);
        if (to) {
          dodges++;
          calmUntil = now + 900;
          gsap.to(anchor, { ...to, duration: 0.7, ease: "back.out(1.4)", overwrite: true });
          gsap.fromTo(body, { scaleX: 1.18, scaleY: 0.84 }, { scaleX: 1, scaleY: 1, duration: 0.8, ease: "elastic.out(1, 0.45)", overwrite: true });
          if (dodges === DODGES) gsap.to(swaying, { reach: TIRED, duration: 1.4, ease: "sine.inOut" });
        }
      }
      const s = reduced ? { x: 0, y: 0 } : sway((now - born) / 1000, width, height, swaying.reach);
      pos = { x: anchor.x + s.x * swaying.amount, y: anchor.y + s.y * swaying.amount };
      place(pos);
    };

    // A comet's tail: each frame fades what's there a little, then lays a soft glow where the orb is.
    const streak = (p: Point, radius: number) => {
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0, 0, 0, 0.16)";
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";
      const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius * 1.6);
      glow.addColorStop(0, "rgba(201, 220, 255, 0.42)");
      glow.addColorStop(1, "rgba(201, 220, 255, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius * 1.6, 0, Math.PI * 2);
      ctx.fill();
    };

    const land = () => {
      state = "home";
      orb.style.visibility = "hidden";
      // The wordmark takes its orb back (globals.css), glows once, and then the page goes home.
      root.dataset.home = "";
      gsap.to(trail, { opacity: 0, duration: 0.7 });
      homeTimer = window.setTimeout(() => router.push("/"), flight.reduced ? 0 : 650);
    };

    catchRef.current = () => {
      if (state !== "drift") return;
      const home = document.querySelector("[data-wordmark-orb]")?.getBoundingClientRect();
      if (!home || flight.reduced) return land();
      state = "flying";
      gsap.killTweensOf(anchor);
      const to = { x: home.left + home.width / 2, y: home.top + home.height / 2 };
      const path = homePath(pos, to);
      const along = gsap.parseEase("power2.inOut");
      const shrink = HOME_SIZE / size;
      const progress = { t: 0 };
      flightTween = gsap.to(progress, {
        t: 1,
        duration: flightMs(Math.hypot(to.x - pos.x, to.y - pos.y)) / 1000,
        ease: "none",
        onUpdate: () => {
          const p = pathPoint(path, along(progress.t));
          const scale = 1 + (shrink - 1) * progress.t ** 1.4;
          place(p, scale);
          streak(p, (size * scale) / 2);
        },
        onComplete: land,
      });
    };

    const stop = startFlight();
    layout();
    root.dataset.live = "";
    place(pos);
    gsap.to(swaying, { amount: 1, duration: 2, ease: "sine.inOut" });
    const offTick = onTick(tick);
    window.addEventListener("resize", layout);
    void document.fonts.ready.then(() => state === "drift" && layout());
    return () => {
      offTick();
      stop();
      window.removeEventListener("resize", layout);
      window.clearTimeout(homeTimer);
      flightTween?.kill();
      gsap.killTweensOf([anchor, swaying, body, trail]);
      catchRef.current = null;
    };
  }, [router]);

  return (
    <div ref={rootRef} data-lost-orb className="pointer-events-none fixed inset-0 z-60">
      <canvas ref={trailRef} aria-hidden="true" className="absolute inset-0 size-full" />
      <Link
        ref={orbRef}
        href="/"
        aria-label="Catch the orb and go home"
        className="lost-orb pointer-events-auto"
        onClick={(event) => {
          const modified = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
          if (modified || !catchRef.current) return;
          event.preventDefault();
          catchRef.current();
        }}
      >
        <span className="orb-dot lost-orb-body" />
      </Link>
    </div>
  );
}
