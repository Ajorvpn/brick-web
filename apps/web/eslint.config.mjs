import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    /*
     * three.js is an imperative library. Every scene component builds its
     * objects once (useMemo / useLayoutEffect) and then writes transforms,
     * instance matrices and shader uniforms on them once per frame inside
     * useFrame — that is the documented react-three-fiber pattern, not a
     * render-phase side effect. React Compiler's immutability rule cannot see
     * the boundary between "created in render" and "mutated per frame", so
     * it is off for this folder only. Everything else — hooks rules included
     * — stays on.
     */
    files: ["src/components/three/**/*.{ts,tsx}"],
    rules: { "react-hooks/immutability": "off" },
  },
]);

export default eslintConfig;
