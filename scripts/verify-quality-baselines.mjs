#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const repoDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baselineDir = path.join(repoDir, "quality-baselines");
const manifest = JSON.parse(fs.readFileSync(path.join(baselineDir, "manifest.json"), "utf8"));
const digest = (file) => createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const errors = [];

for (const entry of manifest.source_contracts || []) {
  const sourcePath = path.resolve(baselineDir, entry.file);
  if (!fs.existsSync(sourcePath)) errors.push(`missing source contract: ${entry.file}`);
  else if (digest(sourcePath) !== entry.sha256) errors.push(`source contract hash mismatch: ${entry.file}`);
}
for (const entry of [...manifest.samples, ...manifest.generated_assets]) {
  const imagePath = path.resolve(baselineDir, entry.image);
  if (!fs.existsSync(imagePath)) errors.push(`missing image: ${entry.image}`);
  else if (digest(imagePath) !== entry.sha256) errors.push(`hash mismatch: ${entry.image}`);
}
const outputIndex = process.argv.indexOf("--report");
if (outputIndex >= 0) {
  const output = path.resolve(process.argv[outputIndex + 1]);
  const cards = manifest.samples.map((sample) => {
    const imagePath = path.resolve(baselineDir, sample.image);
    return `<figure><img src="file://${imagePath}"><figcaption>${sample.label}</figcaption></figure>`;
  }).join("\n");
  fs.writeFileSync(output, `<!doctype html><meta charset="utf-8"><title>Quality baselines</title><style>body{font-family:system-ui;background:#eee;margin:0;padding:32px}main{display:grid;grid-template-columns:repeat(3,minmax(260px,1fr));gap:24px}figure{margin:0;background:white;padding:16px}img{display:block;width:100%;height:auto}figcaption{font-size:20px;margin-top:12px}</style><main>${cards}</main>`);
  console.log(`[PASS] quality report: ${output}`);
}

if (errors.length) {
  for (const error of errors) console.log(`[FAIL] baseline: ${error}`);
  process.exit(1);
}
console.log(`[PASS] quality baselines: ${(manifest.source_contracts || []).length} immutable source contract(s), ${manifest.samples.length} categories, ${manifest.generated_assets.length} hash-pinned visual assets`);
