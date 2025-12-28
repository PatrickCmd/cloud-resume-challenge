/**
 * React Query hooks for visitor tracking and analytics.
 *
 * Provides data fetching and mutation hooks for visitor and analytics operations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { visitorService } from '@/services/visitorService';
import { analyticsService } from '@/services/analyticsService';
import {
  ContentType,
  TrackVisitorRequest,
  TrackViewRequest,
  DailyTrendsParams,
  MonthlyTrendsParams,
  TopContentParams,
  AnalyticsOverviewParams,
  PageAnalyticsParams,
} from '@/types/analytics';

// ============================================================================
// Query Keys
// ============================================================================

export const visitorKeys = {
  all: ['visitors'] as const,
  count: () => [...visitorKeys.all, 'count'] as const,
  dailyTrends: (params?: DailyTrendsParams) => [...visitorKeys.all, 'daily-trends', params] as const,
  monthlyTrends: (params?: MonthlyTrendsParams) => [...visitorKeys.all, 'monthly-trends', params] as const,
};

export const analyticsKeys = {
  all: ['analytics'] as const,
  viewCount: (contentType: ContentType, contentId: string) =>
    [...analyticsKeys.all, 'view-count', contentType, contentId] as const,
  totalViews: () => [...analyticsKeys.all, 'total-views'] as const,
  topContent: (params?: TopContentParams) => [...analyticsKeys.all, 'top-content', params] as const,
  overview: (params?: AnalyticsOverviewParams) => [...analyticsKeys.all, 'overview', params] as const,
  pageAnalytics: (params?: PageAnalyticsParams) => [...analyticsKeys.all, 'page-analytics', params] as const,
  blogStats: (postId: string) => [...analyticsKeys.all, 'blog-stats', postId] as const,
};

// ============================================================================
// Visitor Hooks
// ============================================================================

/**
 * Hook to get visitor count.
 */
export function useVisitorCount() {
  return useQuery({
    queryKey: visitorKeys.count(),
    queryFn: () => visitorService.getVisitorCount(),
  });
}

/**
 * Hook to track a visitor.
 */
export function useTrackVisitor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: TrackVisitorRequest) => visitorService.trackVisitor(request),
    onSuccess: () => {
      // Invalidate visitor count to refetch
      queryClient.invalidateQueries({ queryKey: visitorKeys.count() });
    },
  });
}

/**
 * Hook to get daily visitor trends (owner only).
 */
export function useDailyVisitorTrends(params?: DailyTrendsParams) {
  return useQuery({
    queryKey: visitorKeys.dailyTrends(params),
    queryFn: () => visitorService.getDailyTrends(params),
  });
}

/**
 * Hook to get monthly visitor trends (owner only).
 */
export function useMonthlyVisitorTrends(params?: MonthlyTrendsParams) {
  return useQuery({
    queryKey: visitorKeys.monthlyTrends(params),
    queryFn: () => visitorService.getMonthlyTrends(params),
  });
}

// ============================================================================
// Analytics Hooks
// ============================================================================

/**
 * Hook to get view count for a specific content item.
 */
export function useViewCount(contentType: ContentType, contentId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: analyticsKeys.viewCount(contentType, contentId),
    queryFn: () => analyticsService.getViewCount(contentType, contentId),
    enabled,
  });
}

/**
 * Hook to track a content view.
 */
export function useTrackView() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      contentType,
      contentId,
      request = {},
    }: {
      contentType: ContentType;
      contentId: string;
      request?: TrackViewRequest;
    }) => analyticsService.trackView(contentType, contentId, request),
    onSuccess: (_, variables) => {
      // Invalidate specific view count
      queryClient.invalidateQueries({
        queryKey: analyticsKeys.viewCount(variables.contentType, variables.contentId),
      });
      // Invalidate total views
      queryClient.invalidateQueries({ queryKey: analyticsKeys.totalViews() });
      // Invalidate top content
      queryClient.invalidateQueries({ queryKey: analyticsKeys.all });
    },
  });
}

/**
 * Hook to get total view count across all content.
 */
export function useTotalViews() {
  return useQuery({
    queryKey: analyticsKeys.totalViews(),
    queryFn: () => analyticsService.getTotalViews(),
  });
}

/**
 * Hook to get top content statistics (owner only).
 */
export function useTopContent(params?: TopContentParams) {
  return useQuery({
    queryKey: analyticsKeys.topContent(params),
    queryFn: () => analyticsService.getTopContent(params),
  });
}

/**
 * Hook to get analytics overview (owner only).
 */
export function useAnalyticsOverview(params?: AnalyticsOverviewParams) {
  return useQuery({
    queryKey: analyticsKeys.overview(params),
    queryFn: () => analyticsService.getAnalyticsOverview(params),
  });
}

/**
 * Hook to get page analytics (owner only).
 */
export function usePageAnalytics(params?: PageAnalyticsParams) {
  return useQuery({
    queryKey: analyticsKeys.pageAnalytics(params),
    queryFn: () => analyticsService.getPageAnalytics(params),
  });
}

/**
 * Hook to get blog post statistics (owner only).
 */
export function useBlogPostStats(postId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: analyticsKeys.blogStats(postId),
    queryFn: () => analyticsService.getBlogPostStats(postId),
    enabled,
  });
}
