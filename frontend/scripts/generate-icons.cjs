// Renders public/favicon.svg into the raster icons browsers and phones ask for:
//   apple-touch-icon.png (180), icon-192.png, icon-512.png and icon-16/32/48.png
//   node scripts/generate-icons.cjs
// Needs Playwright with Chromium available to Node (npx playwright install chromium).
// Then pack the three small frames into favicon.ico (Pillow) and delete them:
//   python3 -c "from PIL import Image as I; b,m,s=[I.open(f'public/icon-{n}.png') for n in (48,32,16)]; \
//     b.save('public/favicon.ico', sizes=[(48,48),(32,32),(16,16)], append_images=[m,s])"
//   rm public/icon-16.png public/icon-32.png public/icon-48.png
const path = require("path");
const fs = require("fs");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "..");
const pub = path.join(root, "public");
const svg = fs.readFileSync(path.join(pub, "favicon.svg"), "utf8");

(async () => {
  const browser = await chromium.launch();
  const render = async (size, file, { padding = 0 } = {}) => {
    const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
    // Padding (as a fraction) keeps the mark clear of iOS/Android masking.
    const inner = Math.round(size * (1 - 2 * padding));
    const offset = Math.round(size * padding);
    await page.setContent(`<!doctype html><html><body style="margin:0;background:${padding ? "#15803d" : "transparent"}">
      <div style="position:absolute;left:${offset}px;top:${offset}px;width:${inner}px;height:${inner}px">${svg.replace('width="64" height="64"', `width="${inner}" height="${inner}"`)}</div>
    </body></html>`);
    await page.waitForTimeout(100);
    await page.screenshot({ path: path.join(pub, file), omitBackground: !padding, type: "png" });
    await page.close();
    console.log("wrote", file, `${size}px`);
  };
  await render(512, "icon-512.png");
  await render(192, "icon-192.png");
  await render(180, "apple-touch-icon.png", { padding: 0 });
  await render(48, "icon-48.png");
  await render(32, "icon-32.png");
  await render(16, "icon-16.png");
  await browser.close();
})();
