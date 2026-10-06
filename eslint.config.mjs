import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import boundaries from "eslint-plugin-boundaries";

// Architecture rules from CLAUDE.md §1 (layers), §2 (no Server Actions),
// §7 (no stray console output), §8 (no hard-coded colors).
// If one of these fires, fix the code, don't loosen the rule. Rule changes need an ADR.

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // ── §1 Layers ────────────────────────────────────────────────────────────
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { boundaries },
    settings: {
      "import/resolver": { typescript: { alwaysTryTypes: true, project: "./tsconfig.json" } },
      "boundaries/include": ["src/**/*"],
      "boundaries/elements": [
        { type: "feature", pattern: "src/features/*", partialMatch: false, capture: ["feature"] },
        { type: "server-db", pattern: "src/server/db", partialMatch: false },
        { type: "server-jobs", pattern: "src/server/jobs", partialMatch: false },
        { type: "server", pattern: "src/server", partialMatch: false },
        { type: "app", pattern: "src/app", partialMatch: false },
        { type: "components-ui", pattern: "src/components/ui", partialMatch: false },
        { type: "components-lms", pattern: "src/components/lms", partialMatch: false },
        { type: "lib", pattern: "src/lib", partialMatch: false },
      ],
      "boundaries/files": [
        { category: "entry", pattern: "src/features/*/index.ts" },
        { category: "repo", pattern: "src/features/*/repo.ts" },
        { category: "client-ui", pattern: "src/features/*/ui/**" },
        // The only non-repo files allowed to touch server/db (documented in CLAUDE.md §1):
        { category: "db-adapter", pattern: "src/server/auth.ts" },
        { category: "env", pattern: "src/server/env.ts" },
      ],
    },
    rules: {
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          message:
            "Layer violation (CLAUDE.md §1): '{{from.element.type}}' may not import '{{to.element.type}}'. See docs/architecture.md#layers.",
          policies: [
            // Anything may import within its own element (e.g. service.ts → repo.ts in one feature).
            { allow: { dependency: { relationship: { to: "internal" } } } },

            // Pages/routes: other features only through their index.ts; never server/db.
            { from: { element: { type: "app" } },
              allow: { to: [
                { element: { type: "feature" }, file: { categories: "entry" } },
                { element: { type: ["app", "server", "components-ui", "components-lms", "lib"] } },
              ] } },

            // Features: other features only through index.ts.
            { from: { element: { type: "feature" } },
              allow: { to: [
                { element: { type: "feature" }, file: { categories: "entry" } },
                { element: { type: ["server", "components-ui", "components-lms", "lib"] } },
              ] } },

            // Only a feature's repo.ts may touch the database.
            { from: { element: { type: "feature" }, file: { categories: "repo" } },
              allow: { to: { element: { type: "server-db" } } } },

            // Background jobs call services like pages do: features only through index.ts, never the DB.
            { from: { element: { type: "server-jobs" } },
              allow: { to: [
                { element: { type: "feature" }, file: { categories: "entry" } },
                { element: { type: ["server", "lib"] } },
              ] } },

            // Shared infrastructure. Only the Better Auth adapter may reach the DB.
            { from: { element: { type: "server" } },
              allow: { to: { element: { type: "lib" } } } },
            { from: { element: { type: "server" }, file: { categories: "db-adapter" } },
              allow: { to: { element: { type: "server-db" } } } },
            { from: { element: { type: "server-db" } },
              allow: { to: [
                { element: { type: "lib" } },
                { element: { type: "server" }, file: { categories: "env" } },
              ] } },
            { from: { element: { type: "components-lms" } },
              allow: { to: { element: { type: ["components-ui", "lib"] } } } },
            { from: { element: { type: "components-ui" } },
              allow: { to: { element: { type: "lib" } } } },

            // Feature UI components are display-only: no server code (§1). Must stay LAST so it wins.
            { from: { element: { type: "feature" }, file: { categories: "client-ui" } },
              disallow: { to: [
                { element: { type: ["server", "server-db", "server-jobs"] } },
                { element: { type: "feature" }, file: { categories: "repo" } },
              ] } },
          ],
        },
      ],
      "import/no-cycle": ["error", { maxDepth: 10 }],
    },
  },

  // Feature UI is display-only: block same-feature data/logic imports that the boundaries rule treats as "internal".
  {
    files: ["src/features/*/ui/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [
        { group: ["**/repo", "**/service", "**/policy", "@/server/*"],
          message: "Feature UI components are display-only (CLAUDE.md §1): pass data in as props from the page." },
      ] }],
    },
  },

  // Files directly in src/ (proxy.ts, instrumentation.ts…) belong to no layer: keep them away from data.
  {
    files: ["src/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [
        { group: ["@/server/db", "@/server/db/*", "@/features/*/repo", "@/features/*/service"],
          message: "Root files may not reach data (CLAUDE.md §1)." },
      ] }],
    },
  },

  // ── §2 No Server Actions · §7 no console · §8 no hard-coded colors/fonts ──
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-console": ["error", { allow: ["warn", "error"] }],
      "no-restricted-syntax": [
        "error",
        {
          selector: "ExpressionStatement[directive='use server']",
          message: "No Server Actions (CLAUDE.md §2). Writes go through REST /api/v1.",
        },
        {
          selector: "Literal[value=/-\\[(#|rgb|hsl|oklch|color:)/], TemplateElement[value.raw=/-\\[(#|rgb|hsl|oklch|color:)/]",
          message: "No hard-coded colors (CLAUDE.md §8). Use design tokens (bg-primary, text-muted-foreground…).",
        },
        {
          selector: "Literal[value=/(^|\\s)font-\\[/], TemplateElement[value.raw=/(^|\\s)font-\\[/]",
          message: "No hard-coded fonts (CLAUDE.md §8). Use the font-sans / font-heading tokens.",
        },
        {
          selector: "JSXAttribute[name.name='style'] Property[key.name=/^(color|background|backgroundColor|borderColor|fill|stroke|fontFamily)$/], JSXAttribute[name.name='style'] Property[key.value=/^(color|background|backgroundColor|borderColor|fill|stroke|fontFamily)$/]",
          message: "No inline colors or fonts (CLAUDE.md §8). Use design tokens.",
        },
      ],
    },
  },

  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", ".agents/**", ".claude/**", "drizzle/**"]),
]);

export default eslintConfig;
