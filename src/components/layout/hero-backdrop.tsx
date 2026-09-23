"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type HeroBackdropProps = {
  blur?: boolean;
  className?: string;
};

export function HeroBackdrop({ blur = false, className }: HeroBackdropProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let isVisible = true;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.innerWidth < 640;

    let width = 0;
    let height = 0;

    const resize = () => {
      if (!canvas) return;
      width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.parentElement?.clientHeight || window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);

    // Track visibility to pause off-screen
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        isVisible = entry.isIntersecting;
        if (isVisible && !reducedMotion) {
          loop();
        } else {
          cancelAnimationFrame(animationFrameId);
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(canvas);

    const lineCount = isMobile ? 8 : 16;
    let t = 0;

    const drawFrame = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      // Subtle monochrome convergence grid
      const centerX = width * 0.5;
      const centerY = height * 0.45;

      ctx.lineWidth = 1;
      const isDark =
        document.documentElement.classList.contains("dark") ||
        (!document.documentElement.classList.contains("light") &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);

      const strokeAlpha = isDark ? 0.07 : 0.04;
      const dotAlpha = isDark ? 0.12 : 0.08;

      ctx.strokeStyle = isDark
        ? `rgba(255, 255, 255, ${strokeAlpha})`
        : `rgba(0, 0, 0, ${strokeAlpha})`;

      // Converging rays
      for (let i = 0; i < lineCount; i++) {
        const angle = (i / lineCount) * Math.PI * 2;
        const wave = reducedMotion ? 0 : Math.sin(time * 0.001 + i) * 15;
        const startX = centerX + Math.cos(angle) * (width * 0.55 + wave);
        const startY = centerY + Math.sin(angle) * (height * 0.55 + wave);

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        // Converge toward center with a bezier curve mimicking the Converge mark join
        const cpX = (startX + centerX) * 0.5;
        const cpY = (startY + centerY) * 0.5 + wave * 0.5;
        ctx.quadraticCurveTo(cpX, cpY, centerX, centerY);
        ctx.stroke();
      }

      // Center confluence hub point
      ctx.fillStyle = isDark
        ? `rgba(255, 255, 255, ${dotAlpha})`
        : `rgba(0, 0, 0, ${dotAlpha})`;

      ctx.beginPath();
      ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
      ctx.fill();
    };

    const loop = () => {
      if (!isVisible) return;
      t += 16;
      drawFrame(t);
      if (!reducedMotion) {
        animationFrameId = requestAnimationFrame(loop);
      }
    };

    if (reducedMotion) {
      drawFrame(0);
    } else {
      loop();
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        blur && "blur-xs opacity-50",
        className
      )}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="h-full w-full opacity-60 transition-opacity duration-1000"
      />
      {/* Subtle radial fade */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,var(--background)_80%)]" />
    </div>
  );
}
