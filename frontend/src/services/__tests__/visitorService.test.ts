/**
 * Tests for visitor service.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { visitorService } from '../visitorService';
import { apiClient } from '@/lib/apiClient';
import type { VisitorCount, VisitorTrackResponse, DailyVisitors, MonthlyVisitors } from '@/types/analytics';

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

describe('visitorService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('trackVisitor()', () => {
    it('should track visitor successfully', async () => {
      const mockResponse: VisitorTrackResponse = {
        message: 'Visitor tracked successfully',
        sessionId: 'abc-123',
        count: 1,
      };
      (mockedApiClient.axios.post as any).mockResolvedValue({
        data: mockResponse,
        status: 200,
      });

      const result = await visitorService.trackVisitor({
        page_path: '/',
        referrer: 'https://google.com',
      });

      expect(result).toEqual(mockResponse);
      expect(mockedApiClient.axios.post).toHaveBeenCalledWith('/visitors/track', {
        page_path: '/',
        referrer: 'https://google.com',
      });
    });

    it('should track visitor without referrer', async () => {
      const mockResponse: VisitorTrackResponse = {
        message: 'Visitor tracked successfully',
        sessionId: 'def-456',
        count: 2,
      };
      (mockedApiClient.axios.post as any).mockResolvedValue({
        data: mockResponse,
        status: 200,
      });

      const result = await visitorService.trackVisitor({
        page_path: '/blog',
      });

      expect(result).toEqual(mockResponse);
      expect(mockedApiClient.axios.post).toHaveBeenCalledWith('/visitors/track', {
        page_path: '/blog',
      });
    });
  });

  describe('getVisitorCount()', () => {
    it('should get visitor count successfully', async () => {
      const mockCount: VisitorCount = {
        total_visitors: 42,
        last_updated: '2025-01-01T12:00:00Z',
      };
      (mockedApiClient.axios.get as any).mockResolvedValue({
        data: mockCount,
        status: 200,
      });

      const result = await visitorService.getVisitorCount();

      expect(result).toEqual(mockCount);
      expect(mockedApiClient.axios.get).toHaveBeenCalledWith('/visitors/count');
    });

    it('should handle zero count', async () => {
      const mockCount: VisitorCount = {
        total_visitors: 0,
        last_updated: '2025-01-01T12:00:00Z',
      };
      (mockedApiClient.axios.get as any).mockResolvedValue({
        data: mockCount,
        status: 200,
      });

      const result = await visitorService.getVisitorCount();

      expect(result).toEqual(mockCount);
    });
  });

  describe('getDailyTrends()', () => {
    it('should get daily trends successfully', async () => {
      const mockTrends: DailyVisitors[] = [
        { date: '2025-01-01', visitors: 10 },
        { date: '2025-01-02', visitors: 15 },
      ];
      (mockedApiClient.axios.get as any).mockResolvedValue({
        data: mockTrends,
        status: 200,
      });

      const result = await visitorService.getDailyTrends();

      expect(result).toEqual(mockTrends);
      expect(mockedApiClient.axios.get).toHaveBeenCalledWith('/visitors/trends/daily', {
        params: {},
      });
    });

    it('should get daily trends with days parameter', async () => {
      const mockTrends: DailyVisitors[] = [
        { date: '2025-01-01', visitors: 10 },
      ];
      (mockedApiClient.axios.get as any).mockResolvedValue({
        data: mockTrends,
        status: 200,
      });

      const result = await visitorService.getDailyTrends({ days: 7 });

      expect(result).toEqual(mockTrends);
      expect(mockedApiClient.axios.get).toHaveBeenCalledWith('/visitors/trends/daily', {
        params: { days: 7 },
      });
    });

    it('should handle empty trends', async () => {
      (mockedApiClient.axios.get as any).mockResolvedValue({
        data: [],
        status: 200,
      });

      const result = await visitorService.getDailyTrends();

      expect(result).toEqual([]);
    });
  });

  describe('getMonthlyTrends()', () => {
    it('should get monthly trends successfully', async () => {
      const mockTrends: MonthlyVisitors[] = [
        { month: '2025-01', visitors: 300 },
        { month: '2025-02', visitors: 400 },
      ];
      (mockedApiClient.axios.get as any).mockResolvedValue({
        data: mockTrends,
        status: 200,
      });

      const result = await visitorService.getMonthlyTrends();

      expect(result).toEqual(mockTrends);
      expect(mockedApiClient.axios.get).toHaveBeenCalledWith('/visitors/trends/monthly', {
        params: {},
      });
    });

    it('should get monthly trends with months parameter', async () => {
      const mockTrends: MonthlyVisitors[] = [
        { month: '2025-01', visitors: 300 },
      ];
      (mockedApiClient.axios.get as any).mockResolvedValue({
        data: mockTrends,
        status: 200,
      });

      const result = await visitorService.getMonthlyTrends({ months: 6 });

      expect(result).toEqual(mockTrends);
      expect(mockedApiClient.axios.get).toHaveBeenCalledWith('/visitors/trends/monthly', {
        params: { months: 6 },
      });
    });

    it('should handle empty trends', async () => {
      (mockedApiClient.axios.get as any).mockResolvedValue({
        data: [],
        status: 200,
      });

      const result = await visitorService.getMonthlyTrends();

      expect(result).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('should handle network errors on trackVisitor', async () => {
      const error = new Error('Network error');
      (mockedApiClient.axios.post as any).mockRejectedValue(error);

      await expect(visitorService.trackVisitor({ page_path: '/' })).rejects.toThrow('Network error');
    });

    it('should handle network errors on getVisitorCount', async () => {
      const error = new Error('Network error');
      (mockedApiClient.axios.get as any).mockRejectedValue(error);

      await expect(visitorService.getVisitorCount()).rejects.toThrow('Network error');
    });

    it('should handle network errors on getDailyTrends', async () => {
      const error = new Error('Network error');
      (mockedApiClient.axios.get as any).mockRejectedValue(error);

      await expect(visitorService.getDailyTrends()).rejects.toThrow('Network error');
    });

    it('should handle network errors on getMonthlyTrends', async () => {
      const error = new Error('Network error');
      (mockedApiClient.axios.get as any).mockRejectedValue(error);

      await expect(visitorService.getMonthlyTrends()).rejects.toThrow('Network error');
    });
  });
});
