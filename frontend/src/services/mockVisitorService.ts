// Mock visitor counter service
// In a real app, this would be stored in a database

let visitorCount = 1247; // Start with a realistic number
const sessionKey = 'portfolio_visitor_session';

export interface DailyVisitors {
  date: string;
  visitors: number;
}

export interface MonthlyVisitors {
  month: string;
  visitors: number;
}

// Generate mock historical data
const generateDailyData = (): DailyVisitors[] => {
  const data: DailyVisitors[] = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      visitors: Math.floor(Math.random() * 80) + 20
    });
  }
  return data;
};

const generateMonthlyData = (): MonthlyVisitors[] => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = new Date().getMonth();
  const data: MonthlyVisitors[] = [];
  for (let i = 5; i >= 0; i--) {
    const monthIndex = (currentMonth - i + 12) % 12;
    data.push({
      month: months[monthIndex],
      visitors: Math.floor(Math.random() * 800) + 200
    });
  }
  return data;
};

export const mockVisitorService = {
  // Track a new visit (only once per session)
  trackVisit: async (): Promise<number> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const hasVisited = sessionStorage.getItem(sessionKey);
    if (!hasVisited) {
      visitorCount++;
      sessionStorage.setItem(sessionKey, 'true');
    }
    
    return visitorCount;
  },

  // Get current visitor count
  getVisitorCount: async (): Promise<number> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return visitorCount;
  },

  // Get daily visitor trends (last 30 days)
  getDailyTrends: async (): Promise<DailyVisitors[]> => {
    await new Promise(resolve => setTimeout(resolve, 150));
    return generateDailyData();
  },

  // Get monthly visitor trends (last 6 months)
  getMonthlyTrends: async (): Promise<MonthlyVisitors[]> => {
    await new Promise(resolve => setTimeout(resolve, 150));
    return generateMonthlyData();
  }
};
