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
      "Playwright not found. Run `npm install playwright` inside the skill directory or set PLAYWRIGHT_MODULE."
    );
  }
}

const taskDir = path.resolve(process.argv[2] || ".");
const indexPath = path.join(taskDir, "index.html");
if (!fs.existsSync(indexPath)) {
  console.error(`[ERROR] index.html not found in ${taskDir}`);
  process.exit(2);
}

const chromium = await loadChromium();
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1200, height: 1600 } });
await page.goto(pathToFileURL(indexPath).href, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);

// Document-level checks (mode-aware font loading, accent count)
const docChecks = await page.evaluate(() => {
  const linkFamilies = Array.from(document.querySelectorAll("link[rel='stylesheet']"))
    .map((l) => l.href)
    .join(" ");
  const serifLoaded = /Noto\+Serif|Playfair|Songti|Source\+Serif/i.test(linkFamilies);
  const mode = document.documentElement.getAttribute("data-mode") || "editorial";
  const accents = new Set();
  document.querySelectorAll("[data-accent]").forEach((el) => accents.add(el.getAttribute("data-accent")));
  return { serifLoaded, accents: [...accents], mode };
});

const results = await page.locator(".poster").evaluateAll((cards, mode) => {
  return cards.map((card, idx) => {
    const failures = [];
    const warnings = [];
    const id = card.id || `card-${idx + 1}`;

    // R1 — overflow
    if (card.scrollHeight > card.clientHeight + 1 || card.scrollWidth > card.clientWidth + 1) {
      failures.push(`R1 overflow ${card.scrollWidth}×${card.scrollHeight} (board ${card.clientWidth}×${card.clientHeight})`);
    }

    // R2 — type caps: .h-display-zh / .h-xl ≤ 2 lines on xhs, ≤ 100px
    const isXhs = card.classList.contains("xhs");
    card.querySelectorAll(".h-display-zh, .h-xl").forEach((el) => {
      const style = getComputedStyle(el);
      const size = parseFloat(style.fontSize);
      const lineHeight = parseFloat(style.lineHeight) || size * 1.1;
      const lines = Math.round(el.getBoundingClientRect().height / lineHeight);
      if (isXhs && size > 100) {
        failures.push(`R2 ${el.className} ${Math.round(size)}px exceeds 96px cap on xhs board`);
      }
      if (isXhs && lines > 2) {
        failures.push(`R2 ${el.className} spans ${lines} lines (max 2 on xhs)`);
      }
    });

    // R3 — footer collision: .foot must not overlap previous sibling content
    const foot = card.querySelector(".foot");
    if (foot) {
      const footRect = foot.getBoundingClientRect();
      const prev = foot.previousElementSibling;
      if (prev) {
        const prevRect = prev.getBoundingClientRect();
        if (prevRect.bottom > footRect.top + 1) {
          failures.push(`R3 footer collision: content bottom ${Math.round(prevRect.bottom)} > foot top ${Math.round(footRect.top)}`);
        }
      }
    }

    // R4 — 4-band density (≥3 of 4 bands must have meaningful content)
    const meaningful = [
      ...card.querySelectorAll(
        "h1,h2,h3,p,img,.illust-frame,.frame-img,.matrix-cell,.ledger,.ledger .row,.bar-row,.tower-col,.hero-img-wrap,.hr-accent,.foot,.ba-card,.opt,.plate"
      ),
    ]
      .map((node) => node.getBoundingClientRect())
      .filter((rect) => rect.width > 8 && rect.height > 8);
    const cardRect = card.getBoundingClientRect();
    const bands = [0, 0, 0, 0];
    for (const rect of meaningful) {
      const top = Math.max(0, rect.top - cardRect.top);
      const bottom = Math.min(card.clientHeight, rect.bottom - cardRect.top);
      for (let band = 0; band < 4; band++) {
        const bandTop = (band * card.clientHeight) / 4;
        const bandBottom = ((band + 1) * card.clientHeight) / 4;
        if (bottom > bandTop && top < bandBottom) bands[band] = 1;
      }
    }
    const bandSum = bands.reduce((sum, value) => sum + value, 0);
    if (bandSum < 3) {
      failures.push(`R4 underfilled bands [${bands.join("")}] — only ${bandSum}/4 bands have content`);
    }

    // R5 — frame overflow: .illust-frame / .frame-img children must not overflow
    card.querySelectorAll(".illust-frame, .frame-img").forEach((frame) => {
      if (frame.scrollWidth > frame.clientWidth + 1 || frame.scrollHeight > frame.clientHeight + 1) {
        failures.push(`R5 frame overflow inside ${frame.className}`);
      }
    });

    // R6 — Mode identity
    // Swiss mode: every display title ≥72px must have weight ≤300
    // Editorial mode: skip per-card weight check (display titles are intentionally heavy serif)
    if (mode === "swiss") {
      const displayCandidates = [...card.querySelectorAll("h1,h2,h3,.h-hero,.h-statement,.h-xl,.num-mega,.num-xl,.h-display-zh,.h-section-zh,.term-en,.series-zh")];
      for (const el of displayCandidates) {
        const style = getComputedStyle(el);
        const size = parseFloat(style.fontSize);
        const weight = parseInt(style.fontWeight, 10);
        if (size >= 72 && weight > 300) {
          failures.push(
            `R6 Swiss identity: <${el.tagName.toLowerCase()}.${el.className}> at ${Math.round(size)}px uses weight ${weight} (must be ≤300)`
          );
        }
      }
    }

    // R7 — figure margin reset
    const stretchedFigures = [...card.querySelectorAll("figure")].filter((fig) => {
      const margin = getComputedStyle(fig).margin;
      return margin && margin !== "0px" && !/^0px( 0px)*$/.test(margin);
    });
    if (stretchedFigures.length) {
      warnings.push(`R7 ${stretchedFigures.length} <figure> elements have default browser margin (add figure { margin:0 })`);
    }

    // Evidence density (advisory)
    const evidence = card.querySelector(".illust-frame, .frame-img, .image-hero, .hero-img-wrap");
    if (evidence) {
      const ratio = evidence.getBoundingClientRect().height / card.clientHeight;
      if (ratio < 0.3) warnings.push(`illustration evidence only ${Math.round(ratio * 100)}% of canvas height`);
    }

    return { id, failures, warnings };
  });
}, docChecks.mode);

// Document-level FAILs
let failed = false;
if (docChecks.mode === "swiss" && docChecks.serifLoaded) {
  console.log(`[FAIL] document: R6 Swiss identity — serif family loaded in <head> (Swiss mode forbids serif)`);
  failed = true;
}
if (docChecks.mode === "editorial" && !docChecks.serifLoaded) {
  console.log(`[FAIL] document: R6 Editorial identity — no serif family loaded in <head> (Editorial requires Playfair Display + Noto Serif SC)`);
  failed = true;
}
if (docChecks.accents.length > 1) {
  console.log(`[FAIL] document: R6 identity — multiple accents declared: ${docChecks.accents.join(", ")} (one per set)`);
  failed = true;
}
console.log(`[INFO] mode=${docChecks.mode} accent=${docChecks.accents[0] || "(default)"}`);

for (const result of results) {
  if (result.failures.length) {
    failed = true;
    console.log(`[FAIL] ${result.id}`);
    for (const failure of result.failures) console.log(`  ${failure}`);
  } else {
    console.log(`[PASS] ${result.id}`);
  }
  for (const warning of result.warnings) console.log(`  [WARN] ${warning}`);
}

await browser.close();
process.exit(failed ? 1 : 0);
