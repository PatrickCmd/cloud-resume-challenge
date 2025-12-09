import { useState, useRef } from "react";
import { ArrowLeft, Eye, EyeOff, Save, Send, Loader2, ImagePlus } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { BlogPostDraft } from "@/services/mockBlogDatabase";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { useToast } from "@/hooks/use-toast";

interface BlogEditorProps {
  post?: BlogPostDraft;
  onSave: (post: Omit<BlogPostDraft, "id" | "slug" | "publishedAt" | "readTime" | "status" | "createdAt" | "updatedAt">) => Promise<void>;
  onPublish?: () => Promise<void>;
  onCancel: () => void;
  isNew?: boolean;
}

const CATEGORIES = ["Backend", "Cloud", "DevOps", "Data Engineering", "Python", "JavaScript"];

export function BlogEditor({ post, onSave, onPublish, onCancel, isNew = false }: BlogEditorProps) {
  const [title, setTitle] = useState(post?.title || "");
  const [excerpt, setExcerpt] = useState(post?.excerpt || "");
  const [content, setContent] = useState(post?.content || "");
  const [category, setCategory] = useState(post?.category || CATEGORIES[0]);
  const [tagsInput, setTagsInput] = useState(post?.tags.join(", ") || "");
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (PNG, JPG, GIF, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const altText = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
        const imageMarkdown = `![${altText}](${base64})`;

        // Insert at cursor position or at the end
        const textarea = textareaRef.current;
        if (textarea) {
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const newContent =
            content.substring(0, start) +
            "\n" + imageMarkdown + "\n" +
            content.substring(end);
          setContent(newContent);

          // Move cursor after the inserted image
          setTimeout(() => {
            textarea.focus();
            const newPosition = start + imageMarkdown.length + 2;
            textarea.setSelectionRange(newPosition, newPosition);
          }, 0);
        } else {
          setContent((prev) => prev + "\n" + imageMarkdown + "\n");
        }

        toast({
          title: "Image added",
          description: "The image has been embedded in your article",
        });
        setIsUploading(false);
      };

      reader.onerror = () => {
        toast({
          title: "Upload failed",
          description: "Failed to read the image file",
          variant: "destructive",
        });
        setIsUploading(false);
      };

      reader.readAsDataURL(file);
    } catch {
      toast({
        title: "Upload failed",
        description: "An error occurred while uploading the image",
        variant: "destructive",
      });
      setIsUploading(false);
    }

    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return;
    
    setIsSaving(true);
    try {
      await onSave({
        title: title.trim(),
        excerpt: excerpt.trim() || title.trim(),
        content: content.trim(),
        category,
        tags: tagsInput.split(",").map((t) => t.trim()).filter(Boolean),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!onPublish) return;
    
    setIsPublishing(true);
    try {
      await handleSave();
      await onPublish();
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to articles
        </button>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || showPreview}
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <ImagePlus className="w-4 h-4 mr-2" />
            )}
            Add Image
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? (
              <>
                <EyeOff className="w-4 h-4 mr-2" />
                Edit
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={!title.trim() || !content.trim() || isSaving}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Draft
          </Button>
          {!isNew && post?.status === "draft" && onPublish && (
            <Button
              size="sm"
              onClick={handlePublish}
              disabled={!title.trim() || !content.trim() || isPublishing}
            >
              {isPublishing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Publish
            </Button>
          )}
        </div>
      </div>

      {showPreview ? (
        /* Preview Mode */
        <div className="p-6 rounded-lg border border-border bg-card">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
              {category}
            </span>
            {tagsInput.split(",").map((tag) => tag.trim()).filter(Boolean).map((tag) => (
              <span key={tag} className="skill-badge">
                {tag}
              </span>
            ))}
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-4">
            {title || "Untitled Post"}
          </h1>
          <p className="text-muted-foreground mb-6">{excerpt}</p>
          <MarkdownRenderer content={content} />
        </div>
      ) : (
        /* Edit Mode */
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Title
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter article title..."
              className="text-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Excerpt
            </label>
            <Input
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Brief description of the article..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Tags (comma-separated)
              </label>
              <Input
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Python, FastAPI, Backend"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Content (Markdown supported - use ![alt](url) for images)
            </label>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your article content here...&#10;&#10;Use markdown syntax:&#10;# Heading 1&#10;## Heading 2&#10;- List items&#10;```code blocks```"
              className="w-full min-h-[400px] px-3 py-2 rounded-md border border-input bg-background text-foreground font-mono text-sm resize-y"
            />
          </div>
        </div>
      )}

      {/* Draft indicator */}
      {post?.status === "draft" && (
        <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          This article is a draft and won't be visible to others until published.
        </div>
      )}
    </div>
  );
}
