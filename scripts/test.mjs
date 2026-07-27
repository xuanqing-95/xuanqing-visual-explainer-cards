import fs from "node:fs";
import { createHash } from "node:crypto";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  validateContainedSubjectOccupancy,
  validateFontSourceDeterminism,
  validateLayoutSlotScale,
  validatePromptVisualFidelity,
} from "./quality-contract.mjs";

const repoDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const generateScript = path.join(repoDir, "scripts", "generate.mjs");
const renderScript = path.join(repoDir, "scripts", "render.mjs");
const validateStoryboardScript = path.join(repoDir, "scripts", "validate-storyboard.mjs");
const validatePreflightScript = path.join(repoDir, "scripts", "validate-preflight.mjs");
const validateScript = path.join(repoDir, "scripts", "validate.mjs");

function run(script, taskDir, extraEnv = {}) {
  return spawnSync(process.execPath, [script, taskDir], {
    cwd: repoDir,
    encoding: "utf8",
    env: { ...process.env, ...extraEnv },
  });
}

function assert(condition, message, result) {
  if (condition) return;
  if (result) {
    process.stderr.write(result.stdout || "");
    process.stderr.write(result.stderr || "");
  }
  throw new Error(message);
}

function runGenerate(args) {
  const env = { ...process.env };
  delete env.OPENAI_API_KEY;
  delete env.ZENMUX_API_KEY;
  return spawnSync(process.execPath, [generateScript, ...args], {
    cwd: repoDir,
    encoding: "utf8",
    env,
  });
}

function fixture(body) {
  return `<!doctype html>
<html lang="zh-CN" data-mode="editorial" data-accent="indigo-porcelain">
<head>
  <meta charset="utf-8">
  <style>
    @font-face{font-family:"Noto Serif SC";src:local("Arial"),local("DejaVu Sans"),local("Liberation Sans");font-weight:400 500}
    @font-face{font-family:"Playfair Display";src:local("Georgia"),local("DejaVu Serif"),local("Liberation Serif");font-weight:900}
    @font-face{font-family:"IBM Plex Mono";src:local("Menlo"),local("Arial"),local("DejaVu Sans Mono"),local("Liberation Mono");font-weight:500}
    *{box-sizing:border-box}
    body{margin:0;padding:20px;background:#222}
    .poster{width:1080px;height:1440px;overflow:hidden;background:#fafaf8}
    figure{margin:0}
    .content{height:100%;padding:80px;display:flex;flex-direction:column}
    .chrome,.foot{font-family:"IBM Plex Mono",monospace;font-weight:500}
    .term-en{font-family:"Playfair Display",serif;font-weight:900}
    .term-zh,.term-question,.series-zh,p{font-family:"Noto Serif SC",serif}
    .evidence-figure{margin:0;width:320px;height:240px}
    .illust-frame{width:100%;height:100%;overflow:hidden}
    img{width:100%;height:100%;object-fit:contain;display:block}
  </style>
</head>
<body><main>${body}</main></body>
</html>`;
}

