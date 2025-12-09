import { ArrowLeft, Edit, Send, Trash2, ExternalLink, Github, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Project } from "@/services/mockProjectsDatabase";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface ProjectDetailProps {
  project: Project;
  onBack: () => void;
  onEdit?: () => void;
  onPublish?: () => void;
  onUnpublish?: () => void;
  onDelete?: () => void;
}

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

export function ProjectDetail({
  project,
  onBack,
  onEdit,
  onPublish,
  onUnpublish,
  onDelete,
}: ProjectDetailProps) {
  const isDraft = project.status === "draft";
  const hasActions = onEdit || onPublish || onUnpublish || onDelete;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        {hasActions && (
          <div className="flex gap-2 flex-wrap">
            {onEdit && (
              <Button variant="outline" onClick={onEdit} className="gap-2">
                <Edit className="w-4 h-4" />
                Edit
              </Button>
            )}
            {isDraft && onPublish && (
              <Button onClick={onPublish} className="gap-2">
                <Send className="w-4 h-4" />
                Publish
              </Button>
            )}
            {!isDraft && onUnpublish && (
              <Button variant="outline" onClick={onUnpublish}>
                Unpublish
              </Button>
            )}
            {onDelete && (
              <Button variant="destructive" onClick={onDelete} className="gap-2">
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {project.imageUrl && (
          <img
            src={project.imageUrl}
            alt={project.name}
            className="w-full h-64 object-cover"
          />
        )}
        
        <div className="p-8">
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
            {isDraft && (
              <Badge variant="secondary">Draft</Badge>
            )}
            {project.featured && (
              <Badge className="bg-primary/10 text-primary">Featured</Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-muted-foreground mb-4">
            <Building2 className="w-4 h-4" />
            <span>{project.company}</span>
          </div>

          <p className="text-lg text-foreground mb-6">{project.description}</p>

          <div className="flex flex-wrap gap-2 mb-6">
            {project.tech.map((t) => (
              <Badge
                key={t}
                variant="secondary"
                className={`${techColors[t] || "bg-muted"} text-white`}
              >
                {t}
              </Badge>
            ))}
          </div>

          <div className="flex gap-4 mb-8">
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                <Github className="w-4 h-4" />
                View Source
              </a>
            )}
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Live Demo
              </a>
            )}
          </div>

          {project.longDescription && (
            <div className="pt-6 border-t border-border">
              <h2 className="text-lg font-semibold mb-4">Project Details</h2>
              <MarkdownRenderer content={project.longDescription} />
            </div>
          )}
        </div>
      </div>

      <div className="p-4 rounded-lg border border-border bg-muted/30 text-sm text-muted-foreground">
        <div className="flex flex-wrap gap-4">
          <span>Created: {new Date(project.createdAt).toLocaleDateString()}</span>
          <span>Updated: {new Date(project.updatedAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}
