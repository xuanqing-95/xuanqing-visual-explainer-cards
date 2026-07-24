import fs from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";
import { validateStoryboardTask } from "./validate-storyboard.mjs";
import { loadVersionedLocalFontCss } from "./local-fonts.mjs";
import {
  slotKind,
  validateContainedSubjectOccupancy,
  validateFontSourceDeterminism,
} from "./quality-contract.mjs";

const skillDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

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
const requireUsageSidecar = process.env.REQUIRE_IMAGE_USAGE_SIDECAR === "true";
const allowSystemFontFallback = process.env.ALLOW_SYSTEM_FONT_FALLBACK === "true";
const indexPath = path.join(taskDir, "index.html");
if (!fs.existsSync(indexPath)) {
  console.error(`[ERROR] index.html not found in ${taskDir}`);
  process.exit(2);
}

const storyboardResult = validateStoryboardTask(taskDir);
if (!storyboardResult.ok) {
  for (const error of storyboardResult.errors) {
    console.log(`[FAIL] storyboard: ${error}`);
  }
  process.exit(1);
}
console.log(
  `[PASS] storyboard: ${storyboardResult.summary.pageCount} page(s), ${storyboardResult.summary.contentCount} content page(s), ${storyboardResult.summary.illustrationCount} illustration(s), ${storyboardResult.summary.layoutCount} layout(s), ${storyboardResult.summary.silhouetteCount} silhouette(s)`
);

