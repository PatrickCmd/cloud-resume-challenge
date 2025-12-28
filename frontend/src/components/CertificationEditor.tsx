import { useState } from "react";
import { ArrowLeft, Save, Send, Eye, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CertificationNormalized } from "@/types/certification";

interface CertificationEditorProps {
  certification?: CertificationNormalized;
  onSave: (data: Omit<CertificationNormalized, "id" | "createdAt" | "updatedAt" | "status">) => void;
  onPublish: (data: Omit<CertificationNormalized, "id" | "createdAt" | "updatedAt" | "status">) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const iconOptions = ["☁️", "🏆", "📊", "🤖", "🐍", "📚", "💻", "🎨", "🔐", "⚡", "🌐", "📱"];

export function CertificationEditor({
  certification,
  onSave,
  onPublish,
  onCancel,
  isLoading,
}: CertificationEditorProps) {
  const [name, setName] = useState(certification?.name || "");
  const [issuer, setIssuer] = useState(certification?.issuer || "");
  const [icon, setIcon] = useState(certification?.icon || "🏆");
  const [type, setType] = useState<"certification" | "course">(
    certification?.type || "certification"
  );
  const [featured, setFeatured] = useState(certification?.featured || false);
  const [credentialUrl, setCredentialUrl] = useState(certification?.credentialUrl || "");
  const [dateEarned, setDateEarned] = useState(certification?.dateEarned || "");
  const [expiryDate, setExpiryDate] = useState(certification?.expiry_date || "");
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  const formData = {
    name,
    issuer,
    icon,
    type,
    featured,
    credentialUrl: credentialUrl || undefined,
    expiry_date: expiryDate || undefined,
    dateEarned,
  };

  const isValid = name.trim() && issuer.trim() && dateEarned;

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
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="AWS Certified Solutions Architect"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="issuer">Issuer *</Label>
              <Input
                id="issuer"
                value={issuer}
                onChange={(e) => setIssuer(e.target.value)}
                placeholder="Amazon Web Services"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Icon</Label>
              <Select value={icon} onValueChange={setIcon}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {iconOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      <span className="text-xl">{opt}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as "certification" | "course")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="certification">Certification</SelectItem>
                  <SelectItem value="course">Course</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateEarned">Date Earned *</Label>
              <Input
                id="dateEarned"
                type="date"
                value={dateEarned}
                onChange={(e) => setDateEarned(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date (optional)</Label>
              <Input
                id="expiryDate"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="credentialUrl">Credential URL (optional)</Label>
            <Input
              id="credentialUrl"
              value={credentialUrl}
              onChange={(e) => setCredentialUrl(e.target.value)}
              placeholder="https://www.credly.com/..."
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch id="featured" checked={featured} onCheckedChange={setFeatured} />
            <Label htmlFor="featured">Featured</Label>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="mt-4">
          <div className="p-6 rounded-lg border border-border bg-card">
            <div className="flex items-start gap-4">
              <div className="text-5xl">{icon}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-xl font-semibold text-foreground">{name || "Untitled"}</h2>
                  {featured && (
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded">
                      Featured
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground mb-2">{issuer || "No issuer"}</p>
                <p className="text-sm text-muted-foreground mb-3">
                  {type === "certification" ? "📜 Certification" : "📚 Course"} •{" "}
                  Earned: {dateEarned ? new Date(dateEarned).toLocaleDateString() : "No date"}
                  {expiryDate && (
                    <> • Expires: {new Date(expiryDate).toLocaleDateString()}</>
                  )}
                </p>
                {credentialUrl && (
                  <a
                    href={credentialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-3 text-primary hover:underline text-sm"
                  >
                    View Credential →
                  </a>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
