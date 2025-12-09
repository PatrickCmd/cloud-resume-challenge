import avatar from "@/assets/avatar.jpg";
import { MapPin, Mail, Building2, Github, Linkedin } from "lucide-react";

export function ProfileHeader() {
  return (
    <div className="flex flex-col md:flex-row gap-6 items-start animate-fade-in">
      <div className="relative">
        <img
          src={avatar}
          alt="Patrick Walukagga"
          className="w-64 h-64 rounded-full border-4 border-border shadow-lg"
        />
        <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium">
          2× AWS Certified
        </div>
      </div>

      <div className="flex-1 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Patrick Walukagga</h1>
          <p className="text-xl text-muted-foreground font-mono">PatrickCmd</p>
        </div>

        <p className="text-base text-foreground max-w-xl leading-relaxed">
          Software Engineer — Python Backend | Cloud & Data Engineering. Building scalable backend systems, REST APIs, data pipelines, and cloud-native applications.
        </p>

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <a
            href="https://github.com/PatrickCmd"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 link-hover"
          >
            <Github className="w-4 h-4" />
            PatrickCmd
          </a>
          <a
            href="https://linkedin.com/in/patrick-walukagga-53261382"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 link-hover"
          >
            <Linkedin className="w-4 h-4" />
            LinkedIn
          </a>
          <a
            href="mailto:p.walukagga@gmail.com"
            className="flex items-center gap-1.5 link-hover"
          >
            <Mail className="w-4 h-4" />
            p.walukagga@gmail.com
          </a>
          <span className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4" />
            Kampala, Uganda
          </span>
          <span className="flex items-center gap-1.5">
            <Building2 className="w-4 h-4" />
            Sunbird AI
          </span>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          {["Python", "Django", "FastAPI", "PostgreSQL", "AWS", "Docker"].map((skill) => (
            <span key={skill} className="skill-badge">
              {skill}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
