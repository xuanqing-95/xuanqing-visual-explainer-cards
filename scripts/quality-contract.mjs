import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contractPath = path.join(repoDir, "assets", "quality-contract.json");

export const QUALITY_CONTRACT = Object.freeze(
  JSON.parse(fs.readFileSync(contractPath, "utf8"))
);

export function parseSize(value) {
  const match = typeof value === "string" && value.trim().match(/^(\d+)x(\d+)$/i);
  if (!match) return null;
  return { width: Number(match[1]), height: Number(match[2]) };
}

const QUALITY_RANK = Object.freeze({ low: 0, medium: 1, high: 2 });

export function minimumGenerationQualityForSize(value) {
  const size = parseSize(value);
  const floor = QUALITY_CONTRACT.generation_quality_floor || {};
  if (
    size
    && Math.max(size.width, size.height) >= Number(floor.large_canvas_long_edge || 1536)
  ) {
    return floor.large_canvas || "high";
  }
  return floor.default || "medium";
}

export function generationQualityMeetsFloor(actual, minimum) {
  return Number.isFinite(QUALITY_RANK[actual])
    && Number.isFinite(QUALITY_RANK[minimum])
    && QUALITY_RANK[actual] >= QUALITY_RANK[minimum];
}

export function parseRatio(value) {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
  if (typeof value !== "string") return null;
  const pair = value.trim().match(/^(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)$/);
  if (pair) return Number(pair[1]) / Number(pair[2]);
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

export function relativeRatioDrift(first, second) {
  if (!first || !second) return Number.POSITIVE_INFINITY;
  return Math.abs(first - second) / second;
}

export function slotKind(wrapper = "", orientation = "") {
  const classes = new Set(String(wrapper).split(/\s+/).filter(Boolean));
  if (classes.has("wide-flow") || classes.has("wide-strip")) return "wide";
  if (classes.has("portrait") || orientation === "portrait") return "portrait";
  if (classes.has("square") || classes.has("row-thumb") || orientation === "square") return "square";
  return "landscape";
}

export function taskRelativePath(taskDir, value, label) {
  if (!value || path.isAbsolute(value) || /^[a-z][a-z0-9+.-]*:/i.test(value)) {
    throw new Error(`${label} must be a task-relative path`);
  }
  const resolved = path.resolve(taskDir, value);
  const prefix = `${path.resolve(taskDir)}${path.sep}`;
  if (resolved !== path.resolve(taskDir) && !resolved.startsWith(prefix)) {
    throw new Error(`${label} escapes the task directory`);
  }
  return resolved;
}

export function validateContainedSubjectOccupancy({ bbox, imageSize, frameSize, kind }) {
  const range = QUALITY_CONTRACT.occupancy[kind];
  if (!range) throw new Error(`unknown slot kind: ${kind}`);
  const scale = Math.min(frameSize.width / imageSize.width, frameSize.height / imageSize.height);
  const width = ((bbox.right - bbox.left) * scale) / frameSize.width;
  const height = ((bbox.bottom - bbox.top) * scale) / frameSize.height;
  return {
    ok: width >= range.min_width && width <= range.max_width && height >= range.min_height && height <= range.max_height,
    width,
    height,
    range,
  };
}

export function validatePromptVisualFidelity(prompt = "", { requireExplicitHierarchy = false } = {}) {
  const text = String(prompt);
  const errors = [];
  const structuralAccentPatterns = [
    /\b(?:IKB|Klein)?\s*blue\s+(?:outline|border|frame|bracket|grid|wireframe)\b/i,
    /\b(?:outline|border|frame|bracket|grid|wireframe)\s+(?:in|using|with)\s+(?:IKB|Klein)?\s*blue\b/i,
    /蓝色(?:外框|边框|框线|括号|网格|线框|骨架线)/,
    /(?:外框|边框|框线|括号|网格|线框|骨架线)(?:使用|采用|设为|画成)?蓝色/,
  ];
  const hasUnnegatedStructuralAccent = structuralAccentPatterns.some((pattern) => {
    const matcher = new RegExp(pattern.source, `${pattern.flags.replace("g", "")}g`);
    for (const match of text.matchAll(matcher)) {
      const prefix = text.slice(Math.max(0, match.index - 48), match.index);
      if (!/(?:do\s+not|don't|never|must\s+not|avoid|forbid|禁止|不得|不要|不能|严禁|不使用)[^.!?。！？\n]{0,40}$/i.test(prefix)) {
        return true;
      }
    }
    return false;
  });
  if (hasUnnegatedStructuralAccent) {
    errors.push("accent blue must not be used as a perimeter, frame, bracket, grid, or wireframe");
  }
  if (requireExplicitHierarchy) {
    if (!/LINE COLOR HIERARCHY/i.test(text)) {
      errors.push("prompt must include a LINE COLOR HIERARCHY section");
    }
    if (!/(structural|structure).{0,80}(ink black|light gr[ae]y)|(ink black|light gr[ae]y).{0,80}(structural|structure)/is.test(text)) {
      errors.push("prompt must state that structural linework uses ink black or light grey");
    }
    if (!/(accent|IKB|Klein blue).{0,100}(one|single).{0,40}(small|focal|analytical)/is.test(text)) {
      errors.push("prompt must limit accent blue to one small focal or analytical cue");
    }
  }
  return { ok: errors.length === 0, errors };
}

export function validateLayoutSlotScale({ pageRole = "", pageLayout = "", illustrationCount = 0, slotPx = "" } = {}) {
  const errors = [];
  const match = String(slotPx).match(/^(\d+)x(\d+)$/i);
  const slotHeight = match ? Number(match[2]) : null;
  if (!slotHeight) return { ok: true, errors, slotHeight: null };
  if (
    /compare|comparison|before-after/i.test(String(pageLayout))
    && Number(illustrationCount) > 1
    && (slotHeight < 200 || slotHeight > 280)
  ) {
    errors.push(`multi-state comparison illustration must be 200-280px tall; got ${slotHeight}px`);
  }
  return { ok: errors.length === 0, errors, slotHeight };
}

export function validateFontSourceDeterminism(indexText = "", { schemaVersion = 0 } = {}) {
  if (Number(schemaVersion) < 3) return { ok: true, errors: [] };
  const remote = /(?:fonts\.googleapis\.com|fonts\.gstatic\.com|@font-face[\s\S]{0,500}src\s*:\s*url\(["']?https?:)/i.test(String(indexText));
  return remote
    ? { ok: false, errors: ["schema-v3 cards must use versioned local fonts; remote font/CDN references make layout non-reproducible"] }
    : { ok: true, errors: [] };
}
