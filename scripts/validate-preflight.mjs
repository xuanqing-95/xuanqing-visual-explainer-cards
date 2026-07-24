#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateStoryboardTask } from "./validate-storyboard.mjs";
import {
  taskRelativePath,
  validateLayoutSlotScale,
  validatePromptVisualFidelity,
} from "./quality-contract.mjs";

export function buildIllustrationPlan(taskDirInput) {
  const taskDir = path.resolve(taskDirInput || ".");
  const storyboard = validateStoryboardTask(taskDir);
  const errors = [...storyboard.errors];
  const illustrations = [];

  if (storyboard.ok) {
    for (const page of storyboard.pages) {
      const pageIllustrations = page.illustrations || [];
      for (const illustration of page.illustrations || []) {
        const label = `page ${page.id} illustration ${illustration.id}`;
        try {
          const promptPath = taskRelativePath(taskDir, illustration.prompt_file, `${label} prompt_file`);
          const outputPath = taskRelativePath(taskDir, illustration.output_file, `${label} output_file`);
          if (!fs.existsSync(promptPath)) throw new Error(`${label} prompt file is missing`);
          const prompt = fs.readFileSync(promptPath, "utf8");
          const size = illustration.image_slot.model_output_size;
          if (!prompt.includes(size)) errors.push(`${label} prompt must include output size ${size}`);
          const bbox = illustration.image_slot.subject_bbox;
          const bboxNumbers = String(bbox).match(/\d+/g) || [];
          if (bboxNumbers.some((number) => !prompt.includes(number))) {
            errors.push(`${label} prompt must include the slot-derived pixel subject bounds ${bbox}`);
          }
          if (!/(occupy|occupies|占据|占到)/i.test(prompt)) {
            errors.push(`${label} prompt must include a measurable subject occupancy contract`);
          }
          if (!/(margin|边距|留白)/i.test(prompt)) {
            errors.push(`${label} prompt must include a balanced margin contract`);
          }
          const slotScale = validateLayoutSlotScale({
            pageRole: page.role,
            pageLayout: page.layout,
            illustrationCount: pageIllustrations.length,
            slotPx: illustration.image_slot.slot_px,
          });
          for (const error of slotScale.errors) errors.push(`${label} ${error}`);
          const fidelity = validatePromptVisualFidelity(prompt, {
            requireExplicitHierarchy: Number(storyboard.data?.schema_version || 0) >= 3,
          });
          for (const error of fidelity.errors) errors.push(`${label} ${error}`);
          illustrations.push({
            page_id: String(page.id),
            illustration_id: String(illustration.id),
            generation_quality: illustration.generation_quality || "medium",
            prompt_file: path.relative(taskDir, promptPath).replaceAll("\\", "/"),
            output_file: path.relative(taskDir, outputPath).replaceAll("\\", "/"),
            generator_size: size,
            generator_orientation: illustration.image_slot.requested_orientation,
            generator_ar: illustration.image_slot.slot_ratio,
            html_wrapper: illustration.image_slot.html_wrapper,
            subject_bbox: illustration.image_slot.subject_bbox,
            fit: illustration.image_slot.fit,
          });
        } catch (error) {
          errors.push(error.message);
        }
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    plan: {
      schema_version: 1,
      storyboard_schema_version: storyboard.data?.schema_version || null,
      generated_at: null,
      illustrations,
    },
  };
}

function main() {
  const args = process.argv.slice(2);
  const taskDir = path.resolve(args.find((arg) => !arg.startsWith("--")) || ".");
  const writePlan = args.includes("--write-plan");
  const result = buildIllustrationPlan(taskDir);
  if (!result.ok) {
    for (const error of result.errors) console.log(`[FAIL] preflight: ${error}`);
    process.exit(1);
  }
  if (writePlan) {
    const output = path.join(taskDir, "illustration-plan.json");
    fs.writeFileSync(output, `${JSON.stringify(result.plan, null, 2)}\n`);
    console.log(`[PASS] preflight: wrote ${path.relative(taskDir, output)}`);
  }
  console.log(`[PASS] preflight: ${result.plan.illustrations.length} illustration call(s) planned`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
