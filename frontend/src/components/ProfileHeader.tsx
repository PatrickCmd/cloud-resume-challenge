import avatar from "@/assets/avatar.jpg";
import { MapPin, Mail, Building2, Github, Linkedin } from "lucide-react";
import { profile } from "@/content/profile";
import { coreStack } from "@/content/skills";

export function ProfileHeader() {
  return (
    <div className="flex flex-col md:flex-row gap-6 items-start animate-fade-in">
      <div className="relative">
        <img
          src={avatar}
          alt={profile.name}
          width={256}
          height={256}
          className="w-64 h-64 rounded-full border-4 border-border shadow-lg"
        />
        <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium">
          2× AWS Certified
        </div>
      </div>

      <div className="flex-1 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{profile.name}</h1>
          <p className="text-xl text-muted-foreground font-mono">{profile.handle}</p>
        </div>

        <p className="text-base text-foreground max-w-xl leading-relaxed">{profile.headline}</p>

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <a href={profile.links.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 link-hover">
            <Github className="w-4 h-4" />
            {profile.handle}
          </a>
          <a href={profile.links.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 link-hover">
            <Linkedin className="w-4 h-4" />
            LinkedIn
          </a>
          <a href={`mailto:${profile.email}`} className="flex items-center gap-1.5 link-hover">
            <Mail className="w-4 h-4" />
            {profile.email}
          </a>
          <span className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4" />
            {profile.location}
          </span>
          <span className="flex items-center gap-1.5">
            <Building2 className="w-4 h-4" />
            {profile.employer.name}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          {coreStack.map((skill) => (
            <span key={skill} className="skill-badge">
              {skill}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
