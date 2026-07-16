import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

async function loadChromium() {
  try {
    return (await import("playwright")).chromium;
  } catch {
    const candidates = [process.env.PLAYWRIGHT_MODULE].filter(Boolean);
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return (await import(pathToFileURL(candidate).href)).chromium;
      }
    }
    throw new Error(
      "Playwright not found. Run npm ci inside the skill directory or set PLAYWRIGHT_MODULE."
    );
  }
}

function readPngSize(filePath) {
  const buffer = fs.readFileSync(filePath);
  const signature = "89504e470d0a1a0a";
  if (buffer.length < 24 || buffer.subarray(0, 8).toString("hex") !== signature) {
    throw new Error(`Rendered file is not a valid PNG: ${filePath}`);
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

async function main() {
  const taskDir = path.resolve(process.argv[2] || ".");
  const indexPath = path.join(taskDir, "index.html");
  if (!fs.existsSync(indexPath)) {
    throw new Error(`index.html not found in ${taskDir}`);
  }

  const outputDir = path.join(taskDir, "output");
  fs.mkdirSync(outputDir, { recursive: true });
  for (const name of fs.readdirSync(outputDir)) {
    if (name.toLowerCase().endsWith(".png")) {
      fs.rmSync(path.join(outputDir, name));
    }
  }

  const chromium = await loadChromium();
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (error) {
    if (/Executable doesn't exist/i.test(error.message)) {
      throw new Error(
        "Playwright Chromium is missing. Run npx playwright install chromium inside the skill directory."
      );
    }
    throw error;
  }

  const failedResources = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 1600 } });
    page.on("requestfailed", (request) => {
      const type = request.resourceType();
      if (["image", "stylesheet", "font"].includes(type)) {
        failedResources.push(`${type}: ${request.url()}`);
      }
    });
    await page.goto(pathToFileURL(indexPath).href, {
      waitUntil: "networkidle",
      timeout: 60_000,
    });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);

    const cards = page.locator(".poster");
    const count = await cards.count();
    if (count === 0) {
      throw new Error("No .poster cards found; refusing to report a successful render");
    }

    const cardMeta = await cards.evaluateAll((elements) =>
      elements.map((card, index) => {
        const rect = card.getBoundingClientRect();
        return {
          id: card.id || `card-${String(index + 1).padStart(2, "0")}`,
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      })
    );
    const ids = new Set();
    for (const card of cardMeta) {
      if (!/^[A-Za-z0-9._-]+$/.test(card.id)) {
        throw new Error(`Card id is not a safe filename: ${card.id}`);
      }
      if (ids.has(card.id)) throw new Error(`Duplicate card id: ${card.id}`);
      ids.add(card.id);
      if (card.width !== 1080 || card.height !== 1440) {
        throw new Error(
          `${card.id} is ${card.width}x${card.height}; final cards must be 1080x1440`
        );
      }
    }

    for (let index = 0; index < count; index += 1) {
      const filePath = path.join(outputDir, `${cardMeta[index].id}.png`);
      await cards.nth(index).screenshot({ path: filePath });
      const size = readPngSize(filePath);
      if (size.width !== 1080 || size.height !== 1440) {
        throw new Error(
          `${path.basename(filePath)} rendered at ${size.width}x${size.height}, expected 1080x1440`
        );
      }
      console.log(`[RENDERED] ${path.basename(filePath)} 1080x1440`);
    }
  } finally {
    await browser.close();
  }

  for (const resource of failedResources) {
    console.warn(`[WARN] resource failed during render: ${resource}`);
  }
  console.log(`Rendered ${fs.readdirSync(outputDir).filter((name) => name.endsWith(".png")).length} card(s).`);
}

main().catch((error) => {
  console.error(`[ERROR] ${error.message}`);
  process.exit(1);
});
