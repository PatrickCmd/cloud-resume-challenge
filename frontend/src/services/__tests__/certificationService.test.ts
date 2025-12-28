/**
 * Integration tests for certificationService.
 *
 * Tests certification CRUD operations with mocked API client.
 * Mirrors backend E2E tests (test_certifications_e2e.py) structure.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { certificationService } from '../certificationService';
import { Certification, CertificationCreate, CertificationUpdate } from '@/types/certification';
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
const mockCertification: Certification = {
  id: 'test-cert-123',
  name: 'AWS Certified Solutions Architect',
  issuer: 'Amazon Web Services',
  type: 'certification',
  dateEarned: '2025-01-15',
  credentialUrl: 'https://aws.amazon.com/certification/certified-solutions-architect-associate',
  expiry_date: '2028-01-15',
  icon: 'aws',
  featured: true,
  status: 'PUBLISHED',
  createdAt: '2025-01-15T10:00:00Z',
  updatedAt: '2025-01-15T10:00:00Z',
  publishedAt: '2025-01-15',
};

const mockDraftCertification: Certification = {
  ...mockCertification,
  id: 'draft-cert-456',
  name: 'Docker Fundamentals Course',
  issuer: 'Docker Inc',
  type: 'course',
  status: 'DRAFT',
  featured: false,
  publishedAt: '',
};

describe('certificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllCertifications()', () => {
    it('should fetch all certifications successfully', async () => {
      const mockResponse: Certification[] = [mockCertification, mockDraftCertification];

      (mockedApiClient.axios.get as any).mockResolvedValue({
        data: mockResponse,
        status: 200,
      } as AxiosResponse);

      const certifications = await certificationService.getAllCertifications();

      expect(mockedApiClient.axios.get).toHaveBeenCalledWith('/certifications', { params: undefined });
      expect(certifications).toHaveLength(2);
      expect(certifications[0].status).toBe('published'); // Normalized to lowercase
      expect(certifications[1].status).toBe('draft'); // Normalized to lowercase
    });

    it('should fetch certifications with query parameters', async () => {
      const mockResponse: Certification[] = [mockCertification];

      (mockedApiClient.axios.get as any).mockResolvedValue({
        data: mockResponse,
        status: 200,
      } as AxiosResponse);

      await certificationService.getAllCertifications({ status: 'published', featured: true });

      expect(mockedApiClient.axios.get).toHaveBeenCalledWith('/certifications', {
        params: { status: 'published', featured: true },
      });
    });

    it('should handle paginated response format', async () => {
      const mockResponse = {
        items: [mockCertification],
        total: 10,
        limit: 20,
        last_key: 'next-page-token',
      };

      (mockedApiClient.axios.get as any).mockResolvedValue({
        data: mockResponse,
        status: 200,
      } as AxiosResponse);

      const certifications = await certificationService.getAllCertifications();

      expect(certifications).toHaveLength(1);
      expect(certifications[0].id).toBe(mockCertification.id);
    });

    it('should handle alternative response format with "certifications" key', async () => {
      const mockResponse = {
        certifications: [mockCertification],
        total: 1,
      };

      (mockedApiClient.axios.get as any).mockResolvedValue({
        data: mockResponse,
        status: 200,
      } as AxiosResponse);

      const certifications = await certificationService.getAllCertifications();

      expect(certifications).toHaveLength(1);
      expect(certifications[0].id).toBe(mockCertification.id);
    });
  });

  describe('getPublishedCertifications()', () => {
    it('should fetch only published certifications', async () => {
      const mockResponse: Certification[] = [mockCertification];

      (mockedApiClient.axios.get as any).mockResolvedValue({
        data: mockResponse,
        status: 200,
      } as AxiosResponse);

      await certificationService.getPublishedCertifications();

      expect(mockedApiClient.axios.get).toHaveBeenCalledWith('/certifications', {
        params: { status: 'published' },
      });
    });
  });

  describe('getDraftCertifications()', () => {
    it('should fetch only draft certifications', async () => {
      const mockResponse: Certification[] = [mockDraftCertification];

      (mockedApiClient.axios.get as any).mockResolvedValue({
        data: mockResponse,
        status: 200,
      } as AxiosResponse);

      await certificationService.getDraftCertifications();

      expect(mockedApiClient.axios.get).toHaveBeenCalledWith('/certifications', {
        params: { status: 'draft' },
      });
    });
  });

  describe('getFeaturedCertifications()', () => {
    it('should fetch only featured certifications', async () => {
      const mockResponse: Certification[] = [mockCertification];

      (mockedApiClient.axios.get as any).mockResolvedValue({
        data: mockResponse,
        status: 200,
      } as AxiosResponse);

      await certificationService.getFeaturedCertifications();

      expect(mockedApiClient.axios.get).toHaveBeenCalledWith('/certifications', {
        params: { featured: true },
      });
    });
  });

  describe('getCertificationsByType()', () => {
    it('should fetch certifications by type', async () => {
      const mockResponse: Certification[] = [mockCertification];

      (mockedApiClient.axios.get as any).mockResolvedValue({
        data: mockResponse,
        status: 200,
      } as AxiosResponse);

      await certificationService.getCertificationsByType('certification');

      expect(mockedApiClient.axios.get).toHaveBeenCalledWith('/certifications', {
        params: { type: 'certification' },
      });
    });
  });

  describe('getCertificationsByIssuer()', () => {
    it('should fetch certifications by issuer', async () => {
      const mockResponse: Certification[] = [mockCertification];

      (mockedApiClient.axios.get as any).mockResolvedValue({
        data: mockResponse,
        status: 200,
      } as AxiosResponse);

      await certificationService.getCertificationsByIssuer('Amazon Web Services');

      expect(mockedApiClient.axios.get).toHaveBeenCalledWith('/certifications', {
        params: { issuer: 'Amazon Web Services' },
      });
    });
  });

  describe('getCertificationById()', () => {
    it('should fetch certification by ID successfully', async () => {
      (mockedApiClient.axios.get as any).mockResolvedValue({
        data: mockCertification,
        status: 200,
      } as AxiosResponse);

      const certification = await certificationService.getCertificationById('test-cert-123');

      expect(mockedApiClient.axios.get).toHaveBeenCalledWith('/certifications/test-cert-123');
      expect(certification).not.toBeNull();
      expect(certification?.id).toBe('test-cert-123');
      expect(certification?.status).toBe('published'); // Normalized
    });

    it('should return null for 404 error', async () => {
      (mockedApiClient.axios.get as any).mockRejectedValue({
        response: { status: 404 },
        statusCode: 404,
      });

      const certification = await certificationService.getCertificationById('nonexistent-id');

      expect(certification).toBeNull();
    });

    it('should throw error for non-404 errors', async () => {
      (mockedApiClient.axios.get as any).mockRejectedValue({
        response: { status: 500 },
        statusCode: 500,
        message: 'Internal Server Error',
      });

      await expect(certificationService.getCertificationById('test-id')).rejects.toThrow();
    });
  });

  describe('createCertification()', () => {
    it('should create certification successfully', async () => {
      const createData: CertificationCreate = {
        name: 'New Certification',
        issuer: 'Test Issuer',
        type: 'certification',
        dateEarned: '2025-01-15',
        featured: true,
      };

      const createdCertification: Certification = {
        ...mockCertification,
        ...createData,
        id: 'new-cert-789',
        status: 'DRAFT',
        publishedAt: '',
      };

      (mockedApiClient.axios.post as any).mockResolvedValue({
        data: createdCertification,
        status: 201,
      } as AxiosResponse);

      const certification = await certificationService.createCertification(createData);

      expect(mockedApiClient.axios.post).toHaveBeenCalledWith('/certifications', createData);
      expect(certification.id).toBe('new-cert-789');
      expect(certification.status).toBe('draft'); // Normalized
    });

    it('should handle validation errors', async () => {
      const invalidData: CertificationCreate = {
        name: '',
        issuer: '',
        type: 'certification',
        dateEarned: '',
      };

      (mockedApiClient.axios.post as any).mockRejectedValue({
        response: {
          status: 422,
          data: { detail: 'Validation error' },
        },
        statusCode: 422,
      });

      await expect(certificationService.createCertification(invalidData)).rejects.toThrow();
    });
  });

  describe('updateCertification()', () => {
    it('should update certification successfully', async () => {
      const updateData: CertificationUpdate = {
        name: 'Updated Name',
        issuer: 'Updated Issuer',
      };

      const updatedCertification: Certification = {
        ...mockCertification,
        ...updateData,
      };

      (mockedApiClient.axios.put as any).mockResolvedValue({
        data: updatedCertification,
        status: 200,
      } as AxiosResponse);

      const certification = await certificationService.updateCertification('test-cert-123', updateData);

      expect(mockedApiClient.axios.put).toHaveBeenCalledWith('/certifications/test-cert-123', updateData);
      expect(certification).not.toBeNull();
      expect(certification?.name).toBe('Updated Name');
    });

    it('should return null for 404 error', async () => {
      (mockedApiClient.axios.put as any).mockRejectedValue({
        response: { status: 404 },
        statusCode: 404,
      });

      const certification = await certificationService.updateCertification('nonexistent-id', { name: 'Test' });

      expect(certification).toBeNull();
    });
  });

  describe('deleteCertification()', () => {
    it('should delete certification successfully', async () => {
      (mockedApiClient.axios.delete as any).mockResolvedValue({
        status: 204,
      } as AxiosResponse);

      const result = await certificationService.deleteCertification('test-cert-123');

      expect(mockedApiClient.axios.delete).toHaveBeenCalledWith('/certifications/test-cert-123');
      expect(result).toBe(true);
    });

    it('should return false for 404 error', async () => {
      (mockedApiClient.axios.delete as any).mockRejectedValue({
        response: { status: 404 },
        statusCode: 404,
      });

      const result = await certificationService.deleteCertification('nonexistent-id');

      expect(result).toBe(false);
    });

    it('should throw error for other errors', async () => {
      (mockedApiClient.axios.delete as any).mockRejectedValue({
        response: { status: 500 },
        statusCode: 500,
      });

      await expect(certificationService.deleteCertification('test-id')).rejects.toThrow();
    });
  });

  describe('publishCertification()', () => {
    it('should publish certification successfully', async () => {
      const publishedCertification: Certification = {
        ...mockDraftCertification,
        status: 'PUBLISHED',
        publishedAt: '2025-01-15',
      };

      (mockedApiClient.axios.post as any).mockResolvedValue({
        data: publishedCertification,
        status: 200,
      } as AxiosResponse);

      const certification = await certificationService.publishCertification('draft-cert-456');

      expect(mockedApiClient.axios.post).toHaveBeenCalledWith('/certifications/draft-cert-456/publish');
      expect(certification).not.toBeNull();
      expect(certification?.status).toBe('published'); // Normalized
      expect(certification?.publishedAt).toBe('2025-01-15');
    });

    it('should return null for 404 error', async () => {
      (mockedApiClient.axios.post as any).mockRejectedValue({
        response: { status: 404 },
        statusCode: 404,
      });

      const certification = await certificationService.publishCertification('nonexistent-id');

      expect(certification).toBeNull();
    });
  });

  describe('unpublishCertification()', () => {
    it('should unpublish certification successfully', async () => {
      const unpublishedCertification: Certification = {
        ...mockCertification,
        status: 'DRAFT',
        publishedAt: '',
      };

      (mockedApiClient.axios.post as any).mockResolvedValue({
        data: unpublishedCertification,
        status: 200,
      } as AxiosResponse);

      const certification = await certificationService.unpublishCertification('test-cert-123');

      expect(mockedApiClient.axios.post).toHaveBeenCalledWith('/certifications/test-cert-123/unpublish');
      expect(certification).not.toBeNull();
      expect(certification?.status).toBe('draft'); // Normalized
    });

    it('should return null for 404 error', async () => {
      (mockedApiClient.axios.post as any).mockRejectedValue({
        response: { status: 404 },
        statusCode: 404,
      });

      const certification = await certificationService.unpublishCertification('nonexistent-id');

      expect(certification).toBeNull();
    });
  });
});
