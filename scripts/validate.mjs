import fs from "node:fs";
import { createHash } from "node:crypto";
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

function readPngSize(filePath) {
  const buffer = fs.readFileSync(filePath);
  if (
    buffer.length < 24 ||
    buffer.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a"
  ) {
    throw new Error("not a valid PNG");
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function sha256File(filePath) {
  return createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

const taskDir = path.resolve(process.argv[2] || ".");
const indexPath = path.join(taskDir, "index.html");
if (!fs.existsSync(indexPath)) {
  console.error(`[ERROR] index.html not found in ${taskDir}`);
  process.exit(2);
}

const chromium = await loadChromium();
let browser;
try {
  browser = await chromium.launch({ headless: true });
} catch (error) {
  if (/Executable doesn't exist/i.test(error.message)) {
    console.error(
      "[ERROR] Playwright Chromium is missing. Run npx playwright install chromium inside the skill directory."
    );
    process.exit(2);
  }
  throw error;
}
const page = await browser.newPage({ viewport: { width: 1200, height: 1600 } });
await page.goto(pathToFileURL(indexPath).href, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(300);

const cardCount = await page.locator(".poster").count();
if (cardCount === 0) {
  console.log("[FAIL] document: no .poster cards found");
  await browser.close();
  process.exit(1);
}

// Document-level checks (actual font faces, accent count)
const docChecks = await page.evaluate(() => {
  const fontFaces = Array.from(document.fonts).map((face) => ({
    family: face.family.replace(/^["']|["']$/g, ""),
    status: face.status,
    weight: face.weight,
    style: face.style,
  }));
  const loaded = (family) =>
    fontFaces.some(
      (face) => face.status === "loaded" && face.family.toLowerCase() === family.toLowerCase()
    );
  const mode = document.documentElement.getAttribute("data-mode") || "editorial";
  const accents = new Set();
  document.querySelectorAll("[data-accent]").forEach((el) => accents.add(el.getAttribute("data-accent")));
  return {
    fonts: {
      notoSerif: loaded("Noto Serif SC"),
      playfair: loaded("Playfair Display"),
      mono: loaded("IBM Plex Mono"),
    },
    fontFaces,
    accents: [...accents],
    mode,
  };
});

const results = await page.locator(".poster").evaluateAll((cards) => {
  return cards.map((card, idx) => {
    const failures = [];
    const warnings = [];
    const id = card.id || `card-${String(idx + 1).padStart(2, "0")}`;

    // R0 — final board contract
    if (card.clientWidth !== 1080 || card.clientHeight !== 1440) {
      failures.push(
        `R0 board is ${card.clientWidth}×${card.clientHeight}; expected 1080×1440`
      );
    }

    // R1 — overflow
    if (card.scrollHeight > card.clientHeight + 1 || card.scrollWidth > card.clientWidth + 1) {
      failures.push(`R1 overflow ${card.scrollWidth}×${card.scrollHeight} (board ${card.clientWidth}×${card.clientHeight})`);
    }

    // R1b — content padding breach: any single display element extending into
    // the safe-area padding (within 24px of board edge) on a 1080×1440 xhs board.
    // Catches "the term is so big it touches the edge" cases that R1 misses
    // because scrollWidth still fits within the board.
    {
      const cardRect = card.getBoundingClientRect();
      const SAFE = 24; // minimum gap from board edge
      card.querySelectorAll(".term-en, .h-display, .h-xl, .series-zh, .pullquote").forEach((el) => {
        const r = el.getBoundingClientRect();
        const leftGap = r.left - cardRect.left;
        const rightGap = (cardRect.left + cardRect.width) - r.right;
        if (leftGap < SAFE || rightGap < SAFE) {
          failures.push(`R1b ${el.className} breaches safe area (left ${Math.round(leftGap)}px / right ${Math.round(rightGap)}px, min ${SAFE}px)`);
        }
      });
    }

    // R2 — type caps: .h-display / .h-xl ≤ 2 lines on xhs, ≤ 132px (display) / 100px (xl)
    const isXhs = card.classList.contains("xhs");
    card.querySelectorAll(".h-display, .h-xl, .series-zh").forEach((el) => {
      const style = getComputedStyle(el);
      const size = parseFloat(style.fontSize);
      const lineHeight = parseFloat(style.lineHeight) || size * 1.1;
      const lines = Math.round(el.getBoundingClientRect().height / lineHeight);
      const isDisplay = el.classList.contains("h-display") || el.classList.contains("series-zh");
      const cap = isDisplay ? 132 : 100;
      if (isXhs && size > cap) {
        failures.push(`R2 ${el.className} ${Math.round(size)}px exceeds ${cap}px cap on xhs board`);
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
        "h1,h2,h3,p,img,[data-visual-evidence],.illust-frame,.frame-img,.matrix-cell,.ledger,.ledger .row,.bar-row,.tower-col,.hero-img-wrap,.hr-accent,.foot,.ba-card,.opt,.plate"
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

    // R6 — Editorial identity: every display title ≥64px must have weight ≤500
    // ("the larger, the lighter" — never 700+ on serif display)
    const displayCandidates = [...card.querySelectorAll("h1,h2,h3,.h-hero,.h-statement,.h-display,.h-xl,.h-md,.num-mega,.num-xl,.term-en,.series-zh,.pullquote")];
    // Exempt .term-en (cover-only 240px Playfair 900) — that single weight
    // is part of the cover identity, not a content-page rule.
    for (const el of displayCandidates) {
      if (el.classList.contains("term-en")) continue;
      if (el.querySelector(".ai-accent") || el.classList.contains("ai-accent")) continue;
      const style = getComputedStyle(el);
      const size = parseFloat(style.fontSize);
      const weight = parseInt(style.fontWeight, 10);
      if (size >= 64 && weight > 500) {
        warnings.push(
          `R6 Editorial identity: <${el.tagName.toLowerCase()}.${el.className}> at ${Math.round(size)}px uses weight ${weight} (should be ≤500 — "the larger, the lighter")`
        );
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
});

const identityStats = await page.locator(".poster").evaluateAll((cards) => {
  const ids = cards.map(
    (card, index) => card.id || `card-${String(index + 1).padStart(2, "0")}`
  );
  return {
    ids,
    duplicateIds: ids.filter((id, index) => ids.indexOf(id) !== index),
    unsafeIds: ids.filter((id) => !/^[A-Za-z0-9._-]+$/.test(id)),
  };
});

const mediaStats = await page.locator(".poster").evaluateAll((cards) => {
  const images = cards.flatMap((card) =>
    Array.from(card.querySelectorAll("img")).map((img) => ({
      card: card.id || "(unnamed)",
      src: img.getAttribute("src") || "",
      alt: img.getAttribute("alt") || "",
      complete: img.complete,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
    }))
  );
  const text = cards.map((card) => card.innerText || "").join("\n");
  return {
    images,
    generatedByCard: cards
      .filter((card) => !card.classList.contains("cover-series"))
      .map((card) => ({
        card: card.id || "(unnamed)",
        images: Array.from(
          card.querySelectorAll(
            '.illust-frame img[data-generated-illustration="true"]'
          )
        ).map((img) => ({
          src: img.getAttribute("src") || "",
          alt: img.getAttribute("alt") || "",
        })),
      })),
    broken: images.filter(
      (image) => !image.complete || image.naturalWidth === 0 || image.naturalHeight === 0
    ),
    placeholders: images.filter((image) =>
      /placeholder|pending[\s_-]*(gpt[\s_-]*)?image/i.test(`${image.src} ${image.alt}`)
    ),
    placeholderText: /pending\s+(gpt\s*)?image|placeholder artwork/i.test(text),
  };
});

const coverStats = await page.locator(".cover-series").evaluateAll((covers) =>
  covers.map((cover) => {
    const value = (selector) => cover.querySelector(selector)?.textContent?.trim() || "";
    const termZh = value(".term-zh");
    return {
      id: cover.id || "(unnamed cover)",
      missing: [".series-zh", ".term-en", ".term-zh", ".term-question"].filter(
        (selector) => !value(selector)
      ),
      termZh,
      termZhHasChinese: /[\u3400-\u9fff]/.test(termZh),
    };
  })
);

const underlineStats = await page.locator(".poster").evaluateAll((cards) => {
  const contentCards = cards.filter((card) => !card.classList.contains("cover-series"));
  const underlined = contentCards.filter((card) =>
    card.querySelector(".h-display.title-underline em, .h-xl.title-underline em, .h-md.title-underline em")
  );
  return {
    contentCount: contentCards.length,
    underlinedCount: underlined.length,
  };
});

const hashtagStats = await page.locator(".poster").evaluateAll((cards) => {
  return cards
    .map((card) => {
      const text = card.innerText || "";
      const matches = text.match(/#[^\s#]+/g) || [];
      return {
        id: card.id || "(unnamed)",
        matches: [...new Set(matches)],
      };
    })
    .filter((entry) => entry.matches.length > 0);
});

// Document-level FAILs
let failed = false;
if (docChecks.mode !== "editorial") {
  console.log(`[FAIL] document: unsupported data-mode "${docChecks.mode}"; use editorial`);
  failed = true;
}
if (
  docChecks.mode === "editorial" &&
  (!docChecks.fonts.notoSerif || !docChecks.fonts.playfair || !docChecks.fonts.mono)
) {
  const missing = [
    !docChecks.fonts.notoSerif && "Noto Serif SC",
    !docChecks.fonts.playfair && "Playfair Display",
    !docChecks.fonts.mono && "IBM Plex Mono",
  ].filter(Boolean);
  console.log(
    `[FAIL] document: R6 required font face(s) did not actually load: ${missing.join(", ")}`
  );
  failed = true;
}
if (docChecks.accents.length > 1) {
  console.log(`[FAIL] document: R6 identity — multiple accents declared: ${docChecks.accents.join(", ")} (one per set)`);
  failed = true;
}
console.log(`[INFO] mode=${docChecks.mode} accent=${docChecks.accents[0] || "(default)"}`);
if (identityStats.duplicateIds.length) {
  console.log(
    `[FAIL] document: duplicate card id(s): ${[...new Set(identityStats.duplicateIds)].join(", ")}`
  );
  failed = true;
}
if (identityStats.unsafeIds.length) {
  console.log(
    `[FAIL] document: card id(s) are not safe output filenames: ${identityStats.unsafeIds.join(", ")}`
  );
  failed = true;
}
for (const image of mediaStats.broken) {
  console.log(
    `[FAIL] ${image.card}: image did not load: ${image.src || "(empty src)"}`
  );
  failed = true;
}
for (const image of mediaStats.placeholders) {
  console.log(
    `[FAIL] ${image.card}: placeholder image is not a deliverable: ${image.src || image.alt}`
  );
  failed = true;
}
if (mediaStats.placeholderText) {
  console.log("[FAIL] document: visible placeholder or pending-image text found");
  failed = true;
}

let verifiedGeneratedImages = 0;
let generatedProvenanceFailed = false;
const taskPrefix = `${taskDir}${path.sep}`;
const resolveTaskFile = (relativePath, label, baseDir = taskDir) => {
  if (!relativePath || /^[a-z][a-z0-9+.-]*:/i.test(relativePath)) {
    throw new Error(`${label} must be a local task-relative path`);
  }
  const cleanPath = decodeURIComponent(relativePath.split(/[?#]/, 1)[0]);
  const resolved = path.resolve(baseDir, cleanPath);
  if (resolved !== taskDir && !resolved.startsWith(taskPrefix)) {
    throw new Error(`${label} escapes the task directory`);
  }
  return resolved;
};

for (const card of mediaStats.generatedByCard) {
  if (card.images.length === 0) {
    console.log(
      `[FAIL] ${card.card}: every non-cover card requires at least one model-generated illustration inside .illust-frame with data-generated-illustration="true"`
    );
    failed = true;
    generatedProvenanceFailed = true;
    continue;
  }
  for (const image of card.images) {
    try {
      const imagePath = resolveTaskFile(image.src, "generated image src");
      const metadataPath = `${imagePath}.generation.json`;
      if (!fs.existsSync(imagePath)) throw new Error(`generated image is missing: ${image.src}`);
      if (!fs.existsSync(metadataPath)) {
        throw new Error(`generation provenance is missing: ${path.relative(taskDir, metadataPath)}`);
      }
      const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
      const required = [
        "generated_at",
        "provider",
        "model",
        "quality",
        "size",
        "output_file",
        "prompt_file",
        "prompt_sha256",
        "final_sha256",
        "final_width",
        "final_height",
      ];
      const missing = required.filter(
        (field) => metadata[field] === undefined || metadata[field] === null || metadata[field] === ""
      );
      if (metadata.schema_version !== 1) missing.push("schema_version=1");
      if (missing.length) {
        throw new Error(`generation provenance is incomplete: ${missing.join(", ")}`);
      }

      const provenanceDir = path.dirname(metadataPath);
      const declaredOutput = resolveTaskFile(
        metadata.output_file,
        "output_file",
        provenanceDir
      );
      if (declaredOutput !== imagePath) {
        throw new Error("generation provenance output_file does not match the HTML image");
      }
      const promptPath = resolveTaskFile(metadata.prompt_file, "prompt_file", provenanceDir);
      if (!fs.existsSync(promptPath)) {
        throw new Error(`generation prompt is missing: ${metadata.prompt_file}`);
      }
      if (sha256File(promptPath) !== metadata.prompt_sha256) {
        throw new Error(`generation prompt hash does not match: ${metadata.prompt_file}`);
      }
      if (sha256File(imagePath) !== metadata.final_sha256) {
        throw new Error(`generated image hash does not match provenance: ${image.src}`);
      }
      const size = readPngSize(imagePath);
      if (
        size.width !== metadata.final_width ||
        size.height !== metadata.final_height ||
        `${size.width}x${size.height}` !== metadata.size
      ) {
        throw new Error(
          `generated image dimensions do not match provenance: ${size.width}x${size.height}`
        );
      }
      verifiedGeneratedImages += 1;
    } catch (error) {
      console.log(`[FAIL] ${card.card}: ${error.message}`);
      failed = true;
      generatedProvenanceFailed = true;
    }
  }
}
if (!generatedProvenanceFailed && mediaStats.generatedByCard.length > 0) {
  console.log(
    `[PASS] generated illustrations: ${mediaStats.generatedByCard.length} content card(s), ${verifiedGeneratedImages} provenance record(s) verified`
  );
}
for (const cover of coverStats) {
  if (cover.missing.length) {
    console.log(
      `[FAIL] ${cover.id}: cover is missing required content: ${cover.missing.join(", ")}`
    );
    failed = true;
  }
  if (cover.termZh && !cover.termZhHasChinese) {
    console.log(
      `[FAIL] ${cover.id}: .term-zh must be a Chinese explanation, got "${cover.termZh}"`
    );
    failed = true;
  }
}
if (
  underlineStats.contentCount > 0 &&
  (underlineStats.underlinedCount > 2 || underlineStats.underlinedCount === underlineStats.contentCount)
) {
  console.log(
    `[WARN] document: title underline appears on ${underlineStats.underlinedCount}/${underlineStats.contentCount} content pages; use .title-underline only for 0-2 key turning points`
  );
}
for (const entry of hashtagStats) {
  console.log(
    `[WARN] ${entry.id}: visible publish hashtag(s) found: ${entry.matches.join(", ")} — keep source hashtags outside card images unless explicitly requested`
  );
}

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

const outputDir = path.join(taskDir, "output");
const expectedPngs = identityStats.ids.map((id) => `${id}.png`).sort();
let actualPngs = [];
if (!fs.existsSync(outputDir)) {
  console.log("[FAIL] artifacts: output directory is missing; render before validating");
  failed = true;
} else {
  actualPngs = fs
    .readdirSync(outputDir)
    .filter((name) => name.toLowerCase().endsWith(".png"))
    .sort();
  const missing = expectedPngs.filter((name) => !actualPngs.includes(name));
  const extra = actualPngs.filter((name) => !expectedPngs.includes(name));
  if (missing.length) {
    console.log(`[FAIL] artifacts: missing rendered PNG(s): ${missing.join(", ")}`);
    failed = true;
  }
  if (extra.length) {
    console.log(`[FAIL] artifacts: stale or unexpected PNG(s): ${extra.join(", ")}`);
    failed = true;
  }
  for (const name of actualPngs) {
    const filePath = path.join(outputDir, name);
    try {
      const size = readPngSize(filePath);
      if (size.width !== 1080 || size.height !== 1440) {
        console.log(
          `[FAIL] artifacts: ${name} is ${size.width}×${size.height}; expected 1080×1440`
        );
        failed = true;
      }
    } catch (error) {
      console.log(`[FAIL] artifacts: ${name} ${error.message}`);
      failed = true;
    }
  }
}
if (!failed) {
  console.log(`[PASS] artifacts: ${actualPngs.length} PNG(s), all 1080×1440`);
}

await browser.close();
process.exit(failed ? 1 : 0);
