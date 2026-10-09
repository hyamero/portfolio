import { effect, frame, surface } from "vgpu";

import skySource from "./sky.wgsl";
import {
  beadFlash,
  bodyFrame,
  endFrame,
  haloFrame,
  settleFrame,
  startFrame,
  stillFrame,
  sunFrame,
  type Body,
} from "@/lib/eclipse";
import { anchorRect, EMPTY_RECT, flight, onTick, startFlight } from "@/lib/flight";
import { getGpu } from "@/lib/gpu";
import { armIntro, introProgress, rise, skyDpr, trailFrame, type Rect } from "@/lib/sky-math";

const INTRO_DELAY_MS = 250;
// The ambient drift (nebula, twinkle, the bead's pulse) needs no more than ~30fps.
const AMBIENT_MS = 33;
// Far above the page and invisible: the body on a page without an eclipse box.
const NO_BODY: Body = { C: [0, -1e5], R: 1, B: [0, -1e5] };

type Callbacks = { onFirstFrame: () => void; onFallback: () => void };

/**
 * Draws the page's sky into the fixed `canvas` on flight's tick, and the resting horizon's ground
 * into `front`, over the content (spec §5.6). Frames are drawn on demand: when anything the sky
 * reads has changed, while the intro eases, and at ~30fps while the body is still moving.
 */
