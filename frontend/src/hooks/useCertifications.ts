/**
 * React Query hooks for certification data management.
 *
 * Provides hooks for fetching, creating, updating, and deleting certifications.
 * Handles caching, loading states, and automatic refetching.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { certificationService } from '@/services/certificationService';
import {
  CertificationNormalized,
  CertificationCreate,
  CertificationUpdate,
  CertificationListParams,
} from '@/types/certification';
import { useToast } from '@/hooks/use-toast';

/**
 * Query key factory for certifications.
 */
export const certificationKeys = {
  all: ['certifications'] as const,
  lists: () => [...certificationKeys.all, 'list'] as const,
  list: (params?: CertificationListParams) => [...certificationKeys.lists(), params] as const,
  details: () => [...certificationKeys.all, 'detail'] as const,
  detail: (id: string) => [...certificationKeys.details(), id] as const,
};

/**
 * Hook to fetch certifications with optional filters.
 *
 * @param params - Optional query parameters for filtering
 * @param enabled - Whether to enable the query (default: true)
 */
export function useCertifications(params?: CertificationListParams, enabled: boolean = true) {
  return useQuery({
    queryKey: certificationKeys.list(params),
    queryFn: () => certificationService.getAllCertifications(params),
    enabled,
  });
}

/**
 * Hook to fetch a single certification by ID.
 *
 * @param id - Certification ID
 * @param enabled - Whether to enable the query (default: true)
 */
export function useCertification(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: certificationKeys.detail(id),
    queryFn: () => certificationService.getCertificationById(id),
    enabled: enabled && !!id,
    retry: (failureCount, error: any) => {
      // Don't retry on 404 errors
      if (error?.statusCode === 404 || error?.response?.status === 404) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

/**
 * Hook to fetch featured certifications.
 */
export function useFeaturedCertifications() {
  return useQuery({
    queryKey: certificationKeys.list({ featured: true }),
    queryFn: () => certificationService.getFeaturedCertifications(),
  });
}

/**
 * Hook to fetch certifications by type.
 *
 * @param type - certification or course
 */
export function useCertificationsByType(type: 'certification' | 'course') {
  return useQuery({
    queryKey: certificationKeys.list({ type }),
    queryFn: () => certificationService.getCertificationsByType(type),
  });
}

/**
 * Hook to create a new certification.
 */
export function useCreateCertification() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CertificationCreate) => certificationService.createCertification(data),
    onSuccess: () => {
      // Invalidate all certification lists to trigger refetch
      queryClient.invalidateQueries({ queryKey: certificationKeys.lists() });
      toast({
        title: 'Success',
        description: 'Certification created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to create certification',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to update an existing certification.
 */
export function useUpdateCertification() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CertificationUpdate }) =>
      certificationService.updateCertification(id, data),
    onSuccess: (data, variables) => {
      // Invalidate the specific certification and all lists
      queryClient.invalidateQueries({ queryKey: certificationKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: certificationKeys.lists() });
      toast({
        title: 'Success',
        description: 'Certification updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to update certification',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to delete a certification.
 */
export function useDeleteCertification() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => certificationService.deleteCertification(id),
    onSuccess: (_, id) => {
      // Remove from cache and invalidate lists
      queryClient.removeQueries({ queryKey: certificationKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: certificationKeys.lists() });
      toast({
        title: 'Success',
        description: 'Certification deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to delete certification',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to publish a certification.
 */
export function usePublishCertification() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => certificationService.publishCertification(id),
    onSuccess: (data, id) => {
      // Invalidate the specific certification and all lists
      queryClient.invalidateQueries({ queryKey: certificationKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: certificationKeys.lists() });
      toast({
        title: 'Success',
        description: 'Certification published successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to publish certification',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to unpublish a certification.
 */
export function useUnpublishCertification() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => certificationService.unpublishCertification(id),
    onSuccess: (data, id) => {
      // Invalidate the specific certification and all lists
      queryClient.invalidateQueries({ queryKey: certificationKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: certificationKeys.lists() });
      toast({
        title: 'Success',
        description: 'Certification unpublished successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to unpublish certification',
        variant: 'destructive',
      });
    },
  });
}
