/**
 * Integration tests for certification React Query hooks.
 *
 * Tests data fetching, caching, and mutation hooks.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import {
  useCertifications,
  useCertification,
  useCreateCertification,
  useUpdateCertification,
  useDeleteCertification,
  usePublishCertification,
  useUnpublishCertification,
  useFeaturedCertifications,
  useCertificationsByType,
} from '../useCertifications';
import { certificationService } from '@/services/certificationService';
import { CertificationNormalized, CertificationCreate } from '@/types/certification';

// Mock certificationService
vi.mock('@/services/certificationService', () => ({
  certificationService: {
    getAllCertifications: vi.fn(),
    getCertificationById: vi.fn(),
    createCertification: vi.fn(),
    updateCertification: vi.fn(),
    deleteCertification: vi.fn(),
    publishCertification: vi.fn(),
    unpublishCertification: vi.fn(),
    getFeaturedCertifications: vi.fn(),
    getCertificationsByType: vi.fn(),
  },
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

const mockedCertificationService = vi.mocked(certificationService);

// Test data
const mockCertification: CertificationNormalized = {
  id: 'test-cert-123',
  name: 'AWS Certified Solutions Architect',
  issuer: 'Amazon Web Services',
  type: 'certification',
  dateEarned: '2025-01-15',
  credentialUrl: 'https://aws.amazon.com/certification/certified-solutions-architect-associate',
  expiry_date: '2028-01-15',
  icon: 'aws',
  featured: true,
  status: 'published',
  createdAt: '2025-01-15T10:00:00Z',
  updatedAt: '2025-01-15T10:00:00Z',
  publishedAt: '2025-01-15',
};

const mockDraftCertification: CertificationNormalized = {
  ...mockCertification,
  id: 'draft-cert-456',
  name: 'Docker Fundamentals Course',
  issuer: 'Docker Inc',
  type: 'course',
  status: 'draft',
  featured: false,
  publishedAt: '',
};

describe('Certification React Query Hooks', () => {
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

  describe('useCertifications()', () => {
    it('should fetch all certifications successfully', async () => {
      mockedCertificationService.getAllCertifications.mockResolvedValue([mockCertification, mockDraftCertification]);

      const { result } = renderHook(() => useCertifications(), { wrapper });

      // Initially loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();

      // Wait for data to load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toHaveLength(2);
      expect(result.current.data?.[0].id).toBe('test-cert-123');
      expect(mockedCertificationService.getAllCertifications).toHaveBeenCalledWith(undefined);
    });

    it('should fetch certifications with query parameters', async () => {
      mockedCertificationService.getAllCertifications.mockResolvedValue([mockCertification]);

      const { result } = renderHook(
        () => useCertifications({ status: 'published', featured: true }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockedCertificationService.getAllCertifications).toHaveBeenCalledWith({
        status: 'published',
        featured: true,
      });
      expect(result.current.data).toHaveLength(1);
    });

    it('should handle error gracefully', async () => {
      mockedCertificationService.getAllCertifications.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useCertifications(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.data).toBeUndefined();
    });
  });

  describe('useCertification()', () => {
    it('should fetch single certification successfully', async () => {
      mockedCertificationService.getCertificationById.mockResolvedValue(mockCertification);

      const { result } = renderHook(() => useCertification('test-cert-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockCertification);
      expect(mockedCertificationService.getCertificationById).toHaveBeenCalledWith('test-cert-123');
    });

    it('should return null for non-existent certification', async () => {
      mockedCertificationService.getCertificationById.mockResolvedValue(null);

      const { result } = renderHook(() => useCertification('nonexistent-id'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeNull();
    });

    it('should not fetch when enabled is false', async () => {
      mockedCertificationService.getCertificationById.mockResolvedValue(mockCertification);

      const { result } = renderHook(() => useCertification('test-cert-123', false), { wrapper });

      // Should not call service
      expect(mockedCertificationService.getCertificationById).not.toHaveBeenCalled();
      expect(result.current.data).toBeUndefined();
    });

    it('should not retry on 404 errors', async () => {
      mockedCertificationService.getCertificationById.mockRejectedValue({
        statusCode: 404,
        message: 'Not found',
      });

      const { result } = renderHook(() => useCertification('test-id'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should only call once (no retries on 404)
      expect(mockedCertificationService.getCertificationById).toHaveBeenCalledTimes(1);
    });
  });

  describe('useFeaturedCertifications()', () => {
    it('should fetch featured certifications successfully', async () => {
      mockedCertificationService.getFeaturedCertifications.mockResolvedValue([mockCertification]);

      const { result } = renderHook(() => useFeaturedCertifications(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockedCertificationService.getFeaturedCertifications).toHaveBeenCalled();
      expect(result.current.data).toHaveLength(1);
      expect(result.current.data?.[0].featured).toBe(true);
    });
  });

  describe('useCertificationsByType()', () => {
    it('should fetch certifications by type successfully', async () => {
      mockedCertificationService.getCertificationsByType.mockResolvedValue([mockCertification]);

      const { result } = renderHook(() => useCertificationsByType('certification'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockedCertificationService.getCertificationsByType).toHaveBeenCalledWith('certification');
      expect(result.current.data).toHaveLength(1);
      expect(result.current.data?.[0].type).toBe('certification');
    });
  });

  describe('useCreateCertification()', () => {
    it('should create certification successfully', async () => {
      const newCertification: CertificationNormalized = {
        ...mockDraftCertification,
        id: 'new-cert-789',
      };

      mockedCertificationService.createCertification.mockResolvedValue(newCertification);

      const { result } = renderHook(() => useCreateCertification(), { wrapper });

      const createData: CertificationCreate = {
        name: 'New Certification',
        issuer: 'Test Issuer',
        type: 'certification',
        dateEarned: '2025-01-15',
      };

      await result.current.mutateAsync(createData);

      expect(mockedCertificationService.createCertification).toHaveBeenCalledWith(createData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('should invalidate certification lists on success', async () => {
      const newCertification: CertificationNormalized = mockDraftCertification;

      mockedCertificationService.createCertification.mockResolvedValue(newCertification);
      mockedCertificationService.getAllCertifications.mockResolvedValue([mockCertification]);

      // First render to populate cache
      const { result: listResult } = renderHook(() => useCertifications(), { wrapper });
      await waitFor(() => expect(listResult.current.isLoading).toBe(false));

      // Create new certification
      const { result: createResult } = renderHook(() => useCreateCertification(), { wrapper });
      await createResult.current.mutateAsync({
        name: 'New',
        issuer: 'Issuer',
        type: 'certification',
        dateEarned: '2025-01-15',
      });

      // Cache should be invalidated and refetch triggered
      await waitFor(() => {
        expect(mockedCertificationService.getAllCertifications).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('useUpdateCertification()', () => {
    it('should update certification successfully', async () => {
      const updatedCertification: CertificationNormalized = {
        ...mockCertification,
        name: 'Updated Name',
      };

      mockedCertificationService.updateCertification.mockResolvedValue(updatedCertification);

      const { result } = renderHook(() => useUpdateCertification(), { wrapper });

      await result.current.mutateAsync({
        id: 'test-cert-123',
        data: { name: 'Updated Name' },
      });

      expect(mockedCertificationService.updateCertification).toHaveBeenCalledWith('test-cert-123', {
        name: 'Updated Name',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('useDeleteCertification()', () => {
    it('should delete certification successfully', async () => {
      mockedCertificationService.deleteCertification.mockResolvedValue(true);

      const { result } = renderHook(() => useDeleteCertification(), { wrapper });

      await result.current.mutateAsync('test-cert-123');

      expect(mockedCertificationService.deleteCertification).toHaveBeenCalledWith('test-cert-123');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('should remove certification from cache on success', async () => {
      mockedCertificationService.deleteCertification.mockResolvedValue(true);
      mockedCertificationService.getCertificationById.mockResolvedValue(mockCertification);

      // Populate cache with certification
      const { result: certResult } = renderHook(() => useCertification('test-cert-123'), {
        wrapper,
      });
      await waitFor(() => expect(certResult.current.isLoading).toBe(false));

      // Delete certification
      const { result: deleteResult } = renderHook(() => useDeleteCertification(), { wrapper });
      await deleteResult.current.mutateAsync('test-cert-123');

      // Certification should be removed from cache
      const cachedData = queryClient.getQueryData(['certifications', 'detail', 'test-cert-123']);
      expect(cachedData).toBeUndefined();
    });
  });

  describe('usePublishCertification()', () => {
    it('should publish certification successfully', async () => {
      const publishedCertification: CertificationNormalized = {
        ...mockDraftCertification,
        status: 'published',
        publishedAt: '2025-01-15',
      };

      mockedCertificationService.publishCertification.mockResolvedValue(publishedCertification);

      const { result } = renderHook(() => usePublishCertification(), { wrapper });

      await result.current.mutateAsync('draft-cert-456');

      expect(mockedCertificationService.publishCertification).toHaveBeenCalledWith('draft-cert-456');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('useUnpublishCertification()', () => {
    it('should unpublish certification successfully', async () => {
      const unpublishedCertification: CertificationNormalized = {
        ...mockCertification,
        status: 'draft',
        publishedAt: '',
      };

      mockedCertificationService.unpublishCertification.mockResolvedValue(unpublishedCertification);

      const { result } = renderHook(() => useUnpublishCertification(), { wrapper });

      await result.current.mutateAsync('test-cert-123');

      expect(mockedCertificationService.unpublishCertification).toHaveBeenCalledWith('test-cert-123');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle mutation errors gracefully', async () => {
      mockedCertificationService.createCertification.mockRejectedValue({
        message: 'Validation error',
        detail: 'Name is required',
      });

      const { result } = renderHook(() => useCreateCertification(), { wrapper });

      await expect(
        result.current.mutateAsync({
          name: '',
          issuer: '',
          type: 'certification',
          dateEarned: '',
        })
      ).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });
});
