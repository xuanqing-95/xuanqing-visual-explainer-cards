import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const generateScript = path.join(repoDir, "scripts", "generate.mjs");
const renderScript = path.join(repoDir, "scripts", "render.mjs");
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

  const emptyDir = path.join(tempRoot, "empty");
  fs.mkdirSync(emptyDir);
  fs.writeFileSync(path.join(emptyDir, "index.html"), fixture("<p>No cards</p>"));
  result = run(renderScript, emptyDir);
  assert(result.status !== 0, "render must fail when no .poster exists", result);
  result = run(validateScript, emptyDir);
  assert(result.status !== 0, "validator must fail when no .poster exists", result);
  console.log("[PASS] zero-card tasks fail");

  const placeholderDir = path.join(tempRoot, "placeholder");
  fs.mkdirSync(placeholderDir);
  fs.writeFileSync(
    path.join(placeholderDir, "index.html"),
    fixture(`
      <section class="poster" id="card-01">
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
  fs.writeFileSync(
    path.join(brokenDir, "index.html"),
    fixture(`
      <section class="poster" id="card-01">
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

  const exampleDir = path.join(repoDir, "examples", "llmops");
  result = run(renderScript, exampleDir);
  assert(result.status === 0, "complete example must render", result);
  result = run(validateScript, exampleDir);
  assert(result.status === 0, "complete example must validate", result);
  console.log("[PASS] complete example renders and validates");
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
