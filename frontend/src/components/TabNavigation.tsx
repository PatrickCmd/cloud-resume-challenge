import { Award, FolderGit2, Newspaper, LayoutDashboard } from "lucide-react";

type Tab = "dashboard" | "certifications" | "projects" | "blog";

interface TabNavigationProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const tabs: { id: Tab; label: string; icon: typeof Award }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "projects", label: "Projects", icon: FolderGit2 },
  { id: "certifications", label: "Certifications", icon: Award },
  { id: "blog", label: "Blog", icon: Newspaper },
];

/** Tab strip for the owner admin area. */
export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <nav aria-label="Admin sections" className="border-b border-border">
      <ul className="flex overflow-x-auto" role="tablist">
        {tabs.map((tab) => (
          <li key={tab.id} role="presentation">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`tab-item flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? "active" : ""}`}
            >
              <tab.icon className="w-4 h-4" aria-hidden="true" />
              {tab.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export type { Tab };
