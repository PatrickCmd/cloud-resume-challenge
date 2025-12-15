import { useState, useEffect } from "react";
import { Calendar, Clock, Tag, ArrowLeft, BookOpen, Search, Plus, Edit2, Trash2, Eye, BarChart3 } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { mockBlogDB, BlogPostDraft } from "@/services/mockBlogDatabase";
import { BlogEditor } from "./BlogEditor";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { mockAnalyticsService } from "@/services/mockAnalyticsService";

type ViewMode = "list" | "view" | "create" | "edit";

interface BlogTabProps {
  triggerCreate?: boolean;
  onCreateHandled?: () => void;
}

export function BlogTab({ triggerCreate, onCreateHandled }: BlogTabProps) {
  const [posts, setPosts] = useState<BlogPostDraft[]>([]);
  const [selectedPost, setSelectedPost] = useState<BlogPostDraft | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [showDrafts, setShowDrafts] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [viewCounts, setViewCounts] = useState<Map<string, number>>(new Map());
  const [currentViewCount, setCurrentViewCount] = useState(0);
  const { toast } = useToast();
  const { isOwner } = useAuth();

  useEffect(() => {
    if (triggerCreate && isOwner) {
      setViewMode("create");
      onCreateHandled?.();
    }
  }, [triggerCreate, isOwner, onCreateHandled]);

  const loadPosts = async () => {
    setIsLoading(true);
    try {
      const [allPosts, views] = await Promise.all([
        mockBlogDB.getAllPosts(),
        mockAnalyticsService.getAllViewStats('blog')
      ]);
      setPosts(allPosts);
      setViewCounts(views);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const trackAndViewPost = async (post: BlogPostDraft) => {
    setSelectedPost(post);
    setViewMode("view");
    const views = await mockAnalyticsService.trackView(post.id, 'blog');
    setCurrentViewCount(views);
    // Update the view counts map
    setViewCounts(prev => new Map(prev).set(post.id, views));
  };

  const categories = [...new Set(posts.map((p) => p.category))];

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = !selectedCategory || post.category === selectedCategory;
    const matchesStatus = showDrafts ? post.status === "draft" : post.status === "published";
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleCreatePost = async (postData: Omit<BlogPostDraft, "id" | "slug" | "publishedAt" | "readTime" | "status" | "createdAt" | "updatedAt">) => {
    const newPost = await mockBlogDB.createPost(postData);
    await loadPosts();
    setSelectedPost(newPost);
    setViewMode("edit");
    toast({
      title: "Draft saved",
      description: "Your article has been saved as a draft.",
    });
  };

  const handleUpdatePost = async (postData: Omit<BlogPostDraft, "id" | "slug" | "publishedAt" | "readTime" | "status" | "createdAt" | "updatedAt">) => {
    if (!selectedPost) return;
    await mockBlogDB.updatePost(selectedPost.id, postData);
    await loadPosts();
    const updated = await mockBlogDB.getPostById(selectedPost.id);
    if (updated) setSelectedPost(updated);
    toast({
      title: "Changes saved",
      description: "Your article has been updated.",
    });
  };

  const handlePublish = async () => {
    if (!selectedPost) return;
    await mockBlogDB.publishPost(selectedPost.id);
    await loadPosts();
    setViewMode("list");
    setSelectedPost(null);
    setShowDrafts(false);
    toast({
      title: "Article published",
      description: "Your article is now visible to everyone.",
    });
  };

  const handleUnpublish = async (post: BlogPostDraft) => {
    await mockBlogDB.unpublishPost(post.id);
    await loadPosts();
    toast({
      title: "Article unpublished",
      description: "Your article has been moved to drafts.",
    });
  };

  const handleDelete = async (post: BlogPostDraft) => {
    if (!confirm("Are you sure you want to delete this article?")) return;
    await mockBlogDB.deletePost(post.id);
    await loadPosts();
    toast({
      title: "Article deleted",
      description: "The article has been permanently removed.",
    });
  };

  // View single post
  if (viewMode === "view" && selectedPost) {
    return (
      <article className="animate-fade-in">
        <button
          onClick={() => {
            setSelectedPost(null);
            setViewMode("list");
          }}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to articles
        </button>

        <header className="mb-8">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
              {selectedPost.category}
            </span>
            {selectedPost.tags.map((tag) => (
              <span key={tag} className="skill-badge">
                {tag}
              </span>
            ))}
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-4">{selectedPost.title}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(selectedPost.publishedAt || selectedPost.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {selectedPost.readTime}
            </span>
            <span className="flex items-center gap-1">
              <BarChart3 className="w-4 h-4" />
              {currentViewCount} views
            </span>
          </div>
        </header>

        <div className="p-6 rounded-lg border border-border bg-card">
          <MarkdownRenderer content={selectedPost.content} />
        </div>
      </article>
    );
  }

  // Create/Edit post
  if (viewMode === "create" || viewMode === "edit") {
    return (
      <BlogEditor
        post={viewMode === "edit" ? selectedPost || undefined : undefined}
        onSave={viewMode === "create" ? handleCreatePost : handleUpdatePost}
        onPublish={viewMode === "edit" && selectedPost?.status === "draft" ? handlePublish : undefined}
        onCancel={() => {
          setViewMode("list");
          setSelectedPost(null);
        }}
        isNew={viewMode === "create"}
      />
    );
  }

  // List view
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-fade-in flex items-start justify-between">
        <div>
          <h2 className="section-title">
            <BookOpen className="w-5 h-5 text-primary" />
            Technical Articles
          </h2>
          <p className="text-muted-foreground">
            Thoughts on Python, AWS, backend development, and lessons learned from building production systems.
          </p>
        </div>
        {isOwner && (
          <Button onClick={() => setViewMode("create")} className="gap-2">
            <Plus className="w-4 h-4" />
            New Article
          </Button>
        )}
      </div>

      {/* Tabs for Published/Drafts - only show drafts tab to owner */}
      {isOwner ? (
        <div className="flex gap-2 border-b border-border pb-2">
          <button
            onClick={() => setShowDrafts(false)}
            className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
              !showDrafts
                ? "text-foreground border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Published ({posts.filter((p) => p.status === "published").length})
          </button>
          <button
            onClick={() => setShowDrafts(true)}
            className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
              showDrafts
                ? "text-foreground border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Drafts ({posts.filter((p) => p.status === "draft").length})
          </button>
        </div>
      ) : null}

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 animate-slide-up">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
              !selectedCategory
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                selectedCategory === category
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Blog Posts Grid */}
      <div className="grid gap-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p>Loading articles...</p>
          </div>
        ) : filteredPosts.length > 0 ? (
          filteredPosts.map((post) => (
            <article
              key={post.id}
              className="p-5 rounded-lg border border-border bg-card hover:border-primary/50 transition-all duration-200 group"
            >
              <div className="flex flex-col md:flex-row md:items-start gap-4">
                <div 
                  className="flex-1 cursor-pointer"
                  onClick={() => trackAndViewPost(post)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded">
                      {post.category}
                    </span>
                    {post.status === "draft" && (
                      <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium rounded">
                        Draft
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {post.readTime}
                    </span>
                    {viewCounts.get(post.id) !== undefined && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <BarChart3 className="w-3 h-3" />
                        {viewCounts.get(post.id)}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
                    {post.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{post.excerpt}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    {post.tags.slice(0, 4).map((tag) => (
                      <span key={tag} className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Tag className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 md:flex-col md:items-end">
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-4 h-4 md:hidden" />
                    {new Date(post.publishedAt || post.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        trackAndViewPost(post);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {isOwner && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPost(post);
                            setViewMode("edit");
                          }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(post);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>{showDrafts ? "No drafts found." : "No published articles found."}</p>
            {showDrafts && (
              <Button onClick={() => setViewMode("create")} variant="outline" className="mt-4">
                Create your first article
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
        <div className="p-4 rounded-lg border border-border bg-card text-center">
          <div className="text-3xl font-bold text-primary">
            {posts.filter((p) => p.status === "published").length}
          </div>
          <div className="text-sm text-muted-foreground">Published</div>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card text-center">
          <div className="text-3xl font-bold text-primary">
            {posts.filter((p) => p.status === "draft").length}
          </div>
          <div className="text-sm text-muted-foreground">Drafts</div>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card text-center">
          <div className="text-3xl font-bold text-primary">{categories.length}</div>
          <div className="text-sm text-muted-foreground">Categories</div>
        </div>
      </div>
    </div>
  );
}
