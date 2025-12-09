import { Briefcase, GraduationCap, Download, Calendar, MapPin } from "lucide-react";
import { Button } from "./ui/button";
import { generateResumePDF } from "@/utils/generateResumePDF";
import { toast } from "@/hooks/use-toast";

const handleDownloadCV = () => {
  try {
    generateResumePDF();
    toast({
      title: "Resume Downloaded",
      description: "Your CV has been generated and downloaded successfully.",
    });
  } catch (error) {
    toast({
      title: "Download Failed",
      description: "There was an error generating the PDF. Please try again.",
      variant: "destructive",
    });
  }
};

const experience = [
  {
    company: "Sunbird AI",
    role: "Software Engineer",
    period: "Apr 2024 – Present",
    location: "Kampala, Uganda",
    highlights: [
      "Working on backend systems, infrastructure automation, and ML-enabled services",
      "Contributing to scalable service design, API development, and cloud orchestration",
    ],
  },
  {
    company: "Audersity",
    role: "Python/Django Backend Engineer",
    period: "May 2023 – Jun 2024",
    location: "Kampala, Uganda",
    highlights: [
      "Designed and developed backend features across Django-based systems",
      "Improved API reliability and system performance through clean architecture",
      "Collaborated with cross-functional teams to ship secure, maintainable backend services",
    ],
  },
  {
    company: "Cecure Intelligence Limited",
    role: "Data Engineer Graduate Trainee",
    period: "Feb 2023 – Mar 2024",
    location: "Lagos, Nigeria",
    highlights: [
      "Built ETL pipelines and automated data ingestion workflows",
      "Worked with engineering teams to support analytics and reporting",
    ],
  },
  {
    company: "HAMWE EA",
    role: "Python/Django Developer",
    period: "Jun 2021 – Jun 2022",
    location: "Kampala, Uganda",
    highlights: [
      "Developed Django REST API for cooperative and farmer onboarding (MTN Rwanda)",
      "Designed PostgreSQL schemas for user, cooperative, and shipment modules",
      "Built USSD module for farmer collection and loan management",
      "Managed DevOps workflows with GitHub Actions, Docker, Nginx",
    ],
  },
  {
    company: "BoldGains",
    role: "Python/Django Engineer",
    period: "Sep 2021 – Jan 2022",
    location: "Dubai, UAE",
    highlights: [
      "Built backend modules for the Blockbrite payment gateway",
      "Developed integration layers for banking transaction APIs",
    ],
  },
  {
    company: "Andela",
    role: "Software Developer",
    period: "Nov 2017 – Dec 2021",
    location: "Kampala, Uganda",
    highlights: [
      "Supported distributed engineering teams building scalable applications",
      "Contributed to backend development, testing, and system debugging",
    ],
  },
  {
    company: "NITA-U IT",
    role: "Python/Django Developer",
    period: "May 2020 – Dec 2020",
    location: "Kampala, Uganda",
    highlights: [
      "Developed RESTful APIs for IT certification extranet system",
      "Integrated SMS notifications and updated certification workflows",
    ],
  },
  {
    company: "Tarana Wireless, Inc.",
    role: "Software Engineer",
    period: "Mar 2019 – Feb 2020",
    location: "Santa Clara, CA",
    highlights: [
      "Built features for internal inventory system for hardware reservations",
      "Automated testing processes to validate device metrics",
    ],
  },
  {
    company: "Chartmetric",
    role: "Junior Software Developer",
    period: "Oct 2018 – Jan 2019",
    location: "Remote / United States",
    highlights: [
      "Scraped music analytics data from APIs into PostgreSQL pipelines",
      "Resolved backend bugs and implemented new feature enhancements",
    ],
  },
];

export function CVTab() {
  return (
    <div className="space-y-8">
      {/* Download Button */}
      <div className="flex justify-end animate-fade-in">
        <Button className="gap-2" variant="default" onClick={handleDownloadCV}>
          <Download className="w-4 h-4" />
          Download CV
        </Button>
      </div>

      {/* Professional Experience */}
      <div className="animate-slide-up">
        <h3 className="section-title">
          <Briefcase className="w-5 h-5 text-primary" />
          Professional Experience
        </h3>
        <div className="space-y-0">
          {experience.map((exp, index) => (
            <div key={index} className="timeline-item">
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <span className="font-semibold text-foreground text-lg">{exp.company}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-primary font-medium">{exp.role}</span>
                  <span className="text-muted-foreground hidden sm:inline">•</span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {exp.period}
                  </span>
                  <span className="text-muted-foreground hidden sm:inline">•</span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    {exp.location}
                  </span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-1">
                  {exp.highlights.map((highlight, i) => (
                    <li key={i}>{highlight}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Education */}
      <div className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
        <h3 className="section-title">
          <GraduationCap className="w-5 h-5 text-primary" />
          Education
        </h3>
        <div className="p-5 rounded-lg border border-border bg-card">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div>
              <div className="font-semibold text-foreground text-lg">Nkumba University</div>
              <div className="text-muted-foreground">Bachelor's Degree in Information Technology</div>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground font-mono">
              <Calendar className="w-3 h-3" />
              2012 – 2015
            </div>
          </div>
        </div>
      </div>

      {/* Print-friendly note */}
      <div className="text-center text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: "0.3s" }}>
        <p>This page is optimized for printing. Use Ctrl/Cmd + P to print.</p>
      </div>
    </div>
  );
}
