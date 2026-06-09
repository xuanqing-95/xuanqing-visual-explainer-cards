import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

async function loadChromium() {
  try {
    return (await import("playwright")).chromium;
  } catch {
    const candidates = [
      process.env.PLAYWRIGHT_MODULE,
    ].filter(Boolean);
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) return (await import(pathToFileURL(candidate).href)).chromium;
    }
    throw new Error("Playwright not found. Run `npm install playwright` inside the skill directory or set PLAYWRIGHT_MODULE.");
  }
}

const taskDir = path.resolve(process.argv[2] || ".");
const outputDir = path.join(taskDir, "output");
fs.mkdirSync(outputDir, { recursive: true });

const chromium = await loadChromium();
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1200, height: 1600 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(path.join(taskDir, "index.html")).href, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(500);

const cards = page.locator(".poster");
for (let index = 0; index < await cards.count(); index++) {
  const card = cards.nth(index);
  const id = (await card.getAttribute("id")) || `card-${String(index + 1).padStart(2, "0")}`;
  await card.screenshot({ path: path.join(outputDir, `${id}.png`) });
}
await browser.close();
