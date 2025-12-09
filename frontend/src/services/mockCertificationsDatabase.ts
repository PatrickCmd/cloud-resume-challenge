export interface Certification {
  id: string;
  name: string;
  issuer: string;
  icon: string;
  type: "certification" | "course";
  featured: boolean;
  description: string;
  credentialUrl?: string;
  dateEarned: string;
  status: "draft" | "published";
  createdAt: string;
  updatedAt: string;
}

const initialCertifications: Omit<Certification, "id" | "createdAt" | "updatedAt" | "status">[] = [
  {
    name: "AWS Certified Solutions Architect – Associate",
    issuer: "Amazon Web Services (AWS)",
    icon: "☁️",
    type: "certification",
    featured: true,
    description: "Validates expertise in designing distributed systems on AWS.",
    dateEarned: "2023-06-15",
  },
  {
    name: "AWS Cloud Practitioner",
    issuer: "Amazon Web Services (AWS)",
    icon: "☁️",
    type: "certification",
    featured: true,
    description: "Foundational understanding of AWS Cloud concepts, services, and terminology.",
    dateEarned: "2023-01-20",
  },
  {
    name: "AWS Cloud Project Bootcamp (Teal Squad)",
    issuer: "AWS",
    icon: "🏆",
    type: "certification",
    featured: false,
    description: "Hands-on bootcamp for building real-world AWS projects.",
    dateEarned: "2023-03-10",
  },
  {
    name: "Applied Data Science Lab",
    issuer: "WorldQuant University",
    icon: "📊",
    type: "course",
    featured: false,
    description: "Practical data science skills using Python and machine learning.",
    dateEarned: "2022-12-01",
  },
  {
    name: "GitHub Copilot Fundamentals",
    issuer: "GitHub",
    icon: "🤖",
    type: "course",
    featured: false,
    description: "Understanding AI-powered code completion with GitHub Copilot.",
    dateEarned: "2024-02-15",
  },
  {
    name: "[PCEP-30-01] PCEP – Certified Entry-Level Python Programmer",
    issuer: "Python Institute",
    icon: "🐍",
    type: "certification",
    featured: false,
    description: "Entry-level certification for Python programming fundamentals.",
    dateEarned: "2022-08-20",
  },
  {
    name: "Python Data Structures",
    issuer: "Coursera",
    icon: "📚",
    type: "course",
    featured: false,
    description: "Deep dive into Python data structures and algorithms.",
    dateEarned: "2022-05-10",
  },
  {
    name: "Programming for Everybody",
    issuer: "Coursera",
    icon: "💻",
    type: "course",
    featured: false,
    description: "Introduction to programming concepts using Python.",
    dateEarned: "2022-03-15",
  },
  {
    name: "Front-End Web UI Frameworks and Tools",
    issuer: "Coursera",
    icon: "🎨",
    type: "course",
    featured: false,
    description: "Building responsive web interfaces with modern frameworks.",
    dateEarned: "2022-07-20",
  },
];

let mockDatabase: Certification[] = initialCertifications.map((cert, index) => ({
  ...cert,
  id: `cert-${index + 1}`,
  status: "published" as const,
  createdAt: cert.dateEarned,
  updatedAt: cert.dateEarned,
}));

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockCertificationsDB = {
  async getAll(): Promise<Certification[]> {
    await delay(100);
    return [...mockDatabase].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  },

  async getPublished(): Promise<Certification[]> {
    await delay(100);
    return mockDatabase
      .filter((c) => c.status === "published")
      .sort((a, b) => new Date(b.dateEarned).getTime() - new Date(a.dateEarned).getTime());
  },

  async getDrafts(): Promise<Certification[]> {
    await delay(100);
    return mockDatabase
      .filter((c) => c.status === "draft")
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  async getById(id: string): Promise<Certification | undefined> {
    await delay(50);
    return mockDatabase.find((c) => c.id === id);
  },

  async create(
    data: Omit<Certification, "id" | "createdAt" | "updatedAt" | "status">
  ): Promise<Certification> {
    await delay(200);
    const now = new Date().toISOString();
    const newCert: Certification = {
      ...data,
      id: `cert-${Date.now()}`,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    };
    mockDatabase.push(newCert);
    return newCert;
  },

  async update(
    id: string,
    updates: Partial<Omit<Certification, "id">>
  ): Promise<Certification | undefined> {
    await delay(200);
    const index = mockDatabase.findIndex((c) => c.id === id);
    if (index === -1) return undefined;

    mockDatabase[index] = {
      ...mockDatabase[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return mockDatabase[index];
  },

  async publish(id: string): Promise<Certification | undefined> {
    await delay(200);
    const index = mockDatabase.findIndex((c) => c.id === id);
    if (index === -1) return undefined;

    mockDatabase[index] = {
      ...mockDatabase[index],
      status: "published",
      updatedAt: new Date().toISOString(),
    };
    return mockDatabase[index];
  },

  async unpublish(id: string): Promise<Certification | undefined> {
    await delay(200);
    const index = mockDatabase.findIndex((c) => c.id === id);
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
    const index = mockDatabase.findIndex((c) => c.id === id);
    if (index === -1) return false;
    mockDatabase.splice(index, 1);
    return true;
  },
};
