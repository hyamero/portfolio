"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { anchorRect, flight, onTick, startFlight } from "@/lib/flight";
import { MAGNET_RADIUS, magnet } from "@/lib/magnet";

gsap.registerPlugin(ScrollTrigger);

// Beyond this a target can't catch the light, so it isn't written to.
const REACH = 300;
const FINE = "(hover: hover) and (pointer: fine)";
// Ancestors GSAP moves while the page is live: the hero copy's drift and the page-in rise.
const MOVERS = ["[data-hero-copy]", "[data-rise]"];

type QuickTo = ReturnType<typeof gsap.quickTo>;
type Box = { el: HTMLElement; left: number; top: number; width: number; height: number; movers: HTMLElement[] };
type Lit = Box & { lx: number; ly: number; lo: number };
type Pull = Box & { x: QuickTo; y: QuickTo; ix: QuickTo | null; iy: QuickTo | null; ox: number; oy: number };

const gsapY = (el: Element) => Number(gsap.getProperty(el, "y")) || 0;
const lift = (movers: HTMLElement[]) => movers.reduce((sum, el) => sum + gsapY(el), 0);
const gap = (p: number, start: number, size: number) => Math.max(start - p, 0, p - start - size);

/** A page-space box with GSAP's offsets taken out (its own and its moving ancestors'), so it holds while they move. */
function box(el: HTMLElement): Box {
  const movers = MOVERS.map((s) => el.parentElement?.closest<HTMLElement>(s)).filter((m): m is HTMLElement => !!m);
  const r = el.getBoundingClientRect();
  return {
    el,
    movers,
    left: r.left + window.scrollX - (Number(gsap.getProperty(el, "x")) || 0),
    top: r.top + window.scrollY - gsapY(el) - lift(movers),
    // Layout size, so a hairline that is still scaling in measures at full width.
    width: el.offsetWidth,
    height: el.offsetHeight,
  };
}

/** The cursor light catching the page's edges, and the arrows it pulls (spec §5, §6.1). */
export default function EdgeLight() {
  const pathname = usePathname();

  useEffect(() => {
    const fine = window.matchMedia(FINE);
    const pulls = new Map<HTMLElement, Pull>();
    let lit: Lit[] = [];
    let anyLit = false;
    let disposed = false;

    // Layout is read only here, never inside a tick.
    const measure = () => {
      if (disposed) return;
      flight.hero = anchorRect("hero");
      // Carry over what each target last wrote, so one that was lit still gets darkened.
      const was = new Map(lit.map((t) => [t.el, t]));
      lit = [...document.querySelectorAll<HTMLElement>("[data-catch-light]")].map((el) => {
        const prev = was.get(el);
        return { ...box(el), lx: prev?.lx ?? Number.NaN, ly: prev?.ly ?? Number.NaN, lo: prev?.lo ?? 0 };
      });
      const seen = new Set<HTMLElement>();
      document.querySelectorAll<HTMLElement>("[data-magnet]").forEach((el) => {
        seen.add(el);
        const prev = pulls.get(el);
        const icon = el.querySelector("svg");
        const tween = { duration: 0.6, ease: "power3.out" };
        pulls.set(el, {
          ...box(el),
          x: prev?.x ?? gsap.quickTo(el, "x", tween),
          y: prev?.y ?? gsap.quickTo(el, "y", tween),
          ix: prev?.ix ?? (icon ? gsap.quickTo(icon, "x", tween) : null),
          iy: prev?.iy ?? (icon ? gsap.quickTo(icon, "y", tween) : null),
          ox: prev?.ox ?? 0,
          oy: prev?.oy ?? 0,
        });
      });
      for (const el of pulls.keys()) if (!seen.has(el)) pulls.delete(el);
    };

    const darken = (t: Lit) => {
      t.el.style.setProperty("--lo", "0");
      t.lo = 0;
      t.lx = Number.NaN;
    };

    const glint = () => {
      const { light, pointer } = flight;
      if (!pointer.active && light.hover <= 0.002) {
        if (anyLit) lit.forEach((t) => t.lo && darken(t));
        anyLit = false;
        return;
      }
      anyLit = true;
      for (const t of lit) {
        const top = t.top + lift(t.movers);
        if (gap(light.x, t.left, t.width) > REACH || gap(light.y, top, t.height) > REACH) {
          if (t.lo) darken(t);
          continue;
        }
        const lx = light.x - t.left;
        const ly = light.y - top;
        if (!(Math.abs(lx - t.lx) < 0.5 && Math.abs(ly - t.ly) < 0.5)) {
          t.el.style.setProperty("--lx", `${lx.toFixed(1)}px`);
          t.el.style.setProperty("--ly", `${ly.toFixed(1)}px`);
          t.el.style.setProperty("--lb", `${(t.height - ly).toFixed(1)}px`);
          t.lx = lx;
          t.ly = ly;
        }
        if (Math.abs(light.hover - t.lo) > 0.01) {
          t.el.style.setProperty("--lo", light.hover.toFixed(3));
          t.lo = light.hover;
        }
      }
    };

    const pull = () => {
      const { pointer } = flight;
      const on = pointer.active && !flight.reduced;
      const px = pointer.x + window.scrollX;
      const py = pointer.y + flight.scroll;
      for (const m of pulls.values()) {
        let o = { x: 0, y: 0 };
        if (on) {
          const dx = px - (m.left + m.width / 2);
          const dy = py - (m.top + lift(m.movers) + m.height / 2);
          if (Math.abs(dx) < MAGNET_RADIUS && Math.abs(dy) < MAGNET_RADIUS) o = magnet(dx, dy);
        }
        if (Math.abs(o.x - m.ox) < 0.05 && Math.abs(o.y - m.oy) < 0.05) continue;
        m.ox = o.x;
        m.oy = o.y;
        m.x(o.x);
        m.y(o.y);
        m.ix?.(o.x * 0.33);
        m.iy?.(o.y * 0.33);
      }
    };

    const tick = () => {
      if (!fine.matches) return;
      glint();
      pull();
    };

    const stop = startFlight();
    measure();
    const offTick = onTick(tick);
    const observer = new ResizeObserver(measure);
    observer.observe(document.body);
    ScrollTrigger.addEventListener("refresh", measure);
    void document.fonts.ready.then(measure);
    return () => {
      disposed = true;
      offTick();
      stop();
      observer.disconnect();
      ScrollTrigger.removeEventListener("refresh", measure);
      for (const m of pulls.values()) gsap.set([m.el, m.el.querySelector("svg")].filter(Boolean), { x: 0, y: 0 });
    };
  }, [pathname]);

  return null;
}
