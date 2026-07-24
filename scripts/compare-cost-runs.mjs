#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const [baselinePath, candidatePath] = process.argv.slice(2);
if (!baselinePath || !candidatePath) throw new Error("usage: compare-cost-runs.mjs <baseline.json> <candidate.json>");
const baseline = JSON.parse(fs.readFileSync(path.resolve(baselinePath), "utf8"));
const candidate = JSON.parse(fs.readFileSync(path.resolve(candidatePath), "utf8"));
const errors = [];

for (const [label, valueA, valueB] of [
  ["image model", baseline.imageRoute?.model, candidate.imageRoute?.model],
  ["image pricing route", baseline.imageRoute?.pricingModel, candidate.imageRoute?.pricingModel],
  ["image count", baseline.imageUsage?.imageCount, candidate.imageUsage?.imageCount],
  ["quality", baseline.imageQuality, candidate.imageQuality],
  ["resolution profile", baseline.resolutionProfile, candidate.resolutionProfile],
]) {
  if (valueA === undefined || valueA === null || valueB === undefined || valueB === null) {
    errors.push(`${label} must be recorded in both receipts`);
    continue;
  }
  if (valueA !== valueB) errors.push(`${label} differs: ${valueA ?? "missing"} vs ${valueB ?? "missing"}`);
}
if (candidate.visualApproval !== "pass") errors.push("candidate visualApproval must be pass");
const total = (usage) => Number(usage?.input_tokens || 0) + Number(usage?.cache_read_input_tokens || 0) + Number(usage?.output_tokens || 0);
const baselineAgentTokens = total(baseline.agentUsage);
const candidateAgentTokens = total(candidate.agentUsage);
if (!(candidateAgentTokens < baselineAgentTokens)) {
  errors.push(`candidate Agent tokens ${candidateAgentTokens} must be lower than baseline ${baselineAgentTokens}`);
}
if (errors.length) {
  for (const error of errors) console.log(`[FAIL] cost comparison: ${error}`);
  process.exit(1);
}
console.log(`[PASS] quality-equivalent Agent cost decreased by ${(((baselineAgentTokens - candidateAgentTokens) / baselineAgentTokens) * 100).toFixed(1)}% (${baselineAgentTokens} -> ${candidateAgentTokens})`);
