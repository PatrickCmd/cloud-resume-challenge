/**
 * React Query hooks for blog posts.
 *
 * Provides data fetching, caching, and mutation hooks for blog operations.
 * Automatically handles loading states, errors, and cache invalidation.
 *
 * Usage:
 * ```tsx
 * const { data: posts, isLoading, error } = useBlogPosts();
 * const createMutation = useCreateBlogPost();
 * await createMutation.mutateAsync(blogData);
 * ```
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blogService } from '@/services/blogService';
import {
  BlogPostCreate,
  BlogPostUpdate,
  BlogListParams,
  BlogPostNormalized,
} from '@/types/blog';
import { useToast } from '@/hooks/use-toast';

// ============================================================================
// Query Keys
// ============================================================================

/**
 * Query key factory for blog-related queries.
 * Ensures consistent cache keys and easy invalidation.
 */
export const blogKeys = {
  all: ['blogs'] as const,
  lists: () => [...blogKeys.all, 'list'] as const,
  list: (params?: BlogListParams) => [...blogKeys.lists(), params] as const,
  details: () => [...blogKeys.all, 'detail'] as const,
  detail: (id: string) => [...blogKeys.details(), id] as const,
  categories: () => [...blogKeys.all, 'categories'] as const,
};

// ============================================================================
// Query Hooks (Read Operations)
// ============================================================================

/**
 * Fetch all blog posts with optional filtering.
 *
 * @param params - Optional query parameters (status, category, tag, limit, offset)
 * @param enabled - Whether to enable the query (default: true)
 * @returns Query result with posts array, loading state, and error
 *
 * @example
 * ```tsx
 * // Get all published posts
 * const { data: posts = [], isLoading } = useBlogPosts({ status: 'published' });
 *
 * // Get drafts only (owner)
 * const { data: drafts = [] } = useBlogPosts({ status: 'draft' });
 *
 * // Conditionally fetch drafts
 * const { data: drafts = [] } = useBlogPosts({ status: 'draft' }, isOwner);
 *
 * // Filter by category
 * const { data: backendPosts = [] } = useBlogPosts({ category: 'Backend' });
 * ```
 */
export function useBlogPosts(params?: BlogListParams, enabled: boolean = true) {
  return useQuery({
    queryKey: blogKeys.list(params),
    queryFn: () => blogService.getAllPosts(params),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes - posts don't change often
  });
}

/**
 * Fetch single blog post by ID.
 *
 * @param id - Blog post ID
 * @param enabled - Whether to run the query (default: true)
 * @returns Query result with post data, loading state, and error
 *
 * @example
 * ```tsx
 * const { data: post, isLoading } = useBlogPost('post-123');
 *
 * // Conditional fetching
 * const { data: post } = useBlogPost(id, id !== null);
 * ```
 */
export function useBlogPost(id: string, enabled = true) {
  return useQuery({
    queryKey: blogKeys.detail(id),
    queryFn: () => blogService.getPostById(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error: any) => {
      // Don't retry on 404 - post doesn't exist
      if (error?.statusCode === 404 || error?.response?.status === 404) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

/**
 * Fetch all unique blog categories.
 *
 * @returns Query result with categories array
 *
 * @example
 * ```tsx
 * const { data: categories = [] } = useBlogCategories();
 * ```
 */
export function useBlogCategories() {
  return useQuery({
    queryKey: blogKeys.categories(),
    queryFn: () => blogService.getCategories(),
    staleTime: 10 * 60 * 1000, // 10 minutes - categories change rarely
  });
}

// ============================================================================
// Mutation Hooks (Write Operations)
// ============================================================================

/**
 * Create new blog post.
 * Requires authentication.
 *
 * @returns Mutation object with mutate/mutateAsync methods
 *
 * @example
 * ```tsx
 * const createMutation = useCreateBlogPost();
 *
 * const handleCreate = async () => {
 *   try {
 *     const newPost = await createMutation.mutateAsync({
 *       title: "My Post",
 *       content: "Content here",
 *       excerpt: "Brief summary",
 *       category: "Backend",
 *       tags: ["python", "fastapi"]
 *     });
 *     console.log('Created:', newPost);
 *   } catch (error) {
 *     console.error('Failed:', error);
 *   }
 * };
 * ```
 */
export function useCreateBlogPost() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: BlogPostCreate) => blogService.createPost(data),
    onSuccess: () => {
      // Invalidate all blog lists to refetch with new post
      queryClient.invalidateQueries({ queryKey: blogKeys.lists() });

      toast({
        title: "Blog post created",
        description: "Your post has been created as a draft.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to create post",
        description: error.message || error.detail || "An error occurred while creating the post.",
      });
    },
  });
}

