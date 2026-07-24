#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const valueAfter = (flag) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : null;
};
const output = path.resolve(valueAfter("--output") || path.join(repoDir, "dist", "xuanqing-visual-explainer-cards.tar.gz"));
const commit = valueAfter("--commit") || "HEAD";
const exactCommit = spawnSync("git", ["rev-parse", commit], { cwd: repoDir, encoding: "utf8" }).stdout.trim();
if (!/^[a-f0-9]{40}$/.test(exactCommit)) throw new Error("--commit must resolve to an exact commit");

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "visual-skill-package-"));
try {
  const sourceTar = path.join(tempDir, "source.tar");
  const packageDir = path.join(tempDir, "xuanqing-visual-explainer-cards");
  fs.mkdirSync(packageDir);
  let result = spawnSync("git", ["archive", "--format=tar", "-o", sourceTar, exactCommit], { cwd: repoDir, encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || "git archive failed");
  result = spawnSync("tar", ["-xf", sourceTar, "-C", packageDir], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || "archive extraction failed");
  const packageJson = JSON.parse(fs.readFileSync(path.join(packageDir, "package.json"), "utf8"));
  const version = packageJson.version.replace(/^-?/, "v");
  fs.writeFileSync(path.join(packageDir, "release-manifest.json"), `${JSON.stringify({
    schema_version: 1,
    skill: "xuanqing-visual-explainer-cards",
    repository: "xuanqing-95/xuanqing-visual-explainer-cards",
    version,
    commit: exactCommit,
  }, null, 2)}\n`);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  result = spawnSync("tar", ["-czf", output, "-C", tempDir, "xuanqing-visual-explainer-cards"], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || "release package creation failed");
  const sha256 = createHash("sha256").update(fs.readFileSync(output)).digest("hex");
  console.log(JSON.stringify({ output, version, commit: exactCommit, sha256 }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
