import { useState } from "react";
import { Hero } from "@/sections/Hero";
import { About } from "@/sections/About";
import { Skills } from "@/sections/Skills";
import { Experience } from "@/sections/Experience";
import { Projects } from "@/sections/Projects";
import { Certifications } from "@/sections/Certifications";
import { Writing } from "@/sections/Writing";
import { Contact } from "@/sections/Contact";
import { SiteFooter } from "@/components/SiteFooter";
import { TabNavigation, Tab } from "@/components/TabNavigation";
import { CertificationsTab } from "@/components/CertificationsTab";
import { ProjectsTab } from "@/components/ProjectsTab";
import { BlogTab } from "@/components/BlogTab";
import { DashboardTab } from "@/components/DashboardTab";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LoginDialog } from "@/components/LoginDialog";
import { UserMenu } from "@/components/UserMenu";
import { useAuth } from "@/contexts/AuthContext";
import { Github } from "lucide-react";

const Index = () => {
  const [activeTab, setActiveTab] = useState<Tab>("projects");
  const [createAction, setCreateAction] = useState<string | null>(null);
  const { user, isLoading, isOwner } = useAuth();

  const handleDashboardNavigate = (tab: "blog" | "certifications" | "projects", action?: "create") => {
    setActiveTab(tab);
    if (action === "create") {
      setCreateAction(tab);
    }
  };

  const clearCreateAction = () => {
    setCreateAction(null);
  };

  const renderTab = () => {
    switch (activeTab) {
      case "dashboard":
        return isOwner ? <DashboardTab onNavigate={handleDashboardNavigate} /> : null;
      case "certifications":
        return <CertificationsTab triggerCreate={createAction === "certifications"} onCreateHandled={clearCreateAction} />;
      case "projects":
        return <ProjectsTab triggerCreate={createAction === "projects"} onCreateHandled={clearCreateAction} />;
      case "blog":
        return <BlogTab triggerCreate={createAction === "blog"} onCreateHandled={clearCreateAction} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[hsl(var(--header-bg))] border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Github className="w-8 h-8 text-[hsl(var(--header-foreground))]" />
            <span className="font-semibold text-[hsl(var(--header-foreground))] hidden sm:inline">
              PatrickCmd
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {!isLoading && (user ? <UserMenu /> : <LoginDialog />)}
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-4">
        <Hero />
        <About />
        <Skills />
        <Experience />
        <Projects />
        <Certifications />
        <Writing />
        <Contact />
      </div>

      {/* Tab Navigation */}
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {renderTab()}
      </main>

      <SiteFooter />
    </div>
  );
};

export default Index;
