/**
 * Project Service - API integration for projects.
 *
 * Provides type-safe methods for project CRUD operations
 * using the Axios HTTP client.
 */

import { apiClient } from '@/lib/apiClient';
import {
  Project,
  ProjectNormalized,
  ProjectCreate,
  ProjectUpdate,
  ProjectListParams,
  ProjectListResponse,
} from '@/types/project';

/**
 * Normalize project status from backend (UPPERCASE) to frontend (lowercase).
 */
function normalizeProject(project: Project): ProjectNormalized {
  return {
    ...project,
    status: project.status.toLowerCase() as 'published' | 'draft',
  };
}

/**
 * Project service for API operations.
 */
export const projectService = {
  /**
   * Fetch all projects with optional filtering.
   *
   * @param params - Query parameters (status, featured, limit, offset)
   * @returns Array of normalized projects
   */
  async getAllProjects(params?: ProjectListParams): Promise<ProjectNormalized[]> {
    const response = await apiClient.axios.get<Project[] | ProjectListResponse>('/projects', {
      params,
    });

    // Handle both array and paginated response formats
    const projects: Project[] = Array.isArray(response.data)
      ? response.data
      : response.data.items || (response.data as any).projects || [];

    return projects.map(normalizeProject);
  },

  /**
   * Fetch only published projects.
   *
   * @returns Array of published projects
   */
  async getPublishedProjects(): Promise<ProjectNormalized[]> {
    return this.getAllProjects({ status: 'published' });
  },

  /**
   * Fetch only draft projects (requires authentication).
   *
   * @returns Array of draft projects
   */
  async getDraftProjects(): Promise<ProjectNormalized[]> {
    return this.getAllProjects({ status: 'draft' });
  },

  /**
   * Fetch only featured projects.
   *
   * @returns Array of featured projects
   */
  async getFeaturedProjects(): Promise<ProjectNormalized[]> {
    return this.getAllProjects({ featured: true });
  },

  /**
   * Fetch single project by ID.
   *
   * @param id - Project ID
   * @returns Normalized project or null if not found
   */
  async getProjectById(id: string): Promise<ProjectNormalized | null> {
    try {
      const response = await apiClient.axios.get<Project>(`/projects/${id}`);
      return normalizeProject(response.data);
    } catch (error: any) {
      // Return null for 404, throw for other errors
      if (error?.response?.status === 404 || error?.statusCode === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Create new project (requires authentication).
   *
   * @param data - Project creation data
   * @returns Created project (as draft)
   */
  async createProject(data: ProjectCreate): Promise<ProjectNormalized> {
    const response = await apiClient.axios.post<Project>('/projects', data);
    return normalizeProject(response.data);
  },

  /**
   * Update existing project (requires authentication).
   *
   * @param id - Project ID
   * @param data - Partial update data
   * @returns Updated project or null if not found
   */
  async updateProject(id: string, data: ProjectUpdate): Promise<ProjectNormalized | null> {
    try {
      const response = await apiClient.axios.put<Project>(`/projects/${id}`, data);
      return normalizeProject(response.data);
    } catch (error: any) {
      if (error?.response?.status === 404 || error?.statusCode === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Delete project (requires authentication).
   *
   * @param id - Project ID
   * @returns True if deleted, false if not found
   */
  async deleteProject(id: string): Promise<boolean> {
    try {
      await apiClient.axios.delete(`/projects/${id}`);
      return true;
    } catch (error: any) {
      if (error?.response?.status === 404 || error?.statusCode === 404) {
        return false;
      }
      throw error;
    }
  },

  /**
   * Publish project (change status from draft to published).
   * Requires authentication.
   *
   * @param id - Project ID
   * @returns Published project or null if not found
   */
  async publishProject(id: string): Promise<ProjectNormalized | null> {
    try {
      const response = await apiClient.axios.post<Project>(`/projects/${id}/publish`);
      return normalizeProject(response.data);
    } catch (error: any) {
      if (error?.response?.status === 404 || error?.statusCode === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Unpublish project (change status from published to draft).
   * Requires authentication.
   *
   * @param id - Project ID
   * @returns Unpublished project or null if not found
   */
  async unpublishProject(id: string): Promise<ProjectNormalized | null> {
    try {
      const response = await apiClient.axios.post<Project>(`/projects/${id}/unpublish`);
      return normalizeProject(response.data);
    } catch (error: any) {
      if (error?.response?.status === 404 || error?.statusCode === 404) {
        return null;
      }
      throw error;
    }
  },
};
