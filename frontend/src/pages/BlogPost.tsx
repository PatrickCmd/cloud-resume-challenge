import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { useBlogPost, useBlogPosts } from "@/hooks/useBlogPosts";
import { profile } from "@/content/profile";
import { formatPostDate, formatReadTime } from "@/lib/blog";

function stripLeadingTitle(content: string, title: string): string {
  const lines = content.split("\n");
  const first = lines.findIndex((l) => l.trim() !== "");
  if (first >= 0 && /^#\s+/.test(lines[first]) && lines[first].replace(/^#\s+/, "").trim() === title.trim()) {
    return lines.slice(first + 1).join("\n");
  }
  return content;
}

/**
 * Resolves a post by its slug. The API lists posts by slug but serves a single post by id,
 * so the page first finds the id in the (cached) list, then fetches the full post when the
 * list entry carries no content.
 */
export default function BlogPost() {
  const { slug = "" } = useParams();
  const list = useBlogPosts({ status: "published", limit: 50 });
  const summary = (list.data ?? []).find((p) => p.slug === slug);
  const needsDetail = !!summary && !summary.content;
  const detail = useBlogPost(summary?.id ?? "", needsDetail);
  const post = needsDetail ? detail.data : summary;
  const isLoading = list.isLoading || (needsDetail && detail.isLoading);
  const isError = list.isError || detail.isError;
  const readTime = formatReadTime(post?.readTime);
  // Posts often start with a "# Title" line that duplicates the page heading; drop it.
  const body = post ? stripLeadingTitle(post.content, post.title) : "";

  useEffect(() => {
    if (post) document.title = `${post.title} — ${profile.name}`;
    return () => {
      document.title = `${profile.name} — ${profile.title}`;
    };
  }, [post]);

  return (
    <article className="mx-auto max-w-6xl px-4 py-12 md:py-16" aria-busy={isLoading}>
      <Link
        to="/blog"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        All posts
      </Link>

      {isLoading && (
        <p className="mt-8 text-muted-foreground" role="status">
          Loading post…
        </p>
      )}

      {!isLoading && !post && (
        <div className="mt-8 max-w-[72ch]">
          <h1 className="text-2xl font-bold text-foreground">Post not found</h1>
          <p className="mt-2 text-muted-foreground">
            {isError
              ? "The blog service could not be reached. Please try again in a moment."
              : "This post may have been unpublished or the link is out of date."}
          </p>
        </div>
      )}

      {!isLoading && post && (
        <>
          <header className="mt-6 max-w-[72ch]">
            {post.category && (
              <p className="text-sm font-medium uppercase tracking-wider text-primary">{post.category}</p>
            )}
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">{post.title}</h1>
            <p className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-4 w-4" aria-hidden="true" />
                <time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time>
              </span>
              {readTime && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-4 w-4" aria-hidden="true" />
                  {readTime}
                </span>
              )}
            </p>
            {post.tags?.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Tags">
                {post.tags.map((tag) => (
                  <li key={tag} className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground">
                    {tag}
                  </li>
                ))}
              </ul>
            )}
          </header>
          <div className="mt-10 max-w-[72ch]">
            <MarkdownRenderer content={body} />
          </div>
        </>
      )}
    </article>
  );
}
