/**
 * React Query hooks for projects.
 *
 * Provides data fetching, caching, and mutation hooks for project operations.
 * Automatically handles loading states, errors, and cache invalidation.
 *
 * Usage:
 * ```tsx
 * const { data: projects, isLoading, error } = useProjects();
 * const createMutation = useCreateProject();
 * await createMutation.mutateAsync(projectData);
 * ```
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '@/services/projectService';
import {
  ProjectCreate,
  ProjectUpdate,
  ProjectListParams,
  ProjectNormalized,
} from '@/types/project';
import { useToast } from '@/hooks/use-toast';

// ============================================================================
// Query Keys
// ============================================================================

/**
 * Query key factory for project-related queries.
 * Ensures consistent cache keys and easy invalidation.
 */
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (params?: ProjectListParams) => [...projectKeys.lists(), params] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
};

// ============================================================================
// Query Hooks (Read Operations)
// ============================================================================

/**
 * Fetch all projects with optional filtering.
 *
 * @param params - Optional query parameters (status, featured, limit, offset)
 * @param enabled - Whether to enable the query (default: true)
 * @returns Query result with projects array, loading state, and error
 *
 * @example
 * ```tsx
 * // Get all published projects
 * const { data: projects = [], isLoading } = useProjects({ status: 'published' });
 *
 * // Get drafts only (owner)
 * const { data: drafts = [] } = useProjects({ status: 'draft' });
 *
 * // Conditionally fetch drafts
 * const { data: drafts = [] } = useProjects({ status: 'draft' }, isOwner);
 *
 * // Get featured projects
 * const { data: featured = [] } = useProjects({ featured: true });
 * ```
 */
export function useProjects(params?: ProjectListParams, enabled: boolean = true) {
  return useQuery({
    queryKey: projectKeys.list(params),
    queryFn: () => projectService.getAllProjects(params),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes - projects don't change often
  });
}

/**
 * Fetch single project by ID.
 *
 * @param id - Project ID
 * @param enabled - Whether to run the query (default: true)
 * @returns Query result with project data, loading state, and error
 *
 * @example
 * ```tsx
 * const { data: project, isLoading } = useProject('project-123');
 *
 * // Conditional fetching
 * const { data: project } = useProject(id, id !== null);
 * ```
 */
export function useProject(id: string, enabled = true) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => projectService.getProjectById(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error: any) => {
      // Don't retry on 404 - project doesn't exist
      if (error?.statusCode === 404 || error?.response?.status === 404) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

// ============================================================================
// Mutation Hooks (Write Operations)
// ============================================================================

/**
 * Create new project.
 * Requires authentication.
 *
 * @returns Mutation object with mutate/mutateAsync methods
 *
 * @example
 * ```tsx
 * const createMutation = useCreateProject();
 *
 * const handleCreate = async () => {
 *   try {
 *     const newProject = await createMutation.mutateAsync({
 *       title: "My Project",
 *       description: "Project description",
 *       tech: ["Python", "FastAPI"],
 *       featured: true
 *     });
 *     console.log('Created:', newProject);
 *   } catch (error) {
 *     console.error('Failed:', error);
 *   }
 * };
 * ```
 */
export function useCreateProject() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: ProjectCreate) => projectService.createProject(data),
    onSuccess: () => {
      // Invalidate all project lists to refetch with new project
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });

      toast({
        title: "Project created",
        description: "Your project has been created as a draft.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to create project",
        description: error.message || error.detail || "An error occurred while creating the project.",
      });
    },
  });
}

/**
 * Update existing project.
 * Requires authentication.
 *
 * @returns Mutation object
 *
 * @example
 * ```tsx
 * const updateMutation = useUpdateProject();
 *
 * await updateMutation.mutateAsync({
 *   id: 'project-123',
 *   data: { title: 'Updated Title' }
 * });
 * ```
 */
export function useUpdateProject() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProjectUpdate }) =>
      projectService.updateProject(id, data),
    onSuccess: (updatedProject, variables) => {
      // Invalidate specific project to refetch
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.id) });
      // Invalidate all lists (project might move between published/draft)
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });

      toast({
        title: "Project updated",
        description: "Your changes have been saved.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to update project",
        description: error.message || error.detail || "An error occurred while updating the project.",
      });
    },
  });
}

/**
 * Delete project.
 * Requires authentication.
 *
 * @returns Mutation object
 *
 * @example
 * ```tsx
 * const deleteMutation = useDeleteProject();
 *
 * const handleDelete = async (id: string) => {
 *   if (confirm('Delete this project?')) {
 *     await deleteMutation.mutateAsync(id);
 *   }
 * };
 * ```
 */
export function useDeleteProject() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => projectService.deleteProject(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: projectKeys.detail(deletedId) });
      // Invalidate lists to refetch without deleted project
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });

      toast({
        title: "Project deleted",
        description: "The project has been permanently deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to delete project",
        description: error.message || error.detail || "An error occurred while deleting the project.",
      });
    },
  });
}

/**
 * Publish project (change status from draft to published).
 * Requires authentication.
 *
 * @returns Mutation object
 *
 * @example
 * ```tsx
 * const publishMutation = usePublishProject();
 * await publishMutation.mutateAsync('project-123');
 * ```
 */
export function usePublishProject() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => projectService.publishProject(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });

      toast({
        title: "Project published",
        description: "Your project is now visible to everyone.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to publish project",
        description: error.message || error.detail || "An error occurred while publishing the project.",
      });
    },
  });
}

/**
 * Unpublish project (change status from published to draft).
 * Requires authentication.
 *
 * @returns Mutation object
 *
 * @example
 * ```tsx
 * const unpublishMutation = useUnpublishProject();
 * await unpublishMutation.mutateAsync('project-123');
 * ```
 */
export function useUnpublishProject() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => projectService.unpublishProject(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });

      toast({
        title: "Project unpublished",
        description: "Your project is now a draft.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to unpublish project",
        description: error.message || error.detail || "An error occurred while unpublishing the project.",
      });
    },
  });
}

// ============================================================================
// Convenience Hooks
// ============================================================================

/**
 * Get published projects only (public view).
 * Shorthand for useProjects({ status: 'published' }).
 */
export function usePublishedProjects() {
  return useProjects({ status: 'published' });
}

/**
 * Get draft projects only (owner view).
 * Shorthand for useProjects({ status: 'draft' }).
 */
export function useDraftProjects() {
  return useProjects({ status: 'draft' });
}

/**
 * Get featured projects only.
 * Shorthand for useProjects({ featured: true }).
 */
export function useFeaturedProjects() {
  return useProjects({ featured: true });
}
