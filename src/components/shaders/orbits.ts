import orbitsSource from "./orbits.wgsl";
import { getGpu, prefersReducedMotion } from "@/lib/gpu";

// Orbit speeds to ease toward: at rest, with the pointer over the card, and with an icon hovered
// or focused, where it holds still so it's easy to click.
const PACE = { idle: 1, near: 0.3, held: 0 };
// Seconds of travel a trail covers at full speed.
const TRAIL_SECONDS = 2.2;
// A ping outlives this by a little; it's also the shortest gap between two from one icon.
const PING_SECONDS = 1.6;
const MAX_BODIES = 4;
const TAU = Math.PI * 2;

type Vec4 = [number, number, number, number];

type Body = {
  link: HTMLElement;
  anim: Animation;
  /** The animation's own time when this took over; orbits keep their phase offsets from it. */
  base: number;
  radius: number;
  iconRadius: number;
  /** 1 for clockwise, -1 for counter-clockwise. */
  spin: number;
  /** Radians per second at full pace. */
  speed: number;
  tint: [number, number, number];
  angle: number;
  lit: number;
  lastPing: number;
};

type Ping = {
  x: number;
  y: number;
  age: number;
  radius: number;
  tint: Body["tint"];
};

/**
 * Drives the CSS orbit animations of `card`'s `[data-orbit]` links so they slow down under the
 * pointer, and draws their trails into `canvas` when WebGPU is available. The trails read each
 * icon's angle from the same animation timing that places it, so the two never drift apart.
 */
