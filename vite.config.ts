// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // keep your existing TanStack settings here if needed
  },
  plugins: [
    {
      name: "capacitor-dist-output",
      apply: "build",
      buildApp: {
        order: "post",
        async handler() {
          const fs = await import("node:fs/promises");
          const path = await import("node:path");
          const { pathToFileURL } = await import("node:url");
          const root = process.cwd();
          const publicOut = path.join(root, ".output", "public");
          const distDir = path.join(root, "dist");
          const ssrEntry = path.join(root, ".output", "server", "_ssr", "ssr.mjs");

          try {
            await fs.access(publicOut);
          } catch {
            return;
          }

          await fs.rm(distDir, { recursive: true, force: true });
          await fs.cp(publicOut, distDir, { recursive: true });

          try {
            const ssrMod = await import(pathToFileURL(ssrEntry).href);
            const ssrHandler = ssrMod.default || ssrMod;
            if (ssrHandler && typeof ssrHandler.fetch === "function") {
              const routes = [
                "/",
                "/app",
                "/app/dashboard",
                "/app/navigation",
                "/app/police",
                "/app/hospital",
                "/app/corridor",
                "/app/map",
                "/app/alerts",
                "/app/analytics",
                "/app/history",
                "/app/settings",
              ];
              for (const routePath of routes) {
                const res = await ssrHandler.fetch(new Request(`http://localhost${routePath}`));
                if (res.ok) {
                  const html = await res.text();
                  if (routePath === "/") {
                    await fs.writeFile(path.join(distDir, "index.html"), html, "utf8");
                  } else {
                    const subDir = path.join(distDir, routePath.slice(1));
                    await fs.mkdir(subDir, { recursive: true });
                    await fs.writeFile(path.join(subDir, "index.html"), html, "utf8");
                  }
                }
              }
            }
          } catch (err) {
            console.warn("[capacitor-dist-output] Could not prerender routes:", err);
          }
        },
      },
    },
  ],
  vite: {
    server: {
      host: "localhost",
      port: 8080,
    },
  },
});
