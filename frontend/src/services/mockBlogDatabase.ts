import { BlogPost, blogPosts as initialPosts } from "@/data/blogPosts";

export interface BlogPostDraft extends BlogPost {
  status: "draft" | "published";
  createdAt: string;
  updatedAt: string;
}

// Initialize mock database with existing posts as published
let mockDatabase: BlogPostDraft[] = initialPosts.map((post) => ({
  ...post,
  status: "published" as const,
  createdAt: post.publishedAt,
  updatedAt: post.publishedAt,
}));

// Simulate async database operations
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockBlogDB = {
  async getAllPosts(): Promise<BlogPostDraft[]> {
    await delay(100);
    return [...mockDatabase].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  },

  async getPublishedPosts(): Promise<BlogPostDraft[]> {
    await delay(100);
    return mockDatabase
      .filter((post) => post.status === "published")
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  },

  async getDraftPosts(): Promise<BlogPostDraft[]> {
    await delay(100);
    return mockDatabase
      .filter((post) => post.status === "draft")
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  async getPostById(id: string): Promise<BlogPostDraft | undefined> {
    await delay(50);
    return mockDatabase.find((post) => post.id === id);
  },

  async createPost(
    post: Omit<BlogPost, "id" | "slug" | "publishedAt" | "readTime">
  ): Promise<BlogPostDraft> {
    await delay(200);
    const now = new Date().toISOString();
    const id = `${Date.now()}`;
    const slug = post.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    
    // Estimate read time based on content length
    const words = post.content.split(/\s+/).length;
    const readTime = `${Math.max(1, Math.ceil(words / 200))} min read`;

    const newPost: BlogPostDraft = {
      ...post,
      id,
      slug,
      readTime,
      publishedAt: "",
      status: "draft",
      createdAt: now,
      updatedAt: now,
    };

    mockDatabase.push(newPost);
    return newPost;
  },

  async updatePost(
    id: string,
    updates: Partial<Omit<BlogPost, "id" | "slug">>
  ): Promise<BlogPostDraft | undefined> {
    await delay(200);
    const index = mockDatabase.findIndex((post) => post.id === id);
    if (index === -1) return undefined;

    const now = new Date().toISOString();
    
    // Recalculate read time if content changed
    let readTime = mockDatabase[index].readTime;
    if (updates.content) {
      const words = updates.content.split(/\s+/).length;
      readTime = `${Math.max(1, Math.ceil(words / 200))} min read`;
    }

    mockDatabase[index] = {
      ...mockDatabase[index],
      ...updates,
      readTime,
      updatedAt: now,
    };

    return mockDatabase[index];
  },

  async publishPost(id: string): Promise<BlogPostDraft | undefined> {
    await delay(200);
    const index = mockDatabase.findIndex((post) => post.id === id);
    if (index === -1) return undefined;

    const now = new Date().toISOString().split("T")[0];
    mockDatabase[index] = {
      ...mockDatabase[index],
      status: "published",
      publishedAt: now,
      updatedAt: now,
    };

    return mockDatabase[index];
  },

  async unpublishPost(id: string): Promise<BlogPostDraft | undefined> {
    await delay(200);
    const index = mockDatabase.findIndex((post) => post.id === id);
    if (index === -1) return undefined;

    mockDatabase[index] = {
      ...mockDatabase[index],
      status: "draft",
      updatedAt: new Date().toISOString(),
    };

    return mockDatabase[index];
  },

  async deletePost(id: string): Promise<boolean> {
    await delay(200);
    const index = mockDatabase.findIndex((post) => post.id === id);
    if (index === -1) return false;

    mockDatabase.splice(index, 1);
    return true;
  },

  getCategories(): string[] {
    return [...new Set(mockDatabase.map((post) => post.category))];
  },
};
