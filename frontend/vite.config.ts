import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { writeFileSync, mkdirSync } from "fs";
import { projects } from "./src/content/projects";
import { profile } from "./src/content/profile";

/**
 * Writes dist/sitemap.xml from the routes the site serves. Case-study routes come
 * straight from src/content/projects.ts so the sitemap never drifts from the content.
 */
function sitemapPlugin(): Plugin {
  let outDir = "dist";
  return {
    name: "portfolio-sitemap",
    apply: "build",
    configResolved(config) {
      outDir = config.build.outDir;
    },
    closeBundle() {
      const base = profile.siteUrl.replace(/\/$/, "");
      const today = new Date().toISOString().slice(0, 10);
      const routes: { path: string; priority: string }[] = [
        { path: "/", priority: "1.0" },
        { path: "/projects", priority: "0.7" },
        { path: "/blog", priority: "0.6" },
        ...projects
          .filter((p) => p.caseStudy)
          .map((p) => ({ path: `/projects/${p.slug}`, priority: "0.8" })),
      ];
      const xml =
        `<?xml version="1.0" encoding="UTF-8"?>\n` +
        `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
        routes
          .map(
            (r) =>
              `  <url><loc>${base}${r.path}</loc><lastmod>${today}</lastmod><priority>${r.priority}</priority></url>`,
          )
          .join("\n") +
        `\n</urlset>\n`;
      mkdirSync(outDir, { recursive: true });
      writeFileSync(path.join(outDir, "sitemap.xml"), xml);
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 5173,
  },
  plugins: [react(), sitemapPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
