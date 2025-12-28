/**
 * Visitor tracking service.
 *
 * Handles API calls for visitor tracking and statistics.
 */

import { apiClient } from '@/lib/apiClient';
import {
  VisitorCount,
  VisitorTrackResponse,
  DailyVisitors,
  MonthlyVisitors,
  TrackVisitorRequest,
  DailyTrendsParams,
  MonthlyTrendsParams,
} from '@/types/analytics';

class VisitorService {
  /**
   * Track a visitor visit.
   */
  async trackVisitor(request: TrackVisitorRequest): Promise<VisitorTrackResponse> {
    const response = await apiClient.axios.post<VisitorTrackResponse>('/visitors/track', request);
    return response.data;
  }

  /**
   * Get total visitor count.
   */
  async getVisitorCount(): Promise<VisitorCount> {
    const response = await apiClient.axios.get<VisitorCount>('/visitors/count');
    return response.data;
  }

  /**
   * Get daily visitor trends (owner only).
   */
  async getDailyTrends(params: DailyTrendsParams = {}): Promise<DailyVisitors[]> {
    const response = await apiClient.axios.get<DailyVisitors[]>('/visitors/trends/daily', {
      params,
    });
    return response.data;
  }

  /**
   * Get monthly visitor trends (owner only).
   */
  async getMonthlyTrends(params: MonthlyTrendsParams = {}): Promise<MonthlyVisitors[]> {
    const response = await apiClient.axios.get<MonthlyVisitors[]>('/visitors/trends/monthly', {
      params,
    });
    return response.data;
  }
}

export const visitorService = new VisitorService();
