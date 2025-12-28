/**
 * Blog service for real backend API integration.
 *
 * Replaces mockBlogDatabase with real HTTP API calls.
 * Maintains same interface for backward compatibility.
 *
 * Based on backend E2E tests (test_blogs_e2e.py):
 * - GET /blogs - List blogs (public, published by default)
 * - POST /blogs - Create blog (requires auth)
 * - GET /blogs/{id} - Get blog by ID (public for published)
 * - PUT /blogs/{id} - Update blog (requires auth)
 * - DELETE /blogs/{id} - Delete blog (requires auth)
 * - POST /blogs/{id}/publish - Publish blog (requires auth)
 * - POST /blogs/{id}/unpublish - Unpublish blog (requires auth)
 */

import { apiClient } from '@/lib/apiClient';
import {
  BlogPost,
  BlogPostCreate,
  BlogPostUpdate,
  BlogListResponse,
  BlogListParams,
  PublishResponse,
  BlogPostNormalized,
} from '@/types/blog';

/**
 * Normalize blog status to lowercase for frontend consistency.
 */
function normalizeBlogPost(post: BlogPost): BlogPostNormalized {
  return {
    ...post,
    status: post.status.toLowerCase() as "draft" | "published",
  };
}

/**
 * Extract blog list from response (handles both array and object responses).
 */
function extractBlogList(response: BlogListResponse): BlogPost[] {
  if (Array.isArray(response)) {
    return response;
  }
  return response.items || response.blogs || [];
}

class BlogService {
  /**
   * Get all blog posts.
   * GET /blogs
   *
   * Query parameters:
   * - status: "published" | "draft" | "all" (default: "published" for public)
   * - category: Filter by category
   * - tag: Filter by tag
   * - limit: Pagination limit
   * - offset: Pagination offset
   */
  async getAllPosts(params?: BlogListParams): Promise<BlogPostNormalized[]> {
    const response = await apiClient.axios.get<BlogListResponse>('/blogs', {
      params,
    });

    const posts = extractBlogList(response.data);
    return posts.map(normalizeBlogPost);
  }

  /**
   * Get published blog posts only.
   * Convenience method for public-facing blog list.
   */
  async getPublishedPosts(): Promise<BlogPostNormalized[]> {
    return this.getAllPosts({ status: 'published' });
  }

  /**
   * Get draft blog posts only.
   * Owner-only view of unpublished content.
   */
  async getDraftPosts(): Promise<BlogPostNormalized[]> {
    return this.getAllPosts({ status: 'draft' });
  }

  /**
   * Get single blog post by ID.
   * GET /blogs/{id}
   *
   * Returns null if not found (404).
   * Public endpoint but only shows published blogs to non-owners.
   */
  async getPostById(id: string): Promise<BlogPostNormalized | null> {
    try {
      const response = await apiClient.axios.get<BlogPost>(`/blogs/${id}`);
      return normalizeBlogPost(response.data);
    } catch (error: any) {
      if (error.statusCode === 404 || error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Create new blog post.
   * POST /blogs
   *
   * Requires authentication.
   * New posts default to DRAFT status.
   *
   * Returns created blog post with ID and metadata.
   */
  async createPost(data: BlogPostCreate): Promise<BlogPostNormalized> {
    const response = await apiClient.axios.post<BlogPost>('/blogs', data);
    return normalizeBlogPost(response.data);
  }

  /**
   * Update existing blog post.
   * PUT /blogs/{id}
   *
   * Requires authentication.
   * Partial update - only provided fields are updated.
   *
   * Returns null if not found (404).
   */
  async updatePost(id: string, data: BlogPostUpdate): Promise<BlogPostNormalized | null> {
    try {
      const response = await apiClient.axios.put<BlogPost>(`/blogs/${id}`, data);
      return normalizeBlogPost(response.data);
    } catch (error: any) {
      if (error.statusCode === 404 || error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Delete blog post.
   * DELETE /blogs/{id}
   *
   * Requires authentication.
   * Returns true if deleted, false if not found.
   */
  async deletePost(id: string): Promise<boolean> {
    try {
      await apiClient.axios.delete(`/blogs/${id}`);
      return true;
    } catch (error: any) {
      if (error.statusCode === 404 || error.response?.status === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Publish blog post.
   * POST /blogs/{id}/publish
   *
   * Requires authentication.
   * Changes status from DRAFT to PUBLISHED and sets publishedAt date.
   *
   * Returns updated blog post or null if not found.
   */
  async publishPost(id: string): Promise<BlogPostNormalized | null> {
    try {
      const response = await apiClient.axios.post<PublishResponse>(`/blogs/${id}/publish`);
      return normalizeBlogPost(response.data);
    } catch (error: any) {
      if (error.statusCode === 404 || error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Unpublish blog post.
   * POST /blogs/{id}/unpublish
   *
   * Requires authentication.
   * Changes status from PUBLISHED back to DRAFT.
   *
   * Returns updated blog post or null if not found.
   */
  async unpublishPost(id: string): Promise<BlogPostNormalized | null> {
    try {
      const response = await apiClient.axios.post<PublishResponse>(`/blogs/${id}/unpublish`);
      return normalizeBlogPost(response.data);
    } catch (error: any) {
      if (error.statusCode === 404 || error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get all unique categories from blogs.
   *
   * Note: Backend may not have GET /blogs/categories endpoint yet.
   * Falls back to extracting categories from all blogs.
   */
  async getCategories(): Promise<string[]> {
    try {
      // Try backend endpoint first (if implemented)
      const response = await apiClient.axios.get<{ categories: string[] }>('/blogs/categories');
      return response.data.categories;
    } catch (error: any) {
      // Fallback: extract categories from all blogs
      if (error.statusCode === 404 || error.response?.status === 404) {
        const posts = await this.getAllPosts({ status: 'all' });
        return [...new Set(posts.map(p => p.category).filter(Boolean))];
      }
      throw error;
    }
  }
}

export const blogService = new BlogService();
