// Builds public/Patrick-Walukagga-Resume.pdf from src/content/*.ts.
//   node scripts/generate-resume.cjs
// Needs Playwright with Chromium available to Node (npx playwright install chromium).
// Rerun whenever experience, skills, certifications or the summary change, and commit the PDF.
const path = require("path");
const fs = require("fs");
const os = require("os");
const esbuild = require("esbuild");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "..");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "resume-"));
const bundle = path.join(tmp, "content.cjs");

esbuild.buildSync({
  entryPoints: [path.join(root, "src/content/index.ts")],
  bundle: true,
  platform: "node",
  format: "cjs",
  outfile: bundle,
  logLevel: "silent",
});
const content = require(bundle);
const { profile, experience, skillGroups, certifications, formatPeriod, yearsOfExperience } = content;

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const bare = (url) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>${esc(profile.name)} – Resume</title>
<style>
  @page { size: A4; margin: 12mm 14mm; }
  * { box-sizing: border-box; }
  body { font-family: Inter, "DejaVu Sans", Arial, sans-serif; color: #111; font-size: 9.8pt; line-height: 1.32; margin: 0; }
  a { color: #111; text-decoration: none; }
  h1 { font-size: 22pt; margin: 0; letter-spacing: -0.01em; }
  .title { font-size: 11.5pt; color: #444; margin: 2pt 0 4pt; }
  .contact { font-size: 9pt; color: #444; }
  .contact span + span::before { content: "  ·  "; color: #999; }
  h2 { font-size: 10.5pt; text-transform: uppercase; letter-spacing: 0.08em; color: #1f6feb; border-bottom: 1px solid #d0d7de; padding-bottom: 2pt; margin: 9pt 0 4pt; }
  p { margin: 0; }
  .skills dt { font-weight: 600; display: inline; }
  .skills dd { display: inline; margin: 0; }
  .skills div { margin-bottom: 2pt; }
  .role { margin-bottom: 5pt; break-inside: avoid; }
  .role-head { display: flex; justify-content: space-between; align-items: baseline; gap: 8pt; }
  .role-head strong { font-size: 10.5pt; }
  .role-head .when { font-size: 9pt; color: #555; white-space: nowrap; }
  .role .meta { font-size: 9.5pt; color: #444; }
  ul { margin: 2pt 0 0; padding-left: 14pt; }
  li { margin: 0 0 1pt; }
  .tags { font-size: 8.5pt; color: #666; margin-top: 1pt; }
  .two { display: grid; grid-template-columns: 1fr 1fr; gap: 0 18pt; }
  .two ul { padding-left: 12pt; }
</style></head><body>
<header>
  <h1>${esc(profile.name)}</h1>
  <div class="title">${esc(profile.title)} · ${esc(profile.headline)}</div>
  <div class="contact">
    <span>${esc(profile.location)}</span>
    <span><a href="mailto:${esc(profile.email)}">${esc(profile.email)}</a></span>
    <span><a href="${esc(profile.siteUrl)}">${esc(bare(profile.siteUrl))}</a></span>
    <span><a href="${esc(profile.links.github)}">${esc(bare(profile.links.github))}</a></span>
    <span><a href="${esc(profile.links.linkedin)}">${esc(bare(profile.links.linkedin))}</a></span>
  </div>
</header>

<h2>Summary</h2>
<p>${esc(profile.summary.replace(/\d+\+ years/, `${yearsOfExperience()}+ years`))}</p>

<h2>Technical skills</h2>
<dl class="skills">
${skillGroups.map((g) => `  <div><dt>${esc(g.title)}:</dt> <dd>${esc(g.items.join(", "))}</dd></div>`).join("\n")}
</dl>

<h2>Experience</h2>
${experience
  .map(
    (e) => `<div class="role">
  <div class="role-head"><strong>${esc(e.role)}</strong><span class="when">${esc(formatPeriod(e))}</span></div>
  <div class="meta">${esc(e.company)} · ${esc(e.location)}</div>
  <ul>${e.outcomes.map((o) => `<li>${esc(o)}</li>`).join("")}</ul>
  <div class="tags">${esc(e.tech.join(" · "))}</div>
</div>`,
  )
  .join("\n")}

<div class="two">
  <div>
    <h2>Education</h2>
    ${profile.education
      .map((ed) => `<div class="role"><strong>${esc(ed.institution)}</strong><div class="meta">${esc(ed.degree)} · ${ed.startYear} – ${ed.endYear}</div></div>`)
      .join("")}
  </div>
  <div>
    <h2>Certifications</h2>
    <ul>${certifications.map((c) => `<li>${esc(c.name)} · ${esc(c.issuer)} (${c.year})</li>`).join("")}</ul>
  </div>
</div>
</body></html>`;

(async () => {
  const out = path.join(root, "public", profile.resumeUrl.replace(/^\//, ""));
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "load" });
  await page.pdf({ path: out, format: "A4", printBackground: true, preferCSSPageSize: true });
  await browser.close();
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log("wrote", path.relative(root, out));
})();
