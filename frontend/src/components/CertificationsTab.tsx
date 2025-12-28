import { useState, useEffect } from "react";
import { Award, Plus, ExternalLink, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CertificationEditor } from "./CertificationEditor";
import { CertificationDetail } from "./CertificationDetail";
import { useAuth } from "@/contexts/AuthContext";
import { mockAnalyticsService } from "@/services/mockAnalyticsService";
import {
  useCertifications,
  useCreateCertification,
  useUpdateCertification,
  useDeleteCertification,
  usePublishCertification,
  useUnpublishCertification,
} from "@/hooks/useCertifications";
import { CertificationNormalized } from "@/types/certification";

type ViewMode = "list" | "view" | "create" | "edit";

interface CertificationsTabProps {
  triggerCreate?: boolean;
  onCreateHandled?: () => void;
}

export function CertificationsTab({ triggerCreate, onCreateHandled }: CertificationsTabProps) {
  const [mode, setMode] = useState<ViewMode>("list");
  const [selectedCert, setSelectedCert] = useState<CertificationNormalized | null>(null);
  const [filter, setFilter] = useState<"published" | "drafts">("published");
  const [viewCounts, setViewCounts] = useState<Map<string, number>>(new Map());
  const [currentViewCount, setCurrentViewCount] = useState(0);
  const { isOwner } = useAuth();

  // Fetch certifications using React Query
  // Owners need both published and draft certifications, non-owners only see published
  const { data: publishedCertifications = [], isLoading: isLoadingPublished } = useCertifications(
    { status: 'published' }
  );
  const { data: draftCertifications = [], isLoading: isLoadingDrafts } = useCertifications(
    { status: 'draft' },
    isOwner // Only fetch drafts if user is owner
  );

  // Combine published and draft certifications for owners
  const certifications = isOwner ? [...publishedCertifications, ...draftCertifications] : publishedCertifications;
  const isLoading = isLoadingPublished || (isOwner && isLoadingDrafts);

  const createMutation = useCreateCertification();
  const updateMutation = useUpdateCertification();
  const deleteMutation = useDeleteCertification();
  const publishMutation = usePublishCertification();
  const unpublishMutation = useUnpublishCertification();

  useEffect(() => {
    if (triggerCreate && isOwner) {
      setMode("create");
      onCreateHandled?.();
    }
  }, [triggerCreate, isOwner, onCreateHandled]);

  // Load view counts
  useEffect(() => {
    const loadViewCounts = async () => {
      try {
        const views = await mockAnalyticsService.getAllViewStats('certification');
        setViewCounts(views);
      } catch (error) {
        console.error('Failed to load view counts:', error);
      }
    };
    loadViewCounts();
  }, []);

  const handleCreate = async (data: Omit<CertificationNormalized, "id" | "createdAt" | "updatedAt" | "status">) => {
    try {
      const newCert = await createMutation.mutateAsync({
        name: data.name,
        issuer: data.issuer,
        type: data.type,
        dateEarned: data.dateEarned,
        credentialUrl: data.credentialUrl,
        expiry_date: data.expiry_date,
        icon: data.icon,
        featured: data.featured,
      });
      setSelectedCert(newCert);
      setMode("list");
      setFilter("drafts");
    } catch (error) {
      console.error('Failed to create certification:', error);
    }
  };

  const handleCreateAndPublish = async (data: Omit<CertificationNormalized, "id" | "createdAt" | "updatedAt" | "status">) => {
    try {
      const newCert = await createMutation.mutateAsync({
        name: data.name,
        issuer: data.issuer,
        type: data.type,
        dateEarned: data.dateEarned,
        credentialUrl: data.credentialUrl,
        expiry_date: data.expiry_date,
        icon: data.icon,
        featured: data.featured,
      });
      await publishMutation.mutateAsync(newCert.id);
      setMode("list");
      setFilter("published");
    } catch (error) {
      console.error('Failed to create and publish certification:', error);
    }
  };

  const handleUpdate = async (data: Omit<CertificationNormalized, "id" | "createdAt" | "updatedAt" | "status">) => {
    if (!selectedCert) return;
    try {
      await updateMutation.mutateAsync({
        id: selectedCert.id,
        data: {
          name: data.name,
          issuer: data.issuer,
          type: data.type,
          dateEarned: data.dateEarned,
          credentialUrl: data.credentialUrl,
          expiry_date: data.expiry_date,
          icon: data.icon,
          featured: data.featured,
        },
      });
      setMode("list");
    } catch (error) {
      console.error('Failed to update certification:', error);
    }
  };

  const handleUpdateAndPublish = async (data: Omit<CertificationNormalized, "id" | "createdAt" | "updatedAt" | "status">) => {
    if (!selectedCert) return;
    try {
      await updateMutation.mutateAsync({
        id: selectedCert.id,
        data: {
          name: data.name,
          issuer: data.issuer,
          type: data.type,
          dateEarned: data.dateEarned,
          credentialUrl: data.credentialUrl,
          expiry_date: data.expiry_date,
          icon: data.icon,
          featured: data.featured,
        },
      });
      await publishMutation.mutateAsync(selectedCert.id);
      setMode("list");
      setFilter("published");
    } catch (error) {
      console.error('Failed to update and publish certification:', error);
    }
  };

  const handlePublish = async () => {
    if (!selectedCert) return;
    try {
      await publishMutation.mutateAsync(selectedCert.id);
      setMode("list");
      setFilter("published");
      setSelectedCert(null);
    } catch (error) {
      console.error('Failed to publish certification:', error);
    }
  };

  const handleUnpublish = async () => {
    if (!selectedCert) return;
    try {
      await unpublishMutation.mutateAsync(selectedCert.id);
      setMode("list");
      setFilter("drafts");
      setSelectedCert(null);
    } catch (error) {
      console.error('Failed to unpublish certification:', error);
    }
  };

  const handleDelete = async () => {
    if (!selectedCert) return;
    try {
      await deleteMutation.mutateAsync(selectedCert.id);
      setMode("list");
      setSelectedCert(null);
    } catch (error) {
      console.error('Failed to delete certification:', error);
    }
  };

  const viewCertification = async (id: string) => {
    const cert = certifications.find(c => c.id === id);
    if (cert) {
      setSelectedCert(cert);
      setMode("view");
      const views = await mockAnalyticsService.trackView(id, 'certification');
      setCurrentViewCount(views);
      setViewCounts(prev => new Map(prev).set(id, views));
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
        viewCount={currentViewCount}
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
                    <div className="flex items-center gap-2 mt-2">
                      {cert.featured && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded">
                          ✓ Featured
                        </span>
                      )}
                      {viewCounts.get(cert.id) !== undefined && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <BarChart3 className="w-3 h-3" />
                          {viewCounts.get(cert.id)} views
                        </span>
                      )}
                    </div>
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
