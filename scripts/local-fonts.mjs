import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export function loadVersionedLocalFontCss(skillDir) {
  const manifestPath = path.join(skillDir, "assets", "font-manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  if (manifest.schema_version !== 1 || !Array.isArray(manifest.fonts) || manifest.fonts.length === 0) {
    throw new Error("assets/font-manifest.json is invalid");
  }
  return manifest.fonts.map((font) => {
    const filePath = path.join(skillDir, "assets", "fonts", font.file);
    if (!fs.existsSync(filePath)) throw new Error(`versioned font is missing: assets/fonts/${font.file}`);
    return `@font-face{font-family:${JSON.stringify(font.family)};src:url(${JSON.stringify(pathToFileURL(filePath).href)}) format("truetype");font-weight:${font.weight};font-style:${font.style || "normal"};font-display:block}`;
  }).join("\n");
}
