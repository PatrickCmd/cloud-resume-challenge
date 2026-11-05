import { ProjectsTab } from "@/components/ProjectsTab";

export default function ProjectsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
      <header className="mb-8 max-w-[72ch]">
        <p className="text-sm font-medium uppercase tracking-wider text-primary">Projects</p>
        <h1 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight text-foreground">All projects</h1>
        <p className="mt-3 text-muted-foreground">
          Client work and side projects, published from the portfolio API.
        </p>
      </header>
      <ProjectsTab />
    </div>
  );
}
