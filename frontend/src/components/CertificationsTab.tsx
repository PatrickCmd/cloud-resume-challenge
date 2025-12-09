import { useState, useEffect } from "react";
import { Award, Plus, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { mockCertificationsDB, Certification } from "@/services/mockCertificationsDatabase";
import { CertificationEditor } from "./CertificationEditor";
import { CertificationDetail } from "./CertificationDetail";
import { useAuth } from "@/contexts/AuthContext";

type ViewMode = "list" | "view" | "create" | "edit";

interface CertificationsTabProps {
  triggerCreate?: boolean;
  onCreateHandled?: () => void;
}

export function CertificationsTab({ triggerCreate, onCreateHandled }: CertificationsTabProps) {
  const [mode, setMode] = useState<ViewMode>("list");
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [selectedCert, setSelectedCert] = useState<Certification | null>(null);
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
    loadCertifications();
  }, [filter]);

  const loadCertifications = async () => {
    const data = filter === "published" 
      ? await mockCertificationsDB.getPublished()
      : await mockCertificationsDB.getDrafts();
    setCertifications(data);
  };

  const handleCreate = async (data: Omit<Certification, "id" | "createdAt" | "updatedAt" | "status">) => {
    setIsLoading(true);
    try {
      await mockCertificationsDB.create(data);
      toast({ title: "Draft saved", description: "Your certification has been saved as a draft." });
      setMode("list");
      setFilter("drafts");
      loadCertifications();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAndPublish = async (data: Omit<Certification, "id" | "createdAt" | "updatedAt" | "status">) => {
    setIsLoading(true);
    try {
      const cert = await mockCertificationsDB.create(data);
      await mockCertificationsDB.publish(cert.id);
      toast({ title: "Published", description: "Your certification has been published." });
      setMode("list");
      setFilter("published");
      loadCertifications();
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (data: Omit<Certification, "id" | "createdAt" | "updatedAt" | "status">) => {
    if (!selectedCert) return;
    setIsLoading(true);
    try {
      await mockCertificationsDB.update(selectedCert.id, data);
      toast({ title: "Saved", description: "Your changes have been saved." });
      setMode("list");
      loadCertifications();
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateAndPublish = async (data: Omit<Certification, "id" | "createdAt" | "updatedAt" | "status">) => {
    if (!selectedCert) return;
    setIsLoading(true);
    try {
      await mockCertificationsDB.update(selectedCert.id, data);
      await mockCertificationsDB.publish(selectedCert.id);
      toast({ title: "Published", description: "Your certification has been published." });
      setMode("list");
      setFilter("published");
      loadCertifications();
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedCert) return;
    await mockCertificationsDB.publish(selectedCert.id);
    toast({ title: "Published", description: "Certification is now public." });
    const updated = await mockCertificationsDB.getById(selectedCert.id);
    if (updated) setSelectedCert(updated);
    loadCertifications();
  };

  const handleUnpublish = async () => {
    if (!selectedCert) return;
    await mockCertificationsDB.unpublish(selectedCert.id);
    toast({ title: "Unpublished", description: "Certification moved to drafts." });
    const updated = await mockCertificationsDB.getById(selectedCert.id);
    if (updated) setSelectedCert(updated);
    loadCertifications();
  };

  const handleDelete = async () => {
    if (!selectedCert) return;
    await mockCertificationsDB.delete(selectedCert.id);
    toast({ title: "Deleted", description: "Certification has been deleted." });
    setMode("list");
    setSelectedCert(null);
    loadCertifications();
  };

  const viewCertification = async (id: string) => {
    const cert = await mockCertificationsDB.getById(id);
    if (cert) {
      setSelectedCert(cert);
      setMode("view");
    }
  };

  if (mode === "create" && isOwner) {
    return (
      <CertificationEditor
        onSave={handleCreate}
        onPublish={handleCreateAndPublish}
        onCancel={() => setMode("list")}
        isLoading={isLoading}
      />
    );
  }

  if (mode === "edit" && selectedCert && isOwner) {
    return (
      <CertificationEditor
        certification={selectedCert}
        onSave={handleUpdate}
        onPublish={handleUpdateAndPublish}
        onCancel={() => setMode("view")}
        isLoading={isLoading}
      />
    );
  }

  if (mode === "view" && selectedCert) {
    return (
      <CertificationDetail
        certification={selectedCert}
        onBack={() => { setMode("list"); setSelectedCert(null); }}
        onEdit={isOwner ? () => setMode("edit") : undefined}
        onPublish={isOwner ? handlePublish : undefined}
        onUnpublish={isOwner ? handleUnpublish : undefined}
        onDelete={isOwner ? handleDelete : undefined}
      />
    );
  }

  const awsCerts = certifications.filter(c => c.type === "certification");
  const courses = certifications.filter(c => c.type === "course");

  return (
    <div className="space-y-6">
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
            Add New
          </Button>
        )}
      </div>

      {/* Certifications */}
      {awsCerts.length > 0 && (
        <div className="animate-fade-in">
          <h3 className="section-title">
            <Award className="w-5 h-5 text-primary" />
            Certifications
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {awsCerts.map((cert) => (
              <div
                key={cert.id}
                onClick={() => viewCertification(cert.id)}
                className={`p-5 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                  cert.featured 
                    ? "border-primary/30 bg-gradient-to-br from-primary/5 to-transparent hover:border-primary/50" 
                    : "border-border bg-card hover:border-primary/30"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{cert.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-foreground">{cert.name}</h4>
                      {cert.status === "draft" && <Badge variant="secondary">Draft</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{cert.issuer}</p>
                    {cert.featured && (
                      <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded">
                        ✓ Featured
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Courses */}
      {courses.length > 0 && (
        <div className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <h3 className="section-title">
            <Award className="w-5 h-5 text-muted-foreground" />
            Courses
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {courses.map((cert) => (
              <div
                key={cert.id}
                onClick={() => viewCertification(cert.id)}
                className="p-4 rounded-lg border border-border bg-card hover:border-primary/30 transition-all duration-200 group cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{cert.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-foreground text-sm line-clamp-2 group-hover:text-primary transition-colors">
                        {cert.name}
                      </h4>
                      {cert.status === "draft" && <Badge variant="secondary" className="text-xs">Draft</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{cert.issuer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {certifications.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No {filter === "drafts" ? "draft" : "published"} certifications found.
        </div>
      )}

      {/* Stats */}
      <div className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-lg border border-border bg-card text-center">
            <div className="text-3xl font-bold text-primary">{certifications.length}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </div>
          <div className="p-4 rounded-lg border border-border bg-card text-center">
            <div className="text-3xl font-bold text-primary">{awsCerts.length}</div>
            <div className="text-sm text-muted-foreground">Certifications</div>
          </div>
          <div className="p-4 rounded-lg border border-border bg-card text-center">
            <div className="text-3xl font-bold text-primary">{courses.length}</div>
            <div className="text-sm text-muted-foreground">Courses</div>
          </div>
        </div>
      </div>
    </div>
  );
}
