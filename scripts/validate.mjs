import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

async function loadChromium() {
  try {
    return (await import("playwright")).chromium;
  } catch {
    const candidates = [
      process.env.PLAYWRIGHT_MODULE,
      path.join(process.env.HOME || "", ".codex/skills/visual-explainer-cards/node_modules/playwright/index.mjs"),
      "/private/tmp/guizang-social-card-skill/node_modules/playwright/index.mjs",
    ].filter(Boolean);
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) return (await import(pathToFileURL(candidate).href)).chromium;
    }
    throw new Error("Playwright not found. Run `npm install playwright` inside the skill directory or set PLAYWRIGHT_MODULE.");
  }
}

const taskDir = path.resolve(process.argv[2] || ".");
const chromium = await loadChromium();
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 1800 } });
await page.goto(pathToFileURL(path.join(taskDir, "index.html")).href, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);

const results = await page.locator(".poster").evaluateAll((cards) => cards.map((card) => {
  const failures = [];
  const warnings = [];
  if (card.scrollHeight > card.clientHeight + 1 || card.scrollWidth > card.clientWidth + 1) {
    failures.push(`overflow ${card.scrollWidth}x${card.scrollHeight}`);
  }
  const tooSmall = [...card.querySelectorAll("p,li,.body,.note,.label")]
    .filter((node) => parseFloat(getComputedStyle(node).fontSize) < 18);
  if (tooSmall.length) failures.push(`${tooSmall.length} text elements below 18px`);
  const titles = [...card.querySelectorAll(".page-title,.display")];
  for (const title of titles) {
    const style = getComputedStyle(title);
    const lines = Math.round(title.getBoundingClientRect().height / parseFloat(style.lineHeight));
    if (lines > 3) failures.push(`title exceeds 3 lines`);
  }
  const meaningful = [...card.querySelectorAll("h1,h2,h3,p,img,.panel,.cell,.next-block,.process-row,.ledger-row,.action-row,.hero-strip,.takeaway-band")]
    .map((node) => node.getBoundingClientRect())
    .filter((rect) => rect.width > 8 && rect.height > 8);
  const bands = [0, 0, 0, 0];
  for (const rect of meaningful) {
    const top = Math.max(0, rect.top - card.getBoundingClientRect().top);
    const bottom = Math.min(card.clientHeight, rect.bottom - card.getBoundingClientRect().top);
    for (let band = 0; band < 4; band++) {
      const bandTop = band * card.clientHeight / 4;
      const bandBottom = (band + 1) * card.clientHeight / 4;
      if (bottom > bandTop && top < bandBottom) bands[band] = 1;
    }
  }
  if (bands.reduce((sum, value) => sum + value, 0) < 3) {
    failures.push(`underfilled portrait bands ${bands.join("")}`);
  }
  const evidence = card.querySelector(".hero-art,.evidence-well,.art-stage");
  if (evidence) {
    const ratio = evidence.getBoundingClientRect().height / card.clientHeight;
    if (ratio < 0.32) warnings.push(`illustration evidence only ${Math.round(ratio * 100)}% height`);
  }
  return { id: card.id, failures, warnings };
}));

let failed = false;
for (const result of results) {
  if (result.failures.length) {
    failed = true;
    console.log(`[FAIL] ${result.id}: ${result.failures.join("; ")}`);
  } else {
    console.log(`[PASS] ${result.id}`);
  }
  for (const warning of result.warnings) console.log(`  [WARN] ${warning}`);
}
await browser.close();
process.exit(failed ? 1 : 0);
