#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

function digest(filePath) {
  return createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function listFiles(rootDir, relativeDir, pattern) {
  const dir = path.join(rootDir, relativeDir);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((name) => pattern.test(name))
    .sort()
    .map((name) => path.join(relativeDir, name).replaceAll("\\", "/"));
}

export function compareVisualReplay(baselineDirInput, candidateDirInput) {
  const baselineDir = path.resolve(baselineDirInput);
  const candidateDir = path.resolve(candidateDirInput);
  const errors = [];
  const compared = [];
  const baselineOutputs = listFiles(baselineDir, "output", /\.png$/i);
  const candidateOutputs = listFiles(candidateDir, "output", /\.png$/i);
  if (baselineOutputs.join("\n") !== candidateOutputs.join("\n")) {
    errors.push(`output set differs: ${baselineOutputs.length} baseline vs ${candidateOutputs.length} candidate`);
  }
  const sourceFiles = [
    "source.md",
    "index.html",
    "storyboard.yaml",
    ...listFiles(baselineDir, "prompts", /\.md$/i),
  ];
  for (const relativePath of [...new Set(sourceFiles)]) {
    const baselinePath = path.join(baselineDir, relativePath);
    const candidatePath = path.join(candidateDir, relativePath);
    if (!fs.existsSync(candidatePath)) {
      errors.push(`candidate is missing ${relativePath}`);
      continue;
    }
    const baselineSha256 = digest(baselinePath);
    const candidateSha256 = digest(candidatePath);
    compared.push({ relativePath, baselineSha256, candidateSha256 });
    if (baselineSha256 !== candidateSha256) errors.push(`frozen source differs: ${relativePath}`);
  }

  const pixelScript = path.join(path.dirname(fileURLToPath(import.meta.url)), "compare_visual_pixels.py");
  const pixelResult = spawnSync(
    "python3",
    [
      pixelScript,
      path.join(baselineDir, "output"),
      path.join(candidateDir, "output"),
    ],
    { encoding: "utf8" }
  );
  let perceptual = null;
  try {
    perceptual = JSON.parse(String(pixelResult.stdout || "").trim());
  } catch {
    errors.push(`perceptual replay did not return JSON: ${String(pixelResult.stderr || pixelResult.stdout).trim()}`);
  }
  if (perceptual && !perceptual.ok) {
    errors.push(...(perceptual.errors || []).map((error) => `perceptual replay differs: ${error}`));
  }
  return { ok: errors.length === 0, errors, compared, perceptual };
}

function main() {
  const [baselineDir, candidateDir] = process.argv.slice(2);
  if (!baselineDir || !candidateDir) {
    throw new Error("usage: compare-visual-replay.mjs <baseline-task-dir> <candidate-task-dir>");
  }
  const result = compareVisualReplay(baselineDir, candidateDir);
  if (!result.ok) {
    for (const error of result.errors) console.log(`[FAIL] visual replay: ${error}`);
    process.exit(1);
  }
  const outputCount = result.perceptual?.pages?.length || 0;
  console.log(
    `[PASS] visual replay: ${result.compared.length} frozen source file(s), `
    + `${outputCount} rendered card(s), perceptual delta ${result.perceptual?.set_mean_grayscale_delta}; `
    + `human approval still required`
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
