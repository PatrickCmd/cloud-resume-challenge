import { ArrowLeft, Edit, Send, Trash2, ExternalLink, Calendar, Award, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Certification } from "@/services/mockCertificationsDatabase";

interface CertificationDetailProps {
  certification: Certification;
  onBack: () => void;
  onEdit?: () => void;
  onPublish?: () => void;
  onUnpublish?: () => void;
  onDelete?: () => void;
}

export function CertificationDetail({
  certification,
  onBack,
  onEdit,
  onPublish,
  onUnpublish,
  onDelete,
}: CertificationDetailProps) {
  const isDraft = certification.status === "draft";
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

      <div className="p-8 rounded-xl border border-border bg-card">
        <div className="flex items-start gap-6">
          <div className="text-6xl">{certification.icon}</div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground">{certification.name}</h1>
              {isDraft && (
                <Badge variant="secondary">Draft</Badge>
              )}
              {certification.featured && (
                <Badge className="bg-primary/10 text-primary">Featured</Badge>
              )}
            </div>
            
            <p className="text-lg text-muted-foreground mb-4">{certification.issuer}</p>
            
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
              <div className="flex items-center gap-2">
                {certification.type === "certification" ? (
                  <Award className="w-4 h-4" />
                ) : (
                  <BookOpen className="w-4 h-4" />
                )}
                <span className="capitalize">{certification.type}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{new Date(certification.dateEarned).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="prose prose-sm max-w-none">
              <p className="text-foreground leading-relaxed">{certification.description}</p>
            </div>

            {certification.credentialUrl && (
              <a
                href={certification.credentialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                View Credential
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 rounded-lg border border-border bg-muted/30 text-sm text-muted-foreground">
        <div className="flex flex-wrap gap-4">
          <span>Created: {new Date(certification.createdAt).toLocaleDateString()}</span>
          <span>Updated: {new Date(certification.updatedAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}
