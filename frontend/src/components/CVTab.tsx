import { Briefcase, GraduationCap, Download, Calendar, MapPin } from "lucide-react";
import { Button } from "./ui/button";
import { generateResumePDF } from "@/utils/generateResumePDF";
import { toast } from "@/hooks/use-toast";
import { profile } from "@/content/profile";
import { experience, formatPeriod } from "@/content/experience";

const handleDownloadCV = () => {
  try {
    generateResumePDF();
    toast({
      title: "Resume Downloaded",
      description: "Your CV has been generated and downloaded successfully.",
    });
  } catch {
    toast({
      title: "Download Failed",
      description: "There was an error generating the PDF. Please try again.",
      variant: "destructive",
    });
  }
};

export function CVTab() {
  return (
    <div className="space-y-8">
      <div className="flex justify-end animate-fade-in">
        <Button className="gap-2" variant="default" onClick={handleDownloadCV}>
          <Download className="w-4 h-4" />
          Download CV
        </Button>
      </div>

      <div className="animate-slide-up">
        <h3 className="section-title">
          <Briefcase className="w-5 h-5 text-primary" />
          Professional Experience
        </h3>
        <div className="space-y-0">
          {experience.map((exp) => (
            <div key={`${exp.company}-${exp.start}`} className="timeline-item">
              <div className="space-y-2">
                <span className="font-semibold text-foreground text-lg">{exp.company}</span>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-primary font-medium">{exp.role}</span>
                  <span className="text-muted-foreground hidden sm:inline">•</span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {formatPeriod(exp)}
                  </span>
                  <span className="text-muted-foreground hidden sm:inline">•</span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    {exp.location}
                  </span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-1">
                  {exp.outcomes.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
        <h3 className="section-title">
          <GraduationCap className="w-5 h-5 text-primary" />
          Education
        </h3>
        {profile.education.map((edu) => (
          <div key={edu.institution} className="p-5 rounded-lg border border-border bg-card">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <div>
                <div className="font-semibold text-foreground text-lg">{edu.institution}</div>
                <div className="text-muted-foreground">{edu.degree}</div>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground font-mono">
                <Calendar className="w-3 h-3" />
                {edu.startYear} – {edu.endYear}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: "0.3s" }}>
        <p>This page is optimized for printing. Use Ctrl/Cmd + P to print.</p>
      </div>
    </div>
  );
}
