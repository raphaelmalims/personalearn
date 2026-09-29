/**
 * Pure state for the landing hero. The canvas renderer is separate so the
 * budget, pause rules, and document cycle can be tested without a GL context.
 */

export type SceneTier = "mobile" | "modest" | "full";

export type SceneBudget = {
  nodes: number;
  documents: number;
  /** Faint links between neighbouring students. Mobile skips these. */
  neighborLinks: boolean;
  dprCap: number;
};

export type DocKind = "scheme" | "paper" | "script";

export type SceneNode = {
  angle: number;
  /** Share of the shorter viewport edge. */
  radius: number;
  phase: number;
  size: number;
};

export type SceneDocument = {
  kind: DocKind;
  /** 0 at the edge, 1 at the mark, then a short spark tail before wrap. */
  progress: number;
  speed: number;
  /** -1..1, picks which edge the document enters from. */
  lane: number;
  /** Student nodes that receive the resolved output. */
  targets: number[];
};

export type SceneState = {
  nodes: SceneNode[];
  documents: SceneDocument[];
  time: number;
};

const DOC_KINDS: DocKind[] = ["scheme", "paper", "script"];

/** Progress past the mark before a document loops. Leaves room for sparks. */
export const DOCUMENT_WRAP = 1.28;

export function resolveSceneTier(input: {
  viewportWidth: number;
  coarsePointer: boolean;
  cores: number;
  deviceMemory: number;
}): SceneTier {
  if (input.coarsePointer || input.viewportWidth < 768) return "mobile";
  const lowCpu = input.cores > 0 && input.cores <= 4;
  const lowMem = input.deviceMemory > 0 && input.deviceMemory <= 4;
  if (lowCpu || lowMem) return "modest";
  return "full";
}

export function sceneBudget(tier: SceneTier): SceneBudget {
  if (tier === "mobile") {
    return { nodes: 12, documents: 3, neighborLinks: false, dprCap: 1.25 };
  }
  if (tier === "modest") {
    return { nodes: 24, documents: 3, neighborLinks: true, dprCap: 1.5 };
  }
  return { nodes: 42, documents: 3, neighborLinks: true, dprCap: 2 };
}

export function shouldRunScene(input: {
  inView: boolean;
  tabVisible: boolean;
  reducedMotion: boolean;
}): boolean {
  return input.inView && input.tabVisible && !input.reducedMotion;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 1831565813) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createSceneState(budget: SceneBudget, seed = 125): SceneState {
  const rand = mulberry32(seed);
  const nodes: SceneNode[] = [];
  for (let i = 0; i < budget.nodes; i += 1) {
    const ring = i % 3;
    nodes.push({
      angle: (i / budget.nodes) * Math.PI * 2 + ring * 0.35,
      radius: 0.34 + ring * 0.12 + rand() * 0.06,
      phase: rand() * Math.PI * 2,
      size: 1.6 + rand() * 1.8,
    });
  }

  const documents: SceneDocument[] = [];
  for (let i = 0; i < budget.documents; i += 1) {
    const targets: number[] = [];
    const span = Math.max(1, Math.floor(budget.nodes / budget.documents));
    for (let k = 0; k < Math.min(3, budget.nodes); k += 1) {
      targets.push((i * span + k * 2) % budget.nodes);
    }
    documents.push({
      kind: DOC_KINDS[i % DOC_KINDS.length],
      progress: (i / budget.documents) * 0.92,
      speed: 0.11 + rand() * 0.03,
      lane: i === 0 ? -0.72 : i === 1 ? 0.78 : 0.05,
      targets,
    });
  }

  return { nodes, documents, time: 0 };
}

export function stepScene(state: SceneState, dt: number) {
  const step = Math.min(0.05, Math.max(0, dt));
  state.time += step;
  for (const doc of state.documents) {
    doc.progress += doc.speed * step;
    if (doc.progress >= DOCUMENT_WRAP) {
      doc.progress -= DOCUMENT_WRAP;
    }
  }
}

export function readSceneEnvironment(): {
  viewportWidth: number;
  coarsePointer: boolean;
  cores: number;
  deviceMemory: number;
} {
  const nav = navigator as Navigator & { deviceMemory?: number };
  return {
    viewportWidth: window.innerWidth,
    coarsePointer: window.matchMedia("(pointer: coarse)").matches,
    cores: navigator.hardwareConcurrency ?? 0,
    deviceMemory: nav.deviceMemory ?? 0,
  };
}
