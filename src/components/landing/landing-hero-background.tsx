"use client";

import { useEffect, useState } from "react";
import { LandingStaticFrame } from "@/components/landing/landing-static-frame";
import type { LandingScene as LandingSceneComponent } from "@/components/landing/landing-scene";

type SceneComponent = typeof LandingSceneComponent;

/**
 * The animated field loads after first paint. Reduced motion keeps the still frame
 * and never fetches the canvas chunk.
 */
export function LandingHeroBackground() {
  const [reduced, setReduced] = useState(false);
  const [Scene, setScene] = useState<SceneComponent | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reduced) {
      setScene(null);
      setReady(false);
      return;
    }

    let cancelled = false;
    let idleId = 0;
    let timeoutId = 0;
    let raf1 = 0;
    let raf2 = 0;

    const load = () => {
      if (cancelled) return;
      void import("@/components/landing/landing-scene").then((mod) => {
        if (!cancelled) setScene(() => mod.LandingScene);
      });
    };

    const arm = () => {
      if (cancelled) return;
      if (typeof window.requestIdleCallback === "function") {
        idleId = window.requestIdleCallback(load, { timeout: 1600 });
      } else {
        timeoutId = window.setTimeout(load, 280);
      }
    };

    raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(arm);
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
      if (idleId && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
      window.clearTimeout(timeoutId);
    };
  }, [reduced]);

  const showStill = reduced || !ready;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div
        data-hero-frame={reduced ? "reduced" : "still"}
        className={showStill ? "absolute inset-0" : "absolute inset-0 opacity-0"}
      >
        <LandingStaticFrame />
      </div>
      {Scene && !reduced ? (
        <Scene
          onReady={() => {
            setReady(true);
          }}
        />
      ) : null}
    </div>
  );
}
