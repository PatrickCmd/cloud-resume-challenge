/**
 * Certification type definitions.
 *
 * Defines TypeScript interfaces for certification data structures
 * matching the backend API schema.
 */

/**
 * Certification entity from backend API (uppercase status).
 */
export interface Certification {
  id: string;
  name: string;
  issuer: string;
  type: 'certification' | 'course';
  dateEarned: string;
  credentialUrl?: string;
  expiry_date?: string;
  icon?: string;
  featured: boolean;
  status: 'PUBLISHED' | 'DRAFT';
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

/**
 * Normalized certification for frontend use (lowercase status).
 */
export interface CertificationNormalized {
  id: string;
  name: string;
  issuer: string;
  type: 'certification' | 'course';
  dateEarned: string;
  credentialUrl?: string;
  expiry_date?: string;
  icon?: string;
  featured: boolean;
  status: 'published' | 'draft';
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

/**
 * Data required to create a new certification.
 */
export interface CertificationCreate {
  name: string;
  issuer: string;
  type: 'certification' | 'course';
  dateEarned: string;
  credentialUrl?: string;
  expiry_date?: string;
  icon?: string;
  featured?: boolean;
}

/**
 * Data for updating an existing certification.
 */
export interface CertificationUpdate {
  name?: string;
  issuer?: string;
  type?: 'certification' | 'course';
  dateEarned?: string;
  credentialUrl?: string;
  expiry_date?: string;
  icon?: string;
  featured?: boolean;
}

/**
 * Paginated certification list response.
 */
export interface CertificationListResponse {
  items: Certification[];
  total: number;
  limit: number;
  last_key?: string;
}

/**
 * Query parameters for filtering and pagination.
 */
export interface CertificationListParams {
  status?: 'published' | 'draft' | 'all';
  type?: 'certification' | 'course';
  featured?: boolean;
  issuer?: string;
  limit?: number;
  last_key?: string;
}
