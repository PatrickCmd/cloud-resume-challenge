import { useState, useRef } from "react";
import { ArrowLeft, Save, Send, Eye, Edit, Image, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Project } from "@/services/mockProjectsDatabase";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { useToast } from "@/hooks/use-toast";

interface ProjectEditorProps {
  project?: Project;
  onSave: (data: Omit<Project, "id" | "createdAt" | "updatedAt" | "status">) => void;
  onPublish: (data: Omit<Project, "id" | "createdAt" | "updatedAt" | "status">) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const techOptions = [
  "Python", "Django", "FastAPI", "Flask", "PostgreSQL", "Docker", 
  "AWS", "REST APIs", "APIs", "JavaScript", "TypeScript", "React", 
  "Node.js", "MongoDB", "Redis", "Kubernetes", "GraphQL"
];

export function ProjectEditor({
  project,
  onSave,
  onPublish,
  onCancel,
  isLoading,
}: ProjectEditorProps) {
  const [name, setName] = useState(project?.name || "");
  const [description, setDescription] = useState(project?.description || "");
  const [longDescription, setLongDescription] = useState(project?.longDescription || "");
  const [tech, setTech] = useState<string[]>(project?.tech || []);
  const [company, setCompany] = useState(project?.company || "");
  const [featured, setFeatured] = useState(project?.featured || false);
  const [githubUrl, setGithubUrl] = useState(project?.githubUrl || "");
  const [liveUrl, setLiveUrl] = useState(project?.liveUrl || "");
  const [imageUrl, setImageUrl] = useState(project?.imageUrl || "");
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [newTech, setNewTech] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const formData = {
    name,
    description,
    longDescription,
    tech,
    company,
    featured,
    githubUrl: githubUrl || undefined,
    liveUrl: liveUrl || undefined,
    imageUrl: imageUrl || undefined,
  };

  const isValid = name.trim() && description.trim() && company.trim() && tech.length > 0;

  const addTech = (techName: string) => {
    if (techName && !tech.includes(techName)) {
      setTech([...tech, techName]);
    }
    setNewTech("");
  };

  const removeTech = (techName: string) => {
    setTech(tech.filter((t) => t !== techName));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file type", description: "Please select an image file", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Image must be less than 5MB", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = () => {
        setImageUrl(reader.result as string);
        toast({ title: "Image uploaded", description: "Project image has been set" });
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onCancel} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onSave(formData)}
            disabled={!isValid || isLoading}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            Save Draft
          </Button>
          <Button
            onClick={() => onPublish(formData)}
            disabled={!isValid || isLoading}
            className="gap-2"
          >
            <Send className="w-4 h-4" />
            Publish
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "edit" | "preview")}>
        <TabsList>
          <TabsTrigger value="edit" className="gap-2">
            <Edit className="w-4 h-4" />
            Edit
          </TabsTrigger>
          <TabsTrigger value="preview" className="gap-2">
            <Eye className="w-4 h-4" />
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="space-y-4 mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Awesome Project"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company *</Label>
              <Input
                id="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Company Name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Short Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the project..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="longDescription">
              Full Description (Markdown supported)
            </Label>
            <Textarea
              id="longDescription"
              value={longDescription}
              onChange={(e) => setLongDescription(e.target.value)}
              placeholder="Detailed project description with features, technical details..."
              rows={8}
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label>Technologies *</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tech.map((t) => (
                <Badge
                  key={t}
                  variant="secondary"
                  className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => removeTech(t)}
                >
                  {t} ×
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTech}
                onChange={(e) => setNewTech(e.target.value)}
                placeholder="Add custom technology..."
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTech(newTech))}
              />
              <Button type="button" variant="outline" onClick={() => addTech(newTech)}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {techOptions
                .filter((t) => !tech.includes(t))
                .map((t) => (
                  <Badge
                    key={t}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                    onClick={() => addTech(t)}
                  >
                    + {t}
                  </Badge>
                ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="githubUrl">GitHub URL (optional)</Label>
              <Input
                id="githubUrl"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="liveUrl">Live URL (optional)</Label>
              <Input
                id="liveUrl"
                value={liveUrl}
                onChange={(e) => setLiveUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Project Image (optional)</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="gap-2"
              >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4" />}
                Upload Image
              </Button>
              {imageUrl && (
                <Button type="button" variant="ghost" onClick={() => setImageUrl("")}>
                  Remove
                </Button>
              )}
            </div>
            {imageUrl && (
              <img src={imageUrl} alt="Preview" className="mt-2 max-h-32 rounded-lg object-cover" />
            )}
          </div>

          <div className="flex items-center gap-2">
            <Switch id="featured" checked={featured} onCheckedChange={setFeatured} />
            <Label htmlFor="featured">Featured Project</Label>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="mt-4">
          <div className="p-6 rounded-lg border border-border bg-card space-y-4">
            {imageUrl && (
              <img src={imageUrl} alt={name} className="w-full h-48 object-cover rounded-lg" />
            )}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-foreground">{name || "Untitled Project"}</h2>
              {featured && (
                <Badge className="bg-primary/10 text-primary">Featured</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">@ {company || "No company"}</p>
            <p className="text-foreground">{description || "No description"}</p>
            <div className="flex flex-wrap gap-2">
              {tech.map((t) => (
                <Badge key={t} variant="secondary">{t}</Badge>
              ))}
            </div>
            {longDescription && (
              <div className="pt-4 border-t border-border">
                <MarkdownRenderer content={longDescription} />
              </div>
            )}
            <div className="flex gap-4 pt-2">
              {githubUrl && (
                <a href={githubUrl} className="text-primary hover:underline text-sm">
                  GitHub →
                </a>
              )}
              {liveUrl && (
                <a href={liveUrl} className="text-primary hover:underline text-sm">
                  Live Demo →
                </a>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
