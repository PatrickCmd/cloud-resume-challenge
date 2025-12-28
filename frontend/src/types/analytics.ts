/**
 * Analytics and Visitor type definitions.
 *
 * Defines TypeScript interfaces for visitor tracking and analytics data structures
 * matching the backend API schema.
 */

/**
 * Visitor count response from backend API.
 */
export interface VisitorCount {
  total_visitors: number;
  last_updated: string;
}

/**
 * Visitor track response from backend API.
 */
export interface VisitorTrackResponse {
  message: string;
  sessionId: string;
  count: number;
}

/**
 * Daily visitor trend data.
 */
export interface DailyVisitors {
  date: string;
  visitors: number;
}

/**
 * Monthly visitor trend data.
 */
export interface MonthlyVisitors {
  month: string;
  visitors: number;
}

/**
 * View statistics for a single content item.
 */
export interface ContentViewStat {
  contentId: string;
  views: number;
}

/**
 * Top content statistics grouped by content type.
 */
export interface TopContentStats {
  blogs: ContentViewStat[];
  projects: ContentViewStat[];
  certifications: ContentViewStat[];
}

/**
 * Map of content IDs to view counts.
 */
export interface ViewStatsMap {
  [contentId: string]: number;
}

/**
 * Valid content types for analytics tracking.
 */
export type ContentType = "blog" | "project" | "certification";

/**
 * Page view statistics.
 */
export interface PageView {
  page_path: string;
  view_count: number;
  unique_visitors: number;
}

/**
 * Overall analytics overview.
 */
export interface AnalyticsOverview {
  total_views: number;
  unique_visitors: number;
  top_pages: PageView[];
  recent_activity: any[];
}

/**
 * Detailed blog post statistics.
 */
export interface BlogPostStats {
  post_id: string;
  title: string;
  view_count: number;
  unique_visitors: number;
  average_time_on_page: number;
  bounce_rate: number;
}

/**
 * Request payload for tracking a visitor.
 */
export interface TrackVisitorRequest {
  page_path: string;
  referrer?: string;
}

/**
 * Request payload for tracking a content view.
 */
export interface TrackViewRequest {
  session_id?: string;
}

/**
 * Response from tracking a content view.
 */
export interface TrackViewResponse {
  views: number;
  tracked: boolean;
}

/**
 * Total views response.
 */
export interface TotalViewsResponse {
  totalViews: number;
}

/**
 * Parameters for fetching daily visitor trends.
 */
export interface DailyTrendsParams {
  days?: number;
}

/**
 * Parameters for fetching monthly visitor trends.
 */
export interface MonthlyTrendsParams {
  months?: number;
}

/**
 * Parameters for fetching top content.
 */
export interface TopContentParams {
  limit?: number;
}

/**
 * Parameters for fetching analytics overview.
 */
export interface AnalyticsOverviewParams {
  days?: number;
}

/**
 * Parameters for fetching page analytics.
 */
export interface PageAnalyticsParams {
  content_type?: ContentType;
}
