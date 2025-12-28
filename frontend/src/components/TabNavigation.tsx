import { BookOpen, Award, FolderGit2, FileText, Newspaper, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useBlogPosts } from "@/hooks/useBlogPosts";
import { useProjects } from "@/hooks/useProjects";
import { useCertifications } from "@/hooks/useCertifications";

type Tab = "overview" | "certifications" | "projects" | "blog" | "cv" | "dashboard";

interface TabNavigationProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const { isOwner } = useAuth();

  // Fetch published blog count
  const { data: publishedBlogs = [] } = useBlogPosts({ status: 'published' });
  const publishedBlogCount = publishedBlogs.length;

  // Fetch published project count
  const { data: publishedProjects = [] } = useProjects({ status: 'published' });
  const publishedProjectCount = publishedProjects.length;

  // Fetch published certification count
  const { data: publishedCertifications = [] } = useCertifications({ status: 'published' });
  const publishedCertificationCount = publishedCertifications.length;

  const publicTabs = [
    { id: "overview" as Tab, label: "Overview", icon: BookOpen },
    { id: "certifications" as Tab, label: "Certifications", icon: Award, count: publishedCertificationCount },
    { id: "projects" as Tab, label: "Projects", icon: FolderGit2, count: publishedProjectCount },
    { id: "blog" as Tab, label: "Blog", icon: Newspaper, count: publishedBlogCount },
    { id: "cv" as Tab, label: "CV", icon: FileText },
  ];

  const ownerTabs = [
    { id: "dashboard" as Tab, label: "Dashboard", icon: LayoutDashboard },
    ...publicTabs,
  ];

  const tabs = isOwner ? ownerTabs : publicTabs;

  return (
    <nav className="border-b border-border bg-nav-bg sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4">
        <ul className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <li key={tab.id}>
              <button
                onClick={() => onTabChange(tab.id)}
                className={`tab-item flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id ? "active" : ""
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.count && (
                  <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-secondary text-muted-foreground">
                    {tab.count}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

export type { Tab };
