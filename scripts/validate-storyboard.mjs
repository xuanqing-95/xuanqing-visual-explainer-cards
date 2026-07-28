import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseDocument } from "yaml";
import {
  QUALITY_CONTRACT,
  generationQualityMeetsFloor,
  minimumGenerationQualityForSize,
  relativeRatioDrift,
} from "./quality-contract.mjs";

const REQUIRED_BRIEF_FIELDS = [
  "prior_knowledge",
  "plain_definition",
  "not_this",
  "how_it_works",
  "why_it_matters",
  "concrete_example",
  "next_action",
];

const REQUIRED_SLOT_FIELDS = [
  "html_wrapper",
  "slot_px",
  "slot_ratio",
  "requested_orientation",
  "model_output_size",
  "subject_bbox",
  "fit",
];

const VISUAL_TYPES = new Set(["labeled-gpt-image"]);
const ORIENTATIONS = new Set(["landscape", "square", "portrait"]);
const GENERATION_QUALITIES = new Set(["low", "medium", "high"]);

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizedId(value) {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (hasText(value)) return value.trim();
  return "";
}

function parseSize(value) {
  const match = hasText(value) && value.trim().match(/^(\d+)x(\d+)$/i);
  if (!match) return null;
  return { width: Number(match[1]), height: Number(match[2]) };
}

