#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixture = fs.readFileSync(
  path.join(repoDir, "examples", "llmops", "assets", "page-02.png")
);
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "visual-api-test-"));

const server = http.createServer((request, response) => {
  if (request.method !== "POST" || request.url !== "/images/generations") {
    response.writeHead(404).end();
    return;
  }
  let body = "";
  request.setEncoding("utf8");
  request.on("data", (chunk) => {
    body += chunk;
  });
  request.on("end", () => {
    const payload = JSON.parse(body);
    assert.equal(payload.model, "gpt-image-2");
    assert.equal(payload.size, "1536x1024");
    assert.equal(payload.quality, "high");
    response.setHeader("content-type", "application/json");
    response.setHeader("x-request-id", "public-test-request");
    response.end(JSON.stringify({
      data: [{ b64_json: fixture.toString("base64") }],
      usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2 },
    }));
  });
});

try {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  const output = path.join(tempDir, "image.png");
  const child = spawn(
    process.execPath,
    [
      path.join(repoDir, "scripts", "generate.mjs"),
      "--prompt",
      "Public API compatibility test",
      "--output",
      output,
      "--size",
      "1536x1024",
      "--quality",
      "high",
      "--model",
      "gpt-image-2",
    ],
    {
      cwd: repoDir,
      env: {
        ...process.env,
        OPENAI_API_KEY: "public-test-key",
        OPENAI_BASE_URL: `http://127.0.0.1:${port}`,
        NO_PROXY: "127.0.0.1,localhost",
        no_proxy: "127.0.0.1,localhost",
      },
      stdio: ["ignore", "pipe", "pipe"],
    }
  );
  let stderr = "";
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });
  const exitCode = await new Promise((resolve) => child.on("close", resolve));
  assert.equal(exitCode, 0, stderr);
  assert.ok(fs.statSync(output).size > 100);
  const generation = JSON.parse(
    fs.readFileSync(`${output}.generation.json`, "utf8")
  );
  const usage = JSON.parse(fs.readFileSync(`${output}.usage.json`, "utf8"));
  assert.equal(generation.provider, "openai-compatible");
  assert.equal(generation.size, "1536x1024");
  assert.equal(usage.usage.total_tokens, 2);
  console.log("[PASS] user-provided OpenAI-compatible image API route");
} finally {
  server.close();
  fs.rmSync(tempDir, { recursive: true, force: true });
}
