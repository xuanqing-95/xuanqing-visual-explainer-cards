#!/usr/bin/env node
/**
 * generate.mjs — Standalone image generation via OpenAI-compatible API.
 *
 * Usage:
 *   node generate.mjs --prompt "描述" --output assets/page-01.png --ar 3:4
 *   node generate.mjs --promptfile prompts/page-02.md --output assets/page-02.png --ar 3:4 --quality 2k
 *
 * Environment:
 *   OPENAI_API_KEY    — required (or ZENMUX_API_KEY)
 *   OPENAI_BASE_URL   — API base URL (default: https://api.openai.com/v1)
 *   OPENAI_IMAGE_MODEL — model override (default: gpt-image-1.5)
 *
 * No npm dependencies. Uses Node.js built-in fetch + FormData.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

// --- CLI args ---
const args = process.argv.slice(2);
let prompt = null;
let promptFile = null;
let output = null;
let ar = null;
let quality = "medium";
let model = null;

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case "--prompt": case "-p": prompt = args[++i]; break;
    case "--promptfile": promptFile = args[++i]; break;
    case "--output": case "-o": output = args[++i]; break;
    case "--ar": ar = args[++i]; break;
    case "--quality": quality = args[++i]; break;
    case "--model": case "-m": model = args[++i]; break;
  }
}

if (!output) { console.error("ERROR: --output required"); process.exit(1); }
if (!prompt && !promptFile) { console.error("ERROR: --prompt or --promptfile required"); process.exit(1); }

if (promptFile) {
  prompt = await readFile(promptFile, "utf-8");
}

// --- Env ---
const apiKey = process.env.OPENAI_API_KEY || process.env.ZENMUX_API_KEY;
if (!apiKey) { console.error("ERROR: OPENAI_API_KEY or ZENMUX_API_KEY required"); process.exit(1); }
const baseURL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
const modelName = model || process.env.OPENAI_IMAGE_MODEL || "gpt-image-1.5";

// --- Size mapping ---
function parseAR(ar) {
  if (!ar) return null;
  const m = ar.match(/^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/);
  if (!m) return null;
  return { w: parseFloat(m[1]), h: parseFloat(m[2]) };
}

function getSize(model, ar, quality) {
  const parsed = parseAR(ar);
  if (!parsed) return "1024x1024";
  const ratio = parsed.w / parsed.h;
  const isDalle3 = model.includes("dall-e-3");
  const isDalle2 = model.includes("dall-e-2");
  if (isDalle2) return "1024x1024";
  const sizes = isDalle3
    ? { sq: "1024x1024", ls: "1792x1024", pt: "1024x1792" }
    : { sq: "1024x1024", ls: "1536x1024", pt: "1024x1536" };
  if (Math.abs(ratio - 1) < 0.1) return sizes.sq;
  if (ratio > 1.5) return sizes.ls;
  if (ratio < 0.67) return sizes.pt;
  return sizes.sq;
}

// --- Generate ---
async function generate() {
  const size = getSize(modelName, ar, quality);
  console.log(`Generating: ${modelName} @ ${size} → ${output}`);

  const body = { model: modelName, prompt, size };
  if (modelName.includes("dall-e-3")) {
    body.quality = quality === "2k" ? "hd" : "standard";
  } else if (modelName.includes("gpt-image")) {
    body.quality = quality === "2k" ? "high" : "medium";
  }

  const res = await fetch(`${baseURL}/images/generations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`API error (${res.status}): ${err}`);
    process.exit(1);
  }

  const result = await res.json();
  const img = result.data?.[0];

  let bytes;
  if (img?.b64_json) {
    bytes = Uint8Array.from(Buffer.from(img.b64_json, "base64"));
  } else if (img?.url) {
    const imgRes = await fetch(img.url);
    if (!imgRes.ok) { console.error("Failed to download image"); process.exit(1); }
    bytes = new Uint8Array(await imgRes.arrayBuffer());
  } else {
    console.error("No image in response"); process.exit(1);
  }

  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, bytes);
  console.log(`Saved: ${output} (${bytes.length} bytes)`);
}

generate().catch(e => { console.error(e.message); process.exit(1); });
