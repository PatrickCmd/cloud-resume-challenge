import { useState, useEffect } from "react";
import { FolderGit2, Star, Plus, ExternalLink, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { mockProjectsDB, Project } from "@/services/mockProjectsDatabase";
import { ProjectEditor } from "./ProjectEditor";
import { ProjectDetail } from "./ProjectDetail";
import { useAuth } from "@/contexts/AuthContext";

type ViewMode = "list" | "view" | "create" | "edit";

const techColors: Record<string, string> = {
  Python: "bg-[hsl(210,60%,50%)]",
  Django: "bg-[hsl(142,71%,45%)]",
  FastAPI: "bg-[hsl(170,70%,45%)]",
  PostgreSQL: "bg-[hsl(210,50%,45%)]",
  Docker: "bg-[hsl(200,80%,55%)]",
  Flask: "bg-[hsl(0,0%,30%)]",
  AWS: "bg-[hsl(35,100%,50%)]",
  "REST APIs": "bg-[hsl(280,60%,55%)]",
  APIs: "bg-[hsl(280,60%,55%)]",
};

interface ProjectsTabProps {
  triggerCreate?: boolean;
  onCreateHandled?: () => void;
}

export function ProjectsTab({ triggerCreate, onCreateHandled }: ProjectsTabProps) {
  const [mode, setMode] = useState<ViewMode>("list");
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [filter, setFilter] = useState<"published" | "drafts">("published");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { isOwner } = useAuth();

  useEffect(() => {
    if (triggerCreate && isOwner) {
      setMode("create");
      onCreateHandled?.();
    }
  }, [triggerCreate, isOwner, onCreateHandled]);

  useEffect(() => {
    loadProjects();
  }, [filter]);

  const loadProjects = async () => {
    const data = filter === "published" 
      ? await mockProjectsDB.getPublished()
      : await mockProjectsDB.getDrafts();
    setProjects(data);
  };

  const handleCreate = async (data: Omit<Project, "id" | "createdAt" | "updatedAt" | "status">) => {
    setIsLoading(true);
    try {
      await mockProjectsDB.create(data);
      toast({ title: "Draft saved", description: "Your project has been saved as a draft." });
      setMode("list");
      setFilter("drafts");
      loadProjects();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAndPublish = async (data: Omit<Project, "id" | "createdAt" | "updatedAt" | "status">) => {
    setIsLoading(true);
    try {
      const project = await mockProjectsDB.create(data);
      await mockProjectsDB.publish(project.id);
      toast({ title: "Published", description: "Your project has been published." });
      setMode("list");
      setFilter("published");
      loadProjects();
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (data: Omit<Project, "id" | "createdAt" | "updatedAt" | "status">) => {
    if (!selectedProject) return;
    setIsLoading(true);
    try {
      await mockProjectsDB.update(selectedProject.id, data);
      toast({ title: "Saved", description: "Your changes have been saved." });
      setMode("list");
      loadProjects();
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateAndPublish = async (data: Omit<Project, "id" | "createdAt" | "updatedAt" | "status">) => {
    if (!selectedProject) return;
    setIsLoading(true);
    try {
      await mockProjectsDB.update(selectedProject.id, data);
      await mockProjectsDB.publish(selectedProject.id);
      toast({ title: "Published", description: "Your project has been published." });
      setMode("list");
      setFilter("published");
      loadProjects();
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedProject) return;
    await mockProjectsDB.publish(selectedProject.id);
    toast({ title: "Published", description: "Project is now public." });
    const updated = await mockProjectsDB.getById(selectedProject.id);
    if (updated) setSelectedProject(updated);
    loadProjects();
  };

  const handleUnpublish = async () => {
    if (!selectedProject) return;
    await mockProjectsDB.unpublish(selectedProject.id);
    toast({ title: "Unpublished", description: "Project moved to drafts." });
    const updated = await mockProjectsDB.getById(selectedProject.id);
    if (updated) setSelectedProject(updated);
    loadProjects();
  };

  const handleDelete = async () => {
    if (!selectedProject) return;
    await mockProjectsDB.delete(selectedProject.id);
    toast({ title: "Deleted", description: "Project has been deleted." });
    setMode("list");
    setSelectedProject(null);
    loadProjects();
  };

  const viewProject = async (id: string) => {
    const project = await mockProjectsDB.getById(id);
    if (project) {
      setSelectedProject(project);
      setMode("view");
    }
  };

  if (mode === "create" && isOwner) {
    return (
      <ProjectEditor
        onSave={handleCreate}
        onPublish={handleCreateAndPublish}
        onCancel={() => setMode("list")}
        isLoading={isLoading}
      />
    );
  }

  if (mode === "edit" && selectedProject && isOwner) {
    return (
      <ProjectEditor
        project={selectedProject}
        onSave={handleUpdate}
        onPublish={handleUpdateAndPublish}
        onCancel={() => setMode("view")}
        isLoading={isLoading}
      />
    );
  }

  if (mode === "view" && selectedProject) {
    return (
      <ProjectDetail
        project={selectedProject}
        onBack={() => { setMode("list"); setSelectedProject(null); }}
        onEdit={isOwner ? () => setMode("edit") : undefined}
        onPublish={isOwner ? handlePublish : undefined}
        onUnpublish={isOwner ? handleUnpublish : undefined}
        onDelete={isOwner ? handleDelete : undefined}
      />
    );
  }

  const featured = projects.filter((p) => p.featured);
  const others = projects.filter((p) => !p.featured);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        {isOwner ? (
          <Tabs value={filter} onValueChange={(v) => setFilter(v as "published" | "drafts")}>
            <TabsList>
              <TabsTrigger value="published">Published</TabsTrigger>
              <TabsTrigger value="drafts">Drafts</TabsTrigger>
            </TabsList>
          </Tabs>
        ) : (
          <div />
        )}
        {isOwner && (
          <Button onClick={() => setMode("create")} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Project
          </Button>
        )}
      </div>

      {/* Featured Projects */}
      {featured.length > 0 && (
        <div className="animate-fade-in">
          <h3 className="section-title">
            <Star className="w-5 h-5 text-yellow-500" />
            Featured Projects
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featured.map((project) => (
              <div 
                key={project.id} 
                className="project-card group cursor-pointer"
                onClick={() => viewProject(project.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FolderGit2 className="w-5 h-5 text-primary" />
                    <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {project.name}
                    </span>
                  </div>
                  {project.status === "draft" && <Badge variant="secondary">Draft</Badge>}
                </div>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {project.tech.map((tech) => (
                    <span key={tech} className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Circle className={`w-2 h-2 ${techColors[tech] || "bg-muted-foreground"} rounded-full`} style={{ fill: 'currentColor' }} />
                      {tech}
                    </span>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground font-mono">
                  @ {project.company}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Projects */}
      {others.length > 0 && (
        <div className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <h3 className="section-title">
            <FolderGit2 className="w-5 h-5 text-muted-foreground" />
            More Projects
          </h3>
          <div className="space-y-3">
            {others.map((project) => (
              <div
                key={project.id}
                onClick={() => viewProject(project.id)}
                className="p-4 rounded-lg border border-border bg-card hover:border-primary/30 transition-all duration-200 flex flex-col sm:flex-row sm:items-center gap-3 cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <FolderGit2 className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-foreground">{project.name}</span>
                    <span className="text-xs text-muted-foreground font-mono">@ {project.company}</span>
                    {project.status === "draft" && <Badge variant="secondary">Draft</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {project.description}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {project.tech.slice(0, 3).map((tech) => (
                    <span key={tech} className="skill-badge text-xs">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {projects.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No {filter === "drafts" ? "draft" : "published"} projects found.
        </div>
      )}

      {/* GitHub Link */}
      <div className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
        <a
          href="https://github.com/PatrickCmd"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 p-4 rounded-lg border border-dashed border-border hover:border-primary bg-card hover:bg-primary/5 transition-all duration-200 group"
        >
          <FolderGit2 className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          <span className="text-muted-foreground group-hover:text-foreground transition-colors">
            View all repositories on GitHub
          </span>
          <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </a>
      </div>
    </div>
  );
}
