/**
 * Integration tests for blog React Query hooks.
 *
 * Tests data fetching, caching, and mutation hooks.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import {
  useBlogPosts,
  useBlogPost,
  useCreateBlogPost,
  useUpdateBlogPost,
  useDeleteBlogPost,
  usePublishBlogPost,
  useUnpublishBlogPost,
  useBlogCategories,
} from '../useBlogPosts';
import { blogService } from '@/services/blogService';
import { BlogPostNormalized, BlogPostCreate } from '@/types/blog';

// Mock blogService
vi.mock('@/services/blogService', () => ({
  blogService: {
    getAllPosts: vi.fn(),
    getPostById: vi.fn(),
    createPost: vi.fn(),
    updatePost: vi.fn(),
    deletePost: vi.fn(),
    publishPost: vi.fn(),
    unpublishPost: vi.fn(),
    getCategories: vi.fn(),
  },
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

const mockedBlogService = vi.mocked(blogService);

// Test data
const mockBlogPost: BlogPostNormalized = {
  id: 'test-blog-123',
  slug: 'test-blog-post',
  title: 'Test Blog Post',
  excerpt: 'This is a test',
  content: '# Test',
  category: 'Backend',
  readTime: '5 min read',
  publishedAt: '2025-01-15',
  tags: ['python'],
  status: 'published',
  createdAt: '2025-01-15T10:00:00Z',
  updatedAt: '2025-01-15T10:00:00Z',
};

const mockDraftPost: BlogPostNormalized = {
  ...mockBlogPost,
  id: 'draft-blog-456',
  status: 'draft',
  publishedAt: '',
};

describe('Blog React Query Hooks', () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  describe('useBlogPosts()', () => {
    it('should fetch all blog posts successfully', async () => {
      mockedBlogService.getAllPosts.mockResolvedValue([mockBlogPost, mockDraftPost]);

      const { result } = renderHook(() => useBlogPosts(), { wrapper });

      // Initially loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();

      // Wait for data to load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toHaveLength(2);
      expect(result.current.data?.[0].id).toBe('test-blog-123');
      expect(mockedBlogService.getAllPosts).toHaveBeenCalledWith(undefined);
    });

    it('should fetch posts with query parameters', async () => {
      mockedBlogService.getAllPosts.mockResolvedValue([mockBlogPost]);

      const { result } = renderHook(
        () => useBlogPosts({ status: 'published', category: 'Backend' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockedBlogService.getAllPosts).toHaveBeenCalledWith({
        status: 'published',
        category: 'Backend',
      });
      expect(result.current.data).toHaveLength(1);
    });

    it('should handle error gracefully', async () => {
      mockedBlogService.getAllPosts.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useBlogPosts(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.data).toBeUndefined();
    });
  });

  describe('useBlogPost()', () => {
    it('should fetch single blog post successfully', async () => {
      mockedBlogService.getPostById.mockResolvedValue(mockBlogPost);

      const { result } = renderHook(() => useBlogPost('test-blog-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockBlogPost);
      expect(mockedBlogService.getPostById).toHaveBeenCalledWith('test-blog-123');
    });

    it('should return null for non-existent post', async () => {
      mockedBlogService.getPostById.mockResolvedValue(null);

      const { result } = renderHook(() => useBlogPost('nonexistent-id'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeNull();
    });

    it('should not fetch when enabled is false', async () => {
      mockedBlogService.getPostById.mockResolvedValue(mockBlogPost);

      const { result } = renderHook(() => useBlogPost('test-blog-123', false), { wrapper });

      // Should not call service
      expect(mockedBlogService.getPostById).not.toHaveBeenCalled();
      expect(result.current.data).toBeUndefined();
    });

    it('should not retry on 404 errors', async () => {
      mockedBlogService.getPostById.mockRejectedValue({
        statusCode: 404,
        message: 'Not found',
      });

      const { result } = renderHook(() => useBlogPost('test-id'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should only call once (no retries on 404)
      expect(mockedBlogService.getPostById).toHaveBeenCalledTimes(1);
    });
  });

  describe('useBlogCategories()', () => {
    it('should fetch categories successfully', async () => {
      mockedBlogService.getCategories.mockResolvedValue(['Backend', 'Frontend', 'DevOps']);

      const { result } = renderHook(() => useBlogCategories(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(['Backend', 'Frontend', 'DevOps']);
      expect(mockedBlogService.getCategories).toHaveBeenCalled();
    });
  });

  describe('useCreateBlogPost()', () => {
    it('should create blog post successfully', async () => {
      const newPost: BlogPostNormalized = {
        ...mockDraftPost,
        id: 'new-blog-789',
      };

      mockedBlogService.createPost.mockResolvedValue(newPost);

      const { result } = renderHook(() => useCreateBlogPost(), { wrapper });

      const createData: BlogPostCreate = {
        title: 'New Post',
        content: '# Content',
        excerpt: 'Summary',
        category: 'Backend',
        tags: ['python'],
      };

      await result.current.mutateAsync(createData);

      expect(mockedBlogService.createPost).toHaveBeenCalledWith(createData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('should invalidate blog lists on success', async () => {
      const newPost: BlogPostNormalized = mockDraftPost;

      mockedBlogService.createPost.mockResolvedValue(newPost);
      mockedBlogService.getAllPosts.mockResolvedValue([mockBlogPost]);

      // First render to populate cache
      const { result: listResult } = renderHook(() => useBlogPosts(), { wrapper });
      await waitFor(() => expect(listResult.current.isLoading).toBe(false));

      // Create new post
      const { result: createResult } = renderHook(() => useCreateBlogPost(), { wrapper });
      await createResult.current.mutateAsync({
        title: 'New',
        content: 'Content',
        excerpt: 'Summary',
      });

      // Cache should be invalidated and refetch triggered
      await waitFor(() => {
        expect(mockedBlogService.getAllPosts).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('useUpdateBlogPost()', () => {
    it('should update blog post successfully', async () => {
      const updatedPost: BlogPostNormalized = {
        ...mockBlogPost,
        title: 'Updated Title',
      };

      mockedBlogService.updatePost.mockResolvedValue(updatedPost);

      const { result } = renderHook(() => useUpdateBlogPost(), { wrapper });

      await result.current.mutateAsync({
        id: 'test-blog-123',
        data: { title: 'Updated Title' },
      });

      expect(mockedBlogService.updatePost).toHaveBeenCalledWith('test-blog-123', {
        title: 'Updated Title',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('useDeleteBlogPost()', () => {
    it('should delete blog post successfully', async () => {
      mockedBlogService.deletePost.mockResolvedValue(true);

      const { result } = renderHook(() => useDeleteBlogPost(), { wrapper });

      await result.current.mutateAsync('test-blog-123');

      expect(mockedBlogService.deletePost).toHaveBeenCalledWith('test-blog-123');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('should remove post from cache on success', async () => {
      mockedBlogService.deletePost.mockResolvedValue(true);
      mockedBlogService.getPostById.mockResolvedValue(mockBlogPost);

      // Populate cache with post
      const { result: postResult } = renderHook(() => useBlogPost('test-blog-123'), {
        wrapper,
      });
      await waitFor(() => expect(postResult.current.isLoading).toBe(false));

      // Delete post
      const { result: deleteResult } = renderHook(() => useDeleteBlogPost(), { wrapper });
      await deleteResult.current.mutateAsync('test-blog-123');

      // Post should be removed from cache
      const cachedData = queryClient.getQueryData(['blogs', 'detail', 'test-blog-123']);
      expect(cachedData).toBeUndefined();
    });
  });

  describe('usePublishBlogPost()', () => {
    it('should publish blog post successfully', async () => {
      const publishedPost: BlogPostNormalized = {
        ...mockDraftPost,
        status: 'published',
        publishedAt: '2025-01-15',
      };

      mockedBlogService.publishPost.mockResolvedValue(publishedPost);

      const { result } = renderHook(() => usePublishBlogPost(), { wrapper });

      await result.current.mutateAsync('draft-blog-456');

      expect(mockedBlogService.publishPost).toHaveBeenCalledWith('draft-blog-456');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('useUnpublishBlogPost()', () => {
    it('should unpublish blog post successfully', async () => {
      const unpublishedPost: BlogPostNormalized = {
        ...mockBlogPost,
        status: 'draft',
        publishedAt: '',
      };

      mockedBlogService.unpublishPost.mockResolvedValue(unpublishedPost);

      const { result } = renderHook(() => useUnpublishBlogPost(), { wrapper });

      await result.current.mutateAsync('test-blog-123');

      expect(mockedBlogService.unpublishPost).toHaveBeenCalledWith('test-blog-123');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle mutation errors gracefully', async () => {
      mockedBlogService.createPost.mockRejectedValue({
        message: 'Validation error',
        detail: 'Title is required',
      });

      const { result } = renderHook(() => useCreateBlogPost(), { wrapper });

      await expect(
        result.current.mutateAsync({
          title: '',
          content: '',
          excerpt: '',
        })
      ).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });
});
