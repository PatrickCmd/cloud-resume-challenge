import { BlogTab } from "@/components/BlogTab";

export default function BlogPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
      <header className="mb-8 max-w-[72ch]">
        <p className="text-sm font-medium uppercase tracking-wider text-primary">Writing</p>
        <h1 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight text-foreground">All posts</h1>
        <p className="mt-3 text-muted-foreground">Notes on building and running backend and AI systems.</p>
      </header>
      <BlogTab />
    </div>
  );
}
