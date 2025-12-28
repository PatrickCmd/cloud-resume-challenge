/**
 * Integration tests for project React Query hooks.
 *
 * Tests data fetching, caching, and mutation hooks.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import {
  useProjects,
  useProject,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  usePublishProject,
  useUnpublishProject,
  useFeaturedProjects,
} from '../useProjects';
import { projectService } from '@/services/projectService';
import { ProjectNormalized, ProjectCreate } from '@/types/project';

// Mock projectService
vi.mock('@/services/projectService', () => ({
  projectService: {
    getAllProjects: vi.fn(),
    getProjectById: vi.fn(),
    createProject: vi.fn(),
    updateProject: vi.fn(),
    deleteProject: vi.fn(),
    publishProject: vi.fn(),
    unpublishProject: vi.fn(),
  },
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

const mockedProjectService = vi.mocked(projectService);

// Test data
const mockProject: ProjectNormalized = {
  id: 'test-project-123',
  title: 'Test Project',
  description: 'This is a test project',
  tech: ['Python', 'FastAPI', 'React'],
  link: 'https://example.com',
  github: 'https://github.com/test/repo',
  image: 'https://example.com/image.png',
  featured: true,
  status: 'published',
  createdAt: '2025-01-15T10:00:00Z',
  updatedAt: '2025-01-15T10:00:00Z',
  publishedAt: '2025-01-15',
};

const mockDraftProject: ProjectNormalized = {
  ...mockProject,
  id: 'draft-project-456',
  status: 'draft',
  featured: false,
  publishedAt: '',
};

describe('Project React Query Hooks', () => {
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

  describe('useProjects()', () => {
    it('should fetch all projects successfully', async () => {
      mockedProjectService.getAllProjects.mockResolvedValue([mockProject, mockDraftProject]);

      const { result } = renderHook(() => useProjects(), { wrapper });

      // Initially loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();

      // Wait for data to load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toHaveLength(2);
      expect(result.current.data?.[0].id).toBe('test-project-123');
      expect(mockedProjectService.getAllProjects).toHaveBeenCalledWith(undefined);
    });

    it('should fetch projects with query parameters', async () => {
      mockedProjectService.getAllProjects.mockResolvedValue([mockProject]);

      const { result } = renderHook(
        () => useProjects({ status: 'published', featured: true }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockedProjectService.getAllProjects).toHaveBeenCalledWith({
        status: 'published',
        featured: true,
      });
      expect(result.current.data).toHaveLength(1);
    });

    it('should handle error gracefully', async () => {
      mockedProjectService.getAllProjects.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useProjects(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.data).toBeUndefined();
    });
  });

  describe('useProject()', () => {
    it('should fetch single project successfully', async () => {
      mockedProjectService.getProjectById.mockResolvedValue(mockProject);

      const { result } = renderHook(() => useProject('test-project-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockProject);
      expect(mockedProjectService.getProjectById).toHaveBeenCalledWith('test-project-123');
    });

    it('should return null for non-existent project', async () => {
      mockedProjectService.getProjectById.mockResolvedValue(null);

      const { result } = renderHook(() => useProject('nonexistent-id'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeNull();
    });

    it('should not fetch when enabled is false', async () => {
      mockedProjectService.getProjectById.mockResolvedValue(mockProject);

      const { result } = renderHook(() => useProject('test-project-123', false), { wrapper });

      // Should not call service
      expect(mockedProjectService.getProjectById).not.toHaveBeenCalled();
      expect(result.current.data).toBeUndefined();
    });

    it('should not retry on 404 errors', async () => {
      mockedProjectService.getProjectById.mockRejectedValue({
        statusCode: 404,
        message: 'Not found',
      });

      const { result } = renderHook(() => useProject('test-id'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should only call once (no retries on 404)
      expect(mockedProjectService.getProjectById).toHaveBeenCalledTimes(1);
    });
  });

  describe('useFeaturedProjects()', () => {
    it('should fetch featured projects successfully', async () => {
      mockedProjectService.getAllProjects.mockResolvedValue([mockProject]);

      const { result } = renderHook(() => useFeaturedProjects(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockedProjectService.getAllProjects).toHaveBeenCalledWith({ featured: true });
      expect(result.current.data).toHaveLength(1);
      expect(result.current.data?.[0].featured).toBe(true);
    });
  });

  describe('useCreateProject()', () => {
    it('should create project successfully', async () => {
      const newProject: ProjectNormalized = {
        ...mockDraftProject,
        id: 'new-project-789',
      };

      mockedProjectService.createProject.mockResolvedValue(newProject);

      const { result } = renderHook(() => useCreateProject(), { wrapper });

      const createData: ProjectCreate = {
        title: 'New Project',
        description: 'Project description',
        tech: ['Python'],
      };

      await result.current.mutateAsync(createData);

      expect(mockedProjectService.createProject).toHaveBeenCalledWith(createData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('should invalidate project lists on success', async () => {
      const newProject: ProjectNormalized = mockDraftProject;

      mockedProjectService.createProject.mockResolvedValue(newProject);
      mockedProjectService.getAllProjects.mockResolvedValue([mockProject]);

      // First render to populate cache
      const { result: listResult } = renderHook(() => useProjects(), { wrapper });
      await waitFor(() => expect(listResult.current.isLoading).toBe(false));

      // Create new project
      const { result: createResult } = renderHook(() => useCreateProject(), { wrapper });
      await createResult.current.mutateAsync({
        title: 'New',
        description: 'Description',
        tech: ['Python'],
      });

      // Cache should be invalidated and refetch triggered
      await waitFor(() => {
        expect(mockedProjectService.getAllProjects).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('useUpdateProject()', () => {
    it('should update project successfully', async () => {
      const updatedProject: ProjectNormalized = {
        ...mockProject,
        title: 'Updated Title',
      };

      mockedProjectService.updateProject.mockResolvedValue(updatedProject);

      const { result } = renderHook(() => useUpdateProject(), { wrapper });

      await result.current.mutateAsync({
        id: 'test-project-123',
        data: { title: 'Updated Title' },
      });

      expect(mockedProjectService.updateProject).toHaveBeenCalledWith('test-project-123', {
        title: 'Updated Title',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('useDeleteProject()', () => {
    it('should delete project successfully', async () => {
      mockedProjectService.deleteProject.mockResolvedValue(true);

      const { result } = renderHook(() => useDeleteProject(), { wrapper });

      await result.current.mutateAsync('test-project-123');

      expect(mockedProjectService.deleteProject).toHaveBeenCalledWith('test-project-123');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('should remove project from cache on success', async () => {
      mockedProjectService.deleteProject.mockResolvedValue(true);
      mockedProjectService.getProjectById.mockResolvedValue(mockProject);

      // Populate cache with project
      const { result: projectResult } = renderHook(() => useProject('test-project-123'), {
        wrapper,
      });
      await waitFor(() => expect(projectResult.current.isLoading).toBe(false));

      // Delete project
      const { result: deleteResult } = renderHook(() => useDeleteProject(), { wrapper });
      await deleteResult.current.mutateAsync('test-project-123');

      // Project should be removed from cache
      const cachedData = queryClient.getQueryData(['projects', 'detail', 'test-project-123']);
      expect(cachedData).toBeUndefined();
    });
  });

  describe('usePublishProject()', () => {
    it('should publish project successfully', async () => {
      const publishedProject: ProjectNormalized = {
        ...mockDraftProject,
        status: 'published',
        publishedAt: '2025-01-15',
      };

      mockedProjectService.publishProject.mockResolvedValue(publishedProject);

      const { result } = renderHook(() => usePublishProject(), { wrapper });

      await result.current.mutateAsync('draft-project-456');

      expect(mockedProjectService.publishProject).toHaveBeenCalledWith('draft-project-456');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('useUnpublishProject()', () => {
    it('should unpublish project successfully', async () => {
      const unpublishedProject: ProjectNormalized = {
        ...mockProject,
        status: 'draft',
        publishedAt: '',
      };

      mockedProjectService.unpublishProject.mockResolvedValue(unpublishedProject);

      const { result } = renderHook(() => useUnpublishProject(), { wrapper });

      await result.current.mutateAsync('test-project-123');

      expect(mockedProjectService.unpublishProject).toHaveBeenCalledWith('test-project-123');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle mutation errors gracefully', async () => {
      mockedProjectService.createProject.mockRejectedValue({
        message: 'Validation error',
        detail: 'Title is required',
      });

      const { result } = renderHook(() => useCreateProject(), { wrapper });

      await expect(
        result.current.mutateAsync({
          title: '',
          description: '',
          tech: [],
        })
      ).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });
});
