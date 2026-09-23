import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...coreWebVitals,
  ...typescript,
  {
    ignores: [".next/**", "node_modules/**", "out/**", "next-env.d.ts"],
  },
  {
    rules: {
      // Next 16 ships a stricter react-hooks plugin. Existing Hub/eval
      // patterns (ref-in-render, setState-in-effect) stay as-is for this upgrade.
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/components/ui/**"],
    rules: {
      "no-restricted-imports": [
        "warn",
        {
          paths: [
            {
              name: "lucide-react",
              message:
                "Use Icon from @/components/ui/icon in feature code. Direct lucide imports stay inside src/components/ui.",
            },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
