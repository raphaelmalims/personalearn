# PersonaLearn design system

Monochrome, dark-first. There is no brand hue. Status colors stay, desaturated. Light mode is the second theme.

Signed-in home is the AI Hub. This document is the contract for tokens and primitives. DS-2 (mark) and DS-3 (landing) build on it.

## Tokens

| File | Owns |
| --- | --- |
| `src/styles/tokens/primitives.css` | Neutral ramp `--gray-0` … `--gray-1000`, alpha whites and blacks |
| `src/styles/tokens/semantic.css` | Dark default on `:root` and `.dark`. Light overrides on `.light`. Shadcn names (`--background`, `--primary`, …) alias the semantic tokens |
| `src/styles/tokens/motion.css` | Durations, easings, stagger |
| `src/styles/tokens/canvas.ts` | `themeColor` values (`#fafafa` light, `#0a0a0a` dark) |
| `src/lib/motion.ts` | Motion for React presets. Import these instead of inventing durations |

`src/app/globals.css` imports the CSS tokens and maps them into Tailwind v4 `@theme`.

### Color

- Canvas `#0a0a0a`, surfaces `#111111`, `#171717`, `#1f1f1f`.
- Hairlines `rgb(255 255 255 / 0.08–0.14)`.
- Primary action is inverted: white fill and black text in dark, the reverse in light.
- Focus is a neutral ring.
- Text: `--text-primary`, `--text-secondary` (`#a3a3a3` on the dark canvas), `--text-tertiary` (`#8a8a8a`). Both secondary and tertiary clear WCAG AA on `#0a0a0a`.

### Type

Geist Sans (`--font-body`, also display) and Geist Mono (`--font-mono`) via `next/font`. Utilities: `text-display` (clamp, tight tracking), `text-h1` through `text-h4`, `text-body`, `text-small`, `text-caption`.

### Radius

`xs 6 / sm 8 / md 12 / lg 16 / xl 24 / full`. Buttons, the composer, chips, and segmented controls use `full`. Cards and panels use `lg`. Menus and inputs use `md`.

### Elevation

Hairline borders plus soft shadows. Use `surface-1`, `surface-2`, `surface-3`. Do not add `surface-float` or `hero-glass`.

### Motion

Durations: instant 80, fast 150, base 240, slow 400, slower 700. Easings: `standard`, `emphasized`, `spring-soft`, `spring-snappy`. Stagger step 40ms.

Animate `transform`, `opacity`, and `filter` only. `MotionConfig reducedMotion="user"` swaps press and sheet motion for crossfades. Presets live in `src/lib/motion.ts` (`press`, `pageEnter`, `sheet`, `drawer`, `listItem`).

### Responsive

Product breakpoints (documented here; Tailwind `sm` stays 640px so existing utilities do not shift): `xs 360 / sm 480 / md 768 / lg 1024 / xl 1280 / 2xl 1536`.

- Below `md`, the Hub is a single chat column. The class panel is a left drawer about 88% wide with a scrim. It opens from the top-left icon or an edge swipe. Resource and eval artifacts are full-height sheets. There is no bottom tab bar. Targets are at least 44px.
- `md` to `lg` starts with the class panel collapsed (a rail) until the teacher expands it.
- `lg` and up keeps the IDE split.
- The composer pads with `visualViewport` via `--keyboard-inset`.

## Primitives

`src/components/ui/`: button (`primary`, `secondary`, `ghost`, `outline`, `link`, plus landing `hero` aliases), input, textarea, select, badge, card, dialog, sheet, dropdown, tabs, tooltip, kbd, skeleton, icon.

`Icon` defaults to `strokeWidth={1.5}` and sizes `sm 14 / md 16 / lg 20`. ESLint warns on direct `lucide-react` imports outside `src/components/ui`.

## Adding a token or variant

1. Add the primitive in `primitives.css` if it is a new neutral or alpha.
2. Map it in `semantic.css` for both `:root`/`.dark` and `.light`.
3. Expose it in `@theme inline` inside `globals.css` if components need a Tailwind utility.
4. Use the utility in `src/components/ui`. Do not put raw palette classes or hex in feature files.
5. Show the addition on `/dev/design-system`.

## Guardrail

`npm run check:colors` fails when `src/` contains a Tailwind palette class (`bg-emerald-500`, `text-indigo-950`, …) or a hex color outside `src/styles/tokens/`. `src/components/auth/google-icon.tsx` is the only exception, because those fills are the Google mark. CI runs the check with lint.
