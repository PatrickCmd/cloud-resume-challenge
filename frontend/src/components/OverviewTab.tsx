import { Briefcase, GraduationCap, Code2 } from "lucide-react";
import { profile, profileFacts } from "@/content/profile";
import { skillGroups } from "@/content/skills";
import { experience, formatPeriod } from "@/content/experience";

export function OverviewTab() {
  const recentExperience = experience.slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Summary */}
      <div className="p-5 rounded-lg border border-border bg-card animate-fade-in">
        <p className="text-foreground leading-relaxed">{profile.about}</p>
        <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 mt-4 text-sm">
          {profileFacts().map((fact) => (
            <div key={fact.label} className="flex gap-2">
              <dt className="text-muted-foreground shrink-0">{fact.label}:</dt>
              <dd className="text-foreground">{fact.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Technical Skills */}
      <div className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
        <h3 className="section-title">
          <Code2 className="w-5 h-5 text-primary" />
          Technical Skills
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          {skillGroups.map((group) => (
            <div key={group.id} className="p-4 rounded-lg border border-border bg-card">
              <div className="font-medium text-sm mb-3">{group.title}</div>
              <div className="flex flex-wrap gap-2">
                {group.items.map((skill) => (
                  <span key={skill} className="skill-badge">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Experience */}
      <div className="animate-slide-up" style={{ animationDelay: "0.4s" }}>
        <h3 className="section-title">
          <Briefcase className="w-5 h-5 text-primary" />
          Recent Experience
        </h3>
        <div className="space-y-0">
          {recentExperience.map((exp) => (
            <div key={`${exp.company}-${exp.start}`} className="timeline-item">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-1">
                <span className="font-semibold text-foreground">{exp.company}</span>
                <span className="text-sm text-muted-foreground hidden sm:inline">•</span>
                <span className="text-sm text-muted-foreground">{exp.role}</span>
              </div>
              <span className="text-xs text-muted-foreground font-mono">{formatPeriod(exp)}</span>
              <p className="text-sm text-muted-foreground mt-1">{exp.outcomes[0]}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Education */}
      <div className="animate-slide-up" style={{ animationDelay: "0.5s" }}>
        <h3 className="section-title">
          <GraduationCap className="w-5 h-5 text-primary" />
          Education
        </h3>
        {profile.education.map((edu) => (
          <div key={edu.institution} className="p-4 rounded-lg border border-border bg-card">
            <div className="font-semibold text-foreground">{edu.institution}</div>
            <div className="text-sm text-muted-foreground">{edu.degree}</div>
            <div className="text-xs text-muted-foreground font-mono mt-1">
              {edu.startYear} – {edu.endYear}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
