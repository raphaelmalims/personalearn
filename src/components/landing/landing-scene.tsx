"use client";

import { useEffect, useRef } from "react";
import { convergeMark } from "@/components/brand/logo";
import {
  createSceneState,
  readSceneEnvironment,
  resolveSceneTier,
  sceneBudget,
  shouldRunScene,
  stepScene,
  type DocKind,
  type SceneBudget,
  type SceneState,
} from "@/components/landing/scene-model";

/** Marks the async hero chunk so the gzip budget can be checked after build. */
export const HERO_SCENE_CHUNK = "pl-landing-hero";

type Rgb = { r: number; g: number; b: number };

type Pointer = { x: number; y: number; tx: number; ty: number };

const DOC_LABEL: Record<DocKind, string> = {
  scheme: "Scheme",
  paper: "Paper",
  script: "Script",
};

function parseRgb(color: string): Rgb {
  const parts = color.match(/[\d.]+/g);
  if (!parts || parts.length < 3) return { r: 250, g: 250, b: 250 };
  return { r: Number(parts[0]), g: Number(parts[1]), b: Number(parts[2]) };
}

function rgba(rgb: Rgb, alpha: number) {
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function readInk(): Rgb {
  return parseRgb(getComputedStyle(document.body).color);
}

function nodePosition(
  node: SceneState["nodes"][number],
  cx: number,
  cy: number,
  span: number,
  time: number
) {
  const wobble = Math.sin(time * 0.7 + node.phase) * span * 0.012;
  const radius = node.radius * span * 0.5;
  const angle = node.angle + Math.sin(time * 0.18 + node.phase) * 0.05;
  return {
    x: cx + Math.cos(angle) * radius + wobble,
    y: cy + Math.sin(angle) * radius * 0.78,
  };
}

function drawMark(
  ctx: CanvasRenderingContext2D,
  paths: { stem: Path2D; left: Path2D; right: Path2D },
  x: number,
  y: number,
  size: number,
  color: string
) {
  const scale = size / 24;
  ctx.save();
  ctx.translate(x - size / 2, y - size / 2);
  ctx.scale(scale, scale);
  ctx.strokeStyle = color;
  ctx.lineWidth = convergeMark.strokeWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke(paths.stem);
  ctx.stroke(paths.left);
  ctx.stroke(paths.right);
  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  ctx.rect(x, y, w, h);
}

function drawDocument(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  kind: DocKind,
  alpha: number,
  scale: number,
  ink: Rgb,
  fontFamily: string
) {
  const w = 92 * scale;
  const h = 58 * scale;
  const left = x - w / 2;
  const top = y - h / 2;
  ctx.save();
  ctx.globalAlpha = Math.max(0, alpha);
  roundRect(ctx, left, top, w, h, 8 * scale);
  ctx.fillStyle = rgba(ink, 0.06);
  ctx.fill();
  ctx.strokeStyle = rgba(ink, 0.45);
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = rgba(ink, 0.9);
  ctx.font = `${Math.max(9, 11 * scale)}px ${fontFamily}`;
  ctx.textBaseline = "top";
  ctx.fillText(DOC_LABEL[kind], left + 8 * scale, top + 7 * scale);

  ctx.strokeStyle = rgba(ink, 0.35);
  for (let i = 0; i < 3; i += 1) {
    const yLine = top + (26 + i * 8) * scale;
    ctx.beginPath();
    ctx.moveTo(left + 8 * scale, yLine);
    ctx.lineTo(left + w - (kind === "script" && i === 2 ? 22 : 10) * scale, yLine);
    ctx.stroke();
  }

  if (kind === "script") {
    ctx.beginPath();
    ctx.arc(left + w - 14 * scale, top + h - 14 * scale, 5 * scale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(left + w - 16.5 * scale, top + h - 14 * scale);
    ctx.lineTo(left + w - 13.5 * scale, top + h - 11 * scale);
    ctx.lineTo(left + w - 10.5 * scale, top + h - 17 * scale);
    ctx.stroke();
  }
  ctx.restore();
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: SceneState,
  budget: SceneBudget,
  pointer: Pointer,
  scroll: number,
  ink: Rgb,
  fontFamily: string,
  paths: { stem: Path2D; left: Path2D; right: Path2D }
) {
  ctx.clearRect(0, 0, width, height);
  const parallax = budget.neighborLinks ? 42 : 22;
  const cx = width * 0.5 + (pointer.x - 0.5) * parallax;
  const cy = height * 0.48 + (pointer.y - 0.5) * parallax * 0.6 - scroll * height * 0.08;
  const span = Math.min(width, height);

  const wash = ctx.createRadialGradient(cx, cy, span * 0.02, cx, cy, span * 0.62);
  wash.addColorStop(0, rgba(ink, 0.07));
  wash.addColorStop(0.45, rgba(ink, 0.025));
  wash.addColorStop(1, rgba(ink, 0));
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, width, height);

  const points = state.nodes.map((node) => nodePosition(node, cx, cy, span, state.time));

  ctx.lineWidth = 1;
  for (let i = 0; i < points.length; i += 1) {
    const point = points[i];
    const dx = (point.x - cx) / width - (pointer.x - 0.5);
    const dy = (point.y - cy) / height - (pointer.y - 0.5);
    const near = Math.max(0, 1 - Math.hypot(dx, dy) * 2.4);
    ctx.strokeStyle = rgba(ink, 0.08 + near * 0.22);
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    ctx.lineTo(cx, cy);
    ctx.stroke();
  }

  if (budget.neighborLinks) {
    ctx.strokeStyle = rgba(ink, 0.06);
    for (let i = 0; i < points.length; i += 1) {
      const next = points[(i + 3) % points.length];
      ctx.beginPath();
      ctx.moveTo(points[i].x, points[i].y);
      ctx.lineTo(next.x, next.y);
      ctx.stroke();
    }
  }

  for (const doc of state.documents) {
    const travel = Math.min(doc.progress, 1);
    const eased = travel * travel * (3 - 2 * travel);
    const fromEdge = doc.lane < -0.2 ? 0 : doc.lane > 0.2 ? 1 : 0.5;
    const fromX = fromEdge === 0.5 ? width * 0.5 : fromEdge === 0 ? -70 : width + 70;
    const fromY = fromEdge === 0.5 ? -60 : height * (0.42 + doc.lane * 0.18);
    const x = fromX + (cx - fromX) * eased;
    const y = fromY + (cy - fromY) * eased;
    const fade = doc.progress < 0.84 ? 0.92 : Math.max(0, 1 - (doc.progress - 0.84) / 0.2);
    drawDocument(ctx, x, y, doc.kind, fade, 1 - eased * 0.35, ink, fontFamily);

    if (doc.progress > 0.8) {
      const spark = Math.min(1, (doc.progress - 0.8) / 0.4);
      for (const target of doc.targets) {
        const point = points[target];
        if (!point) continue;
        const sx = cx + (point.x - cx) * spark;
        const sy = cy + (point.y - cy) * spark;
        ctx.beginPath();
        ctx.arc(sx, sy, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = rgba(ink, 0.85 * (1 - spark * 0.35));
        ctx.fill();
      }
    }
  }

  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 54);
  glow.addColorStop(0, rgba(ink, 0.14));
  glow.addColorStop(1, rgba(ink, 0));
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, 54, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < points.length; i += 1) {
    const point = points[i];
    const node = state.nodes[i];
    ctx.beginPath();
    ctx.arc(point.x, point.y, node.size + 2.5, 0, Math.PI * 2);
    ctx.strokeStyle = rgba(ink, 0.2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(point.x, point.y, node.size, 0, Math.PI * 2);
    ctx.fillStyle = rgba(ink, 0.88);
    ctx.fill();
  }

  drawMark(ctx, paths, cx, cy, Math.max(48, span * 0.09), rgba(ink, 0.95));
}

type LandingSceneProps = {
  onReady?: () => void;
};

export function LandingScene({ onReady }: LandingSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const paths = {
      stem: new Path2D(convergeMark.paths.stem),
      left: new Path2D(convergeMark.paths.left),
      right: new Path2D(convergeMark.paths.right),
    };

    let budget = sceneBudget(resolveSceneTier(readSceneEnvironment()));
    let state = createSceneState(budget);
    let ink = readInk();
    let fontFamily = getComputedStyle(document.body).fontFamily || "sans-serif";
    let inView = true;
    let tabVisible = document.visibilityState === "visible";
    let reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let last = performance.now();
    let scroll = 0;
    const pointer: Pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
    const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const resize = () => {
      const rect = host.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, budget.dprCap);
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { width, height };
    };

    let size = resize();

    const paint = () => {
      drawFrame(ctx, size.width, size.height, state, budget, pointer, scroll, ink, fontFamily, paths);
    };

    const kick = () => {
      if (raf) return;
      if (!shouldRunScene({ inView, tabVisible, reducedMotion: reduced })) return;
      last = performance.now();
      raf = window.requestAnimationFrame(loop);
    };

    const loop = (now: number) => {
      if (!shouldRunScene({ inView, tabVisible, reducedMotion: reduced })) {
        raf = 0;
        return;
      }
      raf = window.requestAnimationFrame(loop);
      const dt = (now - last) / 1000;
      last = now;
      pointer.x += (pointer.tx - pointer.x) * 0.08;
      pointer.y += (pointer.ty - pointer.y) * 0.08;
      stepScene(state, dt);
      paint();
    };

    const applyTier = () => {
      const next = sceneBudget(resolveSceneTier(readSceneEnvironment()));
      if (next.nodes !== budget.nodes || next.neighborLinks !== budget.neighborLinks) {
        budget = next;
        state = createSceneState(budget);
      } else {
        budget = next;
      }
      size = resize();
    };

    const onPointer = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      ) {
        pointer.tx = 0.5;
        pointer.ty = 0.5;
        return;
      }
      pointer.tx = (event.clientX - rect.left) / rect.width;
      pointer.ty = (event.clientY - rect.top) / rect.height;
    };

    const onScroll = () => {
      const rect = host.getBoundingClientRect();
      const height = rect.height || 1;
      scroll = Math.min(1, Math.max(0, -rect.top / height));
    };

    const onVisibility = () => {
      tabVisible = document.visibilityState === "visible";
      if (tabVisible) kick();
    };

    const onMotion = () => {
      reduced = reducedQuery.matches;
      if (reduced) {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        paint();
        return;
      }
      kick();
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = entry?.isIntersecting ?? false;
        if (inView) kick();
      },
      { threshold: 0 }
    );
    observer.observe(host);

    const resizeObserver = new ResizeObserver(() => {
      size = resize();
      if (!raf) paint();
    });
    resizeObserver.observe(host);

    const theme = new MutationObserver(() => {
      ink = readInk();
      fontFamily = getComputedStyle(document.body).fontFamily || "sans-serif";
      paint();
    });
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style"] });

    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", applyTier);
    document.addEventListener("visibilitychange", onVisibility);
    reducedQuery.addEventListener("change", onMotion);

    paint();
    onReadyRef.current?.();
    kick();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      observer.disconnect();
      resizeObserver.disconnect();
      theme.disconnect();
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", applyTier);
      document.removeEventListener("visibilitychange", onVisibility);
      reducedQuery.removeEventListener("change", onMotion);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      data-hero-scene={HERO_SCENE_CHUNK}
      className="absolute inset-0 h-full w-full"
      aria-hidden
    />
  );
}
