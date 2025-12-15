import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Award, 
  FolderGit2, 
  Newspaper, 
  Plus, 
  Eye, 
  EyeOff,
  TrendingUp,
  Clock,
  Users,
  BarChart3
} from "lucide-react";
import { mockBlogDB, BlogPostDraft } from "@/services/mockBlogDatabase";
import { mockCertificationsDB, Certification } from "@/services/mockCertificationsDatabase";
import { mockProjectsDB, Project } from "@/services/mockProjectsDatabase";
import { mockVisitorService, DailyVisitors, MonthlyVisitors } from "@/services/mockVisitorService";
import { mockAnalyticsService } from "@/services/mockAnalyticsService";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, BarChart, Bar, ResponsiveContainer } from "recharts";

interface DashboardTabProps {
  onNavigate: (tab: "blog" | "certifications" | "projects", action?: "create") => void;
}

interface Stats {
  blogs: { total: number; published: number; drafts: number };
  certifications: { total: number; published: number; drafts: number };
  projects: { total: number; published: number; drafts: number };
}

interface RecentItem {
  id: string;
  title: string;
  type: "blog" | "certification" | "project";
  status: "draft" | "published";
  updatedAt: string;
}

interface TopViewedItem {
  id: string;
  title: string;
  type: "blog" | "project" | "certification";
  views: number;
}

