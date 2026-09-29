import type { Transition } from "motion/react";

/** Seconds. CSS tokens in motion.css are the source of truth, in milliseconds. */
export const duration = {
  instant: 0.08,
  fast: 0.15,
  base: 0.24,
  slow: 0.4,
  slower: 0.7,
} as const;

export const ease = {
  standard: [0.2, 0, 0, 1] as const,
  emphasized: [0.3, 0, 0, 1] as const,
};

export const spring = {
  soft: { type: "spring", stiffness: 220, damping: 28, mass: 0.8 } satisfies Transition,
  snappy: { type: "spring", stiffness: 420, damping: 34, mass: 0.6 } satisfies Transition,
};

/** Matches `--stagger-step` (40ms). */
export const staggerStep = 0.04;

export const pressTransition = spring.snappy;

export const fadeTransition: Transition = {
  duration: duration.fast,
  ease: ease.standard,
};

export const presets = {
  press: {
    whileTap: { scale: 0.98 },
    transition: pressTransition,
  },
  pressReduced: {
    whileTap: { opacity: 0.82 },
    transition: fadeTransition,
  },
  pageEnter: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 4 },
    transition: { duration: duration.base, ease: ease.emphasized },
  },
  pageEnterReduced: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: fadeTransition,
  },
  sheet: {
    initial: { opacity: 0, y: "8%" },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: "6%" },
    transition: spring.soft,
  },
  drawer: {
    initial: { x: "-100%" },
    animate: { x: 0 },
    exit: { x: "-100%" },
    transition: spring.snappy,
  },
  listItem: (index: number) => ({
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: duration.base,
      ease: ease.standard,
      delay: index * staggerStep,
    },
  }),
  crossfade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: fadeTransition,
  },
} as const;
