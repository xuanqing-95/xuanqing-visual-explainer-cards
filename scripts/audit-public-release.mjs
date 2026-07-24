#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const listed = spawnSync("git", ["ls-files", "-z"], {
  cwd: repoDir,
  encoding: "utf8",
});
const walkFiles = (directory, prefix = "") => {
  const output = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if ([".git", "node_modules", "output", "dist", "__pycache__"].includes(entry.name)) {
      continue;
    }
    const relative = path.join(prefix, entry.name);
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...walkFiles(absolute, relative));
    else if (entry.isFile()) output.push(relative);
  }
  return output;
};
const files = listed.status === 0
  ? listed.stdout.split("\0").filter(Boolean)
  : walkFiles(repoDir);
const errors = [];
const forbiddenFiles = [
  /(^|\/)\.env(?:\.|$)/i,
  /(^|\/)(?:credentials|secrets?)\.(?:json|ya?ml|toml)$/i,
  /(^|\/)id_(?:rsa|ed25519)(?:\.pub)?$/i,
];
const forbiddenText = [
  { label: "private absolute path", pattern: /(?:\/Users\/[^/\s]+|\/private\/(?:tmp|var)\/|[A-Z]:\\Users\\[^\\\s]+)/i },
  { label: "private email address", pattern: /\b[A-Z0-9._%+-]+@(?:gmail|qq|163|outlook|hotmail)\.com\b/i },
  { label: "private key", pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { label: "API token", pattern: /\b(?:sk-[A-Za-z0-9_-]{16,}|github_pat_[A-Za-z0-9_]{20,}|gh[opusr]_[A-Za-z0-9]{20,}|AIza[A-Za-z0-9_-]{20,})\b/ },
  { label: "internal production integration", pattern: /\b(?:redflow-production|REDFLOW_DISPATCH_TOKEN|pipeline\.xin|supabase\.co|ZENMUX_PAYG_OPENAI_BASE_URL)\b/i },
];

for (const relative of files) {
  if (forbiddenFiles.some((pattern) => pattern.test(relative))) {
    errors.push(`${relative}: forbidden sensitive filename`);
    continue;
  }
  if (relative === "scripts/audit-public-release.mjs") continue;
  const file = path.join(repoDir, relative);
  const buffer = fs.readFileSync(file);
  if (buffer.includes(0)) continue;
  const text = buffer.toString("utf8");
  for (const rule of forbiddenText) {
    if (rule.pattern.test(text)) errors.push(`${relative}: ${rule.label}`);
  }
}

if (errors.length) {
  for (const error of errors) console.log(`[FAIL] public release: ${error}`);
  process.exit(1);
}

console.log(`[PASS] public release audit: ${files.length} public file(s), no private paths, credentials, personal email, or production integration`);