function parseRatio(value) {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
  if (!hasText(value)) return null;
  const text = value.trim();
  const pair = text.match(/^(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)$/);
  if (pair) return Number(pair[1]) / Number(pair[2]);
  const numeric = Number(text);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

function parseSubjectBox(value) {
  if (!hasText(value)) return null;
  const match = value
    .trim()
    .match(/^x\s*=\s*(\d+)\s*-\s*(\d+)\s*,?\s*y\s*=\s*(\d+)\s*-\s*(\d+)$/i);
  if (!match) return null;
  return {
    left: Number(match[1]),
    right: Number(match[2]),
    top: Number(match[3]),
    bottom: Number(match[4]),
  };
}

function isSafeRelativeFile(value, extension) {
  if (!hasText(value) || path.isAbsolute(value) || /^[a-z][a-z0-9+.-]*:/i.test(value)) {
    return false;
  }
  const parts = value.replaceAll("\\", "/").split("/");
  if (parts.includes("..")) return false;
  return value.toLowerCase().endsWith(extension);
}

function normalizePageIllustrations(page, schemaVersion) {
  if (!isObject(page) || page.role === "cover") return [];
  if (schemaVersion === 1) {
    if (!isObject(page.illustration)) return [];
    return [
      {
        id: "main",
        visual_type: page.visual_type,
        prompt_file: page.illustration.prompt_file,
        output_file: page.illustration.output_file,
        image_slot: page.image_slot,
      },
    ];
  }
  return Array.isArray(page.illustrations) ? page.illustrations : [];
}

function validateSlot(slot, label, errors, schemaVersion) {
  if (!isObject(slot)) {
    errors.push(`${label} is required`);
    return;
  }

  for (const field of REQUIRED_SLOT_FIELDS) {
    if (!hasText(slot[field])) errors.push(`${label}.${field} is required`);
  }

  if (hasText(slot.html_wrapper)) {
    const wrapperClasses = slot.html_wrapper.split(/\s+/).filter(Boolean);
    if (!wrapperClasses.includes("evidence-figure") && !wrapperClasses.includes("illust-frame")) {
      errors.push(`${label}.html_wrapper must include evidence-figure or illust-frame`);
    }
  }

  const slotSize = parseSize(slot.slot_px);
  if (hasText(slot.slot_px) && !slotSize) {
    errors.push(`${label}.slot_px must use WIDTHxHEIGHT`);
  }
  const slotRatio = parseRatio(slot.slot_ratio);
  if (hasText(slot.slot_ratio) && !slotRatio) {
    errors.push(`${label}.slot_ratio must be a positive ratio such as 3:2`);
  }
  if (slotSize && slotRatio && Math.abs(slotSize.width / slotSize.height - slotRatio) > 0.08) {
    errors.push(`${label}.slot_ratio does not match slot_px`);
  }

  const outputSize = parseSize(slot.model_output_size);
  if (hasText(slot.model_output_size) && !outputSize) {
    errors.push(`${label}.model_output_size must use WIDTHxHEIGHT`);
  }
  if (!ORIENTATIONS.has(slot.requested_orientation)) {
    errors.push(`${label}.requested_orientation must be landscape, square, or portrait`);
  } else if (outputSize) {
    const { width, height } = outputSize;
    const orientation = slot.requested_orientation;
    if (
      (orientation === "landscape" && width <= height) ||
      (orientation === "portrait" && width >= height) ||
      (orientation === "square" && width !== height)
    ) {
      errors.push(`${label}.model_output_size does not match requested_orientation`);
    }
  }

  if (schemaVersion >= 3 && slotRatio && outputSize) {
    const outputRatio = outputSize.width / outputSize.height;
    const drift = relativeRatioDrift(outputRatio, slotRatio);
    if (drift > QUALITY_CONTRACT.max_canvas_slot_ratio_drift) {
      errors.push(
        `${label}.model_output_size ratio differs from slot_ratio by ${(drift * 100).toFixed(1)}% (max ${QUALITY_CONTRACT.max_canvas_slot_ratio_drift * 100}%)`
      );
    }
  }

  const subjectBox = parseSubjectBox(slot.subject_bbox);
  if (hasText(slot.subject_bbox) && !subjectBox) {
    errors.push(`${label}.subject_bbox must use x=LEFT-RIGHT,y=TOP-BOTTOM`);
  } else if (subjectBox && outputSize) {
    if (
      subjectBox.left < 0 ||
      subjectBox.top < 0 ||
      subjectBox.right > outputSize.width ||
      subjectBox.bottom > outputSize.height ||
      subjectBox.left >= subjectBox.right ||
      subjectBox.top >= subjectBox.bottom
    ) {
      errors.push(`${label}.subject_bbox must stay inside model_output_size`);
    }
  }

  if (hasText(slot.fit) && slot.fit !== "contain") {
    errors.push(`${label}.fit must be contain for generated illustrations`);
  }
}

export function validateStoryboardTask(taskDirInput) {
  const taskDir = path.resolve(taskDirInput || ".");
  const storyboardPath = path.join(taskDir, "storyboard.yaml");
  const errors = [];

  if (!fs.existsSync(storyboardPath)) {
    return {
      ok: false,
      errors: ["storyboard.yaml is required before HTML design"],
      taskDir,
      storyboardPath,
      data: null,
      pages: [],
      beats: [],
    };
  }

  const source = fs.readFileSync(storyboardPath, "utf8");
  const document = parseDocument(source, { prettyErrors: true, uniqueKeys: true });
  for (const error of document.errors) errors.push(`YAML parse error: ${error.message}`);

  let data = null;
  if (document.errors.length === 0) {
    try {
      data = document.toJS();
    } catch (error) {
      errors.push(`YAML conversion error: ${error.message}`);
    }
  }

  if (!isObject(data)) {
    if (errors.length === 0) errors.push("storyboard root must be a YAML mapping");
    return { ok: false, errors, taskDir, storyboardPath, data, pages: [], beats: [] };
  }

  const schemaVersion = data.schema_version;
  if (![1, 2, 3].includes(schemaVersion)) errors.push("schema_version must be 1, 2, or 3");
  if (!hasText(data.topic)) errors.push("topic is required");
  if (!hasText(data.audience)) errors.push("audience is required");

  if (!isObject(data.beginner_brief)) {
    errors.push("beginner_brief is required");
  } else {
    for (const field of REQUIRED_BRIEF_FIELDS) {
      if (!hasText(data.beginner_brief[field])) {
        errors.push(`beginner_brief.${field} is required`);
      }
    }
  }

  const rhythm = isObject(data.page_rhythm) ? data.page_rhythm : null;
  if (!rhythm) errors.push("page_rhythm must be a mapping with strategy and beats");
  if (rhythm && !hasText(rhythm.strategy)) errors.push("page_rhythm.strategy is required");
  const beats = rhythm && Array.isArray(rhythm.beats) ? rhythm.beats : [];
  if (rhythm && !Array.isArray(rhythm.beats)) errors.push("page_rhythm.beats must be a list");

  const sourcePages = Array.isArray(data.pages) ? data.pages : [];
  if (!Array.isArray(data.pages) || sourcePages.length === 0) {
    errors.push("pages must contain at least one page");
  }

  const pages = sourcePages.map((page) =>
    isObject(page)
      ? { ...page, illustrations: normalizePageIllustrations(page, schemaVersion) }
      : page
  );
  const pageIds = [];
  const seenPageIds = new Set();
  const allPromptFiles = [];
  const allOutputFiles = [];
  let illustrationCount = 0;
  let coverCount = 0;

  pages.forEach((page, index) => {
    const label = `pages[${index}]`;
    if (!isObject(page)) {
      errors.push(`${label} must be a mapping`);
      pageIds.push("");
      return;
    }

    const id = normalizedId(page.id);
    pageIds.push(id);
    if (!id) errors.push(`${label}.id is required`);
    if (id && seenPageIds.has(id)) errors.push(`${label}.id duplicates page ${id}`);
    if (id) seenPageIds.add(id);
    if (!hasText(page.message)) errors.push(`${label}.message is required`);
    if (!hasText(page.role)) errors.push(`${label}.role is required`);
    if (!hasText(page.layout)) errors.push(`${label}.layout is required`);

    if (page.role === "cover") {
      coverCount += 1;
      if (index !== 0) errors.push(`${label}: a cover must be the first page`);
      if (!isObject(page.cover)) {
        errors.push(`${label}.cover is required for a cover page`);
      } else {
        for (const field of ["series_line", "english_term", "chinese_explanation", "user_question"]) {
          if (!hasText(page.cover[field])) errors.push(`${label}.cover.${field} is required`);
        }
      }
      if (schemaVersion >= 2 && Array.isArray(sourcePages[index]?.illustrations) && sourcePages[index].illustrations.length > 0) {
        errors.push(`${label}.illustrations must be empty on a cover page`);
      }
      return;
    }

    if (schemaVersion === 2 && !Array.isArray(sourcePages[index]?.illustrations)) {
      errors.push(`${label}.illustrations must be a non-empty list for every non-cover page`);
    }
    if (schemaVersion === 3 && !Array.isArray(sourcePages[index]?.illustrations)) {
      errors.push(`${label}.illustrations must be a list (empty when no generation is needed)`);
    }
    if (page.illustrations.length === 0 && schemaVersion < 3) {
      errors.push(
        schemaVersion === 1
          ? `${label}.illustration is required for every non-cover page`
          : `${label}.illustrations must contain at least one generated illustration`
      );
    }

    const seenIllustrationIds = new Set();
    page.illustrations.forEach((illustration, illustrationIndex) => {
      const illustrationLabel = `${label}.illustrations[${illustrationIndex}]`;
      illustrationCount += 1;
      if (!isObject(illustration)) {
        errors.push(`${illustrationLabel} must be a mapping`);
        return;
      }
      const illustrationId = normalizedId(illustration.id);
      if (!illustrationId) errors.push(`${illustrationLabel}.id is required`);
      if (illustrationId && seenIllustrationIds.has(illustrationId)) {
        errors.push(`${illustrationLabel}.id duplicates illustration ${illustrationId} on page ${id}`);
      }
      if (illustrationId) seenIllustrationIds.add(illustrationId);
      if (!VISUAL_TYPES.has(illustration.visual_type)) {
        errors.push(`${illustrationLabel}.visual_type must be labeled-gpt-image`);
      }
      if (schemaVersion >= 3 && !GENERATION_QUALITIES.has(illustration.generation_quality)) {
        errors.push(`${illustrationLabel}.generation_quality must be low, medium, or high`);
      } else if (schemaVersion >= 3) {
        const minimumQuality = minimumGenerationQualityForSize(
          illustration.image_slot?.model_output_size
        );
        if (!generationQualityMeetsFloor(illustration.generation_quality, minimumQuality)) {
          errors.push(
            `${illustrationLabel}.generation_quality ${illustration.generation_quality} is below `
            + `${minimumQuality} for ${illustration.image_slot?.model_output_size || "this canvas"}`
          );
        }
      }
      if (!isSafeRelativeFile(illustration.prompt_file, ".md")) {
        errors.push(`${illustrationLabel}.prompt_file must be a task-relative .md file`);
      } else {
        allPromptFiles.push(illustration.prompt_file);
      }
      if (!isSafeRelativeFile(illustration.output_file, ".png")) {
        errors.push(`${illustrationLabel}.output_file must be a task-relative .png file`);
      } else {
        allOutputFiles.push(illustration.output_file);
      }
      validateSlot(illustration.image_slot, `${illustrationLabel}.image_slot`, errors, schemaVersion);
    });
  });

  if (coverCount > 1) errors.push("pages may contain at most one cover");

  const beatIds = [];
  const seenBeatIds = new Set();
  beats.forEach((beat, index) => {
    const label = `page_rhythm.beats[${index}]`;
    if (!isObject(beat)) {
      errors.push(`${label} must be a mapping`);
      beatIds.push("");
      return;
    }
    const pageId = normalizedId(beat.page);
    beatIds.push(pageId);
    if (!pageId) errors.push(`${label}.page is required`);
    if (pageId && seenBeatIds.has(pageId)) errors.push(`${label}.page duplicates page ${pageId}`);
    if (pageId) seenBeatIds.add(pageId);
    for (const field of ["purpose", "silhouette", "transition"]) {
      if (!hasText(beat[field])) errors.push(`${label}.${field} is required`);
    }
  });

  if (beats.length !== pages.length) {
    errors.push(`page_rhythm.beats has ${beats.length} item(s), but pages has ${pages.length}`);
  }
  for (let index = 0; index < Math.min(pageIds.length, beatIds.length); index += 1) {
    if (pageIds[index] && beatIds[index] && pageIds[index] !== beatIds[index]) {
      errors.push(`page_rhythm.beats[${index}].page must match pages[${index}].id`);
    }
  }

  const contentPages = pages
    .map((page, index) => ({ page, beat: beats[index], index }))
    .filter(({ page }) => isObject(page) && page.role !== "cover");
  const contentLayouts = contentPages.map(({ page }) => page.layout).filter(hasText);
  const contentSilhouettes = contentPages
    .map(({ beat }) => (isObject(beat) ? beat.silhouette : ""))
    .filter(hasText);
  const requiredVariety = Math.min(3, contentPages.length);

  if (new Set(contentLayouts).size < requiredVariety) {
    errors.push(`content pages need at least ${requiredVariety} distinct layout(s)`);
  }
  if (new Set(contentSilhouettes).size < requiredVariety) {
    errors.push(`content pages need at least ${requiredVariety} distinct silhouette(s)`);
  }
  if (new Set(allPromptFiles).size !== allPromptFiles.length) {
    errors.push("each illustration must use a distinct prompt_file");
  }
  if (new Set(allOutputFiles).size !== allOutputFiles.length) {
    errors.push("each illustration must use a distinct output_file");
  }
  for (let index = 1; index < contentPages.length; index += 1) {
    const previous = contentPages[index - 1];
    const current = contentPages[index];
    if (previous.page.layout === current.page.layout) {
      errors.push(`adjacent content pages ${previous.page.id} and ${current.page.id} repeat layout ${current.page.layout}`);
    }
    if (previous.beat?.silhouette === current.beat?.silhouette) {
      errors.push(
        `adjacent content pages ${previous.page.id} and ${current.page.id} repeat silhouette ${current.beat?.silhouette}`
      );
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    taskDir,
    storyboardPath,
    data,
    pages,
    beats,
    summary: {
      pageCount: pages.length,
      contentCount: contentPages.length,
      illustrationCount,
      layoutCount: new Set(contentLayouts).size,
      silhouetteCount: new Set(contentSilhouettes).size,
    },
  };
}

function printResult(result) {
  if (!result.ok) {
    for (const error of result.errors) console.log(`[FAIL] storyboard: ${error}`);
    return;
  }
  const { pageCount, contentCount, illustrationCount, layoutCount, silhouetteCount } = result.summary;
  console.log(
    `[PASS] storyboard: ${pageCount} page(s), ${contentCount} content page(s), ${illustrationCount} illustration(s), ${layoutCount} layout(s), ${silhouetteCount} silhouette(s)`
  );
}

const isDirectRun =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isDirectRun) {
  const result = validateStoryboardTask(process.argv[2] || ".");
  printResult(result);
  process.exit(result.ok ? 0 : 1);
}