function writeStoryboard(
  taskDir,
  { outputFile = "assets/generated.png", promptFile = "prompts/page.md" } = {}
) {
  fs.writeFileSync(
    path.join(taskDir, "storyboard.yaml"),
    `schema_version: 2
topic: Validator fixture
audience: Test reader
beginner_brief:
  prior_knowledge: Knows this is a test
  plain_definition: A validator fixture
  not_this: Not production content
  how_it_works: The fixture exercises one contract
  why_it_matters: Regressions must fail visibly
  concrete_example: One page is checked
  next_action: Run validation
page_rhythm:
  strategy: Use one compact content page for an isolated validator test
  beats:
    - page: 1
      purpose: Exercise one validation rule
      silhouette: test-silhouette
      transition: isolated-test
pages:
  - id: 1
    message: This fixture exercises one validation rule
    role: concept
    layout: test-layout
    illustrations:
      - id: main
        visual_type: html-label-overlay
        image_slot:
          html_wrapper: evidence-figure compact
          slot_px: 300x300
          slot_ratio: "1:1"
          requested_orientation: square
          model_output_size: 1024x1024
          subject_bbox: x=112-912,y=112-912
          fit: contain
        prompt_file: ${promptFile}
        output_file: ${outputFile}
`
  );
}

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "visual-cards-test-"));
try {
  const structuralBlue = validatePromptVisualFidelity(
    "A thin IKB blue outline frames the page and an IKB blue bracket marks the capacity."
  );
  assert(!structuralBlue.ok, "structural blue frames and brackets must fail prompt fidelity");
  assert(validatePromptVisualFidelity(
    "Never use an IKB blue frame or blue bracket. Keep all structural lines neutral."
  ).ok, "negative prompt instructions that forbid blue structure must not be rejected");
  assert(validatePromptVisualFidelity(
    "禁止使用蓝色边框，结构线只能使用黑色或浅灰。"
  ).ok, "Chinese negative prompt instructions must not be rejected");
  const neutralStructure = validatePromptVisualFidelity(`
LINE COLOR HIERARCHY
Use ink black #0a0a0a and light grey for every structural outline and frame.
Use IKB blue #002FA7 for one small focal analytical cue only.
Never use blue as the perimeter, border, bracket, grid, or wireframe skeleton.
`, { requireExplicitHierarchy: true });
  assert(neutralStructure.ok, "explicit neutral structural line hierarchy must pass");
  const missingHierarchy = validatePromptVisualFidelity(
    "Use thin ink lines and a restrained palette.",
    { requireExplicitHierarchy: true }
  );
  assert(!missingHierarchy.ok, "schema-v3 prompts without explicit line hierarchy must fail");
  console.log("[PASS] visual prompt line hierarchy blocks blue structural skeletons");

  assert(validateLayoutSlotScale({
    pageRole: "action",
    pageLayout: "closing-checklist",
    illustrationCount: 1,
    slotPx: "904x440",
  }).ok, "action-page illustration size must remain content-driven");
  assert(!validateLayoutSlotScale({
    pageRole: "compare",
    pageLayout: "before-after-comparison",
    illustrationCount: 2,
    slotPx: "420x420",
  }).ok, "oversized multi-state comparison images must fail before paid generation");
  assert(validateLayoutSlotScale({
    pageRole: "action",
    pageLayout: "closing-checklist",
    illustrationCount: 1,
    slotPx: "904x120",
  }).ok, "action-page illustration size must not be hard-coded by page role");
  assert(validateLayoutSlotScale({
    pageRole: "compare",
    pageLayout: "before-after-comparison",
    illustrationCount: 2,
    slotPx: "420x240",
  }).ok, "compact baseline comparison images must remain valid");
  console.log("[PASS] layout slot scale preserves comparison safety without hard-coding action pages");

  assert(!validateFontSourceDeterminism(
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC">',
    { schemaVersion: 3 },
  ).ok, "schema-v3 remote fonts must fail reproducibility validation");
  assert(validateFontSourceDeterminism(
    '@font-face{src:url("../../assets/fonts/NotoSerifSC-wght.ttf")}',
    { schemaVersion: 3 },
  ).ok, "schema-v3 versioned local fonts must pass reproducibility validation");
  assert(validateFontSourceDeterminism(
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC">',
    { schemaVersion: 2 },
  ).ok, "legacy immutable baselines remain readable for comparison");
  console.log("[PASS] schema-v3 fonts are versioned local assets");

  const tinyWideSubject = validateContainedSubjectOccupancy({
    bbox: { left: 600, right: 936, top: 400, bottom: 624 },
    imageSize: { width: 1536, height: 1024 },
    frameSize: { width: 900, height: 360 },
    kind: "wide",
  });
  assert(!tinyWideSubject.ok && tinyWideSubject.width < 0.78, "wide-frame subject that is only a small centered patch must fail");
  console.log("[PASS] undersized subjects fail the final frame occupancy contract");
  let result = runGenerate(["--prompt", "test", "--output", "unused.png"]);
  assert(
    result.status !== 0 && /--size or --orientation is required/i.test(result.stderr),
    "image generator must require an explicit slot-derived size or orientation",
    result
  );
  result = runGenerate([
    "--prompt",
    "test",
    "--output",
    "unused.png",
    "--size",
    "1536x1024",
  ]);
  assert(
    result.status !== 0 && /OPENAI_API_KEY or ZENMUX_API_KEY is required/i.test(result.stderr),
    "image generator must fail clearly when credentials are missing",
    result
  );
  console.log("[PASS] image generation contract fails fast");

  const removedNoTextModeDir = path.join(tempRoot, "removed-no-text-mode");
  fs.mkdirSync(removedNoTextModeDir);
  writeStoryboard(removedNoTextModeDir);
  fs.writeFileSync(
    path.join(removedNoTextModeDir, "storyboard.yaml"),
    fs
      .readFileSync(path.join(removedNoTextModeDir, "storyboard.yaml"), "utf8")
      .replace("visual_type: html-label-overlay", "visual_type: no-text")
  );
  result = run(validateStoryboardScript, removedNoTextModeDir);
  assert(
    result.status !== 0 && /visual_type must be labeled-gpt-image or html-label-overlay/i.test(result.stdout),
    "storyboard validator must reject the removed no-text mode",
    result
  );
  console.log("[PASS] removed no-text illustration mode fails storyboard validation");

  const missingStoryboardDir = path.join(tempRoot, "missing-storyboard");
  fs.mkdirSync(missingStoryboardDir);
  fs.writeFileSync(
    path.join(missingStoryboardDir, "index.html"),
    fixture(`
      <section class="poster" id="card-01">
        <div class="content"><p>Storyboard is missing</p></div>
      </section>`)
  );
  result = run(validateScript, missingStoryboardDir);
  assert(
    result.status !== 0 && /storyboard\.yaml is required before HTML design/i.test(result.stdout),
    "validator must reject design work without storyboard.yaml",
    result
  );
  console.log("[PASS] missing storyboard fails before HTML validation");

  const repeatedRhythmDir = path.join(tempRoot, "repeated-rhythm");
  fs.mkdirSync(repeatedRhythmDir);
  fs.writeFileSync(
    path.join(repeatedRhythmDir, "storyboard.yaml"),
    `schema_version: 1
topic: Repeated rhythm
audience: Test reader
beginner_brief:
  prior_knowledge: Basic
  plain_definition: Test
  not_this: Production
  how_it_works: Repeat layouts
  why_it_matters: Rhythm disappears
  concrete_example: Three identical pages
  next_action: Change layouts
page_rhythm:
  strategy: Intentionally repeat pages to prove the gate
  beats:
    - { page: 1, purpose: First, silhouette: repeated, transition: next }
    - { page: 2, purpose: Second, silhouette: repeated, transition: next }
    - { page: 3, purpose: Third, silhouette: repeated, transition: end }
pages:
  - &page
    id: 1
    message: First repeated page
    role: concept
    layout: repeated-layout
    visual_type: html-label-overlay
    image_slot: { html_wrapper: evidence-figure compact, slot_px: 300x300, slot_ratio: "1:1", requested_orientation: square, model_output_size: 1024x1024, subject_bbox: "x=112-912,y=112-912", fit: contain }
    illustration: { prompt_file: prompts/page-01.md, output_file: assets/page-01.png }
  - <<: *page
    id: 2
    message: Second repeated page
    illustration: { prompt_file: prompts/page-02.md, output_file: assets/page-02.png }
  - <<: *page
    id: 3
    message: Third repeated page
    illustration: { prompt_file: prompts/page-03.md, output_file: assets/page-03.png }
`
  );
  result = run(validateStoryboardScript, repeatedRhythmDir);
  assert(
    result.status !== 0 && /distinct layout|repeat layout|distinct silhouette/i.test(result.stdout),
    "storyboard validator must reject repeated content-page rhythm",
    result
  );
  console.log("[PASS] repeated content-page rhythm fails storyboard validation");

  const legacyStoryboardDir = path.join(tempRoot, "legacy-storyboard");
  fs.mkdirSync(legacyStoryboardDir);
  fs.writeFileSync(
    path.join(legacyStoryboardDir, "storyboard.yaml"),
    `schema_version: 1
topic: Legacy single-image storyboard
audience: Test reader
beginner_brief:
  prior_knowledge: Basic
  plain_definition: Legacy schema remains readable
  not_this: Not the canonical schema for new tasks
  how_it_works: Page-level fields normalize to one illustration
  why_it_matters: Existing tasks must not break
  concrete_example: One legacy content page
  next_action: Prefer schema version 2 for new work
page_rhythm:
  strategy: Isolate backward compatibility
  beats:
    - { page: 1, purpose: Check legacy schema, silhouette: legacy-single, transition: end }
pages:
  - id: 1
    message: Existing schema version 1 tasks still validate
    role: concept
    layout: legacy-single
    visual_type: labeled-gpt-image
    image_slot: { html_wrapper: evidence-figure landscape, slot_px: 320x213, slot_ratio: "3:2", requested_orientation: landscape, model_output_size: 1536x1024, subject_bbox: "x=120-1416,y=128-896", fit: contain }
    illustration: { prompt_file: prompts/page-02.md, output_file: assets/page-02.png }
`
  );
  result = run(validateStoryboardScript, legacyStoryboardDir);
  assert(
    result.status === 0 && /1 illustration\(s\)/i.test(result.stdout),
    "schema version 1 single-image storyboards must remain backward compatible",
    result
  );
  console.log("[PASS] legacy single-image storyboards remain compatible");

  const zeroIllustrationStoryboardDir = path.join(tempRoot, "zero-illustration-storyboard");
  fs.mkdirSync(zeroIllustrationStoryboardDir);
  fs.writeFileSync(
    path.join(zeroIllustrationStoryboardDir, "storyboard.yaml"),
    `schema_version: 3
topic: Content-driven illustration count
audience: Test reader
beginner_brief:
  prior_knowledge: Basic
  plain_definition: Exact values stay in HTML
  not_this: Not a fake generated image
  how_it_works: The page content determines whether an illustration is needed
  why_it_matters: Decorative generation is unnecessary
  concrete_example: One exact comparison
  next_action: Validate the storyboard
page_rhythm:
  strategy: Use one exact HTML page without imposing a page mix
  beats:
    - { page: 1, purpose: Show exact values, silhouette: exact-comparison, transition: end }
pages:
  - id: 1
    message: Exact values are clearest as HTML
    role: comparison
    layout: exact-comparison
    illustrations: []
`
  );
  result = run(validateStoryboardScript, zeroIllustrationStoryboardDir);
  assert(result.status === 0 && /0 illustration\(s\)/i.test(result.stdout), "schema version 3 must allow content-driven zero-illustration pages", result);
  console.log("[PASS] content-driven image count does not impose an image or pure-text quota");

  const ratioMismatchDir = path.join(tempRoot, "ratio-mismatch");
  fs.mkdirSync(ratioMismatchDir);
  fs.writeFileSync(path.join(ratioMismatchDir, "storyboard.yaml"), fs.readFileSync(path.join(zeroIllustrationStoryboardDir, "storyboard.yaml"), "utf8")
    .replace("    illustrations: []", `    illustrations:
      - id: main
        visual_type: html-label-overlay
        generation_quality: high
        prompt_file: prompts/page-01.md
        output_file: assets/page-01.png
        image_slot: { html_wrapper: evidence-figure wide-flow, slot_px: 900x360, slot_ratio: "5:2", requested_orientation: square, model_output_size: 1024x1024, subject_bbox: "x=112-912,y=112-912", fit: contain }`));
  result = run(validatePreflightScript, ratioMismatchDir);
  assert(result.status !== 0 && /ratio differs|requested_orientation/i.test(result.stdout), "paid preflight must reject a square canvas planned for a wide frame", result);
  assert(!fs.existsSync(path.join(ratioMismatchDir, "illustration-plan.json")), "failed preflight must not write an image-call plan");
  console.log("[PASS] square-canvas-in-wide-frame fails before paid generation");

  const missingQualityDir = path.join(tempRoot, "missing-generation-quality");
  fs.cpSync(ratioMismatchDir, missingQualityDir, { recursive: true });
  fs.writeFileSync(
    path.join(missingQualityDir, "storyboard.yaml"),
    fs.readFileSync(path.join(missingQualityDir, "storyboard.yaml"), "utf8")
      .replace("        generation_quality: high\n", "")
      .replace('requested_orientation: square, model_output_size: 1024x1024', 'requested_orientation: landscape, model_output_size: 1536x1024')
      .replace('slot_px: 900x360, slot_ratio: "5:2"', 'slot_px: 900x600, slot_ratio: "3:2"')
  );
  result = run(validateStoryboardScript, missingQualityDir);
  assert(result.status !== 0 && /generation_quality must be low, medium, or high/i.test(result.stdout), "schema version 3 must require an explicit image quality", result);
  console.log("[PASS] schema-v3 image quality is explicit before paid generation");

  const loweredLargeQualityDir = path.join(tempRoot, "lowered-large-generation-quality");
  fs.cpSync(ratioMismatchDir, loweredLargeQualityDir, { recursive: true });
  fs.writeFileSync(
    path.join(loweredLargeQualityDir, "storyboard.yaml"),
    fs.readFileSync(path.join(loweredLargeQualityDir, "storyboard.yaml"), "utf8")
      .replace("        generation_quality: high", "        generation_quality: medium")
      .replace("requested_orientation: square, model_output_size: 1024x1024", "requested_orientation: landscape, model_output_size: 1536x1024")
      .replace('slot_px: 900x360, slot_ratio: "5:2"', 'slot_px: 900x600, slot_ratio: "3:2"')
  );
  result = run(validateStoryboardScript, loweredLargeQualityDir);
  assert(
    result.status !== 0 && /below high for 1536x1024/i.test(result.stdout),
    "a canvas with a 1536px edge must keep high quality",
    result
  );
  console.log("[PASS] large-canvas image quality cannot be lowered below high");

  const loweredSquareQualityDir = path.join(tempRoot, "lowered-square-generation-quality");
  fs.cpSync(ratioMismatchDir, loweredSquareQualityDir, { recursive: true });
  fs.writeFileSync(
    path.join(loweredSquareQualityDir, "storyboard.yaml"),
    fs.readFileSync(path.join(loweredSquareQualityDir, "storyboard.yaml"), "utf8")
      .replace("        generation_quality: high", "        generation_quality: low")
      .replace("evidence-figure wide-flow", "evidence-figure square")
      .replace('slot_px: 900x360, slot_ratio: "5:2"', 'slot_px: 600x600, slot_ratio: "1:1"')
  );
  result = run(validateStoryboardScript, loweredSquareQualityDir);
  assert(
    result.status !== 0 && /below medium for 1024x1024/i.test(result.stdout),
    "a 1024 square support image must keep at least medium quality",
    result
  );
  console.log("[PASS] support-image quality cannot be lowered below medium");
  fs.mkdirSync(path.join(legacyStoryboardDir, "assets"));
  fs.mkdirSync(path.join(legacyStoryboardDir, "prompts"));
  fs.copyFileSync(
    path.join(repoDir, "examples", "llmops", "assets", "page-02.png"),
    path.join(legacyStoryboardDir, "assets", "page-02.png")
  );
  fs.copyFileSync(
    path.join(repoDir, "examples", "llmops", "assets", "page-02.png.generation.json"),
    path.join(legacyStoryboardDir, "assets", "page-02.png.generation.json")
  );
  fs.copyFileSync(
    path.join(repoDir, "examples", "llmops", "prompts", "page-02.md"),
    path.join(legacyStoryboardDir, "prompts", "page-02.md")
  );
  fs.writeFileSync(
    path.join(legacyStoryboardDir, "index.html"),
    fixture(`
      <section class="poster" id="card-01" data-page-id="1" data-layout="legacy-single" data-silhouette="legacy-single">
        <div class="content" style="gap:48px;">
          <div class="chrome">LEGACY</div>
          <p class="term-en" style="font-size:18px;margin:0;">LEGACY</p>
          <h2 style="font:500 64px/1.1 'Noto Serif SC',serif;margin:0;">旧任务继续可用</h2>
          <figure class="evidence-figure landscape">
            <div class="illust-frame">
              <img data-generated-illustration="true" src="assets/page-02.png" alt="legacy generated evidence">
            </div>
          </figure>
          <div class="foot" style="margin-top:auto;">01 / 01</div>
        </div>
      </section>`)
  );
  result = run(renderScript, legacyStoryboardDir);
  assert(result.status === 0, "legacy full-task fixture should render", result);
  result = run(validateScript, legacyStoryboardDir);
  assert(
    result.status === 0 && /1 provenance record\(s\) verified/i.test(result.stdout),
    "schema version 1 HTML without data-illustration-id must remain compatible",
    result
  );
  console.log("[PASS] legacy HTML without illustration ids remains compatible");

  const emptyDir = path.join(tempRoot, "empty");
  fs.mkdirSync(emptyDir);
  writeStoryboard(emptyDir);
  fs.writeFileSync(path.join(emptyDir, "index.html"), fixture("<p>No cards</p>"));
  result = run(renderScript, emptyDir);
  assert(result.status !== 0, "render must fail when no .poster exists", result);
  result = run(validateScript, emptyDir);
  assert(result.status !== 0, "validator must fail when no .poster exists", result);
  console.log("[PASS] zero-card tasks fail");

  const placeholderDir = path.join(tempRoot, "placeholder");
  fs.mkdirSync(placeholderDir);
  writeStoryboard(placeholderDir);
  fs.writeFileSync(
    path.join(placeholderDir, "index.html"),
    fixture(`
      <section class="poster" id="card-01" data-page-id="1" data-layout="test-layout" data-silhouette="test-silhouette">
        <div class="content">
          <div class="chrome">TEST</div>
          <p>pending GPT Image</p>
          <div class="foot">01 / 01</div>
        </div>
      </section>`)
  );
  result = run(renderScript, placeholderDir);
  assert(result.status === 0, "placeholder fixture should render before validation", result);
  result = run(validateScript, placeholderDir);
  assert(
    result.status !== 0 && /placeholder or pending-image text/i.test(result.stdout),
    "validator must reject visible placeholder text",
    result
  );
  console.log("[PASS] placeholder content fails validation");

  const brokenDir = path.join(tempRoot, "broken-image");
  fs.mkdirSync(brokenDir);
  writeStoryboard(brokenDir, { outputFile: "assets/missing.png" });
  fs.writeFileSync(
    path.join(brokenDir, "index.html"),
    fixture(`
      <section class="poster" id="card-01" data-page-id="1" data-layout="test-layout" data-silhouette="test-silhouette">
        <div class="content">
          <div class="chrome">TEST</div>
          <img src="assets/missing.png" alt="missing evidence">
          <div class="foot">01 / 01</div>
        </div>
      </section>`)
  );
  result = run(renderScript, brokenDir);
  assert(result.status === 0, "broken-image fixture should render before validation", result);
  const stalePath = path.join(brokenDir, "output", "stale.png");
  fs.copyFileSync(path.join(brokenDir, "output", "card-01.png"), stalePath);
  result = run(renderScript, brokenDir);
  assert(
    result.status === 0 && !fs.existsSync(stalePath),
    "render must clear stale PNG artifacts before writing the current card set",
    result
  );
  result = run(validateScript, brokenDir);
  assert(
    result.status !== 0 && /image did not load/i.test(result.stdout),
    "validator must reject a broken image",
    result
  );
  console.log("[PASS] broken images fail validation");

  const htmlOnlyDir = path.join(tempRoot, "html-only-content");
  fs.mkdirSync(htmlOnlyDir);
  writeStoryboard(htmlOnlyDir);
  fs.writeFileSync(
    path.join(htmlOnlyDir, "index.html"),
    fixture(`
      <section class="poster" id="card-01" data-page-id="1" data-layout="test-layout" data-silhouette="test-silhouette">
        <div class="content">
          <div class="chrome">TEST</div>
          <h2>HTML-only diagram</h2>
          <div data-visual-evidence>CSS chart</div>
          <div class="foot">01 / 01</div>
        </div>
      </section>`)
  );
  result = run(renderScript, htmlOnlyDir);
  assert(result.status === 0, "HTML-only fixture should render before validation", result);
  result = run(validateScript, htmlOnlyDir);
  assert(
    result.status !== 0 && /storyboard requires generated illustration|storyboard plans 1/i.test(result.stdout),
    "validator must reject a non-cover card that replaces model imagery with HTML/CSS",
    result
  );
  console.log("[PASS] HTML-only content cards fail validation");

  fs.writeFileSync(
    path.join(zeroIllustrationStoryboardDir, "index.html"),
    fixture(`
      <section class="poster" id="card-01" data-page-id="1" data-layout="exact-comparison" data-silhouette="exact-comparison">
        <div class="content" style="gap:48px;">
          <div class="chrome">EXACT COMPARISON</div>
          <p class="term-en" style="font-size:18px;margin:0;">EXACT HTML</p>
          <h2 style="font:500 64px/1.1 'Noto Serif SC',serif;margin:0;">精确信息保持可编辑</h2>
          <div data-visual-evidence style="font:500 42px/1.5 'Noto Serif SC',serif;border-block:4px solid #002FA7;padding:48px 0;">输入 100 → 规则检查 → 输出 80</div>
          <p style="font-size:30px;line-height:1.6;">这一页不伪装成生图，也不产生没有解释价值的图片费用。</p>
          <div class="foot" style="margin-top:auto;">01 / 01</div>
        </div>
      </section>`)
  );
  result = run(renderScript, zeroIllustrationStoryboardDir);
  assert(result.status === 0, "content-driven zero-illustration fixture should render", result);
  result = run(validateScript, zeroIllustrationStoryboardDir);
  assert(result.status === 0, "content-driven zero-illustration page should validate without a fake image", result);
  console.log("[PASS] zero-illustration pages validate without generated placeholders");

  fs.writeFileSync(
    path.join(zeroIllustrationStoryboardDir, "index.html"),
    fixture(`
      <section class="poster" id="card-01" data-page-id="1" data-layout="exact-comparison" data-silhouette="exact-comparison">
        <div class="content" style="position:relative;">
          <div class="chrome">FOOTER COLLISION</div>
          <p style="position:absolute;left:80px;right:80px;bottom:42px;font-size:32px;line-height:1.5;margin:0;">This paragraph visibly enters the footer reserve and must fail even though the board clips overflow.</p>
          <div class="foot" style="position:absolute;left:80px;right:80px;bottom:60px;height:42px;">01 / 01</div>
        </div>
      </section>`)
  );
  result = run(validateScript, zeroIllustrationStoryboardDir);
  assert(
    result.status !== 0 && /R3 footer collision/i.test(result.stdout),
    "validator must reject text that enters the footer reserve even when scrollHeight is clipped",
    result
  );
  console.log("[PASS] clipped footer collisions fail final layout validation");

  const noProvenanceDir = path.join(tempRoot, "missing-provenance");
  fs.mkdirSync(path.join(noProvenanceDir, "assets"), { recursive: true });
  writeStoryboard(noProvenanceDir);
  fs.writeFileSync(
    path.join(noProvenanceDir, "assets", "generated.png"),
    Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      "base64"
    )
  );
  fs.writeFileSync(
    path.join(noProvenanceDir, "index.html"),
    fixture(`
      <section class="poster" id="card-01" data-page-id="1" data-layout="test-layout" data-silhouette="test-silhouette">
        <div class="content">
          <div class="chrome">TEST</div>
          <figure class="evidence-figure compact">
            <div class="illust-frame">
              <img data-generated-illustration="true" data-illustration-id="main" src="assets/generated.png" alt="claimed generated evidence">
            </div>
          </figure>
          <div class="foot">01 / 01</div>
        </div>
      </section>`)
  );
  result = run(renderScript, noProvenanceDir);
  assert(result.status === 0, "missing-provenance fixture should render", result);
  result = run(validateScript, noProvenanceDir);
  assert(
    result.status !== 0 && /generation provenance is missing/i.test(result.stdout),
    "validator must reject a claimed generated image without generator provenance",
    result
  );
  console.log("[PASS] generated images without provenance fail validation");

  const tamperedDir = path.join(tempRoot, "tampered-generated-image");
  fs.mkdirSync(path.join(tamperedDir, "assets"), { recursive: true });
  fs.mkdirSync(path.join(tamperedDir, "prompts"), { recursive: true });
  writeStoryboard(tamperedDir);
  const promptText = "test prompt\n";
  fs.writeFileSync(path.join(tamperedDir, "prompts", "page.md"), promptText);
  fs.copyFileSync(
    path.join(noProvenanceDir, "assets", "generated.png"),
    path.join(tamperedDir, "assets", "generated.png")
  );
  fs.writeFileSync(
    path.join(tamperedDir, "assets", "generated.png.generation.json"),
    JSON.stringify({
      schema_version: 1,
      generated_at: new Date(0).toISOString(),
      provider: "test-provider",
      model: "test-model",
      quality: "medium",
      size: "1024x1024",
      output_file: "generated.png",
      prompt_file: "../prompts/page.md",
      prompt_sha256: createHash("sha256").update(promptText).digest("hex"),
      final_sha256: "0".repeat(64),
      final_width: 1,
      final_height: 1,
    })
  );
  fs.writeFileSync(
    path.join(tamperedDir, "index.html"),
    fixture(`
      <section class="poster" id="card-01" data-page-id="1" data-layout="test-layout" data-silhouette="test-silhouette">
        <div class="content">
          <div class="chrome">TEST</div>
          <figure class="evidence-figure compact">
            <div class="illust-frame">
              <img data-generated-illustration="true" data-illustration-id="main" src="assets/generated.png" alt="tampered generated evidence">
            </div>
          </figure>
          <div class="foot">01 / 01</div>
        </div>
      </section>`)
  );
  result = run(renderScript, tamperedDir);
  assert(result.status === 0, "tampered-image fixture should render", result);
  result = run(validateScript, tamperedDir);
  assert(
    result.status !== 0 && /generated image hash does not match provenance/i.test(result.stdout),
    "validator must reject a generated image whose bytes no longer match provenance",
    result
  );
  console.log("[PASS] tampered generated images fail provenance validation");

  const multiImageDir = path.join(tempRoot, "multi-image-page");
  fs.mkdirSync(path.join(multiImageDir, "assets"), { recursive: true });
  fs.mkdirSync(path.join(multiImageDir, "prompts"), { recursive: true });
  for (const name of ["page-02", "symptom-quality"]) {
    fs.copyFileSync(
      path.join(repoDir, "examples", "llmops", "assets", `${name}.png`),
      path.join(multiImageDir, "assets", `${name}.png`)
    );
    fs.copyFileSync(
      path.join(repoDir, "examples", "llmops", "assets", `${name}.png.generation.json`),
      path.join(multiImageDir, "assets", `${name}.png.generation.json`)
    );
    fs.copyFileSync(
      path.join(repoDir, "examples", "llmops", "prompts", `${name}.md`),
      path.join(multiImageDir, "prompts", `${name}.md`)
    );
  }
  fs.writeFileSync(
    path.join(multiImageDir, "storyboard.yaml"),
    `schema_version: 2
topic: Multi-image validator fixture
audience: Test reader
beginner_brief:
  prior_knowledge: Knows this is a test
  plain_definition: One page can contain multiple generated illustrations
  not_this: Not one prompt shared by every image
  how_it_works: Each image binds by its own id
  why_it_matters: Mixed prompts and sizes must remain valid
  concrete_example: One landscape image and one square image share a page
  next_action: Validate both provenance records
page_rhythm:
  strategy: Use one page to isolate the multi-image contract
  beats:
    - { page: 1, purpose: Prove mixed image contracts, silhouette: mixed-evidence, transition: end }
pages:
  - id: 1
    message: One page can bind two independently generated illustrations
    role: concept
    layout: mixed-evidence
    illustrations:
      - id: landscape
        visual_type: labeled-gpt-image
        prompt_file: prompts/page-02.md
        output_file: assets/page-02.png
        image_slot: { html_wrapper: evidence-figure landscape, slot_px: 320x213, slot_ratio: "3:2", requested_orientation: landscape, model_output_size: 1536x1024, subject_bbox: "x=120-1416,y=128-896", fit: contain }
      - id: square
        visual_type: html-label-overlay
        prompt_file: prompts/symptom-quality.md
        output_file: assets/symptom-quality.png
        image_slot: { html_wrapper: illust-frame row-thumb, slot_px: 200x200, slot_ratio: "1:1", requested_orientation: square, model_output_size: 1024x1024, subject_bbox: "x=112-912,y=112-912", fit: contain }
`
  );
  const validMultiImageHtml = fixture(`
    <section class="poster" id="card-01" data-page-id="1" data-layout="mixed-evidence" data-silhouette="mixed-evidence">
      <div class="content" style="gap:48px;">
        <div class="chrome">MULTI IMAGE</div>
        <p class="term-en" style="font-size:18px;margin:0;">MIXED</p>
        <h2 style="font:500 64px/1.1 'Noto Serif SC',serif;margin:0;">两个插图，两套契约</h2>
        <figure class="evidence-figure landscape">
          <div class="illust-frame">
            <img data-generated-illustration="true" data-illustration-id="landscape" src="assets/page-02.png" alt="landscape evidence">
          </div>
        </figure>
        <figure class="illust-frame row-thumb" style="width:200px;height:200px;">
          <img data-generated-illustration="true" data-illustration-id="square" src="assets/symptom-quality.png" alt="square evidence">
        </figure>
        <div class="foot" style="margin-top:auto;">01 / 01</div>
      </div>
    </section>`);
  fs.writeFileSync(path.join(multiImageDir, "index.html"), validMultiImageHtml);
  result = run(renderScript, multiImageDir);
  assert(result.status === 0, "multi-image fixture should render", result);
  result = run(validateScript, multiImageDir);
  assert(
    result.status === 0 && /2 provenance record\(s\) verified/i.test(result.stdout),
    "validator must accept two illustrations with independent prompts and output sizes on one page",
    result
  );
  console.log("[PASS] multi-image pages support independent prompts and sizes");

  const qualityMismatchDir = path.join(tempRoot, "generation-quality-mismatch");
  fs.cpSync(multiImageDir, qualityMismatchDir, { recursive: true });
  fs.writeFileSync(
    path.join(qualityMismatchDir, "storyboard.yaml"),
    fs.readFileSync(path.join(qualityMismatchDir, "storyboard.yaml"), "utf8")
      .replace("schema_version: 2", "schema_version: 3")
      .replace("        visual_type: labeled-gpt-image", "        visual_type: labeled-gpt-image\n        generation_quality: high")
      .replace("        visual_type: html-label-overlay", "        visual_type: html-label-overlay\n        generation_quality: medium")
  );
  result = run(validateScript, qualityMismatchDir);
  assert(
    result.status !== 0 && /generated image quality medium does not match storyboard generation_quality high/i.test(result.stdout),
    "final validation must reject a provider quality that differs from the storyboard",
    result
  );
  console.log("[PASS] generated quality must match the storyboard exactly");

  result = run(validateScript, multiImageDir, { REQUIRE_IMAGE_USAGE_SIDECAR: "true" });
  assert(
    result.status !== 0 && /provider usage is missing/i.test(result.stdout),
    "production validation must reject generated images without real provider usage",
    result
  );
  console.log("[PASS] missing provider usage fails strict usage-accounting acceptance");

  fs.writeFileSync(
    path.join(multiImageDir, "index.html"),
    validMultiImageHtml.replace(
      "<div class=\"foot\"",
      `<figure class="illust-frame row-thumb" style="width:160px;height:160px;">
        <img data-generated-illustration="true" data-illustration-id="unplanned" src="assets/symptom-quality.png" alt="unplanned evidence">
      </figure>
      <div class="foot"`
    )
  );
  result = run(renderScript, multiImageDir);
  assert(result.status === 0, "unplanned-image fixture should render", result);
  result = run(validateScript, multiImageDir);
  assert(
    result.status !== 0 && /unplanned|storyboard plans 2/i.test(result.stdout),
    "validator must reject an extra generated image that is absent from the storyboard",
    result
  );
  console.log("[PASS] unplanned generated images fail exact storyboard binding");

  const exampleDir = path.join(tempRoot, "complete-example");
  fs.cpSync(path.join(repoDir, "examples", "llmops"), exampleDir, { recursive: true });
  result = run(renderScript, exampleDir);
  assert(result.status === 0, "complete example must render", result);
  result = run(validateScript, exampleDir, { ALLOW_SYSTEM_FONT_FALLBACK: "true" });
  assert(result.status === 0, "complete example must validate", result);
  console.log("[PASS] complete example renders and validates");
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
