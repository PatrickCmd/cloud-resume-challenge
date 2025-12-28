/**
 * Project type definitions.
 *
 * Defines TypeScript interfaces for project data structures
 * matching the backend API schema.
 */

/**
 * Project entity from backend API (uppercase status).
 */
export interface Project {
  id: string;
  name: string;
  description: string;
  longDescription?: string;
  tech: string[];
  company?: string;
  githubUrl?: string;
  liveUrl?: string;
  imageUrl?: string;
  featured: boolean;
  status: 'PUBLISHED' | 'DRAFT';
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

/**
 * Normalized project for frontend use (lowercase status).
 */
export interface ProjectNormalized {
  id: string;
  name: string;
  description: string;
  longDescription?: string;
  tech: string[];
  company?: string;
  githubUrl?: string;
  liveUrl?: string;
  imageUrl?: string;
  featured: boolean;
  status: 'published' | 'draft';
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

/**
 * Data required to create a new project.
 */
export interface ProjectCreate {
  name: string;
  description: string;
  longDescription?: string;
  tech: string[];
  company?: string;
  githubUrl?: string;
  liveUrl?: string;
  imageUrl?: string;
  featured?: boolean;
}

/**
 * Data for updating an existing project.
 */
export interface ProjectUpdate {
  name?: string;
  description?: string;
  longDescription?: string;
  tech?: string[];
  company?: string;
  githubUrl?: string;
  liveUrl?: string;
  imageUrl?: string;
  featured?: boolean;
}

/**
 * Paginated project list response.
 */
export interface ProjectListResponse {
  items: Project[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Query parameters for filtering and pagination.
 */
export interface ProjectListParams {
  status?: 'published' | 'draft' | 'all';
  featured?: boolean;
  limit?: number;
  offset?: number;
}
