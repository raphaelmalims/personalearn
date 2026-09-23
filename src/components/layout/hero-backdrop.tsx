"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type HeroBackdropProps = {
  blur?: boolean;
  className?: string;
};

interface Particle {
  angle: number;
  distance: number;
  speed: number;
  size: number;
  opacity: number;
}

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

    // Mouse parallax tracking
    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / (rect.width || 1) - 0.5;
      const y = (e.clientY - rect.top) / (rect.height || 1) - 0.5;
      targetMouseX = x * 60; // Max offset in pixels
      targetMouseY = y * 60;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

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

    const lineCount = isMobile ? 12 : 24;
    const particleCount = isMobile ? 16 : 36;
    const particles: Particle[] = [];

    // Initialize convergence particles
    for (let p = 0; p < particleCount; p++) {
      particles.push({
        angle: Math.random() * Math.PI * 2,
        distance: Math.random() * 0.8 + 0.2, // relative distance from center
        speed: Math.random() * 0.002 + 0.001,
        size: Math.random() * 1.5 + 0.8,
        opacity: Math.random() * 0.4 + 0.1,
      });
    }

    let t = 0;

    const drawFrame = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse lerp
      currentMouseX += (targetMouseX - currentMouseX) * 0.05;
      currentMouseY += (targetMouseY - currentMouseY) * 0.05;

      const centerX = width * 0.5 + currentMouseX;
      const centerY = height * 0.42 + currentMouseY;
      const maxDim = Math.max(width, height);

      const isDark =
        document.documentElement.classList.contains("dark") ||
        (!document.documentElement.classList.contains("light") &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);

      const strokeAlpha = isDark ? 0.06 : 0.035;
      const dotAlpha = isDark ? 0.14 : 0.08;

      ctx.lineWidth = 1;
      ctx.strokeStyle = isDark
        ? `rgba(255, 255, 255, ${strokeAlpha})`
        : `rgba(0, 0, 0, ${strokeAlpha})`;

      // 1. Converging Mathematical Rays
      for (let i = 0; i < lineCount; i++) {
        const angle = (i / lineCount) * Math.PI * 2;
        const wave = reducedMotion ? 0 : Math.sin(time * 0.0008 + i) * 12;
        const startX = centerX + Math.cos(angle) * (maxDim * 0.55 + wave);
        const startY = centerY + Math.sin(angle) * (maxDim * 0.55 + wave);

        ctx.beginPath();
        ctx.moveTo(startX, startY);

        // Converge toward center with a subtle quadratic bezier curve
        const cpX = (startX + centerX) * 0.5;
        const cpY = (startY + centerY) * 0.5 + wave * 0.4;
        ctx.quadraticCurveTo(cpX, cpY, centerX, centerY);
        ctx.stroke();
      }

      // 2. Convergent Flow Particles (Data vectors flowing into the Hub)
      if (!reducedMotion) {
        for (const pt of particles) {
          pt.distance -= pt.speed;
          if (pt.distance <= 0.05) {
            pt.distance = 0.85 + Math.random() * 0.15;
            pt.angle = Math.random() * Math.PI * 2;
          }

          const curDist = pt.distance * maxDim * 0.45;
          const px = centerX + Math.cos(pt.angle) * curDist;
          const py = centerY + Math.sin(pt.angle) * curDist;

          ctx.fillStyle = isDark
            ? `rgba(255, 255, 255, ${pt.opacity})`
            : `rgba(0, 0, 0, ${pt.opacity})`;

          ctx.beginPath();
          ctx.arc(px, py, pt.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 3. Center Confluence Focal Point
      ctx.fillStyle = isDark
        ? `rgba(255, 255, 255, ${dotAlpha})`
        : `rgba(0, 0, 0, ${dotAlpha})`;

      ctx.beginPath();
      ctx.arc(centerX, centerY, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Subtle pulse ring
      if (!reducedMotion) {
        const pulse = (Math.sin(time * 0.002) + 1) * 0.5;
        ctx.strokeStyle = isDark
          ? `rgba(255, 255, 255, ${0.03 + pulse * 0.05})`
          : `rgba(0, 0, 0, ${0.02 + pulse * 0.03})`;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 12 + pulse * 14, 0, Math.PI * 2);
        ctx.stroke();
      }
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
      window.removeEventListener("mousemove", handleMouseMove);
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
        className="h-full w-full opacity-70 transition-opacity duration-1000"
      />
      {/* Subtle radial fade to blend smoothly into page */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_25%,var(--background)_85%)]" />
    </div>
  );
}
