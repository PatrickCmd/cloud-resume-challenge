import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useBlogPosts } from "@/hooks/useBlogPosts";
import { writingFallback } from "@/content/writing";
import { formatPostDate, formatReadTime } from "@/lib/blog";
import { usePageTitle } from "@/hooks/usePageTitle";

interface ListPost {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  readTime: string | null;
  category?: string;
  tags: string[];
}

function PostRow({ post }: { post: ListPost }) {
  return (
    <li>
      <Link
        to={`/blog/${post.slug}`}
        className="group block rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background md:p-6"
      >
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono text-muted-foreground">
          <time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time>
          {post.readTime && <span>{post.readTime}</span>}
          {post.category && <span className="rounded-md bg-secondary px-2 py-0.5 font-sans text-secondary-foreground">{post.category}</span>}
        </p>
        <h2 className="mt-2 text-lg font-semibold leading-snug text-foreground underline-offset-4 group-hover:underline md:text-xl">
          {post.title}
        </h2>
        <p className="mt-2 max-w-[72ch] text-sm leading-relaxed text-muted-foreground md:text-base">{post.excerpt}</p>
        {post.tags.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Tags">
            {post.tags.slice(0, 6).map((tag) => (
              <li key={tag} className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground">
                {tag}
              </li>
            ))}
          </ul>
        )}
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-foreground">
          Read post
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" />
        </span>
      </Link>
    </li>
  );
}

function SkeletonRow() {
  return (
    <li className="animate-pulse rounded-lg border border-border bg-card p-6 motion-reduce:animate-none" aria-hidden="true">
      <div className="h-3 w-40 rounded bg-secondary" />
      <div className="mt-4 h-5 w-3/4 rounded bg-secondary" />
      <div className="mt-3 h-4 w-full rounded bg-secondary" />
      <div className="mt-2 h-4 w-5/6 rounded bg-secondary" />
    </li>
  );
}

export default function BlogPage() {
  usePageTitle("Writing");
  const { data, isLoading, isError } = useBlogPosts({ status: "published", limit: 50, include_content: false });

  const posts: ListPost[] = (data ?? [])
    .slice()
    .sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""))
    .map((p) => ({
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      publishedAt: p.publishedAt,
      readTime: formatReadTime(p.readTime),
      category: p.category,
      tags: p.tags ?? [],
    }));

  const showFallback = !isLoading && posts.length === 0 && writingFallback.length > 0;
  const list: ListPost[] = showFallback
    ? writingFallback.map((p) => ({ ...p, readTime: formatReadTime(p.readTime) }))
    : posts;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
      <header className="mb-8 max-w-[72ch]">
        <p className="text-sm font-medium uppercase tracking-wider text-primary">Writing</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">All posts</h1>
        <p className="mt-3 text-muted-foreground">Notes on building and running backend and AI systems.</p>
      </header>

      {isError && (
        <p className="mb-6 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground" role="status">
          The blog service could not be reached, so this list may be incomplete.
        </p>
      )}

      <ul className="grid max-w-[80ch] gap-4" aria-busy={isLoading} aria-label="Blog posts">
        {isLoading && [1, 2, 3].map((n) => <SkeletonRow key={n} />)}
        {!isLoading && list.map((post) => <PostRow key={post.slug} post={post} />)}
      </ul>

      {!isLoading && list.length === 0 && (
        <p className="text-muted-foreground">No posts published yet.</p>
      )}
    </div>
  );
}
