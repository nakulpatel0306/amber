/// <reference types="vitest/config" />
import { copyFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages has no SPA rewrites; serving index.html as 404.html lets deep
// links like /amber/app/dashboard boot the app and route client-side.
function spaFallback(): Plugin {
  return {
    name: "spa-fallback",
    apply: "build",
    closeBundle() {
      const dist = (file: string) => fileURLToPath(new URL(`./dist/${file}`, import.meta.url));
      copyFileSync(dist("index.html"), dist("404.html"));
    },
  };
}

// `--mode demo` is the GitHub Pages build: in-browser data (VITE_DEMO=1),
// served from https://nakulpatel0306.github.io/amber/.
export default defineConfig(({ mode }) => {
  const demo = mode === "demo";
  return {
    base: demo ? "/amber/" : "/",
    plugins: [react(), ...(demo ? [spaFallback()] : [])],
    define: demo ? { "import.meta.env.VITE_DEMO": JSON.stringify("1") } : {},
    server: {
      port: 5173,
      strictPort: false,
    },
    build: {
      outDir: "dist",
      sourcemap: false,
    },
    test: {
      environment: "jsdom",
    },
  };
});
