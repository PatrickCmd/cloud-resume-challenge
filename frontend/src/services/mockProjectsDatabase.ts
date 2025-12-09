export interface Project {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  tech: string[];
  company: string;
  featured: boolean;
  githubUrl?: string;
  liveUrl?: string;
  imageUrl?: string;
  status: "draft" | "published";
  createdAt: string;
  updatedAt: string;
}

const initialProjects: Omit<Project, "id" | "createdAt" | "updatedAt" | "status">[] = [
  {
    name: "MTN Rwanda Agriculture Platform",
    description: "Django REST API powering cooperative and farmer onboarding workflows with USSD integration for collection and loan management.",
    longDescription: `A comprehensive agriculture platform built for MTN Rwanda in partnership with HAMWE EA. 

## Features
- Cooperative and farmer onboarding workflows
- USSD integration for mobile-first access
- Collection management system
- Loan management and tracking
- Real-time reporting and analytics

## Technical Implementation
Built with Django REST Framework, featuring:
- RESTful API architecture
- PostgreSQL for data persistence
- Docker containerization for deployment
- Integration with USSD gateway services`,
    tech: ["Python", "Django", "PostgreSQL", "Docker"],
    company: "HAMWE EA",
    featured: true,
  },
  {
    name: "Blockbrite Payment Gateway",
    description: "Backend modules for a payment gateway with banking transaction API integrations.",
    longDescription: `Payment gateway backend system developed for BoldGains.

## Features
- Secure payment processing
- Multi-bank API integrations
- Transaction monitoring and reporting
- Fraud detection mechanisms

## Technical Stack
- Django REST Framework for API development
- Secure banking API integrations
- Real-time transaction processing`,
    tech: ["Python", "Django", "REST APIs"],
    company: "BoldGains",
    featured: true,
  },
  {
    name: "IT Certification Extranet",
    description: "RESTful APIs for the IT certification system with SMS notifications and invoice generation.",
    longDescription: `IT Certification management system for NITA-U.

## Features
- Certification application workflow
- SMS notification system
- Automated invoice generation
- Certificate verification portal

## Implementation Details
- Django-based REST API
- PostgreSQL database
- Integration with SMS gateways
- PDF generation for certificates and invoices`,
    tech: ["Python", "Django", "PostgreSQL"],
    company: "NITA-U IT",
    featured: false,
  },
  {
    name: "Hardware Inventory System",
    description: "Internal inventory system for hardware reservations, quality checks, and automated testing processes.",
    longDescription: `Internal inventory management system for Tarana Wireless.

## Features
- Hardware reservation system
- Quality check workflows
- Automated testing integration
- Asset tracking and reporting

## Technical Details
- Flask-based REST API
- PostgreSQL for data storage
- Integration with testing frameworks`,
    tech: ["Python", "Flask", "PostgreSQL"],
    company: "Tarana Wireless",
    featured: false,
  },
  {
    name: "Music Analytics Pipeline",
    description: "Data scraping and PostgreSQL pipelines for music analytics with SQL-based data exports.",
    longDescription: `Music industry analytics platform for Chartmetric.

## Features
- Data scraping from multiple sources
- ETL pipelines for data processing
- Analytics and reporting dashboards
- SQL-based data export functionality

## Implementation
- Python-based data pipelines
- PostgreSQL for data warehousing
- API integrations with music platforms`,
    tech: ["Python", "PostgreSQL", "APIs"],
    company: "Chartmetric",
    featured: false,
  },
  {
    name: "Sunbird AI Platform",
    description: "Backend systems, infrastructure automation, and ML-enabled services for production AI systems.",
    longDescription: `Production AI platform for Sunbird AI.

## Features
- Machine learning model serving
- Infrastructure automation
- API gateway for AI services
- Scalable backend architecture

## Technical Stack
- FastAPI for high-performance APIs
- AWS infrastructure
- Docker and Kubernetes
- ML model deployment pipelines`,
    tech: ["Python", "FastAPI", "AWS", "Docker"],
    company: "Sunbird AI",
    featured: true,
  },
];

let mockDatabase: Project[] = initialProjects.map((project, index) => ({
  ...project,
  id: `proj-${index + 1}`,
  status: "published" as const,
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
}));

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockProjectsDB = {
  async getAll(): Promise<Project[]> {
    await delay(100);
    return [...mockDatabase].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  },

  async getPublished(): Promise<Project[]> {
    await delay(100);
    return mockDatabase
      .filter((p) => p.status === "published")
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  async getDrafts(): Promise<Project[]> {
    await delay(100);
    return mockDatabase
      .filter((p) => p.status === "draft")
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  async getById(id: string): Promise<Project | undefined> {
    await delay(50);
    return mockDatabase.find((p) => p.id === id);
  },

  async create(
    data: Omit<Project, "id" | "createdAt" | "updatedAt" | "status">
  ): Promise<Project> {
    await delay(200);
    const now = new Date().toISOString();
    const newProject: Project = {
      ...data,
      id: `proj-${Date.now()}`,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    };
    mockDatabase.push(newProject);
    return newProject;
  },

  async update(
    id: string,
    updates: Partial<Omit<Project, "id">>
  ): Promise<Project | undefined> {
    await delay(200);
    const index = mockDatabase.findIndex((p) => p.id === id);
    if (index === -1) return undefined;

    mockDatabase[index] = {
      ...mockDatabase[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return mockDatabase[index];
  },

  async publish(id: string): Promise<Project | undefined> {
    await delay(200);
    const index = mockDatabase.findIndex((p) => p.id === id);
    if (index === -1) return undefined;

    mockDatabase[index] = {
      ...mockDatabase[index],
      status: "published",
      updatedAt: new Date().toISOString(),
    };
    return mockDatabase[index];
  },

  async unpublish(id: string): Promise<Project | undefined> {
    await delay(200);
    const index = mockDatabase.findIndex((p) => p.id === id);
    if (index === -1) return undefined;

    mockDatabase[index] = {
      ...mockDatabase[index],
      status: "draft",
      updatedAt: new Date().toISOString(),
    };
    return mockDatabase[index];
  },

  async delete(id: string): Promise<boolean> {
    await delay(200);
    const index = mockDatabase.findIndex((p) => p.id === id);
    if (index === -1) return false;
    mockDatabase.splice(index, 1);
    return true;
  },
};
