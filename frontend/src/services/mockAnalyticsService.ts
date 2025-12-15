// Mock analytics service for tracking content views
// In a real app, this would be stored in a database

export type ContentType = "blog" | "project" | "certification";

interface ViewRecord {
  contentId: string;
  contentType: ContentType;
  views: number;
}

// Initialize with some mock view data
const viewsDatabase: ViewRecord[] = [];

// Session tracking to prevent duplicate views
const sessionViewedKey = 'portfolio_viewed_content';

const getSessionViewed = (): Set<string> => {
  const stored = sessionStorage.getItem(sessionViewedKey);
  return stored ? new Set(JSON.parse(stored)) : new Set();
};

const addToSessionViewed = (key: string) => {
  const viewed = getSessionViewed();
  viewed.add(key);
  sessionStorage.setItem(sessionViewedKey, JSON.stringify([...viewed]));
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Generate some initial mock data
const initializeMockData = () => {
  // Blog posts mock views
  const blogIds = ['1', '2', '3', '4', '5'];
  blogIds.forEach(id => {
    viewsDatabase.push({
      contentId: id,
      contentType: 'blog',
      views: Math.floor(Math.random() * 150) + 20
    });
  });

  // Project mock views
  const projectIds = ['proj_1', 'proj_2', 'proj_3', 'proj_4', 'proj_5'];
  projectIds.forEach(id => {
    viewsDatabase.push({
      contentId: id,
      contentType: 'project',
      views: Math.floor(Math.random() * 100) + 10
    });
  });

  // Certification mock views
  const certIds = ['cert_1', 'cert_2', 'cert_3', 'cert_4', 'cert_5', 'cert_6', 'cert_7', 'cert_8'];
  certIds.forEach(id => {
    viewsDatabase.push({
      contentId: id,
      contentType: 'certification',
      views: Math.floor(Math.random() * 80) + 5
    });
  });
};

initializeMockData();

export interface ContentViewStats {
  contentId: string;
  contentType: ContentType;
  views: number;
  title: string;
}

export interface TopContentStats {
  blogs: ContentViewStats[];
  projects: ContentViewStats[];
  certifications: ContentViewStats[];
}

export const mockAnalyticsService = {
  // Track a view for a content item (only once per session)
  trackView: async (contentId: string, contentType: ContentType): Promise<number> => {
    await delay(50);
    
    const sessionKey = `${contentType}_${contentId}`;
    const sessionViewed = getSessionViewed();
    
    let record = viewsDatabase.find(
      r => r.contentId === contentId && r.contentType === contentType
    );
    
    if (!record) {
      record = { contentId, contentType, views: 0 };
      viewsDatabase.push(record);
    }
    
    // Only increment if not already viewed in this session
    if (!sessionViewed.has(sessionKey)) {
      record.views++;
      addToSessionViewed(sessionKey);
    }
    
    return record.views;
  },

  // Get view count for a specific content item
  getViewCount: async (contentId: string, contentType: ContentType): Promise<number> => {
    await delay(30);
    
    const record = viewsDatabase.find(
      r => r.contentId === contentId && r.contentType === contentType
    );
    
    return record?.views || 0;
  },

  // Get all view stats for a content type
  getAllViewStats: async (contentType: ContentType): Promise<Map<string, number>> => {
    await delay(50);
    
    const stats = new Map<string, number>();
    viewsDatabase
      .filter(r => r.contentType === contentType)
      .forEach(r => stats.set(r.contentId, r.views));
    
    return stats;
  },

  // Get top viewed content across all types (for dashboard)
  getTopContent: async (limit: number = 5): Promise<{
    blogs: { contentId: string; views: number }[];
    projects: { contentId: string; views: number }[];
    certifications: { contentId: string; views: number }[];
  }> => {
    await delay(100);
    
    const getTop = (type: ContentType) => {
      return viewsDatabase
        .filter(r => r.contentType === type)
        .sort((a, b) => b.views - a.views)
        .slice(0, limit)
        .map(r => ({ contentId: r.contentId, views: r.views }));
    };
    
    return {
      blogs: getTop('blog'),
      projects: getTop('project'),
      certifications: getTop('certification'),
    };
  },

  // Get total views across all content
  getTotalViews: async (): Promise<number> => {
    await delay(30);
    return viewsDatabase.reduce((sum, r) => sum + r.views, 0);
  },
};
