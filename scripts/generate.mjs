#!/usr/bin/env node
/**
 * Generate one image through an OpenAI-compatible Image API.
 *
 * Required:
 *   --output <path>
 *   --prompt <text> or --prompt-file <path>
 *   --size <WIDTHxHEIGHT> or --orientation <landscape|square|portrait>
 *
 * Optional:
 *   --quality <low|medium|high>   default: medium
 *   --model <model>               default: OPENAI_IMAGE_MODEL or gpt-image-2
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

const args = process.argv.slice(2);
const options = {
  prompt: null,
  promptFile: null,
  output: null,
  orientation: null,
  size: null,
  quality: "medium",
  model: null,
};

for (let index = 0; index < args.length; index += 1) {
  const value = args[index];
  switch (value) {
    case "--prompt":
    case "-p":
      options.prompt = args[++index];
      break;
    case "--prompt-file":
    case "--promptfile":
      options.promptFile = args[++index];
      break;
    case "--output":
    case "-o":
      options.output = args[++index];
      break;
    case "--orientation":
      options.orientation = args[++index];
      break;
    case "--size":
      options.size = args[++index];
      break;
    case "--quality":
      options.quality = args[++index];
      break;
    case "--model":
    case "-m":
      options.model = args[++index];
      break;
    default:
      throw new Error(`Unknown argument: ${value}`);
  }
}

if (!options.output) throw new Error("--output is required");
if (!options.prompt && !options.promptFile) {
  throw new Error("--prompt or --prompt-file is required");
}
if (!options.size && !options.orientation) {
  throw new Error("--size or --orientation is required; define the final image slot before generation");
}

if (options.promptFile) {
  options.prompt = await readFile(options.promptFile, "utf8");
}
if (!options.prompt?.trim()) throw new Error("Prompt is empty");

const qualityValues = new Set(["low", "medium", "high"]);
if (!qualityValues.has(options.quality)) {
  throw new Error("--quality must be low, medium, or high");
}

const orientationValues = new Set(["landscape", "square", "portrait"]);
if (options.orientation && !orientationValues.has(options.orientation)) {
  throw new Error("--orientation must be landscape, square, or portrait");
}

const zenmuxKey = process.env.ZENMUX_API_KEY;
const apiKey = process.env.OPENAI_API_KEY || zenmuxKey;
if (!apiKey) {
  throw new Error("OPENAI_API_KEY or ZENMUX_API_KEY is required for image generation");
}

const baseURL = (
  process.env.OPENAI_BASE_URL ||
  (zenmuxKey ? "https://zenmux.ai/api/v1" : "https://api.openai.com/v1")
).replace(/\/+$/, "");
const model = options.model || process.env.OPENAI_IMAGE_MODEL || "gpt-image-2";
const provider = baseURL.includes("zenmux.ai")
  ? "zenmux"
  : baseURL.includes("api.openai.com")
    ? "openai"
    : "openai-compatible";

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function standardSizeFor(modelName, orientation) {
  if (modelName.includes("dall-e-2")) return "1024x1024";
  if (modelName.includes("dall-e-3")) {
    return {
      square: "1024x1024",
      landscape: "1792x1024",
      portrait: "1024x1792",
    }[orientation];
  }
  return {
    square: "1024x1024",
    landscape: "1536x1024",
    portrait: "1024x1536",
  }[orientation];
}

function parseSize(size) {
  const match = /^(\d+)x(\d+)$/.exec(size || "");
  if (!match) throw new Error("--size must use WIDTHxHEIGHT, for example 1536x1024");
  return { width: Number(match[1]), height: Number(match[2]) };
}

function orientationForSize({ width, height }) {
  if (width === height) return "square";
  return width > height ? "landscape" : "portrait";
}

const size = options.size || standardSizeFor(model, options.orientation);
const parsedSize = parseSize(size);
if (options.orientation && orientationForSize(parsedSize) !== options.orientation) {
  throw new Error(`--size ${size} conflicts with --orientation ${options.orientation}`);
}

if (model.includes("dall-e-2") && size !== "1024x1024") {
  throw new Error("dall-e-2 only supports 1024x1024 in this wrapper");
}
if (model.includes("dall-e-3")) {
  const supported = new Set(["1024x1024", "1792x1024", "1024x1792"]);
  if (!supported.has(size)) {
    throw new Error("dall-e-3 size must be 1024x1024, 1792x1024, or 1024x1792");
  }
}
if (model === "gpt-image-2" || model.endsWith("/gpt-image-2")) {
  const { width, height } = parsedSize;
  const totalPixels = width * height;
  const ratio = Math.max(width, height) / Math.min(width, height);
  if (
    width > 3840 ||
    height > 3840 ||
    width % 16 !== 0 ||
    height % 16 !== 0 ||
    ratio > 3 ||
    totalPixels < 655_360 ||
    totalPixels > 8_294_400
  ) {
    throw new Error(
      "gpt-image-2 size must use edges up to 3840px, multiples of 16, ratio <= 3:1, and 655360-8294400 total pixels"
    );
  }
}

const retryableStatuses = new Set([408, 409, 429, 500, 502, 503, 504]);
const timeoutMs = Number(process.env.OPENAI_IMAGE_TIMEOUT_MS || 180_000);
const maxAttempts = Number(process.env.OPENAI_IMAGE_MAX_ATTEMPTS || 3);

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request(url, init, label) {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...init, signal: controller.signal });
      const requestId = response.headers.get("x-request-id") || "(not provided)";
      if (response.ok) return { response, requestId };

      const body = (await response.text()).slice(0, 2_000);
      const error = new Error(
        `${label} failed with HTTP ${response.status}; request_id=${requestId}; ${body}`
      );
      if (!retryableStatuses.has(response.status) || attempt === maxAttempts) throw error;
      lastError = error;
    } catch (error) {
      const timedOut = error?.name === "AbortError";
      const retryable = timedOut || error instanceof TypeError;
      const normalized = timedOut
        ? new Error(`${label} timed out after ${timeoutMs}ms`)
        : error;
      if (!retryable || attempt === maxAttempts) throw normalized;
      lastError = normalized;
    } finally {
      clearTimeout(timeout);
    }
    await delay(750 * 2 ** (attempt - 1));
  }
  throw lastError;
}

async function generate() {
  const body = {
    model,
    prompt: options.prompt,
    n: 1,
    size,
  };

  if (model.includes("dall-e-3")) {
    body.quality = options.quality === "high" ? "hd" : "standard";
  } else if (!model.includes("dall-e-2")) {
    body.quality = options.quality;
  }

  console.log(`Generating ${model} at ${size} (${options.quality})`);
  const { response, requestId } = await request(
    `${baseURL}/images/generations`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    },
    "Image generation"
  );

  const result = await response.json();
  const image = result.data?.[0];
  let bytes;
  if (image?.b64_json) {
    bytes = Buffer.from(image.b64_json, "base64");
  } else if (image?.url) {
    const downloaded = await request(image.url, {}, "Image download");
    bytes = Buffer.from(await downloaded.response.arrayBuffer());
  } else {
    throw new Error(`Image API returned no image; request_id=${requestId}`);
  }
  if (bytes.length < 100) throw new Error("Generated image response is unexpectedly small");

  await mkdir(path.dirname(path.resolve(options.output)), { recursive: true });
  await writeFile(options.output, bytes);
  const outputPath = path.resolve(options.output);
  const promptPath = options.promptFile ? path.resolve(options.promptFile) : null;
  const provenanceDir = path.dirname(outputPath);
  const provenance = {
    schema_version: 1,
    generated_at: new Date().toISOString(),
    provider,
    model,
    quality: options.quality,
    size,
    orientation: orientationForSize(parsedSize),
    output_file: path.relative(provenanceDir, outputPath),
    prompt_file: promptPath ? path.relative(provenanceDir, promptPath) : null,
    prompt_sha256: sha256(options.prompt),
    raw_sha256: sha256(bytes),
    request_id: requestId === "(not provided)" ? null : requestId,
  };
  await writeFile(
    `${outputPath}.generation.json`,
    `${JSON.stringify(provenance, null, 2)}\n`,
    "utf8"
  );
  console.log(`Saved ${options.output} (${bytes.length} bytes, request_id=${requestId})`);
  console.log(`Saved generation provenance: ${options.output}.generation.json`);
}

generate().catch((error) => {
  console.error(`ERROR: ${error.message}`);
  process.exit(1);
});
