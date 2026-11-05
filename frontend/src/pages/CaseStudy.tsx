import { useEffect } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, Github } from "lucide-react";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { findProject } from "@/content/projects";
import { getCaseStudy } from "@/content/case-studies";
import { profile } from "@/content/profile";

export default function CaseStudy() {
  const { slug = "" } = useParams();
  const project = findProject(slug);
  const markdown = getCaseStudy(slug);

  useEffect(() => {
    if (project) document.title = `${project.title} — ${profile.name}`;
    return () => {
      document.title = `${profile.name} — ${profile.title}`;
    };
  }, [project]);

  if (!project || !markdown) {
    return <Navigate to="/404" replace />;
  }

  return (
    <article className="mx-auto max-w-6xl px-4 py-12 md:py-16" aria-labelledby="case-study-title">
      <Link
        to="/#projects"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to projects
      </Link>

      <header className="mt-6 max-w-[72ch]">
        <p className="text-sm font-medium uppercase tracking-wider text-primary">Case study · {project.year}</p>
        <h1 id="case-study-title" className="mt-2 text-3xl md:text-4xl font-bold tracking-tight text-foreground">
          {project.title}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{project.problem}</p>
        <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Technologies">
          {project.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-md border border-border bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
            >
              {tag}
            </li>
          ))}
        </ul>
        <div className="mt-5 flex flex-wrap gap-4 text-sm font-medium">
          {project.links.live && (
            <a href={project.links.live} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-foreground underline-offset-4 hover:underline">
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              Live site
            </a>
          )}
          {project.links.github && (
            <a href={project.links.github} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-foreground underline-offset-4 hover:underline">
              <Github className="h-4 w-4" aria-hidden="true" />
              Source code
            </a>
          )}
        </div>
      </header>

      <img
        src={project.image}
        alt={project.imageAlt}
        width={1200}
        height={675}
        className="mt-10 w-full rounded-lg border border-border"
      />

      <div className="mt-10 max-w-[72ch]">
        <MarkdownRenderer content={markdown} />
      </div>
    </article>
  );
}
