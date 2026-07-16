---
name: xuanqing-visual-explainer-cards
description: Create storyboard-first Xiaohongshu/Rednote knowledge-card series with deliberate page rhythm, varied content layouts, editorial HTML typography, a slot-matched model-generated illustration on every non-cover card, and automated artifact validation. Use when turning abstract concepts, tutorials, AI knowledge, product mechanisms, comparisons, or educational content into clear 3:4 social cards, visual explainers, educational infographics, or illustrated knowledge posts.
---

# Visual Explainer Cards

Create social cards that readers can understand visually before reading closely.

## Output contract

- Render every final card from HTML at `1080x1440` (3:4).
- Treat `storyboard.yaml` as the source of truth for page count, message order, rhythm, layout, silhouette, illustration slot, and asset mapping.
- Include at least one model-generated illustration on every non-cover card. HTML diagrams, code, numbers, screenshots, and labels may supplement the illustration but never replace it.
- Treat generated images as evidence inside the card. Their canvas may be landscape, square, portrait, or a supported custom size.
- Define the final `image_slot` before writing an image prompt or generating an image.
- Keep outer titles, body copy, caveats, page chrome, and long explanations in HTML.
- Use only short, high-value labels inside generated illustrations.
- Use the fixed S00 cover for recurring AI concept series unless the user requests another cover.
- Compose content pages from information shape. Do not force them into numbered fixed templates.

## Runtime

Require Node.js 20+, Python 3.9+, Playwright with Chromium, and Pillow.

Check before starting:

```bash
node -e "require('playwright')" &&
python3 -c "import PIL"
```

If Chromium is missing, run `npx playwright install chromium` in the skill directory. If an illustration must be generated, require either `OPENAI_API_KEY` or `ZENMUX_API_KEY`; stop with an actionable error when neither exists.

Resolve `<skill-dir>` to the directory containing this `SKILL.md`.

## Workflow

1. Separate the source into `content_source` and `publish_metadata`. Keep lines under `标签:`, `Tags:`, `Hashtags:`, and standalone `#...` lines out of page copy, footers, captions, and image prompts.
2. Read [`references/beginner-explanation.md`](references/beginner-explanation.md) and create a beginner brief: what it is, what it is not, how it works, one concrete example, why it matters, and the next action.
3. Extract the source's natural message units. Use one complete message per page and let the content determine the page count; 4–7 pages including the cover is common, not mandatory.
4. Read [`references/visual-routing.md`](references/visual-routing.md) and [`references/layouts.md`](references/layouts.md) as planning references. Do not write HTML yet.
5. Copy `assets/storyboard.template.yaml` to the task directory as `storyboard.yaml`. Replace the template with the real message units, then define:
   - one overall `page_rhythm.strategy`;
   - one rhythm beat per page with `purpose`, `silhouette`, `visual_weight`, and `transition`;
   - one content-driven `layout` per page;
   - a different layout and silhouette on adjacent content pages;
   - at least one `image_slot` plus planned prompt and output paths for every non-cover page.
6. Validate the storyboard before image prompting or HTML design. Do not create or edit `index.html` until this passes:

```bash
node <skill-dir>/scripts/validate-storyboard.mjs <task-dir>
```

7. For every non-cover page, confirm that `image_slot` defines:
   - `html_wrapper`
   - `slot_px`
   - `slot_ratio`
   - `requested_orientation`
   - `model_output_size`
   - `subject_bbox`
   - `fit`
8. Read [`references/illustration-prompts.md`](references/illustration-prompts.md). Choose `labeled-gpt-image`, `html-label-overlay`, or `no-text`.
9. Generate every non-cover page's illustration with the explicit `model_output_size`. Use `low` for drafts and `medium` or `high` for accepted assets:

```bash
python3 <skill-dir>/scripts/generate-illustration.py \
  --prompt-file prompts/page-02.md \
  --output assets/page-02.png \
  --orientation landscape \
  --size 1536x1024 \
  --quality medium
```

The script calls the local OpenAI-compatible wrapper, verifies the returned dimensions, normalizes edge-connected paper background, applies conservative auto-framing, and writes `<output>.generation.json` with the model, provider, prompt hash, and final image hash. Never hand-author this provenance file. Use `--remove-background` only for isolated cutouts, `--skip-background-normalize` for intentional scene backgrounds, and `--no-auto-frame` when blank space is deliberate.