export function mountSky(canvas: HTMLCanvasElement, front: HTMLCanvasElement, { onFirstFrame, onFallback }: Callbacks) {
  let disposed = false;
  let measure = () => {};
  const hideFront = () => {
    front.style.visibility = "hidden";
    front.style.clipPath = "";
  };
  const teardown: (() => void)[] = [startFlight(), hideFront];

  void (async () => {
    const maybeGpu = await getGpu();
    if (disposed) return;
    if (!maybeGpu) return onFallback();
    // Narrowing doesn't reach the tick closure below.
    const gpu = maybeGpu;

    try {
      const output = surface(gpu, canvas, {
        // Sized by hand to the pixel budget; auto-resize would re-read devicePixelRatio.
        autoResize: false,
        // Every pixel is written with alpha 1, so the compositor can skip blending the canvas.
        alphaMode: "opaque",
      });
      teardown.push(() => output.dispose());
      // The ground over the content writes premultiplied alpha: clear above the rim.
      const frontOutput = surface(gpu, front, { autoResize: false, alphaMode: "premultiplied" });
      teardown.push(() => frontOutput.dispose());

      const initial = {
        resolution: output.size,
        light: [0, 0],
        pointer: [0.5, 0.5],
        dpr: 1,
        scroll: 0,
        hover: 0,
        time: flight.reduced ? 8 : 0,
        layer: 0,
        origin: 0,
        viewHeight: 1,
        body: [0, 0, 1, 0],
        sun: [0, 0, 0, 0],
        halo: [1, 1, 1, 0],
        glare: [1, 1, 1, 1],
        settle: 0,
        span: [0, 0],
        trail: [0, 0, 0, 0],
      };
      const sky = effect(gpu, skySource, { set: { params: initial } });
      const ground = effect(gpu, skySource, { set: { params: { ...initial, layer: 1 } } });
      await Promise.all([sky.compile({ colors: [output.format] }), ground.compile({ colors: [frontOutput.format] })]);
      if (disposed) return;

      let cssWidth = 1;
      let cssHeight = 1;
      let frontTop = 0;
      let hero: Rect = EMPTY_RECT;
      let eclipse: Rect = EMPTY_RECT;
      let work: Rect = EMPTY_RECT;
      let contact: Rect = EMPTY_RECT;
      let time = flight.reduced ? 8 : 0;
      let lastDraw = 0;
      let dirty = true;
      let shown = false;
      let frontShown = false;
      let introStart: number | null = null;
      // What the last frame was drawn from; a tick that matches it draws nothing.
      const last = new Float64Array(13).fill(Number.NaN);
      // What the ground was last drawn from. It doesn't move with the scroll, so it redraws only when these change.
      const lastGround = new Float64Array(16).fill(Number.NaN);

      // Layout is read only here, never inside a tick.
      measure = () => {
        hero = anchorRect("hero");
        eclipse = anchorRect("eclipse");
        work = anchorRect("work");
        contact = anchorRect("contact");
        flight.hero = hero;
        dirty = true;
      };

      const resize = () => {
        cssWidth = Math.max(canvas.clientWidth, 1);
        cssHeight = Math.max(canvas.clientHeight, 1);
        const dpr = skyDpr(window.devicePixelRatio, cssWidth, cssHeight);
        output.resize([Math.max(1, Math.round(cssWidth * dpr)), Math.max(1, Math.round(cssHeight * dpr))]);
        const box = front.getBoundingClientRect();
        frontTop = box.top;
        frontOutput.resize([Math.max(1, Math.round(cssWidth * dpr)), Math.max(1, Math.round(box.height * dpr))]);
        dirty = true;
        // Resizing clears the canvas.
        lastGround.fill(Number.NaN);
      };

      const tick = (now: number) => {
        if (document.hidden) return;
        const { light, pointer, reduced } = flight;
        const cam = flight.eclipse;
        const scrollY = flight.scroll;
        const W = cssWidth;
        const H = cssHeight;
        const hasEclipse = eclipse.width > 0;

        // The tick only runs while the tab is visible.
        introStart = armIntro(introStart, now + INTRO_DELAY_MS, hasEclipse, true);
        const intro = reduced ? 1 : introStart === null ? 0 : introProgress(now - introStart);
        let body = NO_BODY;
        let morph = 0;
        let settle = 0;
        if (hasEclipse && reduced) {
          const still = stillFrame(startFrame(eclipse, hero.top), { hero, work, contact }, W, H, scrollY);
          body = still.body;
          morph = still.morph;
          // The still horizon is at rest; the still eclipse isn't.
          settle = still.morph;
        } else if (hasEclipse) {
          const settled = settleFrame(bodyFrame(cam, startFrame(eclipse, hero.top), endFrame(W, H)), scrollY, cam.end, H);
          body = settled.body;
          morph = cam.morph;
          settle = settled.s;
        }
        const vis = hasEclipse ? intro : 0;
        const up = !contact.height ? 0 : reduced ? 1 : rise(scrollY, H, contact);
        const trail = trailFrame(settle, up, reduced, work.height > 0);
        const starScroll = scrollY + flight.coast.offset;
        const bead = beadFlash(intro);
        // The ground covers the content from the runway's end on (spec §5.6).
        const frontOn = !reduced && hasEclipse && scrollY >= cam.end;

        const inputs = [
          scrollY, starScroll, light.x, light.y, light.hover, pointer.nx, pointer.ny, reduced ? 1 : 0,
          cam.zoom, cam.pan, cam.level, cam.morph, cam.end,
        ];
        let changed = dirty;
        inputs.forEach((value, i) => {
          if (value !== last[i]) {
            last[i] = value;
            changed = true;
          }
        });
        const easing = !reduced && introStart !== null && intro < 1;
        // At rest the body holds still, so reading Work costs no frames (spec §5.8).
        const ambient = !reduced && vis > 0.001 && settle < 1;
        if (!changed && !easing && !(ambient && now - lastDraw >= AMBIENT_MS)) return;

        // Time only runs while something ambient is in view; elsewhere frames are static.
        if (ambient && lastDraw) time += Math.min((now - lastDraw) / 1000, 0.1);
        lastDraw = now;
        dirty = false;
        const halo = haloFrame(morph, body.R);
        const glare = sunFrame(morph, W);
        const params = {
          resolution: output.size,
          dpr: output.size[0] / cssWidth,
          scroll: scrollY,
          light: [light.x, light.y],
          pointer: [pointer.nx, pointer.ny],
          hover: light.hover,
          time,
          layer: 0,
          origin: 0,
          viewHeight: H,
          body: [body.C[0], body.C[1] + scrollY, body.R, vis],
          sun: [body.B[0], body.B[1] + scrollY, morph, bead],
          halo: [halo.ring, halo.glow, halo.haze, halo.rays],
          glare: [glare.core, glare.glare, glare.streakH, glare.streakV],
          settle,
          span: [work.top, contact.height ? contact.top : work.top + work.height],
          trail: [trail.shed, trail.carry, trail.gather, starScroll],
        };
        sky.set({ params });

        if (frontOn !== frontShown) {
          frontShown = frontOn;
          front.style.visibility = frontOn ? "visible" : "hidden";
        }
        const groundInputs = [
          frontOn ? 1 : 0, body.C[0], body.C[1], body.R, body.B[0], body.B[1], morph, vis, bead, settle,
          light.hover > 0 ? light.x : 0, light.hover, time, W, H, frontTop,
        ];
        let groundChanged = false;
        groundInputs.forEach((value, i) => {
          if (value !== lastGround[i]) {
            lastGround[i] = value;
            groundChanged = true;
          }
        });
        const drawGround = frontOn && groundChanged;
        if (drawGround) {
          ground.set({ params: { ...params, resolution: frontOutput.size, layer: 1, origin: frontTop } });
          // Hit-testing follows the planet: the ground takes the clicks, the clear sky above it doesn't.
          front.style.clipPath = `circle(${(body.R + 3).toFixed(1)}px at ${body.C[0].toFixed(1)}px ${(body.C[1] - frontTop).toFixed(1)}px)`;
        }
        const done = frame(gpu, (f) => {
          f.pass(output, sky);
          if (drawGround) f.pass(frontOutput, ground);
        }).done;
        if (!shown) {
          shown = true;
          // A device lost before the first submit rejects here; the lost handler falls back.
          done.then(() => !disposed && onFirstFrame()).catch(() => {});
        }
      };

      const onVisibility = () => {
        dirty = true;
      };
      window.addEventListener("load", measure);
      document.addEventListener("visibilitychange", onVisibility);
      const canvasObserver = new ResizeObserver(resize);
      canvasObserver.observe(canvas);
      canvasObserver.observe(front);
      const pageObserver = new ResizeObserver(measure);
      pageObserver.observe(document.body);
      void document.fonts.ready.then(() => !disposed && measure());
      const offTick = onTick(tick);
      teardown.push(() => {
        offTick();
        window.removeEventListener("load", measure);
        document.removeEventListener("visibilitychange", onVisibility);
        canvasObserver.disconnect();
        pageObserver.disconnect();
      });

      void gpu.gpu.lost.then(() => {
        if (disposed) return;
        offTick();
        hideFront();
        onFallback();
      });

      resize();
      measure();
    } catch (error) {
      console.error(error);
      hideFront();
      if (!disposed) onFallback();
    }
  })();

  return {
    measure: () => measure(),
    dispose: () => {
      disposed = true;
      teardown.forEach((fn) => fn());
    },
  };
}
