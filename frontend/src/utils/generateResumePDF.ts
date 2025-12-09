import jsPDF from "jspdf";

interface Experience {
  company: string;
  role: string;
  period: string;
  location: string;
  highlights: string[];
}

const experiences: Experience[] = [
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
      "Built USSD module for farmer collection and loan management",
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
    company: "Tarana Wireless, Inc.",
    role: "Software Engineer",
    period: "Mar 2019 – Feb 2020",
    location: "Santa Clara, CA",
    highlights: [
      "Built features for internal inventory system for hardware reservations",
      "Automated testing processes to validate device metrics",
    ],
  },
];

const certifications = [
  "AWS Certified Solutions Architect – Associate",
  "AWS Cloud Practitioner",
  "Applied Data Science Lab - WorldQuant University",
  "GitHub Copilot Fundamentals",
  "PCEP – Certified Entry-Level Python Programmer",
];

const skills = {
  languages: "Python, SQL, Bash",
  frameworks: "Django, FastAPI, Flask, GraphQL",
  cloud: "AWS (2× Certified), GCP",
  devops: "Docker, GitHub Actions, CI/CD, Nginx",
  databases: "PostgreSQL, MySQL",
  data: "Pandas, NumPy, Scikit-Learn",
};

export function generateResumePDF(): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  // Helper functions
  const addText = (text: string, x: number, yPos: number, options?: { fontSize?: number; fontStyle?: string; color?: number[] }) => {
    const { fontSize = 10, fontStyle = "normal", color = [0, 0, 0] } = options || {};
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", fontStyle);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(text, x, yPos);
  };

  const addWrappedText = (text: string, x: number, yPos: number, maxWidth: number, fontSize: number = 10): number => {
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, yPos);
    return lines.length * (fontSize * 0.4);
  };

  const addSectionTitle = (title: string, yPos: number): number => {
    doc.setDrawColor(34, 139, 34);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    addText(title, margin, yPos + 6, { fontSize: 12, fontStyle: "bold", color: [34, 139, 34] });
    return yPos + 12;
  };

  const checkPageBreak = (requiredSpace: number): void => {
    if (y + requiredSpace > 280) {
      doc.addPage();
      y = 20;
    }
  };

  // Header
  addText("PATRICK WALUKAGGA", margin, y, { fontSize: 22, fontStyle: "bold" });
  y += 8;
  addText("Software Engineer — Python Backend | Cloud & Data Engineering | 2× AWS Certified", margin, y, { fontSize: 11, color: [100, 100, 100] });
  y += 7;
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.text("p.walukagga@gmail.com  |  github.com/PatrickCmd  |  linkedin.com/in/patrick-walukagga-53261382  |  Kampala, Uganda", margin, y);
  y += 12;

  // Summary
  y = addSectionTitle("PROFESSIONAL SUMMARY", y);
  y += 2;
  const summary = "Back-End Software Engineer with 4+ years of professional experience building scalable backend systems, REST APIs, data pipelines, and cloud-native applications. Strong in Python, Django/FastAPI, PostgreSQL, and Docker, with additional experience in data engineering, machine learning tooling, and CI/CD automation.";
  y += addWrappedText(summary, margin, y, contentWidth, 10);
  y += 8;

  // Skills
  y = addSectionTitle("TECHNICAL SKILLS", y);
  y += 2;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  
  const skillLines = [
    `Languages: ${skills.languages}`,
    `Frameworks: ${skills.frameworks}`,
    `Cloud: ${skills.cloud}`,
    `DevOps: ${skills.devops}`,
    `Databases: ${skills.databases}`,
    `Data & ML: ${skills.data}`,
  ];
  
  skillLines.forEach((line) => {
    const [label, value] = line.split(": ");
    doc.setFont("helvetica", "bold");
    doc.text(label + ": ", margin, y);
    const labelWidth = doc.getTextWidth(label + ": ");
    doc.setFont("helvetica", "normal");
    doc.text(value, margin + labelWidth, y);
    y += 5;
  });
  y += 6;

  // Experience
  y = addSectionTitle("PROFESSIONAL EXPERIENCE", y);
  y += 2;

  experiences.forEach((exp) => {
    checkPageBreak(30);
    
    addText(exp.company, margin, y, { fontSize: 11, fontStyle: "bold" });
    const companyWidth = doc.getTextWidth(exp.company);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(` — ${exp.role}`, margin + companyWidth, y);
    y += 5;
    
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text(`${exp.period} | ${exp.location}`, margin, y);
    y += 5;
    
    doc.setTextColor(0, 0, 0);
    exp.highlights.forEach((highlight) => {
      checkPageBreak(8);
      doc.setFontSize(9);
      doc.text("•", margin + 2, y);
      const lines = doc.splitTextToSize(highlight, contentWidth - 8);
      doc.text(lines, margin + 6, y);
      y += lines.length * 4 + 1;
    });
    y += 4;
  });

  // Education
  checkPageBreak(25);
  y = addSectionTitle("EDUCATION", y);
  y += 2;
  addText("Nkumba University", margin, y, { fontSize: 11, fontStyle: "bold" });
  y += 5;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Bachelor's Degree in Information Technology | 2012 – 2015", margin, y);
  y += 10;

  // Certifications
  checkPageBreak(40);
  y = addSectionTitle("CERTIFICATIONS", y);
  y += 2;
  doc.setFontSize(9);
  certifications.forEach((cert) => {
    checkPageBreak(6);
    doc.text("•  " + cert, margin, y);
    y += 5;
  });

  // Save the PDF
  doc.save("Patrick_Walukagga_Resume.pdf");
}
