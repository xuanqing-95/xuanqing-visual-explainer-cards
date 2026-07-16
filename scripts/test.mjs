import fs from "node:fs";
import { createHash } from "node:crypto";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const generateScript = path.join(repoDir, "scripts", "generate.mjs");
const renderScript = path.join(repoDir, "scripts", "render.mjs");
const validateStoryboardScript = path.join(repoDir, "scripts", "validate-storyboard.mjs");
const validateScript = path.join(repoDir, "scripts", "validate.mjs");

function run(script, taskDir) {
  return spawnSync(process.execPath, [script, taskDir], {
    cwd: repoDir,
    encoding: "utf8",
    env: process.env,
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
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500&family=Noto+Serif+SC:wght@400;500&family=Playfair+Display:ital,wght@0,900;1,400&display=swap">
  <style>
    *{box-sizing:border-box}
    body{margin:0;padding:20px;background:#222}
    .poster{width:1080px;height:1440px;overflow:hidden;background:#fafaf8}
    .content{height:100%;padding:80px;display:flex;flex-direction:column}
    .chrome,.foot{font-family:"IBM Plex Mono",monospace;font-weight:500}
    .term-en{font-family:"Playfair Display",serif;font-weight:900}
    .term-zh,.term-question,.series-zh,p{font-family:"Noto Serif SC",serif}
    img{width:300px;height:200px;object-fit:contain}
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
    `schema_version: 1
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
      visual_weight: balanced
      transition: isolated-test
pages:
  - id: 1
    message: This fixture exercises one validation rule
    role: concept
    layout: test-layout
    visual_type: no-text
    image_slot:
      html_wrapper: evidence-figure compact
      slot_px: 300x300
      slot_ratio: "1:1"
      requested_orientation: square
      model_output_size: 1024x1024
      subject_bbox: x=112-912,y=112-912
      fit: contain
    illustration:
      prompt_file: ${promptFile}
      output_file: ${outputFile}
`
  );
}

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "visual-cards-test-"));
try {
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
    - { page: 1, purpose: First, silhouette: repeated, visual_weight: balanced, transition: next }
    - { page: 2, purpose: Second, silhouette: repeated, visual_weight: balanced, transition: next }
    - { page: 3, purpose: Third, silhouette: repeated, visual_weight: balanced, transition: end }
pages:
  - &page
    id: 1
    message: First repeated page
    role: concept
    layout: repeated-layout
    visual_type: no-text
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
    result.status !== 0 && /every non-cover card requires at least one model-generated illustration/i.test(result.stdout),
    "validator must reject a non-cover card that replaces model imagery with HTML/CSS",
    result
  );
  console.log("[PASS] HTML-only content cards fail validation");

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
              <img data-generated-illustration="true" src="assets/generated.png" alt="claimed generated evidence">
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
              <img data-generated-illustration="true" src="assets/generated.png" alt="tampered generated evidence">
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

  const exampleDir = path.join(repoDir, "examples", "llmops");
  result = run(renderScript, exampleDir);
  assert(result.status === 0, "complete example must render", result);
  result = run(validateScript, exampleDir);
  assert(result.status === 0, "complete example must validate", result);
  console.log("[PASS] complete example renders and validates");
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
