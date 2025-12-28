/**
 * Blog post type definitions for API integration.
 *
 * Based on backend E2E tests (test_blogs_e2e.py) and OpenAPI spec.
 */

// ============================================================================
// Blog Post Types
// ============================================================================

/**
 * Blog post status.
 * Backend uses uppercase (DRAFT, PUBLISHED).
 */
export type BlogStatus = "draft" | "published" | "DRAFT" | "PUBLISHED";

/**
 * Complete blog post from backend.
 * GET /blogs/{id}
 * POST /blogs (response)
 * PUT /blogs/{id} (response)
 */
export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  readTime: string;
  publishedAt: string; // ISO date string or empty for drafts
  tags: string[];
  status: BlogStatus;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

/**
 * Blog post creation payload.
 * POST /blogs
 *
 * Based on backend test_create_blog_success:
 * - title, content, excerpt are required
 * - category, tags are optional
 * - status defaults to DRAFT
 */
export interface BlogPostCreate {
  title: string;
  content: string;
  excerpt: string;
  category?: string;
  tags?: string[];
}

/**
 * Blog post update payload.
 * PUT /blogs/{id}
 *
 * All fields are optional - partial update.
 */
export interface BlogPostUpdate {
  title?: string;
  content?: string;
  excerpt?: string;
  category?: string;
  tags?: string[];
}

/**
 * Blog list response from backend.
 * GET /blogs
 *
 * Can be either:
 * - Simple array: BlogPost[]
 * - Paginated object: { items: BlogPost[], total: number, ... }
 */
export type BlogListResponse = BlogPost[] | {
  items?: BlogPost[];
  blogs?: BlogPost[];
  total?: number;
  limit?: number;
  offset?: number;
};

/**
 * Blog list query parameters.
 * GET /blogs?status=published&category=Backend&limit=10
 */
export interface BlogListParams {
  status?: "published" | "draft" | "PUBLISHED" | "DRAFT" | "all";
  category?: string;
  tag?: string;
  limit?: number;
  offset?: number;
}

/**
 * Publish/unpublish response.
 * POST /blogs/{id}/publish
 * POST /blogs/{id}/unpublish
 *
 * Returns updated blog post.
 */
export type PublishResponse = BlogPost;

/**
 * Delete response.
 * DELETE /blogs/{id}
 *
 * Returns 204 No Content or { message: string }
 */
export interface DeleteResponse {
  message?: string;
  success?: boolean;
}

// ============================================================================
// Helper Types
// ============================================================================

/**
 * Blog categories response.
 * GET /blogs/categories (if endpoint exists)
 */
export interface CategoriesResponse {
  categories: string[];
}

/**
 * Normalized blog post for frontend use.
 * Ensures consistent status format.
 */
export interface BlogPostNormalized extends Omit<BlogPost, 'status'> {
  status: "draft" | "published";
}
