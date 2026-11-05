// Regenerates public/og.png (1200x630). Needs Playwright with Chromium available to Node:
//   npx playwright install chromium   (once)
//   node scripts/generate-og.cjs src/assets/avatar.jpg public/og.png
// The image is a committed static asset; rerun only when the name, title or headline changes.
const { chromium } = require("playwright");
const { readFileSync } = require("fs");
const avatar = "data:image/jpeg;base64," + readFileSync(process.argv[2]).toString("base64");
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; margin: 0; }
  body { width: 1200px; height: 630px; font-family: Inter, "DejaVu Sans", sans-serif; background: #0d1117; color: #f0f6fc; overflow: hidden; }
  .wrap { position: relative; width: 1200px; height: 630px; padding: 72px 80px; display: flex; align-items: center; gap: 64px; }
  .glow { position: absolute; width: 700px; height: 700px; border-radius: 50%; background: radial-gradient(circle, rgba(46,160,67,0.35), transparent 60%); right: -200px; top: -250px; }
  .glow2 { position: absolute; width: 500px; height: 500px; border-radius: 50%; background: radial-gradient(circle, rgba(31,111,235,0.35), transparent 60%); left: -150px; bottom: -250px; }
  img { width: 240px; height: 240px; border-radius: 50%; border: 6px solid #30363d; object-fit: cover; position: relative; }
  .text { position: relative; flex: 1; }
  .eyebrow { font-size: 22px; letter-spacing: 0.08em; text-transform: uppercase; color: #3fb950; font-weight: 600; margin-bottom: 18px; }
  h1 { font-size: 72px; font-weight: 700; line-height: 1.05; letter-spacing: -0.02em; }
  .title { font-size: 34px; font-weight: 500; color: #c9d1d9; margin-top: 16px; }
  .headline { font-size: 24px; color: #8b949e; margin-top: 28px; line-height: 1.4; max-width: 720px; }
  .url { position: absolute; left: 80px; bottom: 56px; font-size: 24px; color: #8b949e; font-family: "JetBrains Mono", "DejaVu Sans Mono", monospace; }
  .pill { position: absolute; right: 80px; bottom: 56px; font-size: 20px; color: #f0f6fc; border: 2px solid #30363d; border-radius: 999px; padding: 10px 22px; }
</style></head><body><div class="wrap"><div class="glow"></div><div class="glow2"></div>
<img src="${avatar}" alt="">
<div class="text"><div class="eyebrow">Kampala, Uganda</div><h1>Patrick Walukagga</h1><div class="title">Software &amp; AI Engineer</div>
<div class="headline">Backend and AI engineer who takes LLM systems from prototype to production on AWS.</div></div>
<div class="url">patrickcmd.dev</div><div class="pill">2× AWS Certified</div></div></body></html>`;
(async () => {
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(html);
await page.waitForTimeout(300);
await page.screenshot({ path: process.argv[3], type: "png" });
await browser.close();
console.log("wrote", process.argv[3]);
})();
