import jsPDF from "jspdf";
import { profile } from "@/content/profile";
import { experience, formatPeriod } from "@/content/experience";
import { skillGroups } from "@/content/skills";
import { certifications as certificationList } from "@/content/certifications";

const experiences = experience.map((exp) => ({
  company: exp.company,
  role: exp.role,
  period: formatPeriod(exp),
  location: exp.location,
  highlights: exp.outcomes,
}));

const certifications = certificationList.map((c) =>
  c.issuer ? `${c.name} - ${c.issuer}` : c.name,
);

const skills = Object.fromEntries(skillGroups.map((g) => [g.title, g.items.join(", ")]));

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
  addText(profile.name.toUpperCase(), margin, y, { fontSize: 22, fontStyle: "bold" });
  y += 8;
  addText(`${profile.title} | ${profile.headline}`, margin, y, { fontSize: 11, color: [100, 100, 100] });
  y += 7;
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.text(`${profile.email}  |  ${profile.links.github.replace("https://", "")}  |  ${profile.links.linkedin.replace("https://www.", "").replace(/\/$/, "")}  |  ${profile.location}`, margin, y);
  y += 12;

  // Summary
  y = addSectionTitle("PROFESSIONAL SUMMARY", y);
  y += 2;
  const summary = profile.summary;
  y += addWrappedText(summary, margin, y, contentWidth, 10);
  y += 8;

  // Skills
  y = addSectionTitle("TECHNICAL SKILLS", y);
  y += 2;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  
  Object.entries(skills).forEach(([label, value]) => {
    checkPageBreak(10);
    doc.setFont("helvetica", "bold");
    doc.text(label + ": ", margin, y);
    const labelWidth = doc.getTextWidth(label + ": ");
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(value, contentWidth - labelWidth);
    doc.text(lines, margin + labelWidth, y);
    y += lines.length * 4 + 1;
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
  profile.education.forEach((edu) => {
    addText(edu.institution, margin, y, { fontSize: 11, fontStyle: "bold" });
    y += 5;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`${edu.degree} | ${edu.startYear} – ${edu.endYear}`, margin, y);
    y += 10;
  });

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
