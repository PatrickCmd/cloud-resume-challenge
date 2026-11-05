/**
 * Case-study markdown keyed by project slug. Files are bundled as raw strings at build
 * time, so adding a markdown file next to this one is enough to make it available.
 */
const modules = import.meta.glob<string>("./*.md", { query: "?raw", import: "default", eager: true });

export const caseStudies: Record<string, string> = Object.fromEntries(
  Object.entries(modules).map(([path, content]) => [path.replace(/^\.\//, "").replace(/\.md$/, ""), content]),
);

export function getCaseStudy(slug: string): string | undefined {
  return caseStudies[slug];
}
