import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { useBlogPosts } from "@/hooks/useBlogPosts";
import { profile } from "@/content/profile";

export default function BlogPost() {
  const { slug = "" } = useParams();
  const { data: posts = [], isLoading, isError } = useBlogPosts({ status: "published" });
  const post = posts.find((p) => p.slug === slug);

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

      {isLoading && <p className="mt-8 text-muted-foreground">Loading post…</p>}

      {!isLoading && !post && (
        <div className="mt-8 max-w-[72ch]">
          <h1 className="text-2xl font-bold text-foreground">Post not found</h1>
          <p className="mt-2 text-muted-foreground">
            {isError
              ? "The blog API could not be reached. Please try again in a moment."
              : "This post may have been unpublished or the link is out of date."}
          </p>
        </div>
      )}

      {post && (
        <>
          <header className="mt-6 max-w-[72ch]">
            {post.category && (
              <p className="text-sm font-medium uppercase tracking-wider text-primary">{post.category}</p>
            )}
            <h1 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight text-foreground">{post.title}</h1>
            <p className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-4 w-4" aria-hidden="true" />
                <time dateTime={post.publishedAt}>{post.publishedAt?.slice(0, 10)}</time>
              </span>
              {post.readTime && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-4 w-4" aria-hidden="true" />
                  {post.readTime}
                </span>
              )}
            </p>
          </header>
          <div className="mt-10 max-w-[72ch]">
            <MarkdownRenderer content={post.content} />
          </div>
        </>
      )}
    </article>
  );
}
