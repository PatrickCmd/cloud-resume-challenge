import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, Building2, Github } from "lucide-react";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { useProject } from "@/hooks/useProjects";
import { usePageTitle } from "@/hooks/usePageTitle";

/** Detail page for a project published through the content API (not a curated case study). */
export default function ApiProject() {
  const { id = "" } = useParams();
  const { data: project, isLoading, isError } = useProject(id);

  usePageTitle(project ? project.name : null);

  return (
    <article className="mx-auto max-w-6xl px-4 py-12 md:py-16" aria-busy={isLoading}>
      <Link to="/projects" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        All projects
      </Link>

      {isLoading && (
        <p className="mt-8 text-muted-foreground" role="status">
          Loading project…
        </p>
      )}

      {!isLoading && !project && (
        <div className="mt-8 max-w-[72ch]">
          <h1 className="text-2xl font-bold text-foreground">Project not found</h1>
          <p className="mt-2 text-muted-foreground">
            {isError ? "The content service could not be reached." : "This project may have been unpublished."}
          </p>
        </div>
      )}

      {!isLoading && project && (
        <>
          <header className="mt-6 max-w-[72ch]">
            {project.company && (
              <p className="inline-flex items-center gap-1.5 text-sm font-medium uppercase tracking-wider text-primary">
                <Building2 className="h-4 w-4" aria-hidden="true" />
                {project.company}
              </p>
            )}
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">{project.name}</h1>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{project.description}</p>
            <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Technologies">
              {project.tech.map((tag) => (
                <li key={tag} className="rounded-md border border-border bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                  {tag}
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-wrap gap-4 text-sm font-medium">
              {project.liveUrl && (
                <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-foreground underline-offset-4 hover:underline">
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  Live site
                </a>
              )}
              {project.githubUrl && (
                <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-foreground underline-offset-4 hover:underline">
                  <Github className="h-4 w-4" aria-hidden="true" />
                  Source code
                </a>
              )}
            </div>
          </header>
          {project.imageUrl && (
            <img src={project.imageUrl} alt="" width={1200} height={675} className="mt-10 w-full rounded-lg border border-border" />
          )}
          {project.longDescription && (
            <div className="mt-10 max-w-[72ch]">
              <MarkdownRenderer content={project.longDescription} />
            </div>
          )}
        </>
      )}
    </article>
  );
}
