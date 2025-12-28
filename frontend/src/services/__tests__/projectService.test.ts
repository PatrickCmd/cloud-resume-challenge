/**
 * Integration tests for projectService.
 *
 * Tests project CRUD operations with mocked API client.
 * Mirrors backend E2E tests (test_projects_e2e.py) structure.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { projectService } from '../projectService';
import { Project, ProjectCreate, ProjectUpdate } from '@/types/project';
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
const mockProject: Project = {
  id: 'test-project-123',
  name: 'Test Project',
  description: 'This is a test project',
  tech: ['Python', 'FastAPI', 'React'],
  company: 'Test Company',
  githubUrl: 'https://github.com/test/repo',
  liveUrl: 'https://example.com',
  imageUrl: 'https://example.com/image.png',
  featured: true,
  status: 'PUBLISHED',
  createdAt: '2025-01-15T10:00:00Z',
  updatedAt: '2025-01-15T10:00:00Z',
  publishedAt: '2025-01-15',
};

const mockDraftProject: Project = {
  ...mockProject,
  id: 'draft-project-456',
  status: 'DRAFT',
  featured: false,
  publishedAt: '',
};

describe('projectService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllProjects()', () => {
    it('should fetch all projects successfully', async () => {
      const mockResponse: Project[] = [mockProject, mockDraftProject];

      (mockedApiClient.axios.get as any).mockResolvedValue({
        data: mockResponse,
        status: 200,
      } as AxiosResponse);

      const projects = await projectService.getAllProjects();

      expect(mockedApiClient.axios.get).toHaveBeenCalledWith('/projects', { params: undefined });
      expect(projects).toHaveLength(2);
      expect(projects[0].status).toBe('published'); // Normalized to lowercase
      expect(projects[1].status).toBe('draft'); // Normalized to lowercase
    });

    it('should fetch projects with query parameters', async () => {
      const mockResponse: Project[] = [mockProject];

      (mockedApiClient.axios.get as any).mockResolvedValue({
        data: mockResponse,
        status: 200,
      } as AxiosResponse);

      await projectService.getAllProjects({ status: 'published', featured: true });

      expect(mockedApiClient.axios.get).toHaveBeenCalledWith('/projects', {
        params: { status: 'published', featured: true },
      });
    });

    it('should handle paginated response format', async () => {
      const mockResponse = {
        items: [mockProject],
        total: 10,
        limit: 20,
        offset: 0,
      };

      (mockedApiClient.axios.get as any).mockResolvedValue({
        data: mockResponse,
        status: 200,
      } as AxiosResponse);

      const projects = await projectService.getAllProjects();

      expect(projects).toHaveLength(1);
      expect(projects[0].id).toBe(mockProject.id);
    });

    it('should handle alternative response format with "projects" key', async () => {
      const mockResponse = {
        projects: [mockProject],
        total: 1,
      };

      (mockedApiClient.axios.get as any).mockResolvedValue({
        data: mockResponse,
        status: 200,
      } as AxiosResponse);

      const projects = await projectService.getAllProjects();

      expect(projects).toHaveLength(1);
      expect(projects[0].id).toBe(mockProject.id);
    });
  });

  describe('getPublishedProjects()', () => {
    it('should fetch only published projects', async () => {
      const mockResponse: Project[] = [mockProject];

      (mockedApiClient.axios.get as any).mockResolvedValue({
        data: mockResponse,
        status: 200,
      } as AxiosResponse);

      await projectService.getPublishedProjects();

      expect(mockedApiClient.axios.get).toHaveBeenCalledWith('/projects', {
        params: { status: 'published' },
      });
    });
  });

  describe('getDraftProjects()', () => {
    it('should fetch only draft projects', async () => {
      const mockResponse: Project[] = [mockDraftProject];

      (mockedApiClient.axios.get as any).mockResolvedValue({
        data: mockResponse,
        status: 200,
      } as AxiosResponse);

      await projectService.getDraftProjects();

      expect(mockedApiClient.axios.get).toHaveBeenCalledWith('/projects', {
        params: { status: 'draft' },
      });
    });
  });

  describe('getFeaturedProjects()', () => {
    it('should fetch only featured projects', async () => {
      const mockResponse: Project[] = [mockProject];

      (mockedApiClient.axios.get as any).mockResolvedValue({
        data: mockResponse,
        status: 200,
      } as AxiosResponse);

      await projectService.getFeaturedProjects();

      expect(mockedApiClient.axios.get).toHaveBeenCalledWith('/projects', {
        params: { featured: true },
      });
    });
  });

  describe('getProjectById()', () => {
    it('should fetch project by ID successfully', async () => {
      (mockedApiClient.axios.get as any).mockResolvedValue({
        data: mockProject,
        status: 200,
      } as AxiosResponse);

      const project = await projectService.getProjectById('test-project-123');

      expect(mockedApiClient.axios.get).toHaveBeenCalledWith('/projects/test-project-123');
      expect(project).not.toBeNull();
      expect(project?.id).toBe('test-project-123');
      expect(project?.status).toBe('published'); // Normalized
    });

    it('should return null for 404 error', async () => {
      (mockedApiClient.axios.get as any).mockRejectedValue({
        response: { status: 404 },
        statusCode: 404,
      });

      const project = await projectService.getProjectById('nonexistent-id');

      expect(project).toBeNull();
    });

    it('should throw error for non-404 errors', async () => {
      (mockedApiClient.axios.get as any).mockRejectedValue({
        response: { status: 500 },
        statusCode: 500,
        message: 'Internal Server Error',
      });

      await expect(projectService.getProjectById('test-id')).rejects.toThrow();
    });
  });

  describe('createProject()', () => {
    it('should create project successfully', async () => {
      const createData: ProjectCreate = {
        name: 'New Project',
        description: 'Project description',
        tech: ['Python', 'FastAPI'],
        featured: true,
      };

      const createdProject: Project = {
        ...mockProject,
        ...createData,
        id: 'new-project-789',
        status: 'DRAFT',
        publishedAt: '',
      };

      (mockedApiClient.axios.post as any).mockResolvedValue({
        data: createdProject,
        status: 201,
      } as AxiosResponse);

      const project = await projectService.createProject(createData);

      expect(mockedApiClient.axios.post).toHaveBeenCalledWith('/projects', createData);
      expect(project.id).toBe('new-project-789');
      expect(project.status).toBe('draft'); // Normalized
    });

    it('should handle validation errors', async () => {
      const invalidData: ProjectCreate = {
        name: '',
        description: '',
        tech: [],
      };

      (mockedApiClient.axios.post as any).mockRejectedValue({
        response: {
          status: 422,
          data: { detail: 'Validation error' },
        },
        statusCode: 422,
      });

      await expect(projectService.createProject(invalidData)).rejects.toThrow();
    });
  });

  describe('updateProject()', () => {
    it('should update project successfully', async () => {
      const updateData: ProjectUpdate = {
        name: 'Updated Title',
        description: 'Updated description',
      };

      const updatedProject: Project = {
        ...mockProject,
        ...updateData,
      };

      (mockedApiClient.axios.put as any).mockResolvedValue({
        data: updatedProject,
        status: 200,
      } as AxiosResponse);

      const project = await projectService.updateProject('test-project-123', updateData);

      expect(mockedApiClient.axios.put).toHaveBeenCalledWith('/projects/test-project-123', updateData);
      expect(project).not.toBeNull();
      expect(project?.name).toBe('Updated Title');
    });

    it('should return null for 404 error', async () => {
      (mockedApiClient.axios.put as any).mockRejectedValue({
        response: { status: 404 },
        statusCode: 404,
      });

      const project = await projectService.updateProject('nonexistent-id', { name: 'Test' });

      expect(project).toBeNull();
    });
  });

  describe('deleteProject()', () => {
    it('should delete project successfully', async () => {
      (mockedApiClient.axios.delete as any).mockResolvedValue({
        status: 204,
      } as AxiosResponse);

      const result = await projectService.deleteProject('test-project-123');

      expect(mockedApiClient.axios.delete).toHaveBeenCalledWith('/projects/test-project-123');
      expect(result).toBe(true);
    });

    it('should return false for 404 error', async () => {
      (mockedApiClient.axios.delete as any).mockRejectedValue({
        response: { status: 404 },
        statusCode: 404,
      });

      const result = await projectService.deleteProject('nonexistent-id');

      expect(result).toBe(false);
    });

    it('should throw error for other errors', async () => {
      (mockedApiClient.axios.delete as any).mockRejectedValue({
        response: { status: 500 },
        statusCode: 500,
      });

      await expect(projectService.deleteProject('test-id')).rejects.toThrow();
    });
  });

  describe('publishProject()', () => {
    it('should publish project successfully', async () => {
      const publishedProject: Project = {
        ...mockDraftProject,
        status: 'PUBLISHED',
        publishedAt: '2025-01-15',
      };

      (mockedApiClient.axios.post as any).mockResolvedValue({
        data: publishedProject,
        status: 200,
      } as AxiosResponse);

      const project = await projectService.publishProject('draft-project-456');

      expect(mockedApiClient.axios.post).toHaveBeenCalledWith('/projects/draft-project-456/publish');
      expect(project).not.toBeNull();
      expect(project?.status).toBe('published'); // Normalized
      expect(project?.publishedAt).toBe('2025-01-15');
    });

    it('should return null for 404 error', async () => {
      (mockedApiClient.axios.post as any).mockRejectedValue({
        response: { status: 404 },
        statusCode: 404,
      });

      const project = await projectService.publishProject('nonexistent-id');

      expect(project).toBeNull();
    });
  });

  describe('unpublishProject()', () => {
    it('should unpublish project successfully', async () => {
      const unpublishedProject: Project = {
        ...mockProject,
        status: 'DRAFT',
        publishedAt: '',
      };

      (mockedApiClient.axios.post as any).mockResolvedValue({
        data: unpublishedProject,
        status: 200,
      } as AxiosResponse);

      const project = await projectService.unpublishProject('test-project-123');

      expect(mockedApiClient.axios.post).toHaveBeenCalledWith('/projects/test-project-123/unpublish');
      expect(project).not.toBeNull();
      expect(project?.status).toBe('draft'); // Normalized
    });

    it('should return null for 404 error', async () => {
      (mockedApiClient.axios.post as any).mockRejectedValue({
        response: { status: 404 },
        statusCode: 404,
      });

      const project = await projectService.unpublishProject('nonexistent-id');

      expect(project).toBeNull();
    });
  });
});
