#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { loadVersionedLocalFontCss } from "./local-fonts.mjs";

const skillDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(fs.readFileSync(path.join(skillDir, "assets", "font-manifest.json"), "utf8"));
for (const font of manifest.fonts || []) {
  const filePath = path.join(skillDir, "assets", "fonts", font.file);
  const licensePath = path.join(skillDir, "assets", "fonts", font.license_file);
  if (!fs.existsSync(filePath)) throw new Error(`missing font: ${font.file}`);
  if (!fs.existsSync(licensePath)) throw new Error(`missing font license: ${font.license_file}`);
  const actual = createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
  if (actual !== font.sha256) throw new Error(`font hash mismatch: ${font.file}`);
}
const css = loadVersionedLocalFontCss(skillDir);
for (const family of ["Noto Serif SC", "Noto Sans SC", "Playfair Display", "IBM Plex Mono"]) {
  if (!css.includes(`font-family:${JSON.stringify(family)}`)) throw new Error(`font CSS missing family: ${family}`);
}
console.log(`[PASS] versioned local fonts: ${manifest.fonts.length} file(s), hashes and licenses verified`);
