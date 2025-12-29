import { ContributionGraph } from "./ContributionGraph";
import { Briefcase, GraduationCap, Code2, Cloud, Database, Terminal } from "lucide-react";

const skills = {
  languages: ["Python", "SQL", "Bash"],
  frameworks: ["Django", "FastAPI", "Flask", "GraphQL"],
  cloud: ["AWS (2× Certified)", "GCP"],
  data: ["Pandas", "NumPy", "Scikit-Learn"],
  devops: ["Docker", "GitHub Actions", "CI/CD", "Nginx", "Gunicorn"],
  databases: ["PostgreSQL", "MySQL"],
  other: ["LLMs", "Shell scripting", "Systems integration"],
};

const recentExperience = [
  {
    company: "Sunbird AI",
    role: "Software Engineer",
    period: "Apr 2024 – Present",
    description: "Backend systems, infrastructure automation, and ML-enabled services.",
  },
  {
    company: "Audersity",
    role: "Python/Django Backend Engineer",
    period: "May 2023 – Jun 2024",
    description: "Backend features, API reliability, and system performance improvements.",
  },
  {
    company: "Cecure Intelligence Limited",
    role: "Data Engineer Graduate Trainee",
    period: "Feb 2023 – Mar 2024",
    description: "ETL pipelines and automated data ingestion workflows.",
  },
];

export function OverviewTab() {
  return (
    <div className="space-y-8">
      {/* Summary */}
      <div className="p-5 rounded-lg border border-border bg-card animate-fade-in">
        <p className="text-foreground leading-relaxed">
          I am a Backend & Cloud Engineer with <span className="font-semibold text-primary">4+ years</span> of strong expertise in Python and modern backend architectures. I design and build robust APIs, distributed systems, and scalable data pipelines using Django, FastAPI, PostgreSQL, and cloud-native tooling across AWS and GCP.
        </p>
        <p className="text-foreground leading-relaxed mt-4">
          My work spans backend engineering, cloud infrastructure design, CI/CD automation, and end-to-end system reliability. I have experience supporting ML-enabled products, optimizing backend performance, and implementing architecture patterns that make systems secure, observable, and maintainable at scale.
        </p>
        <p className="text-foreground leading-relaxed mt-4">
          I enjoy solving complex engineering problems with clean, systematic solutions and believe in building technology that is stable, efficient, and easy for teams to extend over time. I'm driven by a passion for automation, clarity in engineering, and delivering reliable platforms that power real-world applications.
        </p>
        <div className="flex flex-wrap gap-2 mt-4">
          <span className="skill-badge">Backend Engineering</span>
          <span className="skill-badge">Cloud Infrastructure</span>
          <span className="skill-badge">Distributed Systems</span>
          <span className="skill-badge">Data Pipelines</span>
          <span className="skill-badge">CI/CD Automation</span>
          <span className="skill-badge">System Reliability</span>
          <span className="skill-badge">MLOps</span>
        </div>
      </div>

      <ContributionGraph />

      {/* Technical Skills */}
      <div className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
        <h3 className="section-title">
          <Code2 className="w-5 h-5 text-primary" />
          Technical Skills
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg border border-border bg-card">
            <div className="flex items-center gap-2 mb-3">
              <Terminal className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm">Languages & Frameworks</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[...skills.languages, ...skills.frameworks].map((skill) => (
                <span key={skill} className="skill-badge">{skill}</span>
              ))}
            </div>
          </div>
          
          <div className="p-4 rounded-lg border border-border bg-card">
            <div className="flex items-center gap-2 mb-3">
              <Cloud className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm">Cloud & DevOps</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[...skills.cloud, ...skills.devops].map((skill) => (
                <span key={skill} className="skill-badge">{skill}</span>
              ))}
            </div>
          </div>
          
          <div className="p-4 rounded-lg border border-border bg-card">
            <div className="flex items-center gap-2 mb-3">
              <Database className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm">Databases & Data</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[...skills.databases, ...skills.data].map((skill) => (
                <span key={skill} className="skill-badge">{skill}</span>
              ))}
            </div>
          </div>
          
          <div className="p-4 rounded-lg border border-border bg-card">
            <div className="flex items-center gap-2 mb-3">
              <Code2 className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm">Other</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.other.map((skill) => (
                <span key={skill} className="skill-badge">{skill}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Experience */}
      <div className="animate-slide-up" style={{ animationDelay: "0.4s" }}>
        <h3 className="section-title">
          <Briefcase className="w-5 h-5 text-primary" />
          Recent Experience
        </h3>
        <div className="space-y-0">
          {recentExperience.map((exp, index) => (
            <div key={index} className="timeline-item">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-1">
                <span className="font-semibold text-foreground">{exp.company}</span>
                <span className="text-sm text-muted-foreground hidden sm:inline">•</span>
                <span className="text-sm text-muted-foreground">{exp.role}</span>
              </div>
              <span className="text-xs text-muted-foreground font-mono">{exp.period}</span>
              <p className="text-sm text-muted-foreground mt-1">{exp.description}</p>
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
        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="font-semibold text-foreground">Nkumba University</div>
          <div className="text-sm text-muted-foreground">Bachelor's Degree in Information Technology</div>
          <div className="text-xs text-muted-foreground font-mono mt-1">2012 – 2015</div>
        </div>
      </div>
    </div>
  );
}