export function DashboardTab({ onNavigate }: DashboardTabProps) {
  const [stats, setStats] = useState<Stats>({
    blogs: { total: 0, published: 0, drafts: 0 },
    certifications: { total: 0, published: 0, drafts: 0 },
    projects: { total: 0, published: 0, drafts: 0 },
  });
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [topViewedItems, setTopViewedItems] = useState<TopViewedItem[]>([]);
  const [totalContentViews, setTotalContentViews] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [totalVisitors, setTotalVisitors] = useState(0);
  const [dailyTrends, setDailyTrends] = useState<DailyVisitors[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyVisitors[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [blogs, certifications, projects, visitors, daily, monthly, topContent, contentViews] = await Promise.all([
        mockBlogDB.getAllPosts(),
        mockCertificationsDB.getAll(),
        mockProjectsDB.getAll(),
        mockVisitorService.getVisitorCount(),
        mockVisitorService.getDailyTrends(),
        mockVisitorService.getMonthlyTrends(),
        mockAnalyticsService.getTopContent(5),
        mockAnalyticsService.getTotalViews(),
      ]);

      setTotalVisitors(visitors);
      setDailyTrends(daily);
      setMonthlyTrends(monthly);
      setTotalContentViews(contentViews);

      // Build top viewed items with titles
      const topItems: TopViewedItem[] = [];
      
      for (const item of topContent.blogs) {
        const blog = blogs.find(b => b.id === item.contentId);
        if (blog) {
          topItems.push({ id: blog.id, title: blog.title, type: 'blog', views: item.views });
        }
      }
      
      for (const item of topContent.projects) {
        const project = projects.find(p => p.id === item.contentId);
        if (project) {
          topItems.push({ id: project.id, title: project.name, type: 'project', views: item.views });
        }
      }
      
      for (const item of topContent.certifications) {
        const cert = certifications.find(c => c.id === item.contentId);
        if (cert) {
          topItems.push({ id: cert.id, title: cert.name, type: 'certification', views: item.views });
        }
      }
      
      // Sort by views and take top 5
      topItems.sort((a, b) => b.views - a.views);
      setTopViewedItems(topItems.slice(0, 5));

      // Calculate stats
      setStats({
        blogs: {
          total: blogs.length,
          published: blogs.filter((b) => b.status === "published").length,
          drafts: blogs.filter((b) => b.status === "draft").length,
        },
        certifications: {
          total: certifications.length,
          published: certifications.filter((c) => c.status === "published").length,
          drafts: certifications.filter((c) => c.status === "draft").length,
        },
        projects: {
          total: projects.length,
          published: projects.filter((p) => p.status === "published").length,
          drafts: projects.filter((p) => p.status === "draft").length,
        },
      });

      // Get recent items (last 5 updated across all types)
      const allItems: RecentItem[] = [
        ...blogs.map((b: BlogPostDraft) => ({
          id: b.id,
          title: b.title,
          type: "blog" as const,
          status: b.status,
          updatedAt: b.updatedAt,
        })),
        ...certifications.map((c: Certification) => ({
          id: c.id,
          title: c.name,
          type: "certification" as const,
          status: c.status,
          updatedAt: c.updatedAt,
        })),
        ...projects.map((p: Project) => ({
          id: p.id,
          title: p.name,
          type: "project" as const,
          status: p.status,
          updatedAt: p.updatedAt,
        })),
      ];

      allItems.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      setRecentItems(allItems.slice(0, 5));
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "blog":
        return <Newspaper className="w-4 h-4" />;
      case "certification":
        return <Award className="w-4 h-4" />;
      case "project":
        return <FolderGit2 className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const totalContent = stats.blogs.total + stats.certifications.total + stats.projects.total;
  const totalPublished = stats.blogs.published + stats.certifications.published + stats.projects.published;
  const totalDrafts = stats.blogs.drafts + stats.certifications.drafts + stats.projects.drafts;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Manage your portfolio content</p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Visitors</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVisitors.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All-time visitors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Content Views</CardTitle>
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalContentViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total page views</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Content</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalContent}</div>
            <p className="text-xs text-muted-foreground">
              {totalPublished} published, {totalDrafts} drafts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Blog Posts</CardTitle>
            <Newspaper className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.blogs.total}</div>
            <div className="flex gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                <Eye className="w-3 h-3 mr-1" /> {stats.blogs.published}
              </Badge>
              <Badge variant="outline" className="text-xs">
                <EyeOff className="w-3 h-3 mr-1" /> {stats.blogs.drafts}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Certifications</CardTitle>
            <Award className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.certifications.total}</div>
            <div className="flex gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                <Eye className="w-3 h-3 mr-1" /> {stats.certifications.published}
              </Badge>
              <Badge variant="outline" className="text-xs">
                <EyeOff className="w-3 h-3 mr-1" /> {stats.certifications.drafts}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <FolderGit2 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.projects.total}</div>
            <div className="flex gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                <Eye className="w-3 h-3 mr-1" /> {stats.projects.published}
              </Badge>
              <Badge variant="outline" className="text-xs">
                <EyeOff className="w-3 h-3 mr-1" /> {stats.projects.drafts}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
          <CardDescription>Create new content for your portfolio</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => onNavigate("blog", "create")} className="gap-2">
              <Plus className="w-4 h-4" />
              <Newspaper className="w-4 h-4" />
              New Blog Post
            </Button>
            <Button onClick={() => onNavigate("certifications", "create")} variant="secondary" className="gap-2">
              <Plus className="w-4 h-4" />
              <Award className="w-4 h-4" />
              Add Certification
            </Button>
            <Button onClick={() => onNavigate("projects", "create")} variant="outline" className="gap-2">
              <Plus className="w-4 h-4" />
              <FolderGit2 className="w-4 h-4" />
              Add Project
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Visitor Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Visitors - Area Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Daily Visitors</CardTitle>
            <CardDescription>Last 30 days visitor trends</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                visitors: {
                  label: "Visitors",
                  color: "hsl(var(--primary))",
                },
              }}
              className="h-[250px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyTrends}>
                  <defs>
                    <linearGradient id="visitorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    width={30}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="visitors"
                    stroke="hsl(var(--primary))"
                    fill="url(#visitorGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Monthly Visitors - Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Monthly Visitors</CardTitle>
            <CardDescription>Last 6 months overview</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                visitors: {
                  label: "Visitors",
                  color: "hsl(var(--primary))",
                },
              }}
              className="h-[250px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrends}>
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    width={40}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="visitors"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Viewed Content & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Viewed Content */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Viewed Content</CardTitle>
            <CardDescription>Most popular items by views</CardDescription>
          </CardHeader>
          <CardContent>
            {topViewedItems.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No view data yet</p>
            ) : (
              <div className="space-y-3">
                {topViewedItems.map((item, index) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                        {index + 1}
                      </div>
                      <div className="p-2 rounded-full bg-background">
                        {getTypeIcon(item.type)}
                      </div>
                      <div>
                        <p className="font-medium text-sm line-clamp-1">{item.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">{item.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <BarChart3 className="w-4 h-4" />
                      {item.views}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <CardDescription>Your latest content updates</CardDescription>
          </CardHeader>
          <CardContent>
            {recentItems.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No recent activity</p>
            ) : (
              <div className="space-y-3">
                {recentItems.map((item) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-background">
                        {getTypeIcon(item.type)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{item.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">{item.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={item.status === "published" ? "default" : "secondary"}>
                        {item.status === "published" ? (
                          <Eye className="w-3 h-3 mr-1" />
                        ) : (
                          <EyeOff className="w-3 h-3 mr-1" />
                        )}
                        {item.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(item.updatedAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
