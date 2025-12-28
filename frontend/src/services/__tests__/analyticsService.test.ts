/**
 * Tests for analytics service.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { analyticsService } from '../analyticsService';
import { apiClient } from '@/lib/apiClient';
import type {
  TrackViewResponse,
  TotalViewsResponse,
  TopContentStats,
  AnalyticsOverview,
  PageView,
  BlogPostStats,
} from '@/types/analytics';

// Mock apiClient
vi.mock('@/lib/apiClient', () => ({
  apiClient: {
    axios: {
      get: vi.fn(),
      post: vi.fn(),
    },
  },
}));

const mockedApiClient = vi.mocked(apiClient);

describe('analyticsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear session storage before each test
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  describe('trackView()', () => {
    it('should track view successfully', async () => {
      const mockResponse: TrackViewResponse = { views: 1, tracked: true };
      (mockedApiClient.axios.post as any).mockResolvedValue({
        data: mockResponse,
        status: 200,
      });

      const result = await analyticsService.trackView('blog', 'post-123');

      expect(result).toEqual(mockResponse);
      expect(mockedApiClient.axios.post).toHaveBeenCalledWith('/analytics/track/blog/post-123', {});
      expect(sessionStorage.getItem('view_tracked_blog_post-123')).toBe('true');
    });

    it('should not track view if already tracked in session', async () => {
      // Mark as tracked in session storage
      sessionStorage.setItem('view_tracked_project_proj-456', 'true');

      (mockedApiClient.axios.get as any).mockResolvedValue({
        data: { views: 5 },
        status: 200,
      });

      const result = await analyticsService.trackView('project', 'proj-456');

      expect(result).toEqual({ views: 5, tracked: false });
      expect(mockedApiClient.axios.post).not.toHaveBeenCalled();
      expect(mockedApiClient.axios.get).toHaveBeenCalledWith('/analytics/views/project/proj-456');
    });

    it('should track view with custom session_id', async () => {
      const mockResponse: TrackViewResponse = { views: 2, tracked: true };
      (mockedApiClient.axios.post as any).mockResolvedValue({
        data: mockResponse,
        status: 200,
      });

      const result = await analyticsService.trackView('certification', 'cert-789', {
        session_id: 'custom-session',
      });

      expect(result).toEqual(mockResponse);
      expect(mockedApiClient.axios.post).toHaveBeenCalledWith(
        '/analytics/track/certification/cert-789',
        { session_id: 'custom-session' }
      );
    });

    it('should not mark as tracked if backend returns tracked: false', async () => {
      const mockResponse: TrackViewResponse = { views: 3, tracked: false };
      (mockedApiClient.axios.post as any).mockResolvedValue({
        data: mockResponse,
        status: 200,
      });

      await analyticsService.trackView('blog', 'post-999');

      expect(sessionStorage.getItem('view_tracked_blog_post-999')).toBeNull();
    });
  });

  describe('getViewCount()', () => {
    it('should get view count for blog post', async () => {
      (mockedApiClient.axios.get as any).mockResolvedValue({
        data: { views: 42 },
        status: 200,
      });

      const result = await analyticsService.getViewCount('blog', 'post-123');

      expect(result).toBe(42);
      expect(mockedApiClient.axios.get).toHaveBeenCalledWith('/analytics/views/blog/post-123');
    });

    it('should get view count for project', async () => {
      (mockedApiClient.axios.get as any).mockResolvedValue({
        data: { views: 15 },
        status: 200,
      });

      const result = await analyticsService.getViewCount('project', 'proj-456');

      expect(result).toBe(15);
    });

    it('should handle zero views', async () => {
      (mockedApiClient.axios.get as any).mockResolvedValue({
        data: { views: 0 },
        status: 200,
      });

      const result = await analyticsService.getViewCount('certification', 'cert-789');

      expect(result).toBe(0);
    });
  });

  describe('getTotalViews()', () => {
    it('should get total views successfully', async () => {
      const mockResponse: TotalViewsResponse = { totalViews: 1000 };
      (mockedApiClient.axios.get as any).mockResolvedValue({
        data: mockResponse,
        status: 200,
      });

      const result = await analyticsService.getTotalViews();

      expect(result).toBe(1000);
      expect(mockedApiClient.axios.get).toHaveBeenCalledWith('/analytics/views/total');
    });

    it('should handle zero total views', async () => {
      (mockedApiClient.axios.get as any).mockResolvedValue({
        data: { totalViews: 0 },
        status: 200,
      });

      const result = await analyticsService.getTotalViews();

      expect(result).toBe(0);
    });
  });

  describe('getTopContent()', () => {
    it('should get top content successfully', async () => {
      const mockStats: TopContentStats = {
        blogs: [{ contentId: 'post-1', views: 100 }],
        projects: [{ contentId: 'proj-1', views: 50 }],
        certifications: [{ contentId: 'cert-1', views: 25 }],
      };
      (mockedApiClient.axios.get as any).mockResolvedValue({
        data: mockStats,
        status: 200,
      });

      const result = await analyticsService.getTopContent();

      expect(result).toEqual(mockStats);
      expect(mockedApiClient.axios.get).toHaveBeenCalledWith('/analytics/top-content', {
        params: {},
      });
    });

    it('should get top content with limit parameter', async () => {
      const mockStats: TopContentStats = {
        blogs: [{ contentId: 'post-1', views: 100 }],
        projects: [],
        certifications: [],
      };
      (mockedApiClient.axios.get as any).mockResolvedValue({
        data: mockStats,
        status: 200,
      });

      const result = await analyticsService.getTopContent({ limit: 5 });

      expect(result).toEqual(mockStats);
      expect(mockedApiClient.axios.get).toHaveBeenCalledWith('/analytics/top-content', {
        params: { limit: 5 },
      });
    });
  });

  describe('getAnalyticsOverview()', () => {
    it('should get analytics overview successfully', async () => {
      const mockOverview: AnalyticsOverview = {
        total_views: 500,
        unique_visitors: 200,
        top_pages: [
          { page_path: '/blog/post-1', view_count: 100, unique_visitors: 80 },
        ],
        recent_activity: [],
      };
      (mockedApiClient.axios.get as any).mockResolvedValue({
        data: mockOverview,
        status: 200,
      });

      const result = await analyticsService.getAnalyticsOverview();

      expect(result).toEqual(mockOverview);
      expect(mockedApiClient.axios.get).toHaveBeenCalledWith('/analytics/overview', {
        params: {},
      });
    });

    it('should get analytics overview with days parameter', async () => {
      const mockOverview: AnalyticsOverview = {
        total_views: 100,
        unique_visitors: 50,
        top_pages: [],
        recent_activity: [],
      };
      (mockedApiClient.axios.get as any).mockResolvedValue({
        data: mockOverview,
        status: 200,
      });

      const result = await analyticsService.getAnalyticsOverview({ days: 7 });

      expect(result).toEqual(mockOverview);
      expect(mockedApiClient.axios.get).toHaveBeenCalledWith('/analytics/overview', {
        params: { days: 7 },
      });
    });
  });

  describe('getPageAnalytics()', () => {
    it('should get page analytics successfully', async () => {
      const mockPages: PageView[] = [
        { page_path: '/blog/post-1', view_count: 100, unique_visitors: 80 },
        { page_path: '/projects/proj-1', view_count: 50, unique_visitors: 40 },
      ];
      (mockedApiClient.axios.get as any).mockResolvedValue({
        data: mockPages,
        status: 200,
      });

      const result = await analyticsService.getPageAnalytics();

      expect(result).toEqual(mockPages);
      expect(mockedApiClient.axios.get).toHaveBeenCalledWith('/analytics/pages', {
        params: {},
      });
    });

    it('should get page analytics with content_type parameter', async () => {
      const mockPages: PageView[] = [
        { page_path: '/blog/post-1', view_count: 100, unique_visitors: 80 },
      ];
      (mockedApiClient.axios.get as any).mockResolvedValue({
        data: mockPages,
        status: 200,
      });

      const result = await analyticsService.getPageAnalytics({ content_type: 'blog' });

      expect(result).toEqual(mockPages);
      expect(mockedApiClient.axios.get).toHaveBeenCalledWith('/analytics/pages', {
        params: { content_type: 'blog' },
      });
    });
  });

  describe('getBlogPostStats()', () => {
    it('should get blog post stats successfully', async () => {
      const mockStats: BlogPostStats = {
        post_id: 'post-123',
        title: 'Test Blog Post',
        view_count: 100,
        unique_visitors: 80,
        average_time_on_page: 120,
        bounce_rate: 0.3,
      };
      (mockedApiClient.axios.get as any).mockResolvedValue({
        data: mockStats,
        status: 200,
      });

      const result = await analyticsService.getBlogPostStats('post-123');

      expect(result).toEqual(mockStats);
      expect(mockedApiClient.axios.get).toHaveBeenCalledWith('/analytics/blog/post-123/stats');
    });
  });

  describe('error handling', () => {
    it('should handle network errors on trackView', async () => {
      const error = new Error('Network error');
      (mockedApiClient.axios.post as any).mockRejectedValue(error);

      await expect(analyticsService.trackView('blog', 'post-123')).rejects.toThrow('Network error');
    });

    it('should handle network errors on getViewCount', async () => {
      const error = new Error('Network error');
      (mockedApiClient.axios.get as any).mockRejectedValue(error);

      await expect(analyticsService.getViewCount('blog', 'post-123')).rejects.toThrow(
        'Network error'
      );
    });

    it('should handle network errors on getTotalViews', async () => {
      const error = new Error('Network error');
      (mockedApiClient.axios.get as any).mockRejectedValue(error);

      await expect(analyticsService.getTotalViews()).rejects.toThrow('Network error');
    });

    it('should handle network errors on getTopContent', async () => {
      const error = new Error('Network error');
      (mockedApiClient.axios.get as any).mockRejectedValue(error);

      await expect(analyticsService.getTopContent()).rejects.toThrow('Network error');
    });

    it('should handle network errors on getAnalyticsOverview', async () => {
      const error = new Error('Network error');
      (mockedApiClient.axios.get as any).mockRejectedValue(error);

      await expect(analyticsService.getAnalyticsOverview()).rejects.toThrow('Network error');
    });

    it('should handle network errors on getPageAnalytics', async () => {
      const error = new Error('Network error');
      (mockedApiClient.axios.get as any).mockRejectedValue(error);

      await expect(analyticsService.getPageAnalytics()).rejects.toThrow('Network error');
    });

    it('should handle network errors on getBlogPostStats', async () => {
      const error = new Error('Network error');
      (mockedApiClient.axios.get as any).mockRejectedValue(error);

      await expect(analyticsService.getBlogPostStats('post-123')).rejects.toThrow('Network error');
    });
  });
});
