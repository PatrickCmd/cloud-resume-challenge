import { useState } from "react";
import { ArrowUpRight, ChevronDown, Github, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { SectionHeading } from "@/components/SectionHeading";
import { featuredProjects, type Project } from "@/content/projects";

export function ProjectCard({ project, priority }: { project: Project; priority: boolean }) {
  const titleId = `project-${project.slug}-title`;
  return (
    <article
      aria-labelledby={titleId}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-primary/60 focus-within:border-primary/60"
    >
      <div className="aspect-[2/1] overflow-hidden border-b border-border bg-muted sm:aspect-video">
        <img
          src={project.image}
          alt={project.imageAlt}
          width={1200}
          height={675}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 id={titleId} className="text-lg font-semibold text-foreground">
          {project.caseStudy ? (
            <Link
              to={`/projects/${project.slug}`}
              className="underline-offset-4 hover:underline focus-visible:outline-none focus-visible:underline"
            >
              {project.title}
            </Link>
          ) : (
            project.title
          )}
        </h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{project.problem}</p>
        <ul className="flex flex-wrap gap-1.5" aria-label="Technologies">
          {project.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-md border border-border bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
            >
              {tag}
            </li>
          ))}
        </ul>
        <p className="text-sm leading-relaxed text-foreground">
          <span className="font-medium">Outcome: </span>
          {project.outcome}
        </p>
        <div className="mt-auto flex flex-wrap gap-4 pt-2 text-sm font-medium">
          {project.caseStudy && (
            <Link
              to={`/projects/${project.slug}`}
              className="inline-flex items-center gap-1 text-foreground underline-offset-4 hover:underline"
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              Case study
            </Link>
          )}
          {project.links.live && (
            <a
              href={project.links.live}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-foreground underline-offset-4 hover:underline"
            >
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              Live
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          )}
          {project.links.github && (
            <a
              href={project.links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-foreground underline-offset-4 hover:underline"
            >
              <Github className="h-4 w-4" aria-hidden="true" />
              Code
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

const MOBILE_INITIAL = 3;

export function Projects() {
  const isMobile = useIsMobile();
  const [showAll, setShowAll] = useState(false);
  const visible = isMobile && !showAll ? featuredProjects.slice(0, MOBILE_INITIAL) : featuredProjects;
  const hidden = featuredProjects.length - visible.length;

  return (
    <section id="projects" aria-labelledby="projects-heading" className="scroll-mt-24 py-16 md:py-24 border-t border-border">
      <SectionHeading
        id="projects-heading"
        eyebrow="Projects"
        title="Selected work"
        description="Things I have built or helped build, newest first. Case studies cover the context, architecture, decisions and results."
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {visible.map((project, index) => (
          <ProjectCard key={project.slug} project={project} priority={index < 2} />
        ))}
      </div>
      {hidden > 0 && (
        <div className="mt-6 md:hidden">
          <Button type="button" variant="outline" className="w-full gap-2" onClick={() => setShowAll(true)}>
            Show {hidden} more projects
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      )}
      <p className="mt-8 text-sm text-muted-foreground">
        <Link to="/projects" className="font-medium text-foreground underline-offset-4 hover:underline">
          All projects
        </Link>{" "}
        including older client work.
      </p>
    </section>
  );
}
