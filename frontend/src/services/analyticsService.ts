/**
 * Analytics service.
 *
 * Handles API calls for content view tracking and analytics.
 */

import { apiClient } from '@/lib/apiClient';
import {
  ContentType,
  TrackViewRequest,
  TrackViewResponse,
  TotalViewsResponse,
  TopContentStats,
  TopContentParams,
  AnalyticsOverview,
  AnalyticsOverviewParams,
  PageView,
  PageAnalyticsParams,
  BlogPostStats,
} from '@/types/analytics';

/**
 * Session storage key prefix for tracking content views.
 */
const VIEW_TRACKED_PREFIX = 'view_tracked_';

/**
 * Check if a specific content view has been tracked in this session.
 */
function isViewTracked(contentType: ContentType, contentId: string): boolean {
  const key = `${VIEW_TRACKED_PREFIX}${contentType}_${contentId}`;
  return sessionStorage.getItem(key) === 'true';
}

/**
 * Mark a specific content view as tracked in this session.
 */
function markViewTracked(contentType: ContentType, contentId: string): void {
  const key = `${VIEW_TRACKED_PREFIX}${contentType}_${contentId}`;
  sessionStorage.setItem(key, 'true');
}

class AnalyticsService {
  /**
   * Track a content view.
   * Uses session storage to prevent duplicate tracking in the same session.
   */
  async trackView(
    contentType: ContentType,
    contentId: string,
    request: TrackViewRequest = {}
  ): Promise<TrackViewResponse> {
    // Check if already tracked in this session
    if (isViewTracked(contentType, contentId)) {
      // Return current view count without tracking again
      return {
        views: await this.getViewCount(contentType, contentId),
        tracked: false,
      };
    }

    const response = await apiClient.axios.post<TrackViewResponse>(
      `/analytics/track/${contentType}/${contentId}`,
      request
    );

    // Mark as tracked in session storage
    if (response.data.tracked) {
      markViewTracked(contentType, contentId);
    }

    return response.data;
  }

  /**
   * Get view count for a specific content item.
   */
  async getViewCount(contentType: ContentType, contentId: string): Promise<number> {
    const response = await apiClient.axios.get<{ views: number }>(
      `/analytics/views/${contentType}/${contentId}`
    );
    return response.data.views;
  }

  /**
   * Get total view count across all content.
   */
  async getTotalViews(): Promise<number> {
    const response = await apiClient.axios.get<TotalViewsResponse>('/analytics/views/total');
    return response.data.totalViews;
  }

  /**
   * Get top content statistics (owner only).
   */
  async getTopContent(params: TopContentParams = {}): Promise<TopContentStats> {
    const response = await apiClient.axios.get<TopContentStats>('/analytics/top-content', {
      params,
    });
    return response.data;
  }

  /**
   * Get analytics overview (owner only).
   */
  async getAnalyticsOverview(params: AnalyticsOverviewParams = {}): Promise<AnalyticsOverview> {
    const response = await apiClient.axios.get<AnalyticsOverview>('/analytics/overview', {
      params,
    });
    return response.data;
  }

  /**
   * Get page analytics (owner only).
   */
  async getPageAnalytics(params: PageAnalyticsParams = {}): Promise<PageView[]> {
    const response = await apiClient.axios.get<PageView[]>('/analytics/pages', {
      params,
    });
    return response.data;
  }

  /**
   * Get blog post statistics (owner only).
   */
  async getBlogPostStats(postId: string): Promise<BlogPostStats> {
    const response = await apiClient.axios.get<BlogPostStats>(`/analytics/blog/${postId}/stats`);
    return response.data;
  }
}

export const analyticsService = new AnalyticsService();
