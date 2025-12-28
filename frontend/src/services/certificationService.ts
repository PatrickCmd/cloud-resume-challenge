/**
 * Certification service for API interactions.
 *
 * Provides methods for CRUD operations on certifications.
 * Handles API communication and data transformation.
 */

import { apiClient } from '@/lib/apiClient';
import {
  Certification,
  CertificationNormalized,
  CertificationCreate,
  CertificationUpdate,
  CertificationListParams,
} from '@/types/certification';

/**
 * Normalize certification status from backend format (UPPERCASE) to frontend format (lowercase).
 */
function normalizeCertification(cert: Certification): CertificationNormalized {
  return {
    ...cert,
    status: cert.status.toLowerCase() as 'published' | 'draft',
  };
}

/**
 * Service for certification-related API calls.
 */
export const certificationService = {
  /**
   * Fetch all certifications with optional filters.
   */
  async getAllCertifications(params?: CertificationListParams): Promise<CertificationNormalized[]> {
    const response = await apiClient.axios.get<
      Certification[] | { items: Certification[] } | { certifications: Certification[] }
    >('/certifications', { params });

    let certifications: Certification[];

    // Handle different response formats
    if (Array.isArray(response.data)) {
      certifications = response.data;
    } else if ('items' in response.data) {
      certifications = response.data.items;
    } else if ('certifications' in response.data) {
      certifications = response.data.certifications;
    } else {
      certifications = [];
    }

    return certifications.map(normalizeCertification);
  },

  /**
   * Fetch only published certifications.
   */
  async getPublishedCertifications(): Promise<CertificationNormalized[]> {
    return this.getAllCertifications({ status: 'published' });
  },

  /**
   * Fetch only draft certifications.
   */
  async getDraftCertifications(): Promise<CertificationNormalized[]> {
    return this.getAllCertifications({ status: 'draft' });
  },

  /**
   * Fetch only featured certifications.
   */
  async getFeaturedCertifications(): Promise<CertificationNormalized[]> {
    return this.getAllCertifications({ featured: true });
  },

  /**
   * Fetch certifications by type.
   */
  async getCertificationsByType(type: 'certification' | 'course'): Promise<CertificationNormalized[]> {
    return this.getAllCertifications({ type });
  },

  /**
   * Fetch certifications by issuer.
   */
  async getCertificationsByIssuer(issuer: string): Promise<CertificationNormalized[]> {
    return this.getAllCertifications({ issuer });
  },

  /**
   * Fetch a single certification by ID.
   */
  async getCertificationById(id: string): Promise<CertificationNormalized | null> {
    try {
      const response = await apiClient.axios.get<Certification>(`/certifications/${id}`);
      return normalizeCertification(response.data);
    } catch (error: any) {
      // Return null for 404 errors (certification not found)
      if (error?.response?.status === 404 || error?.statusCode === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Create a new certification (draft by default).
   */
  async createCertification(data: CertificationCreate): Promise<CertificationNormalized> {
    const response = await apiClient.axios.post<Certification>('/certifications', data);
    return normalizeCertification(response.data);
  },

  /**
   * Update an existing certification.
   */
  async updateCertification(
    id: string,
    data: CertificationUpdate
  ): Promise<CertificationNormalized | null> {
    try {
      const response = await apiClient.axios.put<Certification>(`/certifications/${id}`, data);
      return normalizeCertification(response.data);
    } catch (error: any) {
      // Return null for 404 errors
      if (error?.response?.status === 404 || error?.statusCode === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Delete a certification.
   */
  async deleteCertification(id: string): Promise<boolean> {
    try {
      await apiClient.axios.delete(`/certifications/${id}`);
      return true;
    } catch (error: any) {
      // Return false for 404 errors
      if (error?.response?.status === 404 || error?.statusCode === 404) {
        return false;
      }
      throw error;
    }
  },

  /**
   * Publish a draft certification.
   */
  async publishCertification(id: string): Promise<CertificationNormalized | null> {
    try {
      const response = await apiClient.axios.post<Certification>(`/certifications/${id}/publish`);
      return normalizeCertification(response.data);
    } catch (error: any) {
      // Return null for 404 errors
      if (error?.response?.status === 404 || error?.statusCode === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Unpublish a published certification (convert to draft).
   */
  async unpublishCertification(id: string): Promise<CertificationNormalized | null> {
    try {
      const response = await apiClient.axios.post<Certification>(`/certifications/${id}/unpublish`);
      return normalizeCertification(response.data);
    } catch (error: any) {
      // Return null for 404 errors
      if (error?.response?.status === 404 || error?.statusCode === 404) {
        return null;
      }
      throw error;
    }
  },
};
