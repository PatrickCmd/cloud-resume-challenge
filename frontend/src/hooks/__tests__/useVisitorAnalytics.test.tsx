/**
 * Tests for visitor and analytics hooks.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { visitorService } from '@/services/visitorService';
import { analyticsService } from '@/services/analyticsService';
import {
  useVisitorCount,
  useTrackVisitor,
  useDailyVisitorTrends,
  useMonthlyVisitorTrends,
  useViewCount,
  useTrackView,
  useTotalViews,
  useTopContent,
  useAnalyticsOverview,
  usePageAnalytics,
  useBlogPostStats,
} from '../useVisitorAnalytics';
import type {
  VisitorCount,
  VisitorTrackResponse,
  DailyVisitors,
  MonthlyVisitors,
  TrackViewResponse,
  TopContentStats,
  AnalyticsOverview,
  PageView,
  BlogPostStats,
} from '@/types/analytics';

// Mock services
vi.mock('@/services/visitorService');
vi.mock('@/services/analyticsService');

const mockedVisitorService = vi.mocked(visitorService);
const mockedAnalyticsService = vi.mocked(analyticsService);

// Mock toast
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('Visitor Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useVisitorCount()', () => {
    it('should fetch visitor count successfully', async () => {
      const mockCount: VisitorCount = {
        total_visitors: 42,
        last_updated: '2025-01-01T12:00:00Z',
      };
      mockedVisitorService.getVisitorCount.mockResolvedValue(mockCount);

      const { result } = renderHook(() => useVisitorCount(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockCount);
      expect(mockedVisitorService.getVisitorCount).toHaveBeenCalledOnce();
    });

    it('should handle errors', async () => {
      const error = new Error('Failed to fetch');
      mockedVisitorService.getVisitorCount.mockRejectedValue(error);

      const { result } = renderHook(() => useVisitorCount(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useTrackVisitor()', () => {
    it('should track visitor successfully', async () => {
      const mockResponse: VisitorTrackResponse = {
        message: 'Visitor tracked successfully',
        sessionId: 'abc-123',
        count: 1,
      };
      mockedVisitorService.trackVisitor.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useTrackVisitor(), { wrapper: createWrapper() });

      result.current.mutate({ page_path: '/', referrer: 'https://google.com' });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockResponse);
      expect(mockedVisitorService.trackVisitor).toHaveBeenCalledWith({
        page_path: '/',
        referrer: 'https://google.com',
      });
    });
  });

  describe('useDailyVisitorTrends()', () => {
    it('should fetch daily trends successfully', async () => {
      const mockTrends: DailyVisitors[] = [
        { date: '2025-01-01', visitors: 10 },
        { date: '2025-01-02', visitors: 15 },
      ];
      mockedVisitorService.getDailyTrends.mockResolvedValue(mockTrends);

      const { result } = renderHook(() => useDailyVisitorTrends(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockTrends);
      expect(mockedVisitorService.getDailyTrends).toHaveBeenCalledWith(undefined);
    });

    it('should fetch daily trends with days parameter', async () => {
      const mockTrends: DailyVisitors[] = [{ date: '2025-01-01', visitors: 10 }];
      mockedVisitorService.getDailyTrends.mockResolvedValue(mockTrends);

      const { result } = renderHook(() => useDailyVisitorTrends({ days: 7 }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockedVisitorService.getDailyTrends).toHaveBeenCalledWith({ days: 7 });
    });
  });

  describe('useMonthlyVisitorTrends()', () => {
    it('should fetch monthly trends successfully', async () => {
      const mockTrends: MonthlyVisitors[] = [
        { month: '2025-01', visitors: 300 },
        { month: '2025-02', visitors: 400 },
      ];
      mockedVisitorService.getMonthlyTrends.mockResolvedValue(mockTrends);

      const { result } = renderHook(() => useMonthlyVisitorTrends(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockTrends);
      expect(mockedVisitorService.getMonthlyTrends).toHaveBeenCalledWith(undefined);
    });

    it('should fetch monthly trends with months parameter', async () => {
      const mockTrends: MonthlyVisitors[] = [{ month: '2025-01', visitors: 300 }];
      mockedVisitorService.getMonthlyTrends.mockResolvedValue(mockTrends);

      const { result } = renderHook(() => useMonthlyVisitorTrends({ months: 6 }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockedVisitorService.getMonthlyTrends).toHaveBeenCalledWith({ months: 6 });
    });
  });
});

describe('Analytics Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useViewCount()', () => {
    it('should fetch view count successfully', async () => {
      mockedAnalyticsService.getViewCount.mockResolvedValue(42);

      const { result } = renderHook(() => useViewCount('blog', 'post-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBe(42);
      expect(mockedAnalyticsService.getViewCount).toHaveBeenCalledWith('blog', 'post-123');
    });

    it('should not fetch when disabled', async () => {
      const { result } = renderHook(() => useViewCount('blog', 'post-123', false), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isFetching).toBe(false);
      });

      expect(mockedAnalyticsService.getViewCount).not.toHaveBeenCalled();
    });
  });

  describe('useTrackView()', () => {
    it('should track view successfully', async () => {
      const mockResponse: TrackViewResponse = { views: 1, tracked: true };
      mockedAnalyticsService.trackView.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useTrackView(), { wrapper: createWrapper() });

      result.current.mutate({ contentType: 'blog', contentId: 'post-123' });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockResponse);
      expect(mockedAnalyticsService.trackView).toHaveBeenCalledWith('blog', 'post-123', {});
    });

    it('should track view with request payload', async () => {
      const mockResponse: TrackViewResponse = { views: 2, tracked: true };
      mockedAnalyticsService.trackView.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useTrackView(), { wrapper: createWrapper() });

      result.current.mutate({
        contentType: 'project',
        contentId: 'proj-456',
        request: { session_id: 'custom-session' },
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockedAnalyticsService.trackView).toHaveBeenCalledWith('project', 'proj-456', {
        session_id: 'custom-session',
      });
    });
  });

  describe('useTotalViews()', () => {
    it('should fetch total views successfully', async () => {
      mockedAnalyticsService.getTotalViews.mockResolvedValue(1000);

      const { result } = renderHook(() => useTotalViews(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBe(1000);
      expect(mockedAnalyticsService.getTotalViews).toHaveBeenCalledOnce();
    });
  });

  describe('useTopContent()', () => {
    it('should fetch top content successfully', async () => {
      const mockStats: TopContentStats = {
        blogs: [{ contentId: 'post-1', views: 100 }],
        projects: [{ contentId: 'proj-1', views: 50 }],
        certifications: [{ contentId: 'cert-1', views: 25 }],
      };
      mockedAnalyticsService.getTopContent.mockResolvedValue(mockStats);

      const { result } = renderHook(() => useTopContent(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockStats);
      expect(mockedAnalyticsService.getTopContent).toHaveBeenCalledWith(undefined);
    });

    it('should fetch top content with limit parameter', async () => {
      const mockStats: TopContentStats = {
        blogs: [],
        projects: [],
        certifications: [],
      };
      mockedAnalyticsService.getTopContent.mockResolvedValue(mockStats);

      const { result } = renderHook(() => useTopContent({ limit: 5 }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockedAnalyticsService.getTopContent).toHaveBeenCalledWith({ limit: 5 });
    });
  });

  describe('useAnalyticsOverview()', () => {
    it('should fetch analytics overview successfully', async () => {
      const mockOverview: AnalyticsOverview = {
        total_views: 500,
        unique_visitors: 200,
        top_pages: [{ page_path: '/blog/post-1', view_count: 100, unique_visitors: 80 }],
        recent_activity: [],
      };
      mockedAnalyticsService.getAnalyticsOverview.mockResolvedValue(mockOverview);

      const { result } = renderHook(() => useAnalyticsOverview(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockOverview);
      expect(mockedAnalyticsService.getAnalyticsOverview).toHaveBeenCalledWith(undefined);
    });

    it('should fetch analytics overview with days parameter', async () => {
      const mockOverview: AnalyticsOverview = {
        total_views: 100,
        unique_visitors: 50,
        top_pages: [],
        recent_activity: [],
      };
      mockedAnalyticsService.getAnalyticsOverview.mockResolvedValue(mockOverview);

      const { result } = renderHook(() => useAnalyticsOverview({ days: 7 }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockedAnalyticsService.getAnalyticsOverview).toHaveBeenCalledWith({ days: 7 });
    });
  });

  describe('usePageAnalytics()', () => {
    it('should fetch page analytics successfully', async () => {
      const mockPages: PageView[] = [
        { page_path: '/blog/post-1', view_count: 100, unique_visitors: 80 },
        { page_path: '/projects/proj-1', view_count: 50, unique_visitors: 40 },
      ];
      mockedAnalyticsService.getPageAnalytics.mockResolvedValue(mockPages);

      const { result } = renderHook(() => usePageAnalytics(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockPages);
      expect(mockedAnalyticsService.getPageAnalytics).toHaveBeenCalledWith(undefined);
    });

    it('should fetch page analytics with content_type parameter', async () => {
      const mockPages: PageView[] = [
        { page_path: '/blog/post-1', view_count: 100, unique_visitors: 80 },
      ];
      mockedAnalyticsService.getPageAnalytics.mockResolvedValue(mockPages);

      const { result } = renderHook(() => usePageAnalytics({ content_type: 'blog' }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockedAnalyticsService.getPageAnalytics).toHaveBeenCalledWith({ content_type: 'blog' });
    });
  });

  describe('useBlogPostStats()', () => {
    it('should fetch blog post stats successfully', async () => {
      const mockStats: BlogPostStats = {
        post_id: 'post-123',
        title: 'Test Blog Post',
        view_count: 100,
        unique_visitors: 80,
        average_time_on_page: 120,
        bounce_rate: 0.3,
      };
      mockedAnalyticsService.getBlogPostStats.mockResolvedValue(mockStats);

      const { result } = renderHook(() => useBlogPostStats('post-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockStats);
      expect(mockedAnalyticsService.getBlogPostStats).toHaveBeenCalledWith('post-123');
    });

    it('should not fetch when disabled', async () => {
      const { result } = renderHook(() => useBlogPostStats('post-123', false), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isFetching).toBe(false);
      });

      expect(mockedAnalyticsService.getBlogPostStats).not.toHaveBeenCalled();
    });
  });
});