/**
 * Update existing blog post.
 * Requires authentication.
 *
 * @returns Mutation object
 *
 * @example
 * ```tsx
 * const updateMutation = useUpdateBlogPost();
 *
 * await updateMutation.mutateAsync({
 *   id: 'post-123',
 *   data: { title: 'Updated Title' }
 * });
 * ```
 */
export function useUpdateBlogPost() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: BlogPostUpdate }) =>
      blogService.updatePost(id, data),
    onSuccess: (updatedPost, variables) => {
      // Invalidate specific post to refetch
      queryClient.invalidateQueries({ queryKey: blogKeys.detail(variables.id) });
      // Invalidate all lists (post might move between published/draft)
      queryClient.invalidateQueries({ queryKey: blogKeys.lists() });

      toast({
        title: "Blog post updated",
        description: "Your changes have been saved.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to update post",
        description: error.message || error.detail || "An error occurred while updating the post.",
      });
    },
  });
}

/**
 * Delete blog post.
 * Requires authentication.
 *
 * @returns Mutation object
 *
 * @example
 * ```tsx
 * const deleteMutation = useDeleteBlogPost();
 *
 * const handleDelete = async (id: string) => {
 *   if (confirm('Delete this post?')) {
 *     await deleteMutation.mutateAsync(id);
 *   }
 * };
 * ```
 */
export function useDeleteBlogPost() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => blogService.deletePost(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: blogKeys.detail(deletedId) });
      // Invalidate lists to refetch without deleted post
      queryClient.invalidateQueries({ queryKey: blogKeys.lists() });

      toast({
        title: "Blog post deleted",
        description: "The post has been permanently deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to delete post",
        description: error.message || error.detail || "An error occurred while deleting the post.",
      });
    },
  });
}

/**
 * Publish blog post (change status from draft to published).
 * Requires authentication.
 *
 * @returns Mutation object
 *
 * @example
 * ```tsx
 * const publishMutation = usePublishBlogPost();
 * await publishMutation.mutateAsync('post-123');
 * ```
 */
export function usePublishBlogPost() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => blogService.publishPost(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: blogKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: blogKeys.lists() });

      toast({
        title: "Blog post published",
        description: "Your post is now visible to everyone.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to publish post",
        description: error.message || error.detail || "An error occurred while publishing the post.",
      });
    },
  });
}

/**
 * Unpublish blog post (change status from published to draft).
 * Requires authentication.
 *
 * @returns Mutation object
 *
 * @example
 * ```tsx
 * const unpublishMutation = useUnpublishBlogPost();
 * await unpublishMutation.mutateAsync('post-123');
 * ```
 */
export function useUnpublishBlogPost() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => blogService.unpublishPost(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: blogKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: blogKeys.lists() });

      toast({
        title: "Blog post unpublished",
        description: "Your post is now a draft.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to unpublish post",
        description: error.message || error.detail || "An error occurred while unpublishing the post.",
      });
    },
  });
}

// ============================================================================
// Convenience Hooks
// ============================================================================

/**
 * Get published posts only (public view).
 * Shorthand for useBlogPosts({ status: 'published' }).
 */
export function usePublishedBlogPosts() {
  return useBlogPosts({ status: 'published' });
}

/**
 * Get draft posts only (owner view).
 * Shorthand for useBlogPosts({ status: 'draft' }).
 */
export function useDraftBlogPosts() {
  return useBlogPosts({ status: 'draft' });
}