const indexText = fs.readFileSync(indexPath, "utf8");
const fontSource = validateFontSourceDeterminism(indexText, {
  schemaVersion: storyboardResult.data.schema_version,
});
if (!fontSource.ok) {
  console.log(`[FAIL] document: ${fontSource.errors.join("; ")}`);
  process.exit(1);
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
await page.addStyleTag({ content: loadVersionedLocalFontCss(skillDir) });
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

    // R3 — footer collision: no visible content may enter the footer reserve.
    // Checking only previousElementSibling misses flex/absolute layouts where
    // the footer overlays an earlier paragraph while scrollHeight stays clipped.
    const foot = card.querySelector(".foot");
    if (foot) {
      const footRect = foot.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      if (footRect.bottom > cardRect.bottom + 1) {
        failures.push(`R3 footer exits board: foot bottom ${Math.round(footRect.bottom)} > board bottom ${Math.round(cardRect.bottom)}`);
      }
      for (const child of foot.children) {
        const rect = child.getBoundingClientRect();
        if (rect.left < footRect.left - 1 || rect.right > footRect.right + 1) {
          failures.push(
            `R3 footer child exits horizontal safe area: ${child.className || child.tagName.toLowerCase()} ${Math.round(rect.left - cardRect.left)}-${Math.round(rect.right - cardRect.left)} outside ${Math.round(footRect.left - cardRect.left)}-${Math.round(footRect.right - cardRect.left)}`
          );
        }
      }
      const footerGap = 16;
      const contentNodes = card.querySelectorAll(
        "h1,h2,h3,p,li,img,.action-opt,.opt,.ledger .row,[data-visual-evidence]"
      );
      let offender = null;
      for (const node of contentNodes) {
        if (foot.contains(node) || node.contains(foot)) continue;
        const rect = node.getBoundingClientRect();
        if (rect.width <= 1 || rect.height <= 1) continue;
        if (rect.top < footRect.top && rect.bottom > footRect.top - footerGap) {
          if (!offender || rect.bottom > offender.rect.bottom) offender = { node, rect };
        }
      }
      if (offender) {
        const name = offender.node.className || offender.node.tagName.toLowerCase();
        failures.push(`R3 footer collision: ${name} bottom ${Math.round(offender.rect.bottom)} enters ${footerGap}px footer reserve at ${Math.round(footRect.top)}`);
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
      const style = getComputedStyle(fig);
      return parseFloat(style.marginLeft) !== 0 || parseFloat(style.marginRight) !== 0;
    });
    if (stretchedFigures.length) {
      warnings.push(`R7 ${stretchedFigures.length} <figure> elements have default browser margin (add figure { margin:0 })`);
    }

    // Evidence density (advisory)
    const evidence = card.querySelector(".illust-frame, .frame-img, .image-hero, .hero-img-wrap");
    if (evidence) {
      const ratio = evidence.getBoundingClientRect().height / card.clientHeight;
      const layout = card.getAttribute("data-layout") || "";
      const compactEvidenceIsExpected = Boolean(
        evidence.closest(".evidence-figure.compact")
        || /compare|comparison|action|checklist|ledger/i.test(layout)
      );
      if (!compactEvidenceIsExpected && ratio < 0.3) {
        warnings.push(`illustration evidence only ${Math.round(ratio * 100)}% of canvas height`);
      }
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

const storyboardBindingStats = await page.locator(".poster").evaluateAll((cards) =>
  cards.map((card) => ({
    id: card.id || "(unnamed)",
    pageId: card.getAttribute("data-page-id") || "",
    layout: card.getAttribute("data-layout") || "",
    silhouette: card.getAttribute("data-silhouette") || "",
    isCover: card.classList.contains("cover-series"),
    generated: Array.from(
      card.querySelectorAll('.illust-frame img[data-generated-illustration="true"]')
    ).map((img) => ({
      illustrationId: img.getAttribute("data-illustration-id") || "",
      src: img.getAttribute("src") || "",
      wrapperClasses: [img.closest(".evidence-figure"), img.closest(".illust-frame")]
        .filter(Boolean)
        .flatMap((wrapper) => Array.from(wrapper.classList))
        .filter((className, index, classes) => classes.indexOf(className) === index)
        .join(" "),
    })),
  }))
);

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
        pageId: card.getAttribute("data-page-id") || "",
        images: Array.from(
          card.querySelectorAll(
            '.illust-frame img[data-generated-illustration="true"]'
          )
        ).map((img) => ({
          illustrationId: img.getAttribute("data-illustration-id") || "",
          src: img.getAttribute("src") || "",
          alt: img.getAttribute("alt") || "",
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          objectFit: getComputedStyle(img).objectFit,
          frameWidth: img.closest(".illust-frame")?.getBoundingClientRect().width || 0,
          frameHeight: img.closest(".illust-frame")?.getBoundingClientRect().height || 0,
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
let storyboardBindingFailed = false;
const normalizeTaskPath = (value) =>
  decodeURIComponent(String(value || "").split(/[?#]/, 1)[0])
    .replaceAll("\\", "/")
    .replace(/^\.\//, "");
const isLegacySingleIllustrationSchema = storyboardResult.data.schema_version === 1;

if (storyboardBindingStats.length !== storyboardResult.pages.length) {
  console.log(
    `[FAIL] storyboard binding: HTML has ${storyboardBindingStats.length} card(s), storyboard has ${storyboardResult.pages.length} page(s)`
  );
  failed = true;
  storyboardBindingFailed = true;
}

for (
  let index = 0;
  index < Math.min(storyboardBindingStats.length, storyboardResult.pages.length);
  index += 1
) {
  const actual = storyboardBindingStats[index];
  const expectedPage = storyboardResult.pages[index];
  const expectedBeat = storyboardResult.beats[index];
  const expectedId = String(expectedPage.id);
  const expectedLayout = expectedPage.layout;
  const expectedSilhouette = expectedBeat.silhouette;
  const expectedCover = expectedPage.role === "cover";

  if (actual.pageId !== expectedId) {
    console.log(
      `[FAIL] ${actual.id}: data-page-id "${actual.pageId || "(missing)"}" does not match storyboard page ${expectedId}`
    );
    failed = true;
    storyboardBindingFailed = true;
  }
  if (actual.layout !== expectedLayout) {
    console.log(
      `[FAIL] ${actual.id}: data-layout "${actual.layout || "(missing)"}" does not match storyboard layout "${expectedLayout}"`
    );
    failed = true;
    storyboardBindingFailed = true;
  }
  if (actual.silhouette !== expectedSilhouette) {
    console.log(
      `[FAIL] ${actual.id}: data-silhouette "${actual.silhouette || "(missing)"}" does not match storyboard silhouette "${expectedSilhouette}"`
    );
    failed = true;
    storyboardBindingFailed = true;
  }
  if (actual.isCover !== expectedCover) {
    console.log(
      `[FAIL] ${actual.id}: cover-series class does not match storyboard role "${expectedPage.role}"`
    );
    failed = true;
    storyboardBindingFailed = true;
  }

  if (!expectedCover) {
    const expectedIllustrations = expectedPage.illustrations;
    const actualGenerated = actual.generated.map((image) => ({
      ...image,
      illustrationId:
        image.illustrationId ||
        (isLegacySingleIllustrationSchema && actual.generated.length === 1 ? "main" : ""),
    }));
    const actualIds = actualGenerated.map((image) => image.illustrationId);
    const duplicateIds = actualIds.filter(
      (illustrationId, imageIndex) => illustrationId && actualIds.indexOf(illustrationId) !== imageIndex
    );
    if (actual.generated.length !== expectedIllustrations.length) {
      console.log(
        `[FAIL] ${actual.id}: HTML has ${actual.generated.length} generated illustration(s), storyboard plans ${expectedIllustrations.length}`
      );
      failed = true;
      storyboardBindingFailed = true;
    }
    if (duplicateIds.length) {
      console.log(
        `[FAIL] ${actual.id}: duplicate data-illustration-id value(s): ${[...new Set(duplicateIds)].join(", ")}`
      );
      failed = true;
      storyboardBindingFailed = true;
    }

    for (const expectedIllustration of expectedIllustrations) {
      const expectedIllustrationId = String(expectedIllustration.id);
      const matchingImages = actualGenerated.filter(
        (image) => image.illustrationId === expectedIllustrationId
      );
      if (matchingImages.length !== 1) {
        console.log(
          `[FAIL] ${actual.id}: storyboard illustration "${expectedIllustrationId}" must map to exactly one image via data-illustration-id`
        );
        failed = true;
        storyboardBindingFailed = true;
        continue;
      }
      const matchingImage = matchingImages[0];
      const expectedImage = normalizeTaskPath(expectedIllustration.output_file);
      if (normalizeTaskPath(matchingImage.src) !== expectedImage) {
        console.log(
          `[FAIL] ${actual.id}: illustration "${expectedIllustrationId}" src does not match storyboard output_file "${expectedImage}"`
        );
        failed = true;
        storyboardBindingFailed = true;
      }
      const requiredWrapperClasses = expectedIllustration.image_slot.html_wrapper.split(/\s+/).filter(Boolean);
      const actualWrapperClasses = new Set(matchingImage.wrapperClasses.split(/\s+/).filter(Boolean));
      const missingWrapperClasses = requiredWrapperClasses.filter(
        (className) => !actualWrapperClasses.has(className)
      );
      if (missingWrapperClasses.length) {
        console.log(
          `[FAIL] ${actual.id}: illustration "${expectedIllustrationId}" wrapper is missing storyboard class(es): ${missingWrapperClasses.join(", ")}`
        );
        failed = true;
        storyboardBindingFailed = true;
      }
    }

    const expectedIds = new Set(expectedIllustrations.map((illustration) => String(illustration.id)));
    const extraIds = actualIds.filter((illustrationId) => !expectedIds.has(illustrationId));
    if (extraIds.length) {
      console.log(
        `[FAIL] ${actual.id}: unplanned or missing data-illustration-id value(s): ${extraIds.map((value) => value || "(missing)").join(", ")}`
      );
      failed = true;
      storyboardBindingFailed = true;
    }
  }
}

if (!storyboardBindingFailed) {
  console.log(
    `[PASS] storyboard binding: ${storyboardBindingStats.length} HTML card(s) match page ids, layouts, silhouettes, slots, and generated assets`
  );
}

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
    `[${allowSystemFontFallback ? "WARN" : "FAIL"}] document: R6 required font face(s) did not actually load: ${missing.join(", ")}`
  );
  if (!allowSystemFontFallback) failed = true;
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
const resolveMetadataPath = (relativePath, label, provenanceDir, expectedPath = null) => {
  const candidates = [];
  const errors = [];
  for (const baseDir of [provenanceDir, taskDir]) {
    try {
      const candidate = resolveTaskFile(relativePath, label, baseDir);
      if (!candidates.includes(candidate)) candidates.push(candidate);
    } catch (error) {
      errors.push(error);
    }
  }
  if (candidates.length === 0) throw errors[0] || new Error(`${label} is invalid`);
  if (expectedPath && candidates.includes(expectedPath)) return expectedPath;
  const existing = candidates.filter((candidate) => fs.existsSync(candidate));
  if (existing.length === 1) return existing[0];
  if (existing.length > 1) {
    throw new Error(`${label} is ambiguous between provenance-relative and task-relative paths`);
  }
  return candidates[0];
};

for (const card of mediaStats.generatedByCard) {
  const expectedStoryboardPage = storyboardResult.pages.find(
    (page) => String(page.id) === card.pageId
  );
  if (card.images.length === 0) {
    if ((expectedStoryboardPage?.illustrations || []).length > 0) {
      console.log(
        `[FAIL] ${card.card}: storyboard requires generated illustration(s), but none are bound in HTML`
      );
      failed = true;
      generatedProvenanceFailed = true;
    }
    continue;
  }
  for (const image of card.images) {
    try {
      const imagePath = resolveTaskFile(image.src, "generated image src");
      const metadataPath = `${imagePath}.generation.json`;
      const usagePath = `${imagePath}.usage.json`;
      if (!fs.existsSync(imagePath)) throw new Error(`generated image is missing: ${image.src}`);
      if (!fs.existsSync(metadataPath)) {
        throw new Error(`generation provenance is missing: ${path.relative(taskDir, metadataPath)}`);
      }
      if (requireUsageSidecar && !fs.existsSync(usagePath)) {
        throw new Error(`provider usage is missing: ${path.relative(taskDir, usagePath)}`);
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
      const declaredOutput = resolveMetadataPath(
        metadata.output_file,
        "output_file",
        provenanceDir,
        imagePath,
      );
      if (declaredOutput !== imagePath) {
        throw new Error("generation provenance output_file does not match the HTML image");
      }
      const expectedIllustration = expectedStoryboardPage?.illustrations.find(
        (illustration) =>
          String(illustration.id) ===
          (image.illustrationId ||
            (isLegacySingleIllustrationSchema && card.images.length === 1 ? "main" : ""))
      );
      const expectedPromptPath = expectedIllustration
        ? resolveTaskFile(expectedIllustration.prompt_file, "storyboard illustrations[].prompt_file")
        : null;
      const promptPath = resolveMetadataPath(
        metadata.prompt_file,
        "prompt_file",
        provenanceDir,
        expectedPromptPath,
      );
      if (!fs.existsSync(promptPath)) {
        throw new Error(`generation prompt is missing: ${metadata.prompt_file}`);
      }
      if (expectedStoryboardPage) {
        if (!expectedIllustration) {
          throw new Error(
            `generated image has no matching storyboard illustration id: ${image.illustrationId || "(missing)"}`
          );
        }
        if (promptPath !== expectedPromptPath) {
          throw new Error(
            `generation provenance prompt_file does not match storyboard: ${metadata.prompt_file}`
          );
        }
        if (metadata.size !== expectedIllustration.image_slot.model_output_size) {
          throw new Error(
            `generated image size ${metadata.size} does not match storyboard model_output_size ${expectedIllustration.image_slot.model_output_size}`
          );
        }
        if (
          expectedIllustration.generation_quality
          && metadata.quality !== expectedIllustration.generation_quality
        ) {
          throw new Error(
            `generated image quality ${metadata.quality} does not match storyboard generation_quality ${expectedIllustration.generation_quality}`
          );
        }
      }
      if (sha256File(promptPath) !== metadata.prompt_sha256) {
        throw new Error(`generation prompt hash does not match: ${metadata.prompt_file}`);
      }
      if (sha256File(imagePath) !== metadata.final_sha256) {
        throw new Error(`generated image hash does not match provenance: ${image.src}`);
      }
      if (requireUsageSidecar) {
        const usage = JSON.parse(fs.readFileSync(usagePath, "utf8"));
        if (!usage.usage || typeof usage.usage !== "object") {
          throw new Error(`provider usage is empty: ${path.relative(taskDir, usagePath)}`);
        }
        if (usage.final_sha256 !== metadata.final_sha256) {
          throw new Error(`provider usage final_sha256 does not match provenance: ${image.src}`);
        }
        if (usage.prompt_sha256 !== metadata.prompt_sha256) {
          throw new Error(`provider usage prompt_sha256 does not match provenance: ${image.src}`);
        }
        const requestedQuality = usage.request?.requestedQuality || usage.request?.quality;
        if (requestedQuality && requestedQuality !== metadata.quality) {
          throw new Error(`provider usage quality does not match provenance: ${image.src}`);
        }
        const requestedSize = usage.request?.requestedSize || usage.request?.size;
        if (requestedSize && requestedSize !== metadata.size) {
          throw new Error(`provider usage size does not match provenance: ${image.src}`);
        }
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
      if (storyboardResult.data.schema_version >= 3) {
        const bbox = metadata.content_bbox;
        const bboxFields = ["left", "top", "right", "bottom"];
        if (!bbox || bboxFields.some((field) => !Number.isFinite(bbox[field]))) {
          throw new Error(`generated image content_bbox is missing from provenance: ${image.src}`);
        }
        if (image.objectFit !== "contain") {
          throw new Error(`generated image must use object-fit: contain; got ${image.objectFit}`);
        }
        const expectedIllustration = expectedStoryboardPage?.illustrations.find(
          (illustration) => String(illustration.id) === String(image.illustrationId)
        );
        const kind = slotKind(
          expectedIllustration?.image_slot?.html_wrapper,
          expectedIllustration?.image_slot?.requested_orientation
        );
        const occupancy = validateContainedSubjectOccupancy({
          bbox,
          imageSize: size,
          frameSize: { width: image.frameWidth, height: image.frameHeight },
          kind,
        });
        if (!occupancy.ok) {
          const { width: widthOccupancy, height: heightOccupancy, range } = occupancy;
          throw new Error(
            `generated subject occupancy ${Math.round(widthOccupancy * 100)}%×${Math.round(heightOccupancy * 100)}% is outside ${kind} range ${Math.round(range.min_width * 100)}-${Math.round(range.max_width * 100)}%×${Math.round(range.min_height * 100)}-${Math.round(range.max_height * 100)}%`
          );
        }
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
    `[PASS] generated illustrations: ${mediaStats.generatedByCard.length} content card(s), ${verifiedGeneratedImages} provenance record(s) verified${requireUsageSidecar ? " with provider usage" : ""}`
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
