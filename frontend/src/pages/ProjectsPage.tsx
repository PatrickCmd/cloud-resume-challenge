import { ArrowUpRight, Building2, FileText, Github } from "lucide-react";
import { Link } from "react-router-dom";
import { ProjectCard } from "@/sections/Projects";
import { useProjects } from "@/hooks/useProjects";
import { allContentProjects, apiProjectsNotInContent } from "@/lib/projects";
import type { ProjectNormalized } from "@/types/project";
import { profile } from "@/content/profile";
import { usePageTitle } from "@/hooks/usePageTitle";

function ApiProjectCard({ project }: { project: ProjectNormalized }) {
  const titleId = `api-project-${project.id}-title`;
  return (
    <article
      aria-labelledby={titleId}
      className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/60 focus-within:border-primary/60"
    >
      <h3 id={titleId} className="text-lg font-semibold text-foreground">
        {project.longDescription ? (
          <Link to={`/projects/p/${project.id}`} className="underline-offset-4 hover:underline">
            {project.name}
          </Link>
        ) : (
          project.name
        )}
      </h3>
      {project.company && (
        <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
          {project.company}
        </p>
      )}
      <p className="text-sm leading-relaxed text-muted-foreground">{project.description}</p>
      {project.tech.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Technologies">
          {project.tech.slice(0, 8).map((tag) => (
            <li key={tag} className="rounded-md border border-border bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
              {tag}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-auto flex flex-wrap gap-4 pt-2 text-sm font-medium">
        {project.longDescription && (
          <Link to={`/projects/p/${project.id}`} className="inline-flex items-center gap-1 text-foreground underline-offset-4 hover:underline">
            <FileText className="h-4 w-4" aria-hidden="true" />
            Details
          </Link>
        )}
        {project.liveUrl && (
          <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-foreground underline-offset-4 hover:underline">
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            Live<span className="sr-only"> (opens in a new tab)</span>
          </a>
        )}
        {project.githubUrl && (
          <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-foreground underline-offset-4 hover:underline">
            <Github className="h-4 w-4" aria-hidden="true" />
            Code<span className="sr-only"> (opens in a new tab)</span>
          </a>
        )}
      </div>
    </article>
  );
}

export default function ProjectsPage() {
  usePageTitle("Projects");
  const { data: apiProjects = [], isLoading } = useProjects({ status: "published" });
  const extras = apiProjectsNotInContent(apiProjects);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
      <header className="mb-8 max-w-[72ch]">
        <p className="text-sm font-medium uppercase tracking-wider text-primary">Projects</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">All projects</h1>
        <p className="mt-3 text-muted-foreground">
          Side projects, client work and platform work, newest first. Case studies cover the context,
          architecture, decisions and results.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {allContentProjects.map((project, index) => (
          <ProjectCard key={project.slug} project={project} priority={index < 3} />
        ))}
      </div>

      <section aria-labelledby="more-projects-heading" className="mt-16" aria-busy={isLoading}>
        <h2 id="more-projects-heading" className="text-xl font-semibold tracking-tight text-foreground">
          More from the portfolio
        </h2>
        <p className="mt-2 max-w-[72ch] text-sm text-muted-foreground">
          Published through the site's content API.
        </p>
        {extras.length > 0 ? (
          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {extras.map((project) => (
              <ApiProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <p className="mt-6 text-sm text-muted-foreground">
            {isLoading ? "Loading…" : "Nothing extra right now."}{" "}
            <a
              href={profile.links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              See all repositories on GitHub
            </a>
            .
          </p>
        )}
      </section>
    </div>
  );
}
