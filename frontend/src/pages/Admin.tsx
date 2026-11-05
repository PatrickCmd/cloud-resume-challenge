import { useState } from "react";
import { TabNavigation, type Tab } from "@/components/TabNavigation";
import { CertificationsTab } from "@/components/CertificationsTab";
import { ProjectsTab } from "@/components/ProjectsTab";
import { BlogTab } from "@/components/BlogTab";
import { DashboardTab } from "@/components/DashboardTab";
import { LoginDialog } from "@/components/LoginDialog";
import { UserMenu } from "@/components/UserMenu";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Owner area: login, dashboard and the content editors. Nothing here is linked from the
 * public pages; it is reached directly at /admin.
 */
export default function Admin() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [createAction, setCreateAction] = useState<string | null>(null);
  const { user, isLoading, isOwner } = useAuth();

  const handleDashboardNavigate = (tab: "blog" | "certifications" | "projects", action?: "create") => {
    setActiveTab(tab);
    if (action === "create") setCreateAction(tab);
  };
  const clearCreateAction = () => setCreateAction(null);

  const renderTab = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardTab onNavigate={handleDashboardNavigate} />;
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
    <div className="mx-auto max-w-6xl px-4 py-12">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage projects, posts and certifications.</p>
        </div>
        {!isLoading && (user ? <UserMenu /> : <LoginDialog />)}
      </header>

      {isLoading && (
        <p className="text-sm text-muted-foreground" role="status">
          Checking session…
        </p>
      )}

      {!isLoading && !isOwner && (
        <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
          {user ? "This account does not have owner access." : "Sign in with the owner account to manage content."}
        </div>
      )}

      {!isLoading && isOwner && (
        <>
          <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
          <div className="py-8">{renderTab()}</div>
        </>
      )}
    </div>
  );
}