export function mountOrbits(
  card: HTMLElement,
  canvas: HTMLCanvasElement,
  onReady: () => void,
) {
  // The icons stay put under reduced motion (CSS pauses them), so there's nothing to trail.
  if (prefersReducedMotion()) return () => {};

  const bodies = [...card.querySelectorAll<HTMLElement>("[data-orbit]")]
    .slice(0, MAX_BODIES)
    .flatMap((link): Body[] => {
      const anim = link
        .getAnimations()
        .find((a) => a instanceof CSSAnimation && a.animationName === "orbit");
      const timing = anim?.effect?.getTiming();
      if (!anim || !timing) return [];
      return [
        {
          link,
          anim,
          base: Number(anim.currentTime ?? 0),
          radius: parseFloat(
            getComputedStyle(link).getPropertyValue("--radius"),
          ),
          iconRadius: link.offsetWidth / 2,
          spin: timing.direction === "reverse" ? -1 : 1,
          speed: TAU / (Number(timing.duration) / 1000),
          tint: tintOf(link.dataset.tint),
          angle: 0,
          lit: 0,
          lastPing: -Infinity,
        },
      ];
    });
  if (!bodies.length) return () => {};

  let disposed = false;
  const teardown: (() => void)[] = [];
  const on = <K extends keyof HTMLElementEventMap>(
    target: HTMLElement,
    type: K,
    listener: (event: HTMLElementEventMap[K]) => void,
  ) => {
    target.addEventListener(type, listener);
    teardown.push(() => target.removeEventListener(type, listener));
  };

  bodies.forEach((body) => body.anim.pause());
  teardown.push(() => bodies.forEach((body) => body.anim.play()));

  let near = false;
  let held = -1;
  let pace = PACE.idle;
  let elapsed = 0;
  const pings: Ping[] = [];

  const ping = (body: Body) => {
    const now = performance.now();
    if (now - body.lastPing < PING_SECONDS * 1000) return;
    body.lastPing = now;
    pings.push({
      x: -body.radius * Math.sin(body.angle),
      y: body.radius * Math.cos(body.angle),
      age: 0,
      radius: body.iconRadius,
      tint: body.tint,
    });
    if (pings.length > MAX_BODIES) pings.shift();
  };

  // Touch has no hover to brake for; a tap just sends the ping.
  on(card, "pointerenter", (event) => {
    if (event.pointerType !== "touch") near = true;
  });
  on(card, "pointerleave", () => (near = false));
  bodies.forEach((body, i) => {
    const hold = () => {
      held = i;
      ping(body);
    };
    const release = () => {
      if (held === i) held = -1;
    };
    on(
      body.link,
      "pointerenter",
      (event) => event.pointerType !== "touch" && hold(),
    );
    on(body.link, "pointerleave", release);
    // Only keyboard focus holds: a clicked link keeps focus, which would pin the orbit afterwards.
    on(body.link, "focus", () => body.link.matches(":focus-visible") && hold());
    on(body.link, "blur", release);
    on(
      body.link,
      "pointerdown",
      (event) => event.pointerType === "touch" && ping(body),
    );
  });

  let render: (() => void) | undefined;
  let raf = 0;
  let last = 0;
  const tick = (now: number) => {
    const dt = last ? Math.min((now - last) / 1000, 0.1) : 1 / 60;
    last = now;

    const target = held >= 0 ? PACE.held : near ? PACE.near : PACE.idle;
    // Brakes quickly when reached for, and winds back up slowly, like something with mass.
    pace += (target - pace) * (1 - Math.exp(-dt * (target < pace ? 6 : 1.5)));
    elapsed += dt * 1000 * pace;

    bodies.forEach((body, i) => {
      body.anim.currentTime = body.base + elapsed;
      body.angle = TAU * (body.anim.effect?.getComputedTiming().progress ?? 0);
      body.lit += ((held === i ? 1 : 0) - body.lit) * (1 - Math.exp(-dt * 8));
    });
    for (const p of pings) p.age += dt;
    while (pings.length && pings[0].age > PING_SECONDS) pings.shift();

    render?.();
    raf = requestAnimationFrame(tick);
  };

  // Offscreen, the icons simply wait where they are.
  const observer = new IntersectionObserver(([entry]) => {
    cancelAnimationFrame(raf);
    raf = 0;
    last = 0;
    if (entry.isIntersecting) raf = requestAnimationFrame(tick);
  });
  observer.observe(card);
  teardown.push(() => {
    observer.disconnect();
    cancelAnimationFrame(raf);
  });

  void (async () => {
    const gpu = await getGpu();
    if (!gpu || disposed) return;

    try {
      // Loaded here rather than statically: the braking above runs even where WebGPU doesn't.
      const { effect, frame, surface } = await import("vgpu");
      if (disposed) return;
      const output = surface(gpu, canvas, {
        dpr: Math.min(window.devicePixelRatio || 1, 2),
        alphaMode: "premultiplied",
      });
      teardown.push(() => output.dispose());

      const unused = (): Vec4[] =>
        Array.from({ length: MAX_BODIES }, () => [0, 0, 0, 0]);
      const trails = effect(gpu, orbitsSource, {
        set: {
          params: {
            resolution: output.size,
            scale: 1,
            pace,
            bodies: unused(),
            looks: unused(),
            pings: unused().map((): Vec4 => [0, 0, -1, 0]),
            pingTints: unused(),
          },
        },
      });
      teardown.push(
        output.onResize(({ width, height }) =>
          trails.set({
            params: {
              resolution: [width, height],
              scale: canvas.clientWidth ? width / canvas.clientWidth : 1,
            },
          }),
        ),
      );
      await trails.compile({ colors: [output.format] });
      if (disposed) return;

      render = () => {
        const bodyData = unused();
        const looks = unused();
        bodies.forEach((body, i) => {
          const trail =
            Math.min(body.speed * pace * TRAIL_SECONDS, 1.2) * body.spin;
          bodyData[i] = [body.radius, body.angle, trail, body.iconRadius];
          looks[i] = [...body.tint, body.lit];
        });
        const pingData = unused().map((): Vec4 => [0, 0, -1, 0]);
        const pingTints = unused();
        pings.forEach((p, i) => {
          pingData[i] = [p.x, p.y, p.age, p.radius];
          pingTints[i] = [...p.tint, 0];
        });
        trails.set({
          params: { pace, bodies: bodyData, looks, pings: pingData, pingTints },
        });
        frame(gpu, (f) => f.pass(output, trails));
      };
      render();
      onReady();
    } catch (error) {
      console.error(error);
    }
  })();

  return () => {
    disposed = true;
    teardown.forEach((fn) => fn());
  };
}

/** A brand color from `data-tint`, washed most of the way toward white. */
function tintOf(hex = "#ffffff"): [number, number, number] {
  const value = parseInt(hex.replace("#", ""), 16);
  const channel = (shift: number) => ((value >> shift) & 255) / 255;
  return [channel(16), channel(8), channel(0)].map((c) => 0.65 + 0.35 * c) as [
    number,
    number,
    number,
  ];
}
