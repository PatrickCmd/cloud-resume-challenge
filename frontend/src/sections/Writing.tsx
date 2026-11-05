import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { SectionHeading } from "@/components/SectionHeading";
import { useBlogPosts } from "@/hooks/useBlogPosts";
import { writingFallback, type WritingEntry } from "@/content/writing";

const LIMIT = 3;

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function PostCard({ post }: { post: WritingEntry }) {
  const external = Boolean(post.url);
  const inner = (
    <>
      <p className="text-xs font-mono text-muted-foreground">
        <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
        {post.readTime ? ` · ${post.readTime}` : ""}
      </p>
      <h3 className="mt-2 text-base font-semibold leading-snug text-foreground group-hover:underline underline-offset-4">
        {post.title}
      </h3>
      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>
      {post.tags.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Tags">
          {post.tags.slice(0, 4).map((tag) => (
            <li key={tag} className="rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
              {tag}
            </li>
          ))}
        </ul>
      )}
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-foreground">
        Read post
        {external ? (
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        ) : (
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        )}
      </span>
    </>
  );
  const className =
    "group flex h-full flex-col rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";
  return external ? (
    <a href={post.url} target="_blank" rel="noopener noreferrer" className={className}>
      {inner}
    </a>
  ) : (
    <Link to={`/blog/${post.slug}`} className={className}>
      {inner}
    </Link>
  );
}

export function Writing() {
  const { data, isError, isLoading } = useBlogPosts({ status: "published" });

  const fromApi: WritingEntry[] = (data ?? [])
    .slice()
    .sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""))
    .slice(0, LIMIT)
    .map((p) => ({
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      publishedAt: p.publishedAt,
      readTime: p.readTime,
      tags: p.tags ?? [],
    }));

  const posts = fromApi.length > 0 ? fromApi : writingFallback.slice(0, LIMIT);
  const showingFallback = fromApi.length === 0 && !isLoading;

  return (
    <section id="writing" aria-labelledby="writing-heading" className="scroll-mt-24 py-16 md:py-24 border-t border-border">
      <SectionHeading
        id="writing-heading"
        eyebrow="Writing"
        title="Latest posts"
        description="Notes on building and running backend and AI systems."
      />
      <div className="grid gap-6 md:grid-cols-3" aria-busy={isLoading}>
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
      <p className="mt-8 text-sm text-muted-foreground">
        <Link to="/blog" className="font-medium text-foreground underline-offset-4 hover:underline">
          All posts
        </Link>
        {showingFallback && isError && <span className="sr-only"> (showing cached list)</span>}
      </p>
    </section>
  );
}
