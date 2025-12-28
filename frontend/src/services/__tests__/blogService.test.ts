/**
 * Integration tests for blogService.
 *
 * Tests blog CRUD operations with mocked API client.
 * Mirrors backend E2E tests (test_blogs_e2e.py) structure.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { blogService } from '../blogService';
import { BlogPost, BlogPostCreate, BlogPostUpdate } from '@/types/blog';
import type { AxiosResponse } from 'axios';

// Mock the apiClient module
vi.mock('@/lib/apiClient', () => {
  const mockAxiosInstance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  };

  return {
    apiClient: {
      axios: mockAxiosInstance,
    },
  };
});

// Get the mocked apiClient
import { apiClient } from '@/lib/apiClient';
const mockedApiClient = vi.mocked(apiClient);

// Test data
const mockBlogPost: BlogPost = {
  id: 'test-blog-123',
  slug: 'test-blog-post',
  title: 'Test Blog Post',
  excerpt: 'This is a test blog post',
  content: '# Test Content\n\nThis is test content.',
  category: 'Backend',
  readTime: '5 min read',
  publishedAt: '2025-01-15',
  tags: ['python', 'fastapi', 'testing'],
  status: 'PUBLISHED',
  createdAt: '2025-01-15T10:00:00Z',
  updatedAt: '2025-01-15T10:00:00Z',
};

const mockDraftPost: BlogPost = {
  ...mockBlogPost,
  id: 'draft-blog-456',
  status: 'DRAFT',
  publishedAt: '',
};

describe('blogService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllPosts()', () => {
    it('should fetch all posts successfully', async () => {
      const mockResponse: BlogPost[] = [mockBlogPost, mockDraftPost];

      (mockedApiClient.axios.get as any).mockResolvedValue({
        data: mockResponse,
        status: 200,
      } as AxiosResponse);

      const posts = await blogService.getAllPosts();

      expect(mockedApiClient.axios.get).toHaveBeenCalledWith('/blogs', { params: undefined });
      expect(posts).toHaveLength(2);
      expect(posts[0].status).toBe('published'); // Normalized to lowercase
      expect(posts[1].status).toBe('draft'); // Normalized to lowercase
    });

    it('should fetch posts with query parameters', async () => {
      const mockResponse: BlogPost[] = [mockBlogPost];

      (mockedApiClient.axios.get as any).mockResolvedValue({
        data: mockResponse,
        status: 200,
      } as AxiosResponse);

      await blogService.getAllPosts({ status: 'published', category: 'Backend' });

      expect(mockedApiClient.axios.get).toHaveBeenCalledWith('/blogs', {
        params: { status: 'published', category: 'Backend' },
      });
    });

    it('should handle paginated response format', async () => {
      const mockResponse = {
        items: [mockBlogPost],
        total: 10,
        limit: 20,
        offset: 0,
      };

      (mockedApiClient.axios.get as any).mockResolvedValue({
        data: mockResponse,
        status: 200,
      } as AxiosResponse);

      const posts = await blogService.getAllPosts();

      expect(posts).toHaveLength(1);
      expect(posts[0].id).toBe(mockBlogPost.id);
    });

    it('should handle alternative response format with "blogs" key', async () => {
      const mockResponse = {
        blogs: [mockBlogPost],
        total: 1,
      };

      (mockedApiClient.axios.get as any).mockResolvedValue({
        data: mockResponse,
        status: 200,
      } as AxiosResponse);

      const posts = await blogService.getAllPosts();

      expect(posts).toHaveLength(1);
      expect(posts[0].id).toBe(mockBlogPost.id);
    });
  });

  describe('getPublishedPosts()', () => {
    it('should fetch only published posts', async () => {
      const mockResponse: BlogPost[] = [mockBlogPost];

      (mockedApiClient.axios.get as any).mockResolvedValue({
        data: mockResponse,
        status: 200,
      } as AxiosResponse);

      await blogService.getPublishedPosts();

      expect(mockedApiClient.axios.get).toHaveBeenCalledWith('/blogs', {
        params: { status: 'published' },
      });
    });
  });

  describe('getDraftPosts()', () => {
    it('should fetch only draft posts', async () => {
      const mockResponse: BlogPost[] = [mockDraftPost];

      (mockedApiClient.axios.get as any).mockResolvedValue({
        data: mockResponse,
        status: 200,
      } as AxiosResponse);

      await blogService.getDraftPosts();

      expect(mockedApiClient.axios.get).toHaveBeenCalledWith('/blogs', {
        params: { status: 'draft' },
      });
    });
  });

  describe('getPostById()', () => {
    it('should fetch blog post by ID successfully', async () => {
      (mockedApiClient.axios.get as any).mockResolvedValue({
        data: mockBlogPost,
        status: 200,
      } as AxiosResponse);

      const post = await blogService.getPostById('test-blog-123');

      expect(mockedApiClient.axios.get).toHaveBeenCalledWith('/blogs/test-blog-123');
      expect(post).not.toBeNull();
      expect(post?.id).toBe('test-blog-123');
      expect(post?.status).toBe('published'); // Normalized
    });

    it('should return null for 404 error', async () => {
      (mockedApiClient.axios.get as any).mockRejectedValue({
        response: { status: 404 },
        statusCode: 404,
      });

      const post = await blogService.getPostById('nonexistent-id');

      expect(post).toBeNull();
    });

    it('should throw error for non-404 errors', async () => {
      (mockedApiClient.axios.get as any).mockRejectedValue({
        response: { status: 500 },
        statusCode: 500,
        message: 'Internal Server Error',
      });

      await expect(blogService.getPostById('test-id')).rejects.toThrow();
    });
  });

  describe('createPost()', () => {
    it('should create blog post successfully', async () => {
      const createData: BlogPostCreate = {
        title: 'New Blog Post',
        content: '# Content here',
        excerpt: 'Brief summary',
        category: 'Backend',
        tags: ['python', 'fastapi'],
      };

      const createdPost: BlogPost = {
        ...mockBlogPost,
        ...createData,
        id: 'new-blog-789',
        slug: 'new-blog-post',
        status: 'DRAFT',
        publishedAt: '',
      };

      (mockedApiClient.axios.post as any).mockResolvedValue({
        data: createdPost,
        status: 201,
      } as AxiosResponse);

      const post = await blogService.createPost(createData);

      expect(mockedApiClient.axios.post).toHaveBeenCalledWith('/blogs', createData);
      expect(post.id).toBe('new-blog-789');
      expect(post.status).toBe('draft'); // Normalized
    });

    it('should handle validation errors', async () => {
      const invalidData: BlogPostCreate = {
        title: '',
        content: '',
        excerpt: '',
      };

      (mockedApiClient.axios.post as any).mockRejectedValue({
        response: {
          status: 422,
          data: { detail: 'Validation error' },
        },
        statusCode: 422,
      });

      await expect(blogService.createPost(invalidData)).rejects.toThrow();
    });
  });

  describe('updatePost()', () => {
    it('should update blog post successfully', async () => {
      const updateData: BlogPostUpdate = {
        title: 'Updated Title',
        content: 'Updated content',
      };

      const updatedPost: BlogPost = {
        ...mockBlogPost,
        ...updateData,
      };

      (mockedApiClient.axios.put as any).mockResolvedValue({
        data: updatedPost,
        status: 200,
      } as AxiosResponse);

      const post = await blogService.updatePost('test-blog-123', updateData);

      expect(mockedApiClient.axios.put).toHaveBeenCalledWith('/blogs/test-blog-123', updateData);
      expect(post).not.toBeNull();
      expect(post?.title).toBe('Updated Title');
    });

    it('should return null for 404 error', async () => {
      (mockedApiClient.axios.put as any).mockRejectedValue({
        response: { status: 404 },
        statusCode: 404,
      });

      const post = await blogService.updatePost('nonexistent-id', { title: 'Test' });

      expect(post).toBeNull();
    });
  });

  describe('deletePost()', () => {
    it('should delete blog post successfully', async () => {
      (mockedApiClient.axios.delete as any).mockResolvedValue({
        status: 204,
      } as AxiosResponse);

      const result = await blogService.deletePost('test-blog-123');

      expect(mockedApiClient.axios.delete).toHaveBeenCalledWith('/blogs/test-blog-123');
      expect(result).toBe(true);
    });

    it('should return false for 404 error', async () => {
      (mockedApiClient.axios.delete as any).mockRejectedValue({
        response: { status: 404 },
        statusCode: 404,
      });

      const result = await blogService.deletePost('nonexistent-id');

      expect(result).toBe(false);
    });

    it('should throw error for other errors', async () => {
      (mockedApiClient.axios.delete as any).mockRejectedValue({
        response: { status: 500 },
        statusCode: 500,
      });

      await expect(blogService.deletePost('test-id')).rejects.toThrow();
    });
  });

  describe('publishPost()', () => {
    it('should publish blog post successfully', async () => {
      const publishedPost: BlogPost = {
        ...mockDraftPost,
        status: 'PUBLISHED',
        publishedAt: '2025-01-15',
      };

      (mockedApiClient.axios.post as any).mockResolvedValue({
        data: publishedPost,
        status: 200,
      } as AxiosResponse);

      const post = await blogService.publishPost('draft-blog-456');

      expect(mockedApiClient.axios.post).toHaveBeenCalledWith('/blogs/draft-blog-456/publish');
      expect(post).not.toBeNull();
      expect(post?.status).toBe('published'); // Normalized
      expect(post?.publishedAt).toBe('2025-01-15');
    });

    it('should return null for 404 error', async () => {
      (mockedApiClient.axios.post as any).mockRejectedValue({
        response: { status: 404 },
        statusCode: 404,
      });

      const post = await blogService.publishPost('nonexistent-id');

      expect(post).toBeNull();
    });
  });

  describe('unpublishPost()', () => {
    it('should unpublish blog post successfully', async () => {
      const unpublishedPost: BlogPost = {
        ...mockBlogPost,
        status: 'DRAFT',
        publishedAt: '',
      };

      (mockedApiClient.axios.post as any).mockResolvedValue({
        data: unpublishedPost,
        status: 200,
      } as AxiosResponse);

      const post = await blogService.unpublishPost('test-blog-123');

      expect(mockedApiClient.axios.post).toHaveBeenCalledWith('/blogs/test-blog-123/unpublish');
      expect(post).not.toBeNull();
      expect(post?.status).toBe('draft'); // Normalized
    });

    it('should return null for 404 error', async () => {
      (mockedApiClient.axios.post as any).mockRejectedValue({
        response: { status: 404 },
        statusCode: 404,
      });

      const post = await blogService.unpublishPost('nonexistent-id');

      expect(post).toBeNull();
    });
  });

  describe('getCategories()', () => {
    it('should fetch categories from backend endpoint', async () => {
      (mockedApiClient.axios.get as any).mockResolvedValue({
        data: { categories: ['Backend', 'Frontend', 'DevOps'] },
        status: 200,
      } as AxiosResponse);

      const categories = await blogService.getCategories();

      expect(mockedApiClient.axios.get).toHaveBeenCalledWith('/blogs/categories');
      expect(categories).toEqual(['Backend', 'Frontend', 'DevOps']);
    });

    it('should fallback to extracting categories from posts if endpoint not found', async () => {
      // First call to /blogs/categories fails with 404
      (mockedApiClient.axios.get as any).mockRejectedValueOnce({
        response: { status: 404 },
        statusCode: 404,
      });

      // Second call to /blogs returns posts
      (mockedApiClient.axios.get as any).mockResolvedValueOnce({
        data: [
          { ...mockBlogPost, category: 'Backend' },
          { ...mockBlogPost, category: 'Frontend' },
          { ...mockBlogPost, category: 'Backend' }, // Duplicate
        ],
        status: 200,
      } as AxiosResponse);

      const categories = await blogService.getCategories();

      expect(mockedApiClient.axios.get).toHaveBeenCalledWith('/blogs/categories');
      expect(mockedApiClient.axios.get).toHaveBeenCalledWith('/blogs', {
        params: { status: 'all' },
      });
      expect(categories).toEqual(['Backend', 'Frontend']); // Unique categories
    });
  });
});
