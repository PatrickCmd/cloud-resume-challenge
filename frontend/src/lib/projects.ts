import type { ProjectNormalized } from "@/types/project";
import { projects as contentProjects, type Project } from "@/content/projects";

/**
 * API projects that duplicate a content project (same live or GitHub URL, or the same
 * title) are dropped so the curated entry wins and nothing shows twice.
 */
export function apiProjectsNotInContent(apiProjects: ProjectNormalized[]): ProjectNormalized[] {
  const norm = (u?: string) => (u ? u.replace(/\/$/, "").toLowerCase() : "");
  const known = new Set<string>();
  for (const p of contentProjects) {
    if (p.links.live) known.add(norm(p.links.live));
    if (p.links.github) known.add(norm(p.links.github));
    known.add(p.title.toLowerCase());
  }
  return apiProjects.filter(
    (p) =>
      !known.has(norm(p.liveUrl)) &&
      !known.has(norm(p.githubUrl)) &&
      !known.has(p.name.toLowerCase()) &&
      !p.name.toLowerCase().startsWith("cloud resume challenge"),
  );
}

export const allContentProjects: Project[] = contentProjects;