10. Only after the storyboard passes, copy `assets/template.html` to the task directory as `index.html`. Read [`references/design-system.md`](references/design-system.md) before editing:
    - body and lead are serif Chinese, not sans;
    - large display text stays light;
    - IKB blue remains visible on every page;
    - mustard yellow appears only on the cover bar in the default theme;
    - use no rounded cards, shadows, or gradients.
11. On every `.poster`, set `data-page-id`, `data-layout`, and `data-silhouette` from the storyboard. Place every generated illustration inside `.illust-frame`; use `.evidence-figure` for major images. Mark the exact generated `<img>` with `data-generated-illustration="true"`, match the wrapper and asset path to the declared slot, and keep `object-fit: contain`.
12. Render, validate, and inspect:

```bash
node <skill-dir>/scripts/render.mjs <task-dir>
node <skill-dir>/scripts/validate.mjs <task-dir>
```

Fix every FAIL. Inspect every final PNG for factual accuracy, Chinese label accuracy, readability, page rhythm, visual consistency, and complete causal explanation. Show only validated final PNGs unless the user explicitly asks for a rough draft.

## Storyboard contract

[`assets/storyboard.template.yaml`](assets/storyboard.template.yaml) is the canonical contract. Copy it; do not reconstruct it from memory.

The storyboard must contain `schema_version`, `topic`, `audience`, the complete seven-field `beginner_brief`, `page_rhythm.strategy`, one `page_rhythm.beats` entry per page, and one `pages` entry per final card. Every non-cover page must also declare `visual_type`, `image_slot`, `illustration.prompt_file`, and `illustration.output_file`.

The rhythm plan and page definitions serve different purposes:

- `page_rhythm.beats[].silhouette` controls the visible page shape and visual weight across the sequence.
- `pages[].layout` controls the concrete information arrangement on that page.
- HTML must echo both values through `data-silhouette` and `data-layout`; final validation rejects drift.

## Hard rules

- Keep one complete core message per page.
- Create and pass `storyboard.yaml` before editing HTML; missing or invalid storyboards are blocking failures.
- Vary adjacent content-page layouts and silhouettes. For three or more content pages, use at least three distinct layouts and three distinct silhouettes.
- Introduce technical terms in plain language on first appearance.
- Include a concrete example and a practical consequence for abstract definitions.
- State important boundaries; do not teach an analogy as the literal mechanism.
- Use HTML for exact comparison text, code, numbers, labels, and ledgers, while keeping at least one model-generated supporting illustration on the same card.
- Never deliver a non-cover card made only from HTML/CSS, a screenshot, or typography.
- Keep each HTML card's page id, layout, silhouette, generated asset path, and illustration wrapper synchronized with the storyboard.
- Keep the generator-written `.generation.json` beside every accepted generated image; validation must fail when provenance or hashes do not match.
- Never duplicate the outer HTML title inside a generated illustration.
- Keep prices, dates, model names, long explanations, and unstable facts out of generated images.
- Keep user-provided hashtags outside the cards unless the user explicitly requests a hashtag page.
- Use `.frame-img` with `cover` only for photographs where intentional cropping is acceptable.
- Do not accept an illustration merely because a file exists. Verify that the picture communicates the intended input, action, direction, result, and practical meaning.

## References

Read only the references needed for the current step:

- [`references/beginner-explanation.md`](references/beginner-explanation.md): beginner brief and copy logic.
- [`references/design-system.md`](references/design-system.md): canvas, typography, colors, components, image containers, and backgrounds.
- [`references/layouts.md`](references/layouts.md): S00 cover and content-shape composition patterns.
- [`references/visual-routing.md`](references/visual-routing.md): choose the right visual evidence.
- [`references/metaphor-library.md`](references/metaphor-library.md): map abstract ideas to concrete scenes.
- [`references/illustration-prompts.md`](references/illustration-prompts.md): slot registry, prompt contracts, and image modes.
- [`references/qa-checklist.md`](references/qa-checklist.md): release checks before delivery.

## Task directory

```text
visual-cards/<slug>/
├── source.md
├── storyboard.yaml
├── prompts/
├── assets/
├── index.html
└── output/
```

Keep source, storyboard, prompts, and accepted assets so the result can be reproduced and revised.
