"use client";

import { useEffect, useRef } from "react";

interface ParticlesProps {
  className?: string;
  quantity?: number;
  staticity?: number;
  ease?: number;
  size?: number;
  refresh?: boolean;
  color?: string;
  vx?: number;
  vy?: number;
}

type Circle = {
  x: number;
  y: number;
  translateX: number;
  translateY: number;
  size: number;
  alpha: number;
  targetAlpha: number;
  dx: number;
  dy: number;
  magnetism: number;
};

function hexToRgb(hex: string): number[] {
  hex = hex.replace("#", "");
  const hexInt = parseInt(hex, 16);
  return [(hexInt >> 16) & 255, (hexInt >> 8) & 255, hexInt & 255];
}

function remapValue(
  value: number,
  start1: number,
  end1: number,
  start2: number,
  end2: number,
): number {
  const remapped =
    ((value - start1) * (end2 - start2)) / (end1 - start1) + start2;
  return remapped > 0 ? remapped : 0;
}

export default function Particles({
  className = "",
  quantity = 100,
  staticity = 50,
  ease = 50,
  size = 0.4,
  refresh = false,
  color = "#ffffff",
  vx = 0,
  vy = 0,
}: ParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = canvasContainerRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !container || !context) return;

    const dpr = window.devicePixelRatio || 1;
    const rgb = hexToRgb(color);
    const circles: Circle[] = [];
    const canvasSize = { w: 0, h: 0 };
    // Mouse offset is transient render-loop state; refs avoid re-rendering
    // (and re-running this effect) on every mousemove.
    const mouse = { x: 0, y: 0 };
    let rafId: number;

    const circleParams = (): Circle => ({
      x: Math.floor(Math.random() * canvasSize.w),
      y: Math.floor(Math.random() * canvasSize.h),
      translateX: 0,
      translateY: 0,
      size: Math.floor(Math.random() * 2) + size,
      alpha: 0,
      targetAlpha: parseFloat((Math.random() * 0.6 + 0.1).toFixed(1)),
      dx: (Math.random() - 0.5) * 0.1,
      dy: (Math.random() - 0.5) * 0.1,
      magnetism: 0.1 + Math.random() * 4,
    });

    const drawCircle = (circle: Circle, update = false) => {
      const { x, y, translateX, translateY, size: circleSize, alpha } = circle;
      context.translate(translateX, translateY);
      context.beginPath();
      context.arc(x, y, circleSize, 0, 2 * Math.PI);
      context.fillStyle = `rgba(${rgb.join(", ")}, ${alpha})`;
      context.fill();
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (!update) circles.push(circle);
    };

    const clearContext = () => {
      context.clearRect(0, 0, canvasSize.w, canvasSize.h);
    };

    const resizeCanvas = () => {
      circles.length = 0;
      canvasSize.w = container.offsetWidth;
      canvasSize.h = container.offsetHeight;
      canvas.width = canvasSize.w * dpr;
      canvas.height = canvasSize.h * dpr;
      canvas.style.width = `${canvasSize.w}px`;
      canvas.style.height = `${canvasSize.h}px`;
      context.scale(dpr, dpr);
    };

    const drawParticles = () => {
      clearContext();
      for (let i = 0; i < quantity; i++) {
        drawCircle(circleParams());
      }
    };

    const initCanvas = () => {
      resizeCanvas();
      drawParticles();
    };

    const onMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const { w, h } = canvasSize;
      const x = event.clientX - rect.left - w / 2;
      const y = event.clientY - rect.top - h / 2;
      const inside = x < w / 2 && x > -w / 2 && y < h / 2 && y > -h / 2;
      if (inside) {
        mouse.x = x;
        mouse.y = y;
      }
    };

    const animate = () => {
      clearContext();
      circles.forEach((circle, i) => {
        // Fade the particle out as it approaches an edge.
        const edge = [
          circle.x + circle.translateX - circle.size,
          canvasSize.w - circle.x - circle.translateX - circle.size,
          circle.y + circle.translateY - circle.size,
          canvasSize.h - circle.y - circle.translateY - circle.size,
        ];
        const closestEdge = edge.reduce((a, b) => Math.min(a, b));
        const remapClosestEdge = parseFloat(
          remapValue(closestEdge, 0, 20, 0, 1).toFixed(2),
        );
        if (remapClosestEdge > 1) {
          circle.alpha = Math.min(circle.alpha + 0.02, circle.targetAlpha);
        } else {
          circle.alpha = circle.targetAlpha * remapClosestEdge;
        }
        circle.x += circle.dx + vx;
        circle.y += circle.dy + vy;
        circle.translateX +=
          (mouse.x / (staticity / circle.magnetism) - circle.translateX) / ease;
        circle.translateY +=
          (mouse.y / (staticity / circle.magnetism) - circle.translateY) / ease;

        drawCircle(circle, true);

        // Replace particles that drift out of the canvas.
        if (
          circle.x < -circle.size ||
          circle.x > canvasSize.w + circle.size ||
          circle.y < -circle.size ||
          circle.y > canvasSize.h + circle.size
        ) {
          circles.splice(i, 1);
          drawCircle(circleParams());
        }
      });
      rafId = window.requestAnimationFrame(animate);
    };

    initCanvas();
    animate();
    window.addEventListener("resize", initCanvas);
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", initCanvas);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, [quantity, staticity, ease, size, color, vx, vy, refresh]);

  return (
    <div className={className} ref={canvasContainerRef} aria-hidden="true">
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
